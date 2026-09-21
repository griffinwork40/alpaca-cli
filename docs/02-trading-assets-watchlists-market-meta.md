# Alpaca Trading API — Assets, Watchlists, Calendar, Clock, Portfolio History & Account Activities

> **Scope:** Supporting / meta endpoints for the Alpaca Trading API v2.
> Auth, base URLs, orders, positions, and market-data bars/quotes are covered in other documents.
>
> **Source:** Official `alpaca-trade-api-python` SDK (`rest.py`, `entity.py`) and `alpaca-py` SDK (`models.py`, `enums.py`, `requests.py`) on GitHub, cross-referenced against the known-good API anchors provided by the task brief.
> Direct retrieval of `https://docs.alpaca.markets/reference/*` was blocked by Cloudflare bot protection at research time — all field descriptions are derived from SDK source code and type annotations which reflect the live API contract.

---

## Table of Contents

1. [Authentication Quick Reference](#1-authentication-quick-reference)
2. [Assets](#2-assets)
   - 2.1 [List All Assets](#21-list-all-assets)
   - 2.2 [Get an Asset by Symbol or ID](#22-get-an-asset-by-symbol-or-id)
3. [Watchlists](#3-watchlists)
   - 3.1 [List Watchlists](#31-list-watchlists)
   - 3.2 [Create a Watchlist](#32-create-a-watchlist)
   - 3.3 [Get a Watchlist by ID](#33-get-a-watchlist-by-id)
   - 3.4 [Replace / Update a Watchlist](#34-replace--update-a-watchlist)
   - 3.5 [Delete a Watchlist](#35-delete-a-watchlist)
   - 3.6 [Add a Symbol to a Watchlist](#36-add-a-symbol-to-a-watchlist)
   - 3.7 [Remove a Symbol from a Watchlist](#37-remove-a-symbol-from-a-watchlist)
4. [Calendar](#4-calendar)
5. [Clock](#5-clock)
6. [Portfolio History](#6-portfolio-history)
7. [Account Activities](#7-account-activities)
   - 7.1 [List All Activities](#71-list-all-activities)
   - 7.2 [List Activities by Type](#72-list-activities-by-type)
8. [Object Reference](#8-object-reference)
   - 8.1 [Asset Object](#81-asset-object)
   - 8.2 [Watchlist Object](#82-watchlist-object)
   - 8.3 [Calendar Object](#83-calendar-object)
   - 8.4 [Clock Object](#84-clock-object)
   - 8.5 [PortfolioHistory Object](#85-portfoliohistory-object)
   - 8.6 [TradeActivity Object](#86-tradeactivity-object)
   - 8.7 [NonTradeActivity Object](#87-nontradactivity-object)
   - 8.8 [ActivityType Enum Values](#88-activitytype-enum-values)

---

## 1. Authentication Quick Reference

All trading-API requests require two headers:

| Header | Value |
|--------|-------|
| `APCA-API-KEY-ID` | Your API key ID |
| `APCA-API-SECRET-KEY` | Your API secret key |

Paper trading base URL: `https://paper-api.alpaca.markets`  
Live trading base URL: `https://api.alpaca.markets`  
Version prefix: `/v2` (all paths below are relative to this prefix)

---

## 2. Assets

Assets represent tradable and non-tradable securities available through Alpaca. The list includes US equities, crypto, and US options.

### 2.1 List All Assets

```
GET /v2/assets
```

Returns an array of `Asset` objects. Supports optional filtering by status, asset class, and exchange.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `string` | No | Filter by asset status. Enum: `active`, `inactive` |
| `asset_class` | `string` | No | Filter by asset class. Enum: `us_equity`, `us_option`, `crypto`, `crypto_perp` |
| `exchange` | `string` | No | Filter by exchange. See [AssetExchange enum](#81-asset-object) for valid values |
| `attributes` | `string` | No | Comma-separated attribute filters (e.g. `ptp_no_exception,ptp_with_exception`) |

#### Response

Returns a JSON array of Asset objects (abbreviated):

```json
[
  {
    "id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
    "class": "us_equity",
    "exchange": "NASDAQ",
    "symbol": "AAPL",
    "name": "Apple Inc. Common Stock",
    "status": "active",
    "tradable": true,
    "marginable": true,
    "shortable": true,
    "easy_to_borrow": true,
    "fractionable": true,
    "min_order_size": null,
    "min_trade_increment": null,
    "price_increment": null,
    "maintenance_margin_requirement": 30.0,
    "attributes": []
  }
]
```

---

### 2.2 Get an Asset by Symbol or ID

```
GET /v2/assets/{symbol_or_asset_id}
```

Returns a single `Asset` object.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol_or_asset_id` | `string` | Yes | Ticker symbol (e.g. `AAPL`) or UUID asset ID |

#### Response

Returns a single [Asset object](#81-asset-object). Same shape as one element from the list response above.

---

## 3. Watchlists

A watchlist is an ordered list of assets. An account can have multiple watchlists, each identified by a UUID. Watchlists are account-scoped.

### 3.1 List Watchlists

```
GET /v2/watchlists
```

Returns all watchlists registered under the authenticated account. **Note:** The `assets` array is not populated in the list response — use [Get by ID](#33-get-a-watchlist-by-id) to retrieve assets.

#### Response

```json
[
  {
    "id": "fb306e55-16d3-43b6-8f1f-4e6de7dede5b",
    "account_id": "1de5a640-9f57-4de5-b93b-61bdadec1441",
    "name": "My Tech Stocks",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-16T08:30:00Z",
    "assets": null
  }
]
```

---

### 3.2 Create a Watchlist

```
POST /v2/watchlists
```

Creates a new watchlist with an optional initial set of assets.

#### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Arbitrary label, up to 64 characters |
| `symbols` | `string[]` | No | Array of asset ticker symbols to add initially (e.g. `["AAPL", "TSLA"]`) |

#### Response

Returns the created [Watchlist object](#82-watchlist-object) with `assets` populated.

---

### 3.3 Get a Watchlist by ID

```
GET /v2/watchlists/{watchlist_id}
```

Returns a single watchlist with its `assets` array populated.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watchlist_id` | `UUID string` | Yes | The unique identifier of the watchlist |

#### Response

```json
{
  "id": "fb306e55-16d3-43b6-8f1f-4e6de7dede5b",
  "account_id": "1de5a640-9f57-4de5-b93b-61bdadec1441",
  "name": "My Tech Stocks",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-16T08:30:00Z",
  "assets": [
    {
      "id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
      "class": "us_equity",
      "symbol": "AAPL",
      "name": "Apple Inc. Common Stock",
      "status": "active",
      "tradable": true
    }
  ]
}
```

---

### 3.4 Replace / Update a Watchlist

```
PUT /v2/watchlists/{watchlist_id}
```

Replaces the watchlist's name and/or its full asset list. At least one of `name` or `symbols` must be provided.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watchlist_id` | `UUID string` | Yes | The unique identifier of the watchlist |

#### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No* | New name for the watchlist |
| `symbols` | `string[]` | No* | Replaces the full symbols list |

\* At least one of `name` or `symbols` must be provided.

#### Response

Returns the updated [Watchlist object](#82-watchlist-object).

---

### 3.5 Delete a Watchlist

```
DELETE /v2/watchlists/{watchlist_id}
```

Permanently deletes the watchlist and all its associations.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watchlist_id` | `UUID string` | Yes | The unique identifier of the watchlist |

#### Response

`204 No Content` on success.

---

### 3.6 Add a Symbol to a Watchlist

```
POST /v2/watchlists/{watchlist_id}
```

Appends a single asset symbol to an existing watchlist without replacing the rest.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watchlist_id` | `UUID string` | Yes | The unique identifier of the watchlist |

#### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | `string` | Yes | Ticker symbol to add (e.g. `"MSFT"`) |

#### Response

Returns the updated [Watchlist object](#82-watchlist-object) with all current assets including the newly added one.

---

### 3.7 Remove a Symbol from a Watchlist

```
DELETE /v2/watchlists/{watchlist_id}/{symbol}
```

Removes a specific symbol from the watchlist.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watchlist_id` | `UUID string` | Yes | The unique identifier of the watchlist |
| `symbol` | `string` | Yes | Ticker symbol to remove (e.g. `"MSFT"`) |

#### Response

`204 No Content` on success.

---

## 4. Calendar

Returns the market open/close schedule for NYSE-observed US equity trading days. Useful for determining whether a given date is a trading day, and what hours the market is open (e.g. early closes on half-days).

```
GET /v2/calendar
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | `string (date)` | No | Start date in `YYYY-MM-DD` format. Defaults to the current date. |
| `end` | `string (date)` | No | End date in `YYYY-MM-DD` format. Defaults to the current date. |

#### Response

Returns a JSON array of Calendar objects:

```json
[
  {
    "date": "2024-01-15",
    "open": "09:30",
    "close": "16:00",
    "session_open": "0400",
    "session_close": "2000",
    "settlement_date": "2024-01-17"
  }
]
```

> **Note:** `open` and `close` are the regular market session times in `HH:MM` format (Eastern Time). `session_open` / `session_close` cover the extended-hours window. `settlement_date` is the T+2 settlement date for that trading day.

---

## 5. Clock

Returns the current market status and the timestamps for the next market open and close events.

```
GET /v2/clock
```

No query parameters.

#### Response

```json
{
  "timestamp": "2024-01-15T14:32:00.000000000-05:00",
  "is_open": true,
  "next_open": "2024-01-16T09:30:00.000000000-05:00",
  "next_close": "2024-01-15T16:00:00.000000000-05:00"
}
```

All timestamps are in Eastern Time with timezone offset. `is_open` reflects regular market hours only (9:30 AM – 4:00 PM ET on trading days).

---

## 6. Portfolio History

Returns the time-series equity and profit/loss data for the account over a specified period. Used to render portfolio performance charts.

```
GET /v2/account/portfolio/history
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `string` | No | Duration as `<number><unit>`: `D` = day, `W` = week, `M` = month, `A` = year. Example: `1M`, `6M`, `1A`. Default: `1M`. |
| `timeframe` | `string` | No | Bucket resolution: `1Min`, `5Min`, `15Min`, `1H`, `1D`. Auto-selected if omitted: `1Min` for <7 days, `15Min` for <30 days, otherwise `1D`. |
| `intraday_reporting` | `string` | No | Controls which timestamps to return for intraday data. |
| `start` | `string (RFC3339)` | No | Start timestamp (inclusive), e.g. `2024-01-01T00:00:00Z`. Overrides `period`. |
| `end` | `string (RFC3339)` | No | End timestamp. Defaults to current market date. |
| `pnl_reset` | `string` | No | Defines the baseline for PnL calculation on intraday queries. |
| `extended_hours` | `boolean` | No | If `true`, include pre/post-market hours. Only effective for timeframes less than `1D`. |
| `cashflow_types` | `string` | No | Comma-separated ActivityType values to include cashflow data in the response. |

#### Response

```json
{
  "timestamp": [1705276800, 1705363200, 1705449600],
  "equity":    [125430.50, 126012.75, 124887.20],
  "profit_loss":     [430.50, 1012.75, -112.80],
  "profit_loss_pct": [0.00344, 0.00811, -0.00090],
  "base_value": 125000.00,
  "timeframe": "1D",
  "cashflow": {}
}
```

> **Important:** All arrays (`timestamp`, `equity`, `profit_loss`, `profit_loss_pct`) are parallel arrays of equal length. `timestamp` values are Unix epoch seconds (left-labeled — the beginning of the time window). `base_value` is the equity at the start of the requested period, used as the PnL baseline.

---

## 7. Account Activities

Account activities are events associated with the account. There are two kinds:

- **TradeActivity** — events related to order fills (`activity_type = "FILL"`)
- **NonTradeActivity** — all other events (dividends, journal entries, fees, splits, etc.)

Results are paginated and returned in reverse chronological order by default.

### 7.1 List All Activities

```
GET /v2/account/activities
```

Returns activities across all types, or filtered to a comma-separated list of `activity_types`.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activity_types` | `string` | No | Comma-separated list of [ActivityType](#88-activitytype-enum-values) values to filter by, e.g. `FILL,DIV` |
| `date` | `string (date)` | No | Specific date to filter by (`YYYY-MM-DD`). Cannot be combined with `until` or `after`. |
| `until` | `string (ISO8601)` | No | Return activities up to (but not including) this timestamp |
| `after` | `string (ISO8601)` | No | Return activities after this timestamp |
| `direction` | `string` | No | Sort order: `asc` or `desc`. Default: `desc` |
| `page_size` | `integer` | No | Maximum number of entries to return per page |
| `page_token` | `string` | No | Pagination cursor from a previous response |

#### Response

Returns a JSON array that may contain a mix of `TradeActivity` and `NonTradeActivity` objects, distinguished by `activity_type`:

```json
[
  {
    "id": "20240115000000000::a1b2c3d4-...",
    "account_id": "1de5a640-9f57-4de5-b93b-61bdadec1441",
    "activity_type": "FILL",
    "transaction_time": "2024-01-15T14:32:00Z",
    "type": "fill",
    "price": "182.35",
    "qty": "10",
    "side": "buy",
    "symbol": "AAPL",
    "leaves_qty": "0",
    "order_id": "e7c214f2-...",
    "cum_qty": "10",
    "order_status": "filled"
  },
  {
    "id": "20240115000000000::b2c3d4e5-...",
    "account_id": "1de5a640-9f57-4de5-b93b-61bdadec1441",
    "activity_type": "DIV",
    "date": "2024-01-15",
    "net_amount": 12.50,
    "symbol": "MSFT",
    "qty": 10.0,
    "per_share_amount": 1.25,
    "description": "Cash dividend"
  }
]
```

---

### 7.2 List Activities by Type

```
GET /v2/account/activities/{activity_type}
```

Returns activities filtered to a single `activity_type`. Supports all the same query parameters as [7.1](#71-list-all-activities) except `activity_types` (that filter is in the path).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activity_type` | `string` | Yes | A single [ActivityType](#88-activitytype-enum-values) value, e.g. `FILL`, `DIV`, `INT` |

#### Query Parameters

Same as [7.1](#71-list-all-activities) excluding `activity_types`.

---

## 8. Object Reference

### 8.1 Asset Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique asset identifier |
| `class` | `string` | Asset class. Enum: `us_equity`, `us_option`, `crypto`, `crypto_perp` |
| `exchange` | `string` | Exchange where the asset trades. See AssetExchange below. |
| `symbol` | `string` | Ticker symbol (e.g. `"AAPL"`) |
| `name` | `string \| null` | Full company/asset name |
| `status` | `string` | Lifecycle status. Enum: `active`, `inactive` |
| `tradable` | `boolean` | Whether the asset can be traded via Alpaca |
| `marginable` | `boolean` | Whether the asset can be traded on margin |
| `shortable` | `boolean` | Whether the asset can be sold short |
| `easy_to_borrow` | `boolean` | When shorting, whether the asset is easy to borrow (low borrow rate) |
| `fractionable` | `boolean` | Whether fractional share orders are supported |
| `min_order_size` | `float \| null` | Minimum order size (shares or notional) |
| `min_trade_increment` | `float \| null` | Minimum quantity increment |
| `price_increment` | `float \| null` | Minimum price increment (tick size) |
| `maintenance_margin_requirement` | `float \| null` | Maintenance margin requirement percentage |
| `attributes` | `string[] \| null` | Special asset attributes. Values: `ptp_no_exception`, `ptp_with_exception` |

**AssetExchange enum values:** `AMEX`, `ARCA`, `ASCX`, `BATS`, `NYSE`, `NASDAQ`, `NYSEARCA`, `CBSE`, `GNSS`, `ERSX`, `OTC`, `CRYPTO`, `FTXU`

---

### 8.2 Watchlist Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique watchlist identifier |
| `account_id` | `UUID` | The account this watchlist belongs to |
| `name` | `string` | Watchlist display name (max 64 characters) |
| `created_at` | `datetime` | ISO8601 creation timestamp |
| `updated_at` | `datetime` | ISO8601 last-modified timestamp |
| `assets` | `Asset[] \| null` | Array of Asset objects. Populated by GET-by-ID; null in list responses. |

---

### 8.3 Calendar Object

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string (date)` | Trading date in `YYYY-MM-DD` format |
| `open` | `string` | Regular market open time in `HH:MM` (Eastern Time) |
| `close` | `string` | Regular market close time in `HH:MM` (Eastern Time) |
| `session_open` | `string` | Extended-hours session open in `HHMM` format |
| `session_close` | `string` | Extended-hours session close in `HHMM` format |
| `settlement_date` | `string (date)` | T+2 settlement date in `YYYY-MM-DD` format |

---

### 8.4 Clock Object

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `string (datetime)` | Current server timestamp in RFC3339/ISO8601 with timezone |
| `is_open` | `boolean` | `true` if the market is currently in regular trading hours |
| `next_open` | `string (datetime)` | Timestamp of the next regular market open |
| `next_close` | `string (datetime)` | Timestamp of the next regular market close |

---

### 8.5 PortfolioHistory Object

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `int[]` | Unix epoch seconds for each data point (left-labeled / beginning of window) |
| `equity` | `float[]` | Total account equity (cash + positions) at each timestamp |
| `profit_loss` | `float[]` | Dollar PnL from `base_value` at each timestamp |
| `profit_loss_pct` | `(float \| null)[]` | Percentage PnL from `base_value` at each timestamp |
| `base_value` | `float \| null` | Equity at the start of the requested period; PnL baseline |
| `timeframe` | `string` | Bucket size used: `1Min`, `5Min`, `15Min`, `1H`, or `1D` |
| `cashflow` | `object` | Per-ActivityType cashflow amounts, keyed by ActivityType string. Empty `{}` if not requested. |

---

### 8.6 TradeActivity Object

Returned when `activity_type == "FILL"`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique activity ID. Format: `<date_string>::<uuid>` |
| `account_id` | `UUID` | Account this activity belongs to |
| `activity_type` | `string` | Always `"FILL"` for TradeActivity |
| `transaction_time` | `datetime` | Time the trade was processed |
| `type` | `string` | Enum: `fill`, `partial_fill` |
| `price` | `float` | Per-share execution price |
| `qty` | `float` | Number of shares executed in this fill |
| `side` | `string` | Enum: `buy`, `sell` |
| `symbol` | `string` | Ticker symbol of the traded asset |
| `leaves_qty` | `float` | Remaining unfilled quantity (0 for complete fills) |
| `order_id` | `UUID` | ID of the order this fill is associated with |
| `cum_qty` | `float` | Cumulative filled quantity across all fills for this order |
| `order_status` | `string` | Status of the parent order at the time of this fill |

---

### 8.7 NonTradeActivity Object

Returned for all `activity_type` values other than `"FILL"` (dividends, fees, journals, splits, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique activity ID. Format: `<date_string>::<uuid>` |
| `account_id` | `UUID` | Account this activity belongs to |
| `activity_type` | `string` | One of the non-FILL [ActivityType](#88-activitytype-enum-values) values |
| `date` | `string (date)` | Date the activity occurred or the transaction settled |
| `net_amount` | `float` | Net dollar impact (positive = credit, negative = debit) |
| `description` | `string` | Human-readable description of the activity |
| `status` | `string \| null` | Enum: `executed`, `correct`, `canceled`. Not present for all types. |
| `symbol` | `string \| null` | Symbol of the security involved (not present for all types) |
| `qty` | `float \| null` | For dividend activities: number of shares that generated the payment |
| `price` | `float \| null` | Per-share price (not present for all types) |
| `per_share_amount` | `float \| null` | For dividends: average payment per share |

---

### 8.8 ActivityType Enum Values

| Value | Category | Description |
|-------|----------|-------------|
| `FILL` | Trade | Order fill or partial fill |
| `ACATC` | Non-Trade | ACAT (transfer) cancellation |
| `ACATS` | Non-Trade | ACAT (transfer) submission |
| `CFEE` | Non-Trade | Crypto fee |
| `CIL` | Non-Trade | Cash-in-lieu of fractional shares |
| `CSD` | Non-Trade | Cash settlement disbursement |
| `CSW` | Non-Trade | Cash sweep |
| `DIV` | Non-Trade | Cash dividend |
| `DIVCGL` | Non-Trade | Dividend (long-term capital gain) |
| `DIVCGS` | Non-Trade | Dividend (short-term capital gain) |
| `DIVNRA` | Non-Trade | Dividend (NRA tax withheld) |
| `DIVROC` | Non-Trade | Dividend (return of capital) |
| `DIVTXEX` | Non-Trade | Dividend (tax-exempt) |
| `DIVWH` | Non-Trade | Dividend withholding |
| `EXTRD` | Non-Trade | Extended-hours trade |
| `FEE` | Non-Trade | Fee |
| `FXTRD` | Non-Trade | Foreign exchange trade |
| `INT` | Non-Trade | Interest earned |
| `INTPNL` | Non-Trade | Interest (profit/loss) |
| `JNLC` | Non-Trade | Journal (cash) |
| `JNLS` | Non-Trade | Journal (securities) |
| `MA` | Non-Trade | Merger/acquisition |
| `MEM` | Non-Trade | Memo entry |
| `NC` | Non-Trade | Name change |
| `OCT` | Non-Trade | Option contract termination |
| `OPASN` | Non-Trade | Option assignment |
| `OPCSH` | Non-Trade | Option cash settlement |
| `OPEXC` | Non-Trade | Option exercise |
| `OPEXP` | Non-Trade | Option expiration |
| `OPTRD` | Non-Trade | Options trade |
| `PTC` | Non-Trade | Pass-through charge |
| `REORG` | Non-Trade | Reorganization |
| `SPIN` | Non-Trade | Spinoff |
| `SPLIT` | Non-Trade | Stock split |
| `SWP` | Non-Trade | Swap |
| `VOF` | Non-Trade | Voluntary offering |
| `WH` | Non-Trade | Withholding |

---

## Sources

- `alpaca-trade-api-python` SDK — `rest.py` (endpoint paths, params): https://raw.githubusercontent.com/alpacahq/alpaca-trade-api-python/master/alpaca_trade_api/rest.py
- `alpaca-trade-api-python` SDK — `entity.py` (response shapes): https://raw.githubusercontent.com/alpacahq/alpaca-trade-api-python/master/alpaca_trade_api/entity.py
- `alpaca-py` SDK — `models.py` (Pydantic schemas): https://raw.githubusercontent.com/alpacahq/alpaca-py/master/alpaca/trading/models.py
- `alpaca-py` SDK — `enums.py` (enum values): https://raw.githubusercontent.com/alpacahq/alpaca-py/master/alpaca/trading/enums.py
- `alpaca-py` SDK — `requests.py` (request parameter schemas): https://raw.githubusercontent.com/alpacahq/alpaca-py/master/alpaca/trading/requests.py
- Known-good API anchors provided by task brief (authoritative for base URLs, paths, header names)

> ⚠️ **Coverage gap:** Direct scraping of `https://docs.alpaca.markets/reference/*` was blocked by Cloudflare bot protection during research. All field descriptions, types, and enum values are sourced from the official Alpaca Python SDK repositories, which are considered authoritative. The `settlement_date` field on Calendar and the `intraday_reporting` / `pnl_reset` / `cashflow_types` parameters on Portfolio History are derived from SDK source only — verify exact behavior against the live docs.
