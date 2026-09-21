# Alpaca API — Options, Screeners, Corporate Actions & Account Config

> **Sources:** Alpaca `alpaca-py` SDK (GitHub), `alpaca-mcp-server` v2.3.1 README, and Alpaca docs.
> Options data endpoints use **`v1beta1`** under `https://data.alpaca.markets`.
> Options trading endpoints use **`/v2`** under the trading base URL.

---

## Table of Contents

1. [Options Trading](#1-options-trading)
   - 1.1 [Get Option Contracts](#11-get-option-contracts)
   - 1.2 [Get Option Contract by Symbol/ID](#12-get-option-contract-by-symbolid)
   - 1.3 [Place Option Order (Single-Leg)](#13-place-option-order-single-leg)
   - 1.4 [Place Multi-Leg Option Order](#14-place-multi-leg-option-order)
   - 1.5 [Exercise Option Position](#15-exercise-option-position)
   - 1.6 [Do-Not-Exercise Option Position](#16-do-not-exercise-option-position)
2. [Options Market Data](#2-options-market-data)
   - 2.1 [Option Bars (Historical)](#21-option-bars-historical)
   - 2.2 [Option Trades (Historical)](#22-option-trades-historical)
   - 2.3 [Option Latest Trade](#23-option-latest-trade)
   - 2.4 [Option Latest Quote](#24-option-latest-quote)
   - 2.5 [Option Snapshot](#25-option-snapshot)
   - 2.6 [Option Chain](#26-option-chain)
   - 2.7 [Option Exchange Codes](#27-option-exchange-codes)
3. [Stock Screeners](#3-stock-screeners)
   - 3.1 [Most Active Stocks](#31-most-active-stocks)
   - 3.2 [Market Movers](#32-market-movers)
4. [Crypto Extras](#4-crypto-extras)
   - 4.1 [Crypto Snapshot](#41-crypto-snapshot)
   - 4.2 [Crypto Orderbook](#42-crypto-orderbook)
5. [Corporate Actions](#5-corporate-actions)
6. [Account Configuration](#6-account-configuration)
7. [Object Reference](#7-object-reference)

---

## 1. Options Trading

Options trading endpoints live on the **trading base URL** (`paper-api.alpaca.markets` or `api.alpaca.markets`).

### OCC Symbol Format

Option contract symbols follow OCC symbology: `AAPL250620C00200000`
- `AAPL` — underlying symbol (1-6 chars, left-padded)
- `250620` — expiration date (YYMMDD)
- `C` or `P` — call or put
- `00200000` — strike price x 1000 (8 digits, zero-padded)

### 1.1 Get Option Contracts

```
GET /v2/options/contracts
```

Returns a paginated list of option contracts matching the filter criteria.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `underlying_symbols` | string | No | Comma-separated list of underlying symbols (e.g. `AAPL,SPY`) |
| `status` | string | No | Asset status: `active` (default) or `inactive` |
| `expiration_date` | string | No | Exact expiration date `YYYY-MM-DD` |
| `expiration_date_gte` | string | No | Expiration on or after `YYYY-MM-DD` |
| `expiration_date_lte` | string | No | Expiration on or before `YYYY-MM-DD` |
| `root_symbol` | string | No | Option root symbol |
| `type` | string | No | Contract type: `call` or `put` |
| `style` | string | No | Exercise style: `american` or `european` |
| `strike_price_gte` | string | No | Strike price >= this value |
| `strike_price_lte` | string | No | Strike price <= this value |
| `limit` | integer | No | Results per page (default 100, max 10000) |
| `page_token` | string | No | Pagination cursor |

#### Example response

```json
{
  "option_contracts": [
    {
      "id": "5a071610-a1ed-4e02-8742-69a8f7c114f8",
      "symbol": "AAPL250620C00200000",
      "name": "AAPL Jun 20 2025 200.00 Call",
      "status": "active",
      "tradable": true,
      "expiration_date": "2025-06-20",
      "root_symbol": "AAPL",
      "underlying_symbol": "AAPL",
      "underlying_asset_id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
      "type": "call",
      "style": "american",
      "strike_price": "200",
      "multiplier": "100",
      "size": "100",
      "open_interest": "15432",
      "open_interest_date": "2025-06-19",
      "close_price": "12.50",
      "close_price_date": "2025-06-19",
      "deliverables": null
    }
  ],
  "next_page_token": null
}
```

---

### 1.2 Get Option Contract by Symbol/ID

```
GET /v2/options/contracts/{symbol_or_id}
```

Returns a single option contract.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol_or_id` | string | **Yes** | OCC symbol (e.g. `AAPL250620C00200000`) or UUID |

**Response:** Single option contract object (same shape as array element above).

---

### 1.3 Place Option Order (Single-Leg)

Uses the same `POST /v2/orders` endpoint as equities, with option-specific fields.

```json
POST /v2/orders
{
  "symbol": "AAPL250620C00200000",
  "qty": "1",
  "side": "buy",
  "type": "market",
  "time_in_force": "day",
  "position_intent": "buy_to_open"
}
```

**Key differences from equity orders:**
- `symbol` is the OCC option symbol
- `position_intent` specifies the strategy: `buy_to_open`, `buy_to_close`, `sell_to_open`, `sell_to_close`
- Only `market` and `limit` order types are supported for options
- Only `day` time-in-force is supported for options
- `notional` is NOT supported (must use `qty`)
- `qty` represents number of contracts (each contract = 100 shares of underlying)

**Response:** Standard [Order object](01-trading-account-orders-positions.md#order-object-fields) with `asset_class: "us_option"`.

---

### 1.4 Place Multi-Leg Option Order

Multi-leg orders use `order_class: "mleg"` with a `legs` array. Supports 2-4 legs for strategies like spreads, straddles, strangles, and iron condors.

```json
POST /v2/orders
{
  "qty": "1",
  "type": "market",
  "time_in_force": "day",
  "order_class": "mleg",
  "legs": [
    {
      "symbol": "AAPL250620C00190000",
      "ratio_qty": "1",
      "side": "buy",
      "position_intent": "buy_to_open"
    },
    {
      "symbol": "AAPL250620C00200000",
      "ratio_qty": "1",
      "side": "sell",
      "position_intent": "sell_to_open"
    }
  ]
}
```

**Multi-leg rules:**
- `order_class` must be `"mleg"`
- `qty` is required (contracts per strategy unit)
- `symbol` and `side` move to each leg; top-level `symbol`/`side` must be omitted
- Each leg has `symbol`, `ratio_qty`, and either `side` or `position_intent`
- `ratio_qty` is proportional to `qty` (e.g. `ratio_qty: 1` with `qty: 2` = 2 contracts for that leg)
- 2-4 legs required; all leg symbols must be unique
- Only `market` and `limit` types supported
- For `limit` orders: positive `limit_price` = debit (you pay); negative = credit (you receive)

#### Leg object fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | **Yes** | OCC option symbol for this leg |
| `ratio_qty` | number | **Yes** | Proportional quantity relative to order `qty` |
| `side` | string | Conditional | `buy` or `sell`. Either `side` or `position_intent` required |
| `position_intent` | string | Conditional | `buy_to_open`, `buy_to_close`, `sell_to_open`, `sell_to_close` |

---

### 1.5 Exercise Option Position

```
POST /v2/positions/{symbol_or_contract_id}/exercise
```

Exercises all held contracts of the specified option position. Converts option contracts into the underlying asset.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol_or_contract_id` | string | **Yes** | OCC symbol or contract UUID |

**Notes:**
- Exercise requests are processed immediately
- Requests submitted outside market hours are rejected
- By default, Alpaca automatically exercises ITM contracts at expiry
- Response: `204 No Content` on success

---

### 1.6 Do-Not-Exercise Option Position

```
POST /v2/positions/{symbol_or_contract_id}/do-not-exercise
```

Submits a do-not-exercise instruction for the specified option position.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol_or_contract_id` | string | **Yes** | OCC symbol or contract UUID |

**Response:** `204 No Content` on success.

---

## 2. Options Market Data

All options data endpoints use **`https://data.alpaca.markets`** with API version **`v1beta1`**.

### Feed parameter

| Value | Description | Access |
|-------|-------------|--------|
| `opra` | Official OPRA feed (real-time) | Paid options data subscription |
| `indicative` | Indicative/delayed data | Free (default if no subscription) |

### 2.1 Option Bars (Historical)

```
GET /v1beta1/options/bars
```

Returns OHLCV bars for option contracts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated OCC symbols |
| `timeframe` | string | **Yes** | Aggregation: `1Min` through `1Month` (same values as stock bars) |
| `start` | string | No | Start datetime (RFC-3339 or YYYY-MM-DD) |
| `end` | string | No | End datetime |
| `limit` | integer | No | Max bars (1-10000, default 1000) |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |

#### Example response

```json
{
  "bars": {
    "AAPL250620C00200000": [
      {
        "t": "2025-06-19T14:00:00Z",
        "o": 12.30,
        "h": 12.75,
        "l": 12.10,
        "c": 12.50,
        "v": 1520,
        "n": 245,
        "vw": 12.42
      }
    ]
  },
  "next_page_token": null
}
```

---

### 2.2 Option Trades (Historical)

```
GET /v1beta1/options/trades
```

Returns historical trades for option contracts. Limited to 7 days of history.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated OCC symbols |
| `start` | string | No | Start datetime |
| `end` | string | No | End datetime |
| `limit` | integer | No | Max trades (1-10000, default 1000) |
| `sort` | string | No | `asc` (default) or `desc` |
| `page_token` | string | No | Pagination cursor |

---

### 2.3 Option Latest Trade

```
GET /v1beta1/options/trades/latest
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated OCC symbols |
| `feed` | string | No | `opra` or `indicative` |

---

### 2.4 Option Latest Quote

```
GET /v1beta1/options/quotes/latest
```

Returns the latest bid/ask quote for option contracts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated OCC symbols |
| `feed` | string | No | `opra` or `indicative` |

---

### 2.5 Option Snapshot

```
GET /v1beta1/options/snapshots
```

Returns snapshots with latest trade, latest quote, implied volatility, and Greeks.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated OCC symbols |
| `feed` | string | No | `opra` or `indicative` |

#### Example response

```json
{
  "snapshots": {
    "AAPL250620C00200000": {
      "latestTrade": {
        "t": "2025-06-19T19:45:00Z",
        "x": "C",
        "p": 12.50,
        "s": 10,
        "c": ["a"]
      },
      "latestQuote": {
        "t": "2025-06-19T19:59:00Z",
        "ax": "C",
        "ap": 12.60,
        "as": 50,
        "bx": "P",
        "bp": 12.40,
        "bs": 30,
        "c": ["A"]
      },
      "impliedVolatility": 0.285,
      "greeks": {
        "delta": 0.65,
        "gamma": 0.032,
        "theta": -0.15,
        "vega": 0.28,
        "rho": 0.12
      }
    }
  }
}
```

---

### 2.6 Option Chain

```
GET /v1beta1/options/snapshots/{underlying_symbol}
```

Returns the full option chain (all available contracts with snapshot data) for an underlying symbol.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `underlying_symbol` | string (path) | **Yes** | Underlying ticker (e.g. `AAPL`) |
| `feed` | string | No | `opra` or `indicative` |
| `type` | string | No | Filter: `call` or `put` |
| `strike_price_gte` | number | No | Strike >= value |
| `strike_price_lte` | number | No | Strike <= value |
| `expiration_date` | string | No | Exact expiration `YYYY-MM-DD` |
| `expiration_date_gte` | string | No | Expiration >= date |
| `expiration_date_lte` | string | No | Expiration <= date |
| `root_symbol` | string | No | Option root symbol |
| `updated_since` | string | No | Only snapshots updated after this timestamp |

**Response:** Same snapshot shape as 2.5, keyed by OCC symbol. Paginated.

---

### 2.7 Option Exchange Codes

```
GET /v1beta1/options/meta/exchanges
```

No parameters. Returns a mapping of exchange codes to exchange names.

#### Example response

```json
{
  "A": "NYSE American Options",
  "B": "BOX Options Exchange",
  "C": "CBOE",
  "H": "ISE Gemini",
  "I": "ISE",
  "M": "MIAX Options Exchange",
  "N": "NYSE Arca Options",
  "O": "OPRA",
  "P": "PEARL",
  "Q": "NASDAQ Options Market",
  "W": "C2 Options Exchange",
  "X": "PHLX",
  "Z": "BATS Options"
}
```

---

## 3. Stock Screeners

All screener endpoints use **`https://data.alpaca.markets`** with API version **`v1beta1`**.

### 3.1 Most Active Stocks

```
GET /v1beta1/screener/stocks/most-actives
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `by` | string | No | Ranking metric: `volume` (default) or `trades` |
| `top` | integer | No | Number of results to return (default 10) |

#### Example response

```json
{
  "most_actives": [
    {
      "symbol": "NVDA",
      "volume": 245000000,
      "trade_count": 1520000
    },
    {
      "symbol": "TSLA",
      "volume": 189000000,
      "trade_count": 980000
    }
  ],
  "last_updated": "2025-06-19T19:55:00Z"
}
```

---

### 3.2 Market Movers

```
GET /v1beta1/screener/{market_type}/movers
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `market_type` | string (path) | **Yes** | `stocks` or `crypto` |
| `top` | integer | No | Number of results per category (default 10) |

#### Example response

```json
{
  "gainers": [
    {
      "symbol": "XYZ",
      "percent_change": 15.2,
      "change": 3.45,
      "price": 26.14
    }
  ],
  "losers": [
    {
      "symbol": "ABC",
      "percent_change": -8.7,
      "change": -2.10,
      "price": 22.04
    }
  ],
  "market_type": "stocks",
  "last_updated": "2025-06-19T19:55:00Z"
}
```

---

## 4. Crypto Extras

### 4.1 Crypto Snapshot

```
GET /v1beta3/crypto/{loc}/snapshots
```

Returns snapshots for crypto pairs. Same pattern as stock snapshots.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs (e.g. `BTC/USD,ETH/USD`) |

**Response:** Same shape as stock snapshots (latestTrade, latestQuote, minuteBar, dailyBar, prevDailyBar) keyed by symbol.

---

### 4.2 Crypto Orderbook

```
GET /v1beta3/crypto/{loc}/latest/orderbooks
```

Returns the latest orderbook (depth of book) for crypto pairs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | **Yes** | Comma-separated crypto pairs |

#### Example response

```json
{
  "orderbooks": {
    "BTC/USD": {
      "t": "2025-06-19T19:59:00Z",
      "b": [
        { "p": 67050.00, "s": 0.5 },
        { "p": 67045.00, "s": 1.2 }
      ],
      "a": [
        { "p": 67055.00, "s": 0.3 },
        { "p": 67060.00, "s": 0.8 }
      ]
    }
  }
}
```

---

## 5. Corporate Actions

**Trading API endpoint** (deprecated, but functional):

```
GET /v2/corporate_actions/announcements
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ca_types` | string | **Yes** | Comma-separated types: `dividend`, `merger`, `spinoff`, `split` |
| `since` | string | **Yes** | Start date `YYYY-MM-DD` (max 90-day range) |
| `until` | string | **Yes** | End date `YYYY-MM-DD` |
| `symbol` | string | No | Filter by symbol |
| `cusip` | string | No | Filter by CUSIP |
| `date_type` | string | No | Date field to filter on: `declaration`, `ex`, `record`, `payable` |

```
GET /v2/corporate_actions/announcements/{id}
```

Returns a single announcement by ID.

---

## 6. Account Configuration

### Get Configuration

```
GET /v2/account/configurations
```

No parameters. Returns the account configuration object.

### Update Configuration

```
PATCH /v2/account/configurations
```

Request body (all fields optional, send only those being changed):

| Field | Type | Description |
|-------|------|-------------|
| `fractional_trading` | boolean | Enable/disable fractional share trading |
| `max_margin_multiplier` | string | Margin multiplier: `"1"`, `"2"`, or `"4"` |
| `no_shorting` | boolean | If true, account is long-only |
| `suspend_trade` | boolean | If true, no new orders can be submitted |
| `trade_confirm_email` | string | `all`, `none` |
| `max_options_trading_level` | integer | 0=disabled, 1=covered calls/CSP, 2=long calls/puts, 3=spreads/straddles |

#### Example response

```json
{
  "fractional_trading": true,
  "max_margin_multiplier": "4",
  "no_shorting": false,
  "suspend_trade": false,
  "trade_confirm_email": "all",
  "ptp_no_exception_entry": false,
  "max_options_trading_level": 2
}
```

---

## 7. Object Reference

### Option Contract Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique contract identifier |
| `symbol` | string | OCC symbol (e.g. `AAPL250620C00200000`) |
| `name` | string | Human-readable name |
| `status` | string | `active` or `inactive` |
| `tradable` | boolean | Whether the contract can be traded |
| `expiration_date` | string | Expiration date `YYYY-MM-DD` |
| `root_symbol` | string | Option root symbol |
| `underlying_symbol` | string | Underlying equity symbol |
| `underlying_asset_id` | UUID | Underlying asset ID |
| `type` | string | `call` or `put` |
| `style` | string | `american` or `european` |
| `strike_price` | string | Strike price |
| `multiplier` | string | Contract multiplier (typically `"100"`) |
| `size` | string | Contract size |
| `open_interest` | string | Open interest |
| `open_interest_date` | string | Date of open interest value |
| `close_price` | string | Previous close price |
| `close_price_date` | string | Date of close price |

### Options Greeks Object

| Field | Type | Description |
|-------|------|-------------|
| `delta` | float | Rate of change of option price vs underlying price |
| `gamma` | float | Rate of change of delta vs underlying price |
| `theta` | float | Rate of change of option price vs time (time decay) |
| `vega` | float | Rate of change of option price vs volatility |
| `rho` | float | Rate of change of option price vs risk-free rate |

### ActiveStock Object

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Ticker symbol |
| `volume` | float | Cumulative daily volume |
| `trade_count` | float | Cumulative daily trade count |

### Mover Object

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Ticker symbol |
| `percent_change` | float | Percent change for the day |
| `change` | float | Dollar change for the day |
| `price` | float | Current price |
