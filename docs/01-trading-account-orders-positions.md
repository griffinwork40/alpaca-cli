# Alpaca Trading API — Account, Orders & Positions Reference

> **Auth (one-liner):** All requests require headers `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`.  
> **Base URL:** `https://paper-api.alpaca.markets` (paper) or `https://api.alpaca.markets` (live). Version prefix: `/v2`.  
> See the auth/setup doc for key provisioning details.

---

## Table of Contents

1. [Account](#1-account)
   - [GET /v2/account](#get-v2account)
   - [Account Object Fields](#account-object-fields)
2. [Orders](#2-orders)
   - [GET /v2/orders — List Orders](#get-v2orders--list-orders)
   - [POST /v2/orders — Create Order](#post-v2orders--create-order)
   - [GET /v2/orders/{order_id} — Get Order by ID](#get-v2ordersorder_id--get-order-by-id)
   - [GET /v2/orders:by_client_order_id — Get by Client ID](#get-v2ordersby_client_order_id--get-by-client-order-id)
   - [PATCH /v2/orders/{order_id} — Replace Order](#patch-v2ordersorder_id--replace-order)
   - [DELETE /v2/orders/{order_id} — Cancel Order](#delete-v2ordersorder_id--cancel-order)
   - [DELETE /v2/orders — Cancel All Orders](#delete-v2orders--cancel-all-orders)
   - [Order Object Fields](#order-object-fields)
   - [Order Classes: Bracket, OCO, OTO](#order-classes-bracket-oco-oto)
3. [Positions](#3-positions)
   - [GET /v2/positions — List All Positions](#get-v2positions--list-all-positions)
   - [GET /v2/positions/{symbol} — Get Open Position](#get-v2positionssymbol--get-open-position)
   - [DELETE /v2/positions/{symbol} — Close Position](#delete-v2positionssymbol--close-position)
   - [DELETE /v2/positions — Close All Positions](#delete-v2positions--close-all-positions)
   - [Position Object Fields](#position-object-fields)

---

## 1. Account

### `GET /v2/account`

**Purpose:** Returns current trading account details including balances, buying power, margin status, and trading flags.

**Path params:** none  
**Query params:** none  
**Request body:** none

**Example request:**
```
GET https://paper-api.alpaca.markets/v2/account
APCA-API-KEY-ID: <key>
APCA-API-SECRET-KEY: <secret>
```

**Example response (abbreviated):**
```json
{
  "id": "e6fe16f3-64a4-4921-8928-cadf02f92f98",
  "account_number": "010203ABCD",
  "status": "ACTIVE",
  "crypto_status": "ACTIVE",
  "currency": "USD",
  "cash": "-23140.20",
  "buying_power": "262113.63",
  "regt_buying_power": "80680.36",
  "daytrading_buying_power": "0",
  "non_marginable_buying_power": "7386.56",
  "equity": "103820.56",
  "last_equity": "103529.24",
  "long_market_value": "126960.76",
  "short_market_value": "0",
  "portfolio_value": "103820.56",
  "initial_margin": "63480.38",
  "maintenance_margin": "38088.23",
  "pattern_day_trader": false,
  "trading_blocked": false,
  "transfers_blocked": false,
  "account_blocked": false,
  "shorting_enabled": true,
  "multiplier": "4",
  "daytrade_count": 0,
  "created_at": "2019-06-12T22:47:07.99658Z"
}
```

---

### Account Object Fields

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique account ID |
| `account_number` | string | Human-readable account number (e.g. `PA3717PJAYWN`) |
| `status` | string | Account status. Common values: `ACTIVE`, `ACCOUNT_UPDATED`, `APPROVAL_PENDING` |
| `crypto_status` | string | Crypto-trading status. Only present when crypto is enabled |
| `currency` | string | Always `"USD"` |
| `cash` | string (decimal) | Cash balance. Can be negative if margin is used |
| `buying_power` | string (decimal) | Available buying power. For 2× margin: `max(equity - initial_margin) * 2`; for cash: equals `cash` |
| `regt_buying_power` | string (decimal) | Buying power under Regulation T: `excess_equity - (equity - margin_value) * margin_multiplier` |
| `daytrading_buying_power` | string (decimal) | Buying power available for day trades (PDT accounts only) |
| `non_marginable_buying_power` | string (decimal) | Buying power for non-marginable securities |
| `equity` | string (decimal) | `cash + long_market_value + short_market_value` |
| `last_equity` | string (decimal) | Equity as of previous trading day at 16:00 ET |
| `long_market_value` | string (decimal) | Real-time mark-to-market value of all long positions |
| `short_market_value` | string (decimal) | Real-time mark-to-market value of all short positions |
| `portfolio_value` | string (decimal) | **Deprecated.** Equivalent to `equity` |
| `initial_margin` | string (decimal) | Reg T initial margin requirement |
| `maintenance_margin` | string (decimal) | Current maintenance margin requirement |
| `last_maintenance_margin` | string (decimal) | Maintenance margin from the previous trading day |
| `sma` | string (decimal) | Special Memorandum Account value |
| `accrued_fees` | string (decimal) | Fees accrued in this account |
| `pending_transfer_in` | string (decimal) | Cash pending transfer into account |
| `pending_transfer_out` | string (decimal) | Cash pending transfer out of account |
| `pattern_day_trader` | boolean | `true` if account is flagged as a Pattern Day Trader |
| `trading_blocked` | boolean | `true` if order placement is blocked |
| `transfers_blocked` | boolean | `true` if money transfers are blocked |
| `account_blocked` | boolean | `true` if all account activity is prohibited |
| `trade_suspended_by_user` | boolean | `true` if the user has manually suspended trading |
| `shorting_enabled` | boolean | Whether short selling is permitted |
| `multiplier` | string | Margin multiplier (e.g. `"1"`, `"2"`, `"4"`) |
| `daytrade_count` | integer | Number of day trades in the last 5 trading days (inclusive of today). ≥ 4 triggers PDT flag |
| `created_at` | string (ISO 8601) | Account creation timestamp |
| `options_buying_power` | string (decimal) | Buying power available for options |
| `options_approved_level` | integer | Approved options level: `0`=disabled, `1`=Covered Call/CSP, `2`=Long Call/Put, `3`=Spreads/Straddles |
| `options_trading_level` | integer | Effective options level (min of approved and configured max) |

---

## 2. Orders

### `GET /v2/orders` — List Orders

**Purpose:** Returns a list of orders filtered by status, date range, symbols, and other criteria.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by status: `open` (default), `closed`, or `all` |
| `limit` | integer | No | Max orders to return. Default `50`, max `500` |
| `after` | string (ISO 8601) | No | Return orders submitted after this timestamp |
| `until` | string (ISO 8601) | No | Return orders submitted before this timestamp |
| `direction` | string | No | Sort direction: `asc` or `desc` (default `desc`) |
| `nested` | boolean | No | If `true`, multi-leg order legs are returned as nested `legs` array |
| `symbols` | string | No | Comma-separated list of symbols to filter by (e.g. `AAPL,TSLA`) |
| `side` | string | No | Filter by side: `buy` or `sell` |

**Example request:**
```
GET /v2/orders?status=open&limit=10&symbols=AAPL,TSLA
```

**Example response:** An array of [Order objects](#order-object-fields).

---

### `POST /v2/orders` — Create Order

**Purpose:** Submits a new order. This is the primary endpoint for all trading activity.

**Content-Type:** `application/json`

#### Request Body Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `symbol` | string | **Yes** (except `mleg`) | Symbol, asset ID, or currency pair (e.g. `"AAPL"`, `"BTC/USD"`) |
| `qty` | string/number | Conditional | Number of shares to trade. Fractionable for `market`+`day` orders. Required for `mleg` class. Mutually exclusive with `notional` |
| `notional` | string/number | Conditional | Dollar amount to trade (e.g. `"500.00"`). Only for `market` type + `day` TIF. Mutually exclusive with `qty` |
| `side` | string | **Yes** (except `mleg`) | `"buy"` or `"sell"` |
| `type` | string | **Yes** | Order type (see below) |
| `time_in_force` | string | **Yes** | Time-in-force value (see below) |
| `limit_price` | string/number | Conditional | Required when `type` is `limit` or `stop_limit` |
| `stop_price` | string/number | Conditional | Required when `type` is `stop` or `stop_limit` |
| `trail_price` | string/number | Conditional | Dollar offset from high-water mark. Required when `type` is `trailing_stop` (use either this or `trail_percent`) |
| `trail_percent` | string/number | Conditional | Percentage offset from high-water mark. Required when `type` is `trailing_stop` (use either this or `trail_price`) |
| `extended_hours` | boolean | No | Default `false`. If `true`, eligible for pre-market, after-hours, and overnight sessions. Requires `type=limit` and `time_in_force` of `day` or `gtc` |
| `client_order_id` | string | No | Custom identifier (≤ 128 chars). Auto-generated if not supplied |
| `order_class` | string | No | `"simple"` (default), `"bracket"`, `"oco"`, or `"oto"`. See [Order Classes](#order-classes-bracket-oco-oto) |
| `take_profit` | object | Conditional | Required for `bracket` and `oco`. Contains `{"limit_price": "..."}` |
| `stop_loss` | object | Conditional | Required for `bracket` and `oto`. Contains `{"stop_price": "...", "limit_price": "..."}` (limit_price optional) |
| `position_intent` | string | No | Desired position strategy: `"buy_to_open"`, `"buy_to_close"`, `"sell_to_open"`, `"sell_to_close"` |

#### `type` Values

| Value | Description | Equity | Options | Crypto |
|---|---|---|---|---|
| `market` | Executes at best available price | ✓ | ✓ | ✓ |
| `limit` | Executes at `limit_price` or better | ✓ | ✓ | ✓ |
| `stop` | Becomes market order when `stop_price` is reached | ✓ | — | — |
| `stop_limit` | Becomes limit order when `stop_price` is reached | ✓ | — | ✓ |
| `trailing_stop` | Stop price trails high-water mark by `trail_price` or `trail_percent` | ✓ | — | — |

#### `time_in_force` Values

| Value | Description | Equity | Options | Crypto |
|---|---|---|---|---|
| `day` | Valid only for the current trading day. Canceled at close if unfilled | ✓ | ✓ | — |
| `gtc` | Good-till-canceled. Remains active until filled or explicitly canceled | ✓ | — | ✓ |
| `opg` | Market/Limit On Open — executes in the opening auction only | ✓ | — | — |
| `cls` | Market/Limit On Close — executes in the closing auction only | ✓ | — | — |
| `ioc` | Immediate Or Cancel — fill immediately; cancel any unfilled portion | ✓ | — | ✓ |
| `fok` | Fill Or Kill — fill entire quantity immediately or cancel the whole order | ✓ | — | — |

**Notes on `opg`:** OPG orders submitted after 9:28 AM but before 7:00 PM ET are rejected. Submitted after 7:00 PM ET are queued for next day's open.  
**Notes on `cls`:** CLS orders submitted after 3:50 PM but before 7:00 PM ET are rejected.

#### Example: Simple Market Buy
```json
POST /v2/orders
{
  "symbol": "AAPL",
  "qty": "10",
  "side": "buy",
  "type": "market",
  "time_in_force": "day"
}
```

**Response (200):** A single [Order object](#order-object-fields).

```json
{
  "id": "61e69015-8549-4bfd-b9c3-01e75843f47d",
  "client_order_id": "eb9e2aaa-f71a-4754-8643-5fe8dd2e7ee0",
  "created_at": "2021-03-16T18:38:01.942282Z",
  "updated_at": "2021-03-16T18:38:01.942282Z",
  "submitted_at": "2021-03-16T18:38:01.937734Z",
  "filled_at": null,
  "symbol": "AAPL",
  "asset_class": "us_equity",
  "qty": "10",
  "filled_qty": "0",
  "filled_avg_price": null,
  "order_class": "simple",
  "type": "market",
  "side": "buy",
  "time_in_force": "day",
  "status": "accepted",
  "extended_hours": false,
  "legs": null
}
```

#### Example: Bracket Order (Equity)
```json
POST /v2/orders
{
  "symbol": "TSLA",
  "qty": "5",
  "side": "buy",
  "type": "market",
  "time_in_force": "day",
  "order_class": "bracket",
  "take_profit": { "limit_price": "300.00" },
  "stop_loss": { "stop_price": "240.00", "limit_price": "238.00" }
}
```

#### Example: Limit Order with Dollar Notional
```json
POST /v2/orders
{
  "symbol": "MSFT",
  "notional": "1000.00",
  "side": "buy",
  "type": "market",
  "time_in_force": "day"
}
```

#### Example: Trailing Stop
```json
POST /v2/orders
{
  "symbol": "SPY",
  "qty": "10",
  "side": "sell",
  "type": "trailing_stop",
  "time_in_force": "gtc",
  "trail_percent": "2.5"
}
```

---

### `GET /v2/orders/{order_id}` — Get Order by ID

**Purpose:** Returns a single order by its Alpaca-generated UUID.

**Path params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `order_id` | string (UUID) | **Yes** | The Alpaca order ID |

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `nested` | boolean | No | If `true`, returns bracket/OCO/OTO legs nested under the parent order |

**Example request:**
```
GET /v2/orders/61e69015-8549-4bfd-b9c3-01e75843f47d
```

**Response (200):** Single [Order object](#order-object-fields).

---

### `GET /v2/orders:by_client_order_id` — Get by Client Order ID

**Purpose:** Returns a single order looked up by the client-supplied `client_order_id`.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `client_order_id` | string | **Yes** | The client-supplied order ID |

**Example request:**
```
GET /v2/orders:by_client_order_id?client_order_id=my-order-ref-001
```

**Response (200):** Single [Order object](#order-object-fields).

---

### `PATCH /v2/orders/{order_id}` — Replace Order

**Purpose:** Replaces (amends) an existing open order. Creates a new order and cancels the old one atomically. Only `pending_new` or `new` status orders can be replaced.

**Path params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `order_id` | string (UUID) | **Yes** | The Alpaca order ID to replace |

**Request body (all fields optional; supply only those being changed):**

| Field | Type | Description |
|---|---|---|
| `qty` | string | New quantity |
| `limit_price` | string | New limit price |
| `stop_price` | string | New stop price |
| `trail` | string | New trail value (for trailing_stop orders) |
| `time_in_force` | string | New TIF value |
| `client_order_id` | string | New client order ID (≤ 128 chars) |

**Response (200):** The new replacement [Order object](#order-object-fields). The original order transitions to status `replaced`; the new order's `replaces` field references the original ID.

---

### `DELETE /v2/orders/{order_id}` — Cancel Order

**Purpose:** Attempts to cancel an open order. A successful cancellation does not guarantee the order wasn't already filled (race condition possible during market hours).

**Path params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `order_id` | string (UUID) | **Yes** | The Alpaca order ID to cancel |

**Response:** `204 No Content` on success.

---

### `DELETE /v2/orders` — Cancel All Orders

**Purpose:** Attempts to cancel all open orders. Returns an array of cancellation result objects, one per order attempted.

**Query params:** none  
**Request body:** none

**Response (207 Multi-Status):**
```json
[
  {
    "id": "61e69015-8549-4bfd-b9c3-01e75843f47d",
    "status": 200,
    "body": { /* Order object */ }
  },
  {
    "id": "9876abcd-...",
    "status": 500,
    "body": { "code": 40010001, "message": "order is not cancelable" }
  }
]
```

---

### Order Object Fields

Returned by all order endpoints.

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Alpaca-generated order ID |
| `client_order_id` | string | Client-supplied or auto-generated identifier |
| `created_at` | string (ISO 8601) | Timestamp when order was created |
| `updated_at` | string (ISO 8601) | Timestamp of last update |
| `submitted_at` | string (ISO 8601) | Timestamp when order was submitted to exchange |
| `filled_at` | string (ISO 8601) \| null | Timestamp when order was fully filled |
| `expired_at` | string (ISO 8601) \| null | Timestamp when order expired |
| `canceled_at` | string (ISO 8601) \| null | Timestamp when order was canceled |
| `failed_at` | string (ISO 8601) \| null | Timestamp when order failed |
| `replaced_at` | string (ISO 8601) \| null | Timestamp when order was replaced by a new order |
| `replaced_by` | string (UUID) \| null | ID of the order that replaced this one |
| `replaces` | string (UUID) \| null | ID of the order this one replaced |
| `asset_id` | string (UUID) | ID of the asset being traded |
| `symbol` | string | Symbol of the asset |
| `asset_class` | string | Asset class: `us_equity`, `crypto`, `us_option` |
| `notional` | string \| null | Ordered notional dollar amount; `null` if `qty` was specified |
| `qty` | string \| null | Ordered share quantity; `null` if `notional` was specified |
| `filled_qty` | string | Quantity filled so far |
| `filled_avg_price` | string \| null | Average price of filled shares. May be `0` if processed outside market hours |
| `order_class` | string | `simple`, `bracket`, `oco`, or `oto` |
| `type` | string | Order type: `market`, `limit`, `stop`, `stop_limit`, `trailing_stop` |
| `side` | string | `buy` or `sell` |
| `time_in_force` | string | TIF value used |
| `limit_price` | string \| null | Limit price (if applicable) |
| `stop_price` | string \| null | Stop price (if applicable) |
| `status` | string | Current order status (see below) |
| `extended_hours` | boolean | Whether extended hours execution is enabled |
| `legs` | array \| null | Child orders for bracket/OCO/OTO orders (when `nested=true`) |
| `trail_percent` | string \| null | Trail percentage for trailing stop orders |
| `trail_price` | string \| null | Trail dollar amount for trailing stop orders |
| `hwm` | string \| null | High-water mark (highest/lowest price seen since trailing stop was submitted) |
| `position_intent` | string \| null | Position strategy hint |

**Order status values:** `new`, `partially_filled`, `filled`, `done_for_day`, `canceled`, `expired`, `replaced`, `pending_cancel`, `pending_replace`, `pending_new`, `accepted`, `accepted_for_bidding`, `stopped`, `rejected`, `suspended`, `calculated`

---

### Order Classes: Bracket, OCO, OTO

All multi-leg classes are equity-only (not supported for crypto or options with these classes).

#### Bracket
Submits three linked orders simultaneously: the primary entry order, a take-profit limit order, and a stop-loss order. If either the take-profit or stop-loss fires, the other leg is automatically canceled.

```json
{
  "order_class": "bracket",
  "take_profit": { "limit_price": "155.00" },
  "stop_loss": { "stop_price": "140.00", "limit_price": "139.50" }
}
```

#### OCO (One-Cancels-Other)
Two exit orders where filling one automatically cancels the other. Used to add a take-profit/stop-loss pair to an existing position (no entry leg).

```json
{
  "order_class": "oco",
  "take_profit": { "limit_price": "155.00" },
  "stop_loss": { "stop_price": "140.00" }
}
```

#### OTO (One-Triggers-Other)
An entry order that, once filled, automatically submits a secondary order. Used to place a stop-loss contingent on an entry fill.

```json
{
  "order_class": "oto",
  "stop_loss": { "stop_price": "140.00" }
}
```

---

## 3. Positions

### `GET /v2/positions` — List All Positions

**Purpose:** Returns all open positions in the account.

**Query params:** none  
**Request body:** none

**Example request:**
```
GET /v2/positions
```

**Example response (abbreviated):**
```json
[
  {
    "asset_id": "904837e3-3b76-47ec-b432-046db621571b",
    "symbol": "AAPL",
    "exchange": "NASDAQ",
    "asset_class": "us_equity",
    "qty": "100",
    "side": "long",
    "avg_entry_price": "172.35",
    "market_value": "17645.00",
    "cost_basis": "17235.00",
    "unrealized_pl": "410.00",
    "unrealized_plpc": "0.0238",
    "unrealized_intraday_pl": "45.00",
    "unrealized_intraday_plpc": "0.0026",
    "current_price": "176.45",
    "lastday_price": "175.00",
    "change_today": "0.0083",
    "qty_available": "100"
  }
]
```

---

### `GET /v2/positions/{symbol}` — Get Open Position

**Purpose:** Returns a single open position for the specified symbol or asset ID.

**Path params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `symbol` | string | **Yes** | Ticker symbol (e.g. `AAPL`) or asset UUID |

**Example request:**
```
GET /v2/positions/AAPL
```

**Response (200):** Single [Position object](#position-object-fields).

---

### `DELETE /v2/positions/{symbol}` — Close Position

**Purpose:** Submits a market order to close (liquidate) an open position. Returns the generated order object.

**Path params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `symbol` | string | **Yes** | Ticker symbol or asset UUID |

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `qty` | string | No | Number of shares to close. Mutually exclusive with `percentage` |
| `percentage` | string | No | Percentage of position to close (e.g. `"0.5"` for 50%). Mutually exclusive with `qty` |

If neither `qty` nor `percentage` is supplied, the entire position is closed.

**Example requests:**
```
DELETE /v2/positions/AAPL                      # close entire position
DELETE /v2/positions/AAPL?qty=50               # close 50 shares
DELETE /v2/positions/AAPL?percentage=0.5       # close 50% of position
```

**Response (200):** An [Order object](#order-object-fields) representing the liquidating market order.

---

### `DELETE /v2/positions` — Close All Positions

**Purpose:** Submits market orders to liquidate all open positions. Returns an array of close-position result objects.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `cancel_orders` | boolean | No | If `true`, cancels open orders before liquidating positions (prevents rejections). Default `false` |

**Example request:**
```
DELETE /v2/positions?cancel_orders=true
```

**Response (207 Multi-Status):** Array of `ClosePositionResponse` objects:
```json
[
  {
    "symbol": "AAPL",
    "status": 200,
    "order_id": "61e69015-8549-4bfd-b9c3-01e75843f47d",
    "body": { /* Order object */ }
  },
  {
    "symbol": "TSLA",
    "status": 500,
    "body": {
      "code": 40310000,
      "message": "insufficient qty available for order",
      "existing_qty": 5.0,
      "held_for_orders": 5.0,
      "available": 0.0
    }
  }
]
```

---

### Position Object Fields

| Field | Type | Description |
|---|---|---|
| `asset_id` | string (UUID) | ID of the asset |
| `symbol` | string | Ticker symbol (e.g. `"AAPL"`) |
| `exchange` | string | Exchange the asset trades on (e.g. `"NASDAQ"`, `"NYSE"`) |
| `asset_class` | string | Asset class: `us_equity`, `crypto` |
| `asset_marginable` | boolean \| null | Whether the asset qualifies for margin |
| `qty` | string | Total shares held (positive = long, negative = short for returned `side`) |
| `qty_available` | string | Shares available to trade (total minus shares locked in open orders) |
| `side` | string | `"long"` or `"short"` |
| `avg_entry_price` | string | Volume-weighted average price paid to establish the position |
| `market_value` | string | Current mark-to-market dollar value (`qty × current_price`) |
| `cost_basis` | string | Total dollar cost to establish the position (`qty × avg_entry_price`) |
| `unrealized_pl` | string | Unrealized profit/loss in dollars (`market_value - cost_basis`) |
| `unrealized_plpc` | string | Unrealized P/L as a decimal percentage (e.g. `"0.0238"` = 2.38%) |
| `unrealized_intraday_pl` | string | Unrealized P/L in dollars for today only |
| `unrealized_intraday_plpc` | string | Unrealized P/L percentage for today only |
| `current_price` | string | Current market price per share |
| `lastday_price` | string | Closing price of the previous trading day |
| `change_today` | string | Percent change from `lastday_price` to `current_price` |
| `swap_rate` | string \| null | FX rate used for crypto/international assets |
| `avg_entry_swap_rate` | string \| null | Average FX rate at which the position was entered |
| `usd` | object \| null | USD-denominated equivalents for crypto positions |

---

## Sources

- `https://docs.alpaca.markets/reference/postorder` (bot-blocked; content captured on first attempt)
- `https://alpaca.markets/sdks/python/api_reference/trading/models.html` — `TradeAccount`, `Order`, `Position` model definitions
- `https://blog.xmartlabs.com/blog/a-comprehensive-guide-to-alpaca-trading-api/` — live account response example
- `https://docs.alpaca.markets/us/docs/account-plans` — account JSON example (bot-blocked; data captured from search snippet)
- Known-good anchors provided by task specification (base URLs, paths, auth headers)

> **⚠ Verification status:** The `POST /v2/orders` request fields were scraped directly from docs.alpaca.markets. The `GET /v2/orders` query params, `PATCH /v2/orders/{order_id}` replace fields, and `DELETE /v2/positions` `cancel_orders` param are derived from authoritative SDK models and well-cited community sources — but the exact parameter names for PATCH/DELETE endpoints were not directly scraped (docs site returned bot-challenge pages). Treat those sections as high-confidence but flagged for manual cross-check against https://docs.alpaca.markets/reference/patchorderbyorderid and https://docs.alpaca.markets/reference/deleteallopenpositions.
