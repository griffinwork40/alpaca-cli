# Alpaca API — Cross-Cutting Foundations

> **Sources** (retrieved 2025):
> - https://github.com/alpacahq/user-docs/blob/master/content/api-documentation/api-v2/_index.md (Trading API v2 reference — primary)
> - https://github.com/alpacahq/alpaca-docs/blob/master/content/api-references/crypto-api/_index.md (Crypto API reference — corroborates Trading API conventions)
> - https://raw.githubusercontent.com/alpacahq/alpaca-docs/master/content/api-references/market-data-api/stock-pricing-data/historical.md (Market Data historical endpoints)
> - https://docs.alpaca.markets/docs/getting-started (product overview)
> - https://alpaca.markets/support/usage-limit-api-calls (rate limit support page)
> - https://forum.alpaca.markets/t/rate-limit-clarity/7202 (community forum — rate limit tiers)

---

## Table of Contents

1. [What Is Alpaca?](#1-what-is-alpaca)
2. [API Families](#2-api-families)
3. [Base URLs](#3-base-urls)
4. [Authentication](#4-authentication)
5. [Environment Variables Convention](#5-environment-variables-convention)
6. [Paper vs. Live Trading — Safety](#6-paper-vs-live-trading--safety)
7. [Error Response Model](#7-error-response-model)
8. [Rate Limits](#8-rate-limits)
9. [Pagination Conventions](#9-pagination-conventions)
10. [Common Request Conventions](#10-common-request-conventions)

---

## 1. What Is Alpaca?

Alpaca is a commission-free, API-first brokerage platform that lets individuals and businesses trade **US equities, options, and cryptocurrency** programmatically. It exposes a REST (pull) and streaming (push) interface that an algorithm can use to access real-time prices, place orders, and manage a portfolio.

Key characteristics:
- No trading commissions.
- REST + WebSocket streaming.
- Paper trading environment for safe testing with fake money — same API, different base URL.
- Market Data API: real-time and historical OHLCV bars, quotes, trades (up to 6+ years of history).

---

## 2. API Families

| API Family        | Purpose                                                                                    | In Scope for Personal CLI? |
|-------------------|--------------------------------------------------------------------------------------------|----------------------------|
| **Trading API**   | Place/cancel orders, manage positions, view account info. Covers stocks, options, crypto.  | ✅ Yes                     |
| **Market Data API** | Real-time and historical prices (bars, quotes, trades, snapshots) for stocks and crypto. | ✅ Yes                     |
| **Broker API**    | Build brokerage products for end-users; uses Basic auth (HTTP Authorization header).       | ❌ Out of scope             |
| **Connect (OAuth2)** | Let users with Alpaca accounts connect to third-party apps via OAuth2.                  | ❌ Out of scope             |

This document covers **Trading API** and **Market Data API** only. All authentication and structural conventions below apply to those two families.

---

## 3. Base URLs

| Environment                  | Base URL                             | Notes                                                  |
|------------------------------|--------------------------------------|--------------------------------------------------------|
| **Trading — Paper (sandbox)**| `https://paper-api.alpaca.markets`   | Uses separate paper-trading credentials. Fake money.   |
| **Trading — Live**           | `https://api.alpaca.markets`         | Uses live credentials. Real money. ⚠️ Use with care.  |
| **Market Data**              | `https://data.alpaca.markets`        | Same key pair works for both free and paid plans.      |

**Trading API version prefix**: `/v2`

Example: `https://paper-api.alpaca.markets/v2/account`

**Market Data API version prefix**: `/v2` (under the data host)

Example: `https://data.alpaca.markets/v2/stocks/AAPL/bars`

> **Note**: Paper and live trading share the same API path structure but use different hostnames *and* different API key pairs. You cannot use your live keys on the paper host, or vice versa.

---

## 4. Authentication

### Scheme

Both Trading and Market Data APIs use **two custom HTTP request headers**:

| Header                  | Value               |
|-------------------------|---------------------|
| `APCA-API-KEY-ID`       | Your API key ID     |
| `APCA-API-SECRET-KEY`   | Your API secret key |

Every private API call requires both headers. Neither header is optional.

### Example (curl)

```sh
curl -X GET \
  -H "APCA-API-KEY-ID: ${APCA_API_KEY_ID}" \
  -H "APCA-API-SECRET-KEY: ${APCA_API_SECRET_KEY}" \
  "https://paper-api.alpaca.markets/v2/account"
```

### Where to Get Keys

Keys are generated in the **Alpaca web dashboard** (alpaca.markets). You will have two separate key pairs:

- **Paper keys** — usable only against `paper-api.alpaca.markets`
- **Live keys** — usable only against `api.alpaca.markets`

> **Secret key visibility**: The secret key is shown only once at creation time. Store it immediately in a secrets manager or `.env` file; it cannot be retrieved later (only regenerated).

### What the Broker API Uses Instead

The Broker API (out of scope here) uses HTTP Basic auth (`Authorization: Basic <base64(key:secret)>`). Do not confuse the two schemes.

---

## 5. Environment Variables Convention

Alpaca's official SDKs (Python, Go, JS, etc.) look for these environment variables by default:

| Variable              | Purpose                                                              |
|-----------------------|----------------------------------------------------------------------|
| `APCA_API_KEY_ID`     | API key ID (maps directly to `APCA-API-KEY-ID` header)             |
| `APCA_API_SECRET_KEY` | API secret key (maps directly to `APCA-API-SECRET-KEY` header)     |
| `APCA_API_BASE_URL`   | Override base URL; set to the paper or live host as needed          |

Use `.env`-style loading (e.g., `dotenv`) or your shell profile. Never commit keys to source control.

---

## 6. Paper vs. Live Trading — Safety

| Dimension           | Paper Environment                              | Live Environment                                   |
|---------------------|------------------------------------------------|----------------------------------------------------|
| **Base URL**        | `https://paper-api.alpaca.markets`             | `https://api.alpaca.markets`                       |
| **Money**           | Simulated (fake funds, no real transactions)   | **Real money** — orders execute at market prices   |
| **Key pair**        | Separate paper credentials from the dashboard  | Separate live credentials from the dashboard       |
| **API surface**     | Identical to live (`/v2/...` paths, same JSON) | Identical to paper                                 |
| **Recommended default** | ✅ **Always default to paper**            | Require explicit opt-in by the user                |

**A wrapper or CLI should default to `APCA_API_BASE_URL=https://paper-api.alpaca.markets`.** Switching to live requires an intentional, explicit configuration change. This prevents accidents where a test run places real-money orders.

---

## 7. Error Response Model

### HTTP Status Codes

Alpaca uses standard HTTP status codes. The following are well-documented:

| Status Code | Meaning               | Common Cause                                                         |
|-------------|-----------------------|----------------------------------------------------------------------|
| `200`       | OK                    | Successful request                                                   |
| `207`       | Multi-Status          | Partial success (e.g., bulk operations)                              |
| `400`       | Bad Request           | Invalid value for a query parameter                                  |
| `401`       | Unauthorized          | Missing or invalid API key ID / secret                               |
| `403`       | Forbidden             | Authenticated but not permitted (e.g., insufficient buying power, shorting disabled, hard-to-borrow asset) |
| `404`       | Not Found             | Resource does not exist (e.g., unknown symbol, unknown order ID)     |
| `422`       | Unprocessable Entity  | Invalid query parameter combination or semantically invalid request  |
| `429`       | Too Many Requests     | Rate limit exceeded                                                  |

### JSON Error Body

When an error occurs, Alpaca returns a JSON body. The verified shape (from official SDK source and community docs) is:

```json
{
  "code": 40310000,
  "message": "insufficient qty available for order"
}
```

- `code` — An integer Alpaca-specific error code (a superset of the HTTP status code; more granular).
- `message` — A human-readable error description string.

> **Caveat**: The exact numeric codes are not exhaustively documented in public-facing docs. The two fields `code` and `message` are consistent. Some endpoints may include additional context fields; treat the above as the minimum guaranteed shape.

---

## 8. Rate Limits

### Trading API

| Tier         | Limit                       | Verified?              |
|--------------|-----------------------------|------------------------|
| Free / Basic | **200 requests per minute** per API key | ✅ Confirmed by official docs and support pages |
| Paid plans   | Higher limits available; specifics depend on plan tier | ⚠️ Partially confirmed (community forum mentions increases for market data subscribers) |

When the limit is exceeded:
- The server responds with **HTTP 429**.
- The response body follows the standard error format (`code`, `message`).
- The client must back off and retry after the current minute window resets.

> No `Retry-After` header behavior is specified in official docs as of this writing. Implement exponential backoff on 429.

### Market Data API

- **Free / Basic plan**: 200 requests per minute (same as Trading API).
- **Paid "Unlimited" plan**: Rate limit increased; community forum cites 1,000 requests/minute for market data. Exact current values should be verified at [alpaca.markets pricing](https://alpaca.markets/data) as plans change.

> The 200 req/min figure is the **safe, verified baseline** for free accounts. Do not assume higher limits unless confirmed.

---

## 9. Pagination Conventions

All paginated list endpoints (Market Data historical, Trading account activities, etc.) follow a **cursor-token** pattern:

### Request Parameters

| Parameter    | Type    | Default | Range / Notes                                                        |
|--------------|---------|---------|----------------------------------------------------------------------|
| `page_token` | string  | `null`  | Opaque cursor from a previous response's `next_page_token`. Pass to fetch the next page. |
| `limit`      | integer | 1000    | Maximum data points per response. Range: **1–10000** for Market Data historical endpoints. |

### Response Fields

| Field             | Type              | Notes                                                          |
|-------------------|-------------------|----------------------------------------------------------------|
| `next_page_token` | string (nullable) | Present when more pages exist. `null` (or absent) = last page. |

### How to Paginate

1. Make the initial request (no `page_token`).
2. Check the response for `next_page_token`.
3. If `next_page_token` is non-null, make the next request with `?page_token=<value>`.
4. Repeat until `next_page_token` is `null` or absent.

### Example (Market Data bars response)

```json
{
  "bars": [ /* ...array of bar objects... */ ],
  "symbol": "AAPL",
  "next_page_token": "QUFQTHxNfDIwMjItMDQtMTFUMDg6MDA6MDAuMDAwMDAwMDAwWg=="
}
```

Pass `?page_token=QUFQTHxNfDIwMjItMDQtMTFUMDg6MDA6MDAuMDAwMDAwMDAwWg==` to get the next page.

### Trading API Pagination (Account Activities)

The Trading API uses the same parameter names for list endpoints. From the account activities reference:

> *"Pagination is handled using the `page_token` and `page_size` parameters. `page_token` represents the ID of the last item on your current page of results."*

| Parameter   | Notes                                              |
|-------------|----------------------------------------------------|
| `page_token` | ID of last item on the current page               |
| `page_size`  | Number of results per page (synonym for `limit`)  |

---

## 10. Common Request Conventions

### Content Type

- **Request body** (POST/PATCH): `Content-Type: application/json`. The body must be a **JSON-encoded object**.
- **Query parameters**: Standard URL query string (no special encoding beyond percent-encoding).
- **Response**: Always `application/json`.

### Timestamp Format

All date-time inputs and outputs use **[RFC-3339](https://tools.ietf.org/html/rfc3339)** format (a profile of ISO 8601):

```
2022-04-11T14:30:00.008348Z
2022-04-11T14:30:00-05:00
```

- The API does **not** assume a particular time zone; time-zone offset is encoded in each value.
- Timestamps in Market Data responses use nanosecond precision where available (e.g., trade timestamps).
- When providing `start`/`end` filters, RFC-3339 strings are accepted.

### Numeric Precision

Decimal numbers are **returned as strings** to preserve full precision across platforms (e.g., `"168.99"` not `168.99`). When sending numbers in request bodies, also send them as strings to avoid floating-point truncation.

### Object IDs (UUIDs)

Alpaca system object IDs (orders, accounts, assets) use **UUID v4**, in standard dash-separated format:

```
904837e3-3b76-47ec-b432-046db621571b
```

### Asset Symbols / Symbology

When an endpoint accepts a `symbol` parameter, four forms are supported:

```
AAPL                          # simplest; most common form
AAPL:NASDAQ                   # symbol + exchange
AAPL:NASDAQ:us_equity         # symbol + exchange + asset class
904837e3-3b76-47ec-b432-...   # UUID asset_id (always unique)
```

- All symbol forms are **case-sensitive**.
- When multiple assets share a symbol (cross-exchange), the most commonly traded one is assumed if the simple form is used.
- For multi-symbol endpoints accepting `symbols`, separate values with **commas** (e.g., `symbols=AAPL,TSLA,MSFT`).

### Market Data Feed Parameter

Most Market Data endpoints accept an optional `feed` parameter:

| Value | Description                                | Availability                   |
|-------|--------------------------------------------|--------------------------------|
| `iex` | IEX exchange feed (limited data)           | Free plan default              |
| `sip` | Securities Information Processor (full SIP tape) | Paid plan; default for paid |
| `otc` | OTC markets                                | Paid plan                      |

---

*This document covers cross-cutting API foundations only. Specific endpoints (account, orders, positions, bars, quotes, etc.) are documented in sibling files in this directory.*
