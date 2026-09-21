# Alpaca Market Data API Reference

**Base URL:** `https://data.alpaca.markets`  
**Auth headers:** `APCA-API-KEY-ID: <key>` and `APCA-API-SECRET-KEY: <secret>`

> **Scope of this document:** Historical and snapshot REST endpoints for Stocks (v2), Crypto (v1beta3), and News (v1beta1). Streaming WebSocket endpoints and the Trading/Broker API are out of scope.

---

## Table of Contents

1. [Data Feeds & Plan Tiers](#data-feeds--plan-tiers)
2. [Pagination](#pagination)
3. [Stocks — Historical Bars](#stocks--historical-bars)
4. [Stocks — Latest Bars](#stocks--latest-bars)
5. [Stocks — Historical Quotes](#stocks--historical-quotes)
6. [Stocks — Latest Quotes](#stocks--latest-quotes)
7. [Stocks — Historical Trades](#stocks--historical-trades)
8. [Stocks — Latest Trades](#stocks--latest-trades)
9. [Stocks — Snapshots](#stocks--snapshots)
10. [Crypto — Historical Bars](#crypto--historical-bars)
11. [Crypto — Latest Bars](#crypto--latest-bars)
12. [Crypto — Historical Quotes](#crypto--historical-quotes)
13. [Crypto — Latest Quotes](#crypto--latest-quotes)
14. [Crypto — Historical Trades](#crypto--historical-trades)
15. [Crypto — Latest Trades](#crypto--latest-trades)
16. [News](#news)
17. [Shared Object Shapes](#shared-object-shapes)

---

## Data Feeds & Plan Tiers

| Feed | Scope | Access |
|------|-------|--------|
| `iex` | IEX exchange only (~2.5% of US equity volume) | **Free** — all accounts |
| `sip` | Consolidated tape from all US exchanges (100% of volume) | **Paid** — Algo Trader Plus subscription required for real-time; data older than ~15 min is accessible on all plans |
| `otc` | OTC/pink-sheet data | Paid add-on |
| `boats` | Blue Ocean ATS overnight session (8 PM – 4 AM ET) | Available for historical overnight stock data |
| `overnight` | Derived overnight feed for latest/real-time requests | For certain real-time endpoints on the free plan only; **not** for delayed historical requests |

> ⚠️ **Default feed for stocks:** If `feed` is omitted, the API defaults to `iex` for free-tier accounts. Free-tier users requesting `sip` data for recent timestamps receive a 403 error. For snapshot endpoints, free plan users receive IEX-sourced latest trade/quote/minute bar; daily and previous daily bars are accessible to all plans.

---

## Pagination

All historical list endpoints return a cursor-based `next_page_token` when results exceed the requested `limit`.

**Pattern:**
1. Make initial request (optionally with `limit`).
2. If the response contains `"next_page_token": "<token>"`, pass it as `page_token=<token>` in the next request.
3. Repeat until `next_page_token` is `null` or absent.

The `limit` parameter accepts `1`–`10000` for most endpoints. News uses a maximum page size of `50`.

```json
{
  "bars": { "AAPL": [ /* ... */ ] },
  "next_page_token": "aWQ9MTIzNDU2Nzg5"
}
```

---

## Stocks — Historical Bars

### `GET /v2/stocks/bars` — Multi-symbol

Returns OHLCV aggregates for multiple symbols over a date range.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated list of ticker symbols (e.g., `AAPL,MSFT,TSLA`) |
| `timeframe` | string | **Yes** | Aggregation interval. See [Timeframe values](#timeframe-values) |
| `start` | string | No | Inclusive start (RFC-3339 or `YYYY-MM-DD`). Defaults to start of current day |
| `end` | string | No | Inclusive end (RFC-3339 or `YYYY-MM-DD`). Defaults to now |
| `limit` | integer | No | Max bars returned (1–10000). Default 1000 |
| `adjustment` | string | No | Price adjustment: `raw` (default), `split`, `dividend`, `all` |
| `feed` | string | No | Data feed: `iex` (default/free), `sip` (paid), `otc` |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor from previous response |
| `currency` | string | No | ISO 4217 currency code for price conversion (e.g., `USD`) |
| `asof` | string | No | `YYYY-MM-DD` date for symbol mapping (handles ticker renames) |

### `GET /v2/stocks/{symbol}/bars` — Single symbol

Same parameters as multi-symbol **except** `symbols` is replaced by the `{symbol}` path parameter.

#### Timeframe values

`1Min`, `2Min`, `3Min`, `4Min`, `5Min`, `6Min`, `10Min`, `12Min`, `15Min`, `20Min`, `30Min`, `1Hour`, `2Hour`, `3Hour`, `4Hour`, `6Hour`, `8Hour`, `12Hour`, `1Day`, `1Week`, `1Month` through `12Month`.

#### `adjustment` values explained

| Value | Effect |
|-------|--------|
| `raw` | Unadjusted prices as reported |
| `split` | Prices adjusted for stock splits only |
| `dividend` | Prices adjusted for dividends only |
| `all` | Adjusted for both splits and dividends |

> Note: The `adjustment` parameter applies only to historical bars. Latest bars and snapshot bars are never adjusted (they always return raw data).

#### Example response (multi-symbol)

```json
{
  "bars": {
    "AAPL": [
      {
        "t": "2024-01-03T05:00:00Z",
        "o": 184.15,
        "h": 185.88,
        "l": 183.43,
        "c": 185.52,
        "v": 71054600,
        "n": 524110,
        "vw": 184.916
      }
    ],
    "MSFT": [
      {
        "t": "2024-01-03T05:00:00Z",
        "o": 370.00,
        "h": 374.00,
        "l": 368.50,
        "c": 373.26,
        "v": 19420000,
        "n": 189300,
        "vw": 371.83
      }
    ]
  },
  "next_page_token": null
}
```

---

## Stocks — Latest Bars

### `GET /v2/stocks/bars/latest` — Multi-symbol
### `GET /v2/stocks/{symbol}/bars/latest` — Single symbol

Returns the most recent completed bar for each requested symbol.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** (multi only) | Comma-separated ticker symbols |
| `feed` | string | No | `iex` (default/free) or `sip` (paid) |
| `currency` | string | No | ISO 4217 currency for price conversion |

> **No `adjustment` parameter** — latest bars always return raw (unadjusted) data.

#### Example response

```json
{
  "bars": {
    "AAPL": {
      "t": "2024-06-14T19:59:00Z",
      "o": 213.00,
      "h": 213.20,
      "l": 212.89,
      "c": 213.07,
      "v": 1520000,
      "n": 8421,
      "vw": 213.05
    }
  }
}
```

---

## Stocks — Historical Quotes

### `GET /v2/stocks/quotes` — Multi-symbol
### `GET /v2/stocks/{symbol}/quotes` — Single symbol

Returns historical NBBO bid/ask quote updates.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** (multi only) | Comma-separated ticker symbols |
| `start` | string | No | Inclusive start (RFC-3339 or `YYYY-MM-DD`) |
| `end` | string | No | Inclusive end (RFC-3339 or `YYYY-MM-DD`) |
| `limit` | integer | No | Max quotes (1–10000). Default 1000 |
| `feed` | string | No | `iex` (default/free) or `sip` (paid) |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |
| `currency` | string | No | ISO 4217 currency |
| `asof` | string | No | Date for symbol mapping |

#### Example response

```json
{
  "quotes": {
    "AAPL": [
      {
        "t": "2024-01-03T14:30:00.123456789Z",
        "ax": "V",
        "ap": 185.55,
        "as": 3,
        "bx": "V",
        "bp": 185.50,
        "bs": 5,
        "c": ["R"],
        "z": "C"
      }
    ]
  },
  "next_page_token": null
}
```

---

## Stocks — Latest Quotes

### `GET /v2/stocks/quotes/latest` — Multi-symbol
### `GET /v2/stocks/{symbol}/quotes/latest` — Single symbol

Returns the most recent quote for each requested symbol.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** (multi only) | Comma-separated ticker symbols |
| `feed` | string | No | `iex` (default/free) or `sip` (paid) |
| `currency` | string | No | ISO 4217 currency |

---

## Stocks — Historical Trades

### `GET /v2/stocks/trades` — Multi-symbol
### `GET /v2/stocks/{symbol}/trades` — Single symbol

Returns individual executed trades (tick-level data).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** (multi only) | Comma-separated ticker symbols |
| `start` | string | No | Inclusive start (RFC-3339 or `YYYY-MM-DD`) |
| `end` | string | No | Inclusive end (RFC-3339 or `YYYY-MM-DD`) |
| `limit` | integer | No | Max trades (1–10000). Default 1000 |
| `feed` | string | No | `iex` (default/free) or `sip` (paid) |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |
| `currency` | string | No | ISO 4217 currency |
| `asof` | string | No | Date for symbol mapping |

#### Example response

```json
{
  "trades": {
    "AAPL": [
      {
        "t": "2024-01-03T14:30:00.245579008Z",
        "x": "P",
        "p": 185.52,
        "s": 100,
        "c": ["@"],
        "i": 3,
        "z": "C"
      }
    ]
  },
  "next_page_token": null
}
```

---

## Stocks — Latest Trades

### `GET /v2/stocks/trades/latest` — Multi-symbol
### `GET /v2/stocks/{symbol}/trades/latest` — Single symbol

Returns the most recent trade for each requested symbol.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** (multi only) | Comma-separated ticker symbols |
| `feed` | string | No | `iex` (default/free) or `sip` (paid) |
| `currency` | string | No | ISO 4217 currency |

> **Note:** Latest endpoints return data exactly as received and never apply adjustments. This means a ticker's latest trade reflects whatever symbol was active at the time of the trade (e.g., `FB` before the Meta rename).

---

## Stocks — Snapshots

### `GET /v2/stocks/snapshots` — Multi-symbol
### `GET /v2/stocks/{symbol}/snapshot` — Single symbol

Returns a combined snapshot per symbol containing: latest trade, latest quote, current minute bar, current daily bar, and previous daily bar. Equivalent to calling trades/latest + quotes/latest + bars in one request.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** (multi only) | Comma-separated ticker symbols |
| `feed` | string | No | `iex` (default/free) or `sip` (paid). Free plan gets IEX for latest trade/quote/minute bar; daily bars same across plans |
| `currency` | string | No | ISO 4217 currency |

#### Example response (single symbol)

```json
{
  "latestTrade": {
    "t": "2024-06-14T19:59:58Z",
    "x": "V",
    "p": 213.07,
    "s": 500,
    "c": [" ", "T"],
    "i": 56592424269399,
    "z": "B"
  },
  "latestQuote": {
    "t": "2024-06-14T19:59:59Z",
    "ax": "V",
    "ap": 213.10,
    "as": 2,
    "bx": "V",
    "bp": 213.05,
    "bs": 5,
    "c": ["R"],
    "z": "B"
  },
  "minuteBar": {
    "t": "2024-06-14T19:59:00Z",
    "o": 213.00,
    "h": 213.20,
    "l": 212.89,
    "c": 213.07,
    "v": 1520000,
    "n": 8421,
    "vw": 213.05
  },
  "dailyBar": {
    "t": "2024-06-14T04:00:00Z",
    "o": 207.00,
    "h": 214.24,
    "l": 206.90,
    "c": 213.07,
    "v": 61430000,
    "n": 498200,
    "vw": 211.43
  },
  "prevDailyBar": {
    "t": "2024-06-13T04:00:00Z",
    "o": 214.75,
    "h": 216.75,
    "l": 211.60,
    "c": 214.24,
    "v": 54120000,
    "n": 432100,
    "vw": 214.10
  }
}
```

---

## Crypto — Historical Bars

### `GET /v1beta3/crypto/{loc}/bars`

Returns OHLCV aggregates for crypto pairs. `{loc}` is the market location; use `us` for the US crypto feed.

**Full URL example:** `https://data.alpaca.markets/v1beta3/crypto/us/bars`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs using slash notation (e.g., `BTC/USD,ETH/USD`) |
| `timeframe` | string | **Yes** | Aggregation interval (same values as stock bars) |
| `start` | string | No | Inclusive start (RFC-3339 or `YYYY-MM-DD`) |
| `end` | string | No | Inclusive end (RFC-3339 or `YYYY-MM-DD`) |
| `limit` | integer | No | Max bars (1–10000). Default 1000 |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |
| `currency` | string | No | ISO 4217 currency |

> **Note:** Crypto bars can be non-empty even during intervals with no executed trades. When no trades occur within a bar period, bar prices are derived from quote midpoints rather than trade prices. There is **no** `feed` or `adjustment` parameter for crypto bars.

#### Example response

```json
{
  "bars": {
    "BTC/USD": [
      {
        "t": "2024-01-03T00:00:00Z",
        "o": 44200.50,
        "h": 44850.00,
        "l": 44100.10,
        "c": 44680.25,
        "v": 1029.86,
        "n": 43372,
        "vw": 44450.52
      }
    ]
  },
  "next_page_token": null
}
```

---

## Crypto — Latest Bars

### `GET /v1beta3/crypto/{loc}/latest/bars`

Returns the most recent bar for each requested crypto pair.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs (e.g., `BTC/USD,ETH/USD`) |

#### Example response

```json
{
  "bars": {
    "BTC/USD": {
      "t": "2024-06-14T19:00:00Z",
      "o": 66800.00,
      "h": 67100.00,
      "l": 66750.50,
      "c": 67050.00,
      "v": 120.45,
      "n": 8910,
      "vw": 66942.10
    }
  }
}
```

---

## Crypto — Historical Quotes

### `GET /v1beta3/crypto/{loc}/quotes`

Returns historical bid/ask quote updates for crypto pairs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs |
| `start` | string | No | Inclusive start (RFC-3339 or `YYYY-MM-DD`) |
| `end` | string | No | Inclusive end (RFC-3339 or `YYYY-MM-DD`) |
| `limit` | integer | No | Max quotes (1–10000). Default 1000 |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |
| `currency` | string | No | ISO 4217 currency |

#### Example response

```json
{
  "quotes": {
    "BTC/USD": [
      {
        "t": "2024-01-03T00:00:01.123456789Z",
        "ap": 44210.00,
        "as": 0.5,
        "bp": 44200.00,
        "bs": 1.0
      }
    ]
  },
  "next_page_token": null
}
```

---

## Crypto — Latest Quotes

### `GET /v1beta3/crypto/{loc}/latest/quotes`

Returns the most recent quote for each requested crypto pair.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs |

---

## Crypto — Historical Trades

### `GET /v1beta3/crypto/{loc}/trades`

Returns individual executed crypto trades.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs |
| `start` | string | No | Inclusive start (RFC-3339 or `YYYY-MM-DD`) |
| `end` | string | No | Inclusive end (RFC-3339 or `YYYY-MM-DD`) |
| `limit` | integer | No | Max trades (1–10000). Default 1000 |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |
| `currency` | string | No | ISO 4217 currency |

#### Example response

```json
{
  "trades": {
    "BTC/USD": [
      {
        "t": "2024-01-03T00:00:00.312Z",
        "p": 44202.50,
        "s": 0.25,
        "tks": "B",
        "i": "12345678"
      }
    ]
  },
  "next_page_token": null
}
```

---

## Crypto — Latest Trades

### `GET /v1beta3/crypto/{loc}/latest/trades`

Returns the most recent trade for each requested crypto pair.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs |

---

## News

### `GET /v1beta1/news`

Returns financial news articles. By default returns the latest 10 articles. Supports filtering by symbol, date range, and content availability.

> ⚠️ **Subscription requirement:** As of mid-2024 some users have reported that news endpoints return `403 "Subscription does not permit querying news"` on certain plan tiers. Verify news access against your current Alpaca subscription.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | No | Comma-separated tickers to filter news (e.g., `AAPL,TSLA`). Omit to return all news |
| `start` | string | No | Inclusive start datetime (RFC-3339 or `YYYY-MM-DD`) |
| `end` | string | No | Inclusive end datetime (RFC-3339 or `YYYY-MM-DD`) |
| `sort` | string | No | `desc` (default, newest first) or `asc` |
| `limit` | integer | No | Max articles per page (1–50). Default 10 |
| `include_content` | boolean | No | `false` (default). Set `true` to include full article body in `content` field |
| `exclude_contentless` | boolean | No | `false` (default). Set `true` to omit articles that have no body content |
| `page_token` | string | No | Pagination cursor from previous response |

#### Example response

```json
{
  "news": [
    {
      "id": 40892639,
      "headline": "Apple Announces Record Q2 Earnings",
      "summary": "Apple Inc. reported quarterly earnings that exceeded analyst expectations ...",
      "content": "",
      "author": "Bloomberg",
      "created_at": "2024-05-02T20:30:00Z",
      "updated_at": "2024-05-02T20:35:00Z",
      "url": "https://example.com/apple-q2-earnings",
      "images": [
        {
          "size": "large",
          "url": "https://example.com/img/apple-large.jpg"
        },
        {
          "size": "small",
          "url": "https://example.com/img/apple-small.jpg"
        },
        {
          "size": "thumb",
          "url": "https://example.com/img/apple-thumb.jpg"
        }
      ],
      "symbols": ["AAPL"]
    }
  ],
  "next_page_token": "eyJpZCI6NDA4OTI2Mzh9"
}
```

#### News object fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique article identifier |
| `headline` | string | Article title |
| `summary` | string | Short excerpt or summary |
| `content` | string | Full body text (empty string unless `include_content=true`) |
| `author` | string | Author or source name |
| `created_at` | string | ISO-8601 initial publication timestamp |
| `updated_at` | string | ISO-8601 last updated timestamp. Sort is based on `updated_at` |
| `url` | string | Link to the original article |
| `images` | array | Associated images; each has `size` (`"large"`, `"small"`, `"thumb"`) and `url` |
| `symbols` | array | Ticker symbols mentioned in the article |

---

## Shared Object Shapes

### Bar object

| Field | Description |
|-------|-------------|
| `t` | Timestamp (ISO-8601/RFC-3339) — start of the bar interval |
| `o` | Open price |
| `h` | High price |
| `l` | Low price |
| `c` | Close price |
| `v` | Volume (shares for stocks; units for crypto) |
| `n` | Number of trades within the bar interval |
| `vw` | Volume-weighted average price (VWAP) |

### Quote object (stocks)

| Field | Description |
|-------|-------------|
| `t` | Timestamp |
| `ax` | Ask exchange code |
| `ap` | Ask price |
| `as` | Ask size (in round lots for stocks) |
| `bx` | Bid exchange code |
| `bp` | Bid price |
| `bs` | Bid size (in round lots for stocks) |
| `c` | Quote conditions array |
| `z` | Tape (`A`, `B`, `C`) |

### Quote object (crypto)

| Field | Description |
|-------|-------------|
| `t` | Timestamp |
| `ap` | Ask price |
| `as` | Ask size |
| `bp` | Bid price |
| `bs` | Bid size |

### Trade object (stocks)

| Field | Description |
|-------|-------------|
| `t` | Timestamp |
| `x` | Exchange code where trade occurred |
| `p` | Trade price |
| `s` | Trade size (shares) |
| `c` | Trade conditions array |
| `i` | Trade ID |
| `z` | Tape (`A`, `B`, `C`) |

### Trade object (crypto)

| Field | Description |
|-------|-------------|
| `t` | Timestamp |
| `p` | Trade price |
| `s` | Trade size |
| `tks` | Taker side (`B` = buy, `S` = sell) |
| `i` | Trade ID |

---

## Quick Reference — All Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v2/stocks/bars` | Stock bars (multi-symbol) |
| GET | `/v2/stocks/{symbol}/bars` | Stock bars (single symbol) |
| GET | `/v2/stocks/bars/latest` | Latest bar (multi-symbol) |
| GET | `/v2/stocks/{symbol}/bars/latest` | Latest bar (single symbol) |
| GET | `/v2/stocks/quotes` | Stock quotes (multi-symbol) |
| GET | `/v2/stocks/{symbol}/quotes` | Stock quotes (single symbol) |
| GET | `/v2/stocks/quotes/latest` | Latest quote (multi-symbol) |
| GET | `/v2/stocks/{symbol}/quotes/latest` | Latest quote (single symbol) |
| GET | `/v2/stocks/trades` | Stock trades (multi-symbol) |
| GET | `/v2/stocks/{symbol}/trades` | Stock trades (single symbol) |
| GET | `/v2/stocks/trades/latest` | Latest trade (multi-symbol) |
| GET | `/v2/stocks/{symbol}/trades/latest` | Latest trade (single symbol) |
| GET | `/v2/stocks/snapshots` | Snapshot (multi-symbol) |
| GET | `/v2/stocks/{symbol}/snapshot` | Snapshot (single symbol) |
| GET | `/v1beta3/crypto/{loc}/bars` | Crypto bars (historical) |
| GET | `/v1beta3/crypto/{loc}/latest/bars` | Crypto latest bars |
| GET | `/v1beta3/crypto/{loc}/quotes` | Crypto quotes (historical) |
| GET | `/v1beta3/crypto/{loc}/latest/quotes` | Crypto latest quotes |
| GET | `/v1beta3/crypto/{loc}/trades` | Crypto trades (historical) |
| GET | `/v1beta3/crypto/{loc}/latest/trades` | Crypto latest trades |
| GET | `/v1beta1/news` | News articles |

---

## Sources

- https://alpaca.markets/learn/fetch-historical-data (SDK walkthrough with endpoint paths, parameters, feed descriptions)
- https://alpaca.markets/learn/snapshot-api (snapshot response shapes, multi/single pattern)
- https://alpaca.markets/learn/understanding-alpacas-market-data-api-with-pandas-and-plotly (quote/trade/bar response shapes)
- https://deepwiki.com/alpacahq/alpaca-trade-api-go/3.5-news-and-corporate-actions (news endpoint parameters and response schema)
- https://docs.alpaca.markets/us/reference/stockbars (partially inaccessible due to bot challenge — endpoint confirmed via other sources)
- Alpaca known-good anchors (base URL, endpoint paths, auth headers)
