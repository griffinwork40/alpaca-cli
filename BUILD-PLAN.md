# Alpaca CLI — BUILD PLAN

> **Hand this file verbatim to parallel build sub-agents.**  
> Do NOT deviate from the locked design decisions below.

---

## Locked Design Decisions

1. **Auth**: two headers `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`. Both redacted from ALL stdout and ALL error messages.
2. **Credential resolution**: `config.ts` reads `APCA_API_KEY_ID` / `APCA_API_SECRET_KEY` (primary), aliased from `ALPACA_API_KEY_ID` / `ALPACA_API_SECRET_KEY`. Missing → `UsageError` naming both env vars.
3. **Paper vs. Live safety boundary**: default to paper (`https://paper-api.alpaca.markets`). Global `--live` flag (or `APCA_API_BASE_URL` override) switches to live. Market-data always uses `https://data.alpaca.markets`. CLI prints environment label to STDERR before every command: `[paper]` or `[LIVE ⚠ REAL MONEY]`. Order-creating commands (`orders create`, `positions close`, `positions close-all`) additionally print a LIVE WARNING to STDERR when `--live` is active.
4. **Single `AlpacaClient` class**: constructed with `{ keyId, secretKey, tradingBaseUrl, dataBaseUrl }`. Public methods accept a full URL (string) so callers can pass either base. Commands build the full URL from `config` values. Preferred method signatures below (§B).
5. **Module structure**: `src/config.ts` + `src/types.ts` + `src/utils.ts` + `src/redact.ts` + `src/errors.ts` + `src/client.ts` + `src/commands/*.ts` + `src/cli.ts`. Each `.ts` has a co-located `.test.ts`.
6. **TDD gate per wave**: `pnpm test` green + `pnpm typecheck` clean before proceeding.

---

## A. CLI Command Surface

> Global flags apply to **every** command: `--live`, `--paper` (explicit paper, default), `--help`, `--json` (reserved; output is always JSON).  
> `<id>` = Alpaca UUID. `<symbol>` = ticker (e.g. `AAPL`) or `<pair>` for crypto (e.g. `BTC/USD`).

### Trading Commands (`src/commands/account.ts` + `src/commands/orders.ts` + `src/commands/positions.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca account` | GET | `/v2/account` | — |
| `alpaca account activities` | GET | `/v2/account/activities` | `--types --date --after --until --direction --page-size --page-token` |
| `alpaca account activities <type>` | GET | `/v2/account/activities/{activity_type}` | `--date --after --until --direction --page-size --page-token` |
| `alpaca account portfolio-history` | GET | `/v2/account/portfolio/history` | `--period --timeframe --start --end --extended-hours` |
| `alpaca orders list` | GET | `/v2/orders` | `--status --limit --after --until --direction --symbols --side --nested` |
| `alpaca orders get <id>` | GET | `/v2/orders/{order_id}` | `--nested` |
| `alpaca orders get-by-client-id <client-order-id>` | GET | `/v2/orders:by_client_order_id` | — |
| `alpaca orders create` | POST | `/v2/orders` | `--symbol --qty --notional --side --type --tif --limit-price --stop-price --trail-price --trail-percent --extended-hours --client-order-id --order-class --take-profit-limit --stop-loss-stop --stop-loss-limit` |
| `alpaca orders replace <id>` | PATCH | `/v2/orders/{order_id}` | `--qty --limit-price --stop-price --trail --tif --client-order-id` |
| `alpaca orders cancel <id>` | DELETE | `/v2/orders/{order_id}` | — |
| `alpaca orders cancel-all` | DELETE | `/v2/orders` | — |
| `alpaca positions list` | GET | `/v2/positions` | — |
| `alpaca positions get <symbol>` | GET | `/v2/positions/{symbol}` | — |
| `alpaca positions close <symbol>` | DELETE | `/v2/positions/{symbol}` | `--qty --percentage` |
| `alpaca positions close-all` | DELETE | `/v2/positions` | `--cancel-orders` |

### Assets, Watchlists, Calendar & Clock (`src/commands/assets.ts` + `src/commands/watchlists.ts` + `src/commands/meta.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca assets list` | GET | `/v2/assets` | `--status --asset-class --exchange --attributes` |
| `alpaca assets get <symbol>` | GET | `/v2/assets/{symbol_or_asset_id}` | — |
| `alpaca watchlists list` | GET | `/v2/watchlists` | — |
| `alpaca watchlists get <id>` | GET | `/v2/watchlists/{watchlist_id}` | — |
| `alpaca watchlists create --name <name>` | POST | `/v2/watchlists` | `--name --symbols` |
| `alpaca watchlists update <id>` | PUT | `/v2/watchlists/{watchlist_id}` | `--name --symbols` |
| `alpaca watchlists delete <id>` | DELETE | `/v2/watchlists/{watchlist_id}` | — |
| `alpaca watchlists add <id> --symbol <symbol>` | POST | `/v2/watchlists/{watchlist_id}` | `--symbol` |
| `alpaca watchlists remove <id> --symbol <symbol>` | DELETE | `/v2/watchlists/{watchlist_id}/{symbol}` | — |
| `alpaca calendar` | GET | `/v2/calendar` | `--start --end` |
| `alpaca clock` | GET | `/v2/clock` | — |

### Market Data — Stocks (`src/commands/stocks.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca stocks bars <symbol>` | GET | `/v2/stocks/{symbol}/bars` | `--timeframe --start --end --limit --adjustment --feed --sort --page-token --asof` |
| `alpaca stocks bars-multi --symbols <s1,s2>` | GET | `/v2/stocks/bars` | `--symbols --timeframe --start --end --limit --adjustment --feed --sort --page-token` |
| `alpaca stocks bars-latest <symbol>` | GET | `/v2/stocks/{symbol}/bars/latest` | `--feed` |
| `alpaca stocks quotes <symbol>` | GET | `/v2/stocks/{symbol}/quotes` | `--start --end --limit --feed --sort --page-token --asof` |
| `alpaca stocks quotes-latest <symbol>` | GET | `/v2/stocks/{symbol}/quotes/latest` | `--feed` |
| `alpaca stocks trades <symbol>` | GET | `/v2/stocks/{symbol}/trades` | `--start --end --limit --feed --sort --page-token --asof` |
| `alpaca stocks trades-latest <symbol>` | GET | `/v2/stocks/{symbol}/trades/latest` | `--feed` |
| `alpaca stocks snapshot <symbol>` | GET | `/v2/stocks/{symbol}/snapshot` | `--feed` |
| `alpaca stocks snapshots --symbols <s1,s2>` | GET | `/v2/stocks/snapshots` | `--symbols --feed` |

### Options Trading (`src/commands/options.ts` + `src/commands/positions.ts` + `src/commands/orders.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca options contracts` | GET | `/v2/options/contracts` | `--underlying --status --expiration --expiration-gte --expiration-lte --root-symbol --type --style --strike-gte --strike-lte --limit --page-token` |
| `alpaca options contract <symbol-or-id>` | GET | `/v2/options/contracts/{symbol_or_id}` | — |
| `alpaca options chain <underlying>` | GET | `/v1beta1/options/snapshots/{underlying}` | `--feed --type --strike-gte --strike-lte --expiration --expiration-gte --expiration-lte --root-symbol --updated-since` |
| `alpaca options bars <symbol>` | GET | `/v1beta1/options/bars` | `--timeframe --start --end --limit --sort --page-token` |
| `alpaca options trades <symbol>` | GET | `/v1beta1/options/trades` | `--start --end --limit --sort --page-token` |
| `alpaca options trades-latest <symbol>` | GET | `/v1beta1/options/trades/latest` | `--feed` |
| `alpaca options quotes-latest <symbol>` | GET | `/v1beta1/options/quotes/latest` | `--feed` |
| `alpaca options snapshot <symbol>` | GET | `/v1beta1/options/snapshots` | `--feed` |
| `alpaca options exchanges` | GET | `/v1beta1/options/meta/exchanges` | — |
| `alpaca positions exercise <symbol>` | POST | `/v2/positions/{symbol}/exercise` | — |
| `alpaca positions do-not-exercise <symbol>` | POST | `/v2/positions/{symbol}/do-not-exercise` | — |
| `alpaca orders create` (mleg) | POST | `/v2/orders` | `--qty --type --tif --order-class mleg --legs <json> --limit-price --position-intent` |

> **Note on mleg orders**: `--symbol` and `--side` are omitted for mleg; each leg carries its own symbol/side. `--legs` accepts a JSON array string.

### Screeners & Market Intelligence (`src/commands/screeners.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca stocks most-active` | GET | `/v1beta1/screener/stocks/most-actives` | `--by --top` |
| `alpaca stocks movers <market-type>` | GET | `/v1beta1/screener/{market_type}/movers` | `--top` |

### Corporate Actions & Account Config (`src/commands/meta.ts` + `src/commands/account.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca corporate-actions` | GET | `/v2/corporate_actions/announcements` | `--ca-types --since --until --symbol --cusip --date-type` |
| `alpaca corporate-actions get <id>` | GET | `/v2/corporate_actions/announcements/{id}` | — |
| `alpaca account config` | GET | `/v2/account/configurations` | — |
| `alpaca account update-config` | PATCH | `/v2/account/configurations` | `--fractional-trading --max-margin-multiplier --no-shorting --suspend-trade --trade-confirm-email --max-options-trading-level` |

### Market Data — Crypto & News (`src/commands/crypto.ts` + `src/commands/news.ts`)

| Command | HTTP Method | Path | Key Flags |
|---------|-------------|------|-----------|
| `alpaca crypto bars <pair>` | GET | `/v1beta3/crypto/us/bars` | `--symbols (csv) --timeframe --start --end --limit --sort --page-token` |
| `alpaca crypto bars-latest <pair>` | GET | `/v1beta3/crypto/us/latest/bars` | `--symbols (csv)` |
| `alpaca crypto quotes <pair>` | GET | `/v1beta3/crypto/us/quotes` | `--symbols (csv) --start --end --limit --sort --page-token` |
| `alpaca crypto quotes-latest <pair>` | GET | `/v1beta3/crypto/us/latest/quotes` | `--symbols (csv)` |
| `alpaca crypto trades <pair>` | GET | `/v1beta3/crypto/us/trades` | `--symbols (csv) --start --end --limit --sort --page-token` |
| `alpaca crypto trades-latest <pair>` | GET | `/v1beta3/crypto/us/latest/trades` | `--symbols (csv)` |
| `alpaca crypto snapshots <pair>` | GET | `/v1beta3/crypto/us/snapshots` | `--symbols (csv)` |
| `alpaca crypto orderbook <pair>` | GET | `/v1beta3/crypto/us/latest/orderbooks` | `--symbols (csv)` |
| `alpaca news` | GET | `/v1beta1/news` | `--symbols --start --end --sort --limit --include-content --exclude-contentless --page-token` |

> **Note on crypto commands**: the `<pair>` positional is a convenience alias — it is passed as `symbols=<pair>` to the multi-symbol endpoint (all crypto endpoints are multi-symbol in the API).

---

## B. File Inventory

```
src/
├── config.ts               Resolve keyId/secretKey/tradingBaseUrl/dataBaseUrl from env; export AlpacaConfig interface
├── config.test.ts          Tests for env var resolution, aliasing, defaults, UsageError on missing creds
├── types.ts                AlpacaClientConfig interface; all response data interfaces (PERMISSIVE: index sig + optional fields); AlpacaApiError class
├── types.test.ts           Structural shape tests for key interfaces
├── utils.ts                buildQueryParams, formatJson, parsePositiveInt, sleep (mirror hunter-io exactly)
├── utils.test.ts           Unit tests for all four utilities
├── redact.ts               redactTwo(str, keyId, secretKey); safeStringify(data, keyId, secretKey) — redacts BOTH secrets
├── redact.test.ts          Tests: redactKey single, dual redaction, empty/short keys, JSON stringify
├── errors.ts               UsageError, AlpacaApiError (re-exported from types or defined here)
├── errors.test.ts          instanceof checks, message content
├── client.ts               AlpacaClient class (see method signatures below)
├── client.test.ts          HTTP method routing, error mapping, 204 handling, credential redaction in errors
├── commands/
│   ├── account.ts          runAccount, runActivities, runPortfolioHistory
│   ├── account.test.ts     Tests for all three run functions
│   ├── orders.ts           runOrdersList, runOrdersGet, runOrdersGetByClientId, runOrdersCreate, runOrdersReplace, runOrdersCancel, runOrdersCancelAll
│   ├── orders.test.ts      Tests for every order command
│   ├── positions.ts        runPositionsList, runPositionsGet, runPositionsClose, runPositionsCloseAll
│   ├── positions.test.ts   Tests for every position command
│   ├── assets.ts           runAssetsList, runAssetsGet
│   ├── assets.test.ts      Tests for both asset commands
│   ├── watchlists.ts       runWatchlistsList, runWatchlistsGet, runWatchlistsCreate, runWatchlistsUpdate, runWatchlistsDelete, runWatchlistsAdd, runWatchlistsRemove
│   ├── watchlists.test.ts  Tests for all watchlist commands
│   ├── meta.ts             runCalendar, runClock
│   ├── meta.test.ts        Tests for calendar + clock
│   ├── stocks.ts           runStocksBars, runStocksBarsMuti, runStocksBarsLatest, runStocksQuotes, runStocksQuotesLatest, runStocksTrades, runStocksTradesLatest, runStocksSnapshot, runStocksSnapshots
│   ├── stocks.test.ts      Tests for all stock data commands
│   ├── crypto.ts           runCryptoBars, runCryptoBarsLatest, runCryptoQuotes, runCryptoQuotesLatest, runCryptoTrades, runCryptoTradesLatest
│   ├── crypto.test.ts      Tests for all crypto data commands
│   ├── news.ts             runNews
│   ├── news.test.ts        Tests for news command
│   ├── options.ts          runOptionsContracts, runOptionsContract, runOptionsChain, runOptionsBars, runOptionsTrades, runOptionsTradesLatest, runOptionsQuotesLatest, runOptionsSnapshot, runOptionsExchanges
│   ├── options.test.ts     Tests for all options commands
│   ├── screeners.ts        runMostActive, runMovers
│   └── screeners.test.ts   Tests for screener commands
├── cli.ts                  Entry point: parses top-level command + --live/--paper, builds AlpacaConfig, prints env label to STDERR, dispatches to command modules, maps errors to exit codes
└── cli.test.ts             Integration tests: env label output, error exit codes, missing creds message
```

### `AlpacaClient` method signatures (`src/client.ts`)

```typescript
export interface AlpacaClientConfig {
  keyId: string;
  secretKey: string;
  tradingBaseUrl: string;   // e.g. https://paper-api.alpaca.markets
  dataBaseUrl: string;      // always https://data.alpaca.markets
}

export class AlpacaClient {
  constructor(config: AlpacaClientConfig);

  // Each method takes the FULL URL (base already included by caller):
  async get<T>(url: string): Promise<T>;
  async post<T>(url: string, body?: Record<string, unknown>): Promise<T>;
  async put<T>(url: string, body?: Record<string, unknown>): Promise<T>;
  async patch<T>(url: string, body?: Record<string, unknown>): Promise<T>;
  async delete<T>(url: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T>;

  // private:
  private authHeaders(): Record<string, string>;         // returns both APCA headers
  private async handleResponse<T>(res: Response): Promise<T>;  // maps errors, redacts both secrets
}
```

> **URL construction pattern in commands**: `const url = client.tradingBase + '/v2/account'` or `client.dataBase + '/v2/stocks/AAPL/bars'`. Expose `tradingBase` and `dataBase` as public readonly strings on `AlpacaClient`.

### `config.ts` responsibilities

```typescript
export interface AlpacaConfig {
  keyId: string;
  secretKey: string;
  tradingBaseUrl: string;
  dataBaseUrl: string;
  isLive: boolean;
}

export function resolveConfig(overrides?: { live?: boolean }): AlpacaConfig;
// 1. keyId = APCA_API_KEY_ID ?? ALPACA_API_KEY_ID; throw UsageError if absent
// 2. secretKey = APCA_API_SECRET_KEY ?? ALPACA_API_SECRET_KEY; throw UsageError if absent
// 3. tradingBaseUrl = APCA_API_BASE_URL ?? (live ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets')
// 4. --live flag OR APCA_API_BASE_URL containing 'api.alpaca.markets' sets isLive=true
// 5. dataBaseUrl = always 'https://data.alpaca.markets'
```

### `redact.ts` — extended for two secrets

```typescript
export function redactKey(str: string, key: string): string;         // single (unchanged from hunter-io)
export function redactTwo(str: string, keyId: string, secretKey: string): string;  // redacts both
export function safeStringify(data: unknown, keyId: string, secretKey: string): string;
```

---

## C. Build Waves

### Wave 1 — Foundation (no cross-deps; fully parallel)

**Gate**: `pnpm test` green + `pnpm typecheck` clean.  
All five modules are independent; sub-agents build them simultaneously.

---

#### `src/types.ts` + `src/types.test.ts`

**Responsibility**: Define `AlpacaClientConfig`, `AlpacaConfig`, and all API response shape interfaces (PERMISSIVE — `[key: string]: unknown` + typed optional fields). Define `AlpacaApiError` class (code: number, message: string). No imports from other `src/` modules.

**Test cases**:
1. `AlpacaApiError` is an `instanceof Error` and has correct `name`, `code`, `message` properties.
2. An account response object satisfies `AccountData` interface (optional fields present).
3. An order object with only required fields satisfies `OrderData`.
4. A position object satisfies `PositionData`.
5. A bar object satisfies `BarData` (all OHLCV fields).

**Docs**: `00-overview.md §7`, `01-trading-account-orders-positions.md §Account Object Fields`, `§Order Object Fields`, `§Position Object Fields`, `03-market-data.md §Shared Object Shapes`.

---

#### `src/utils.ts` + `src/utils.test.ts`

**Responsibility**: Mirror hunter-io's utils exactly: `buildQueryParams`, `formatJson`, `parsePositiveInt`, `sleep`. No changes needed; copy the pattern.

**Test cases**:
1. `buildQueryParams` drops `undefined` and `null` values.
2. `buildQueryParams` coerces `false`, `0`, and empty string to `"false"`, `"0"`, `""`.
3. `formatJson` pretty-prints with 2-space indent.
4. `parsePositiveInt("50", "--limit")` returns `50`.
5. `parsePositiveInt("0", "--limit")` throws.
6. `parsePositiveInt("abc", "--limit")` throws.
7. `sleep(0)` resolves without error.

**Docs**: none required.

---

#### `src/redact.ts` + `src/redact.test.ts`

**Responsibility**: Export `redactKey(str, key)` (single; same contract as hunter-io), `redactTwo(str, keyId, secretKey)` (calls `redactKey` twice), and `safeStringify(data, keyId, secretKey)` that calls `formatJson` then `redactTwo`.

**Test cases**:
1. `redactKey("abc123secret", "secret")` → `"abc123[REDACTED]"`.
2. `redactKey` is a no-op when key is empty string.
3. `redactKey` is a no-op when key is shorter than 4 chars.
4. `redactTwo` redacts keyId occurrence AND secretKey occurrence in one pass.
5. `redactTwo` where keyId === secretKey still produces single `[REDACTED]` (not double).
6. `safeStringify({ key: "mysecretkeyid" }, "mysecretkeyid", "other")` output contains `[REDACTED]` and no `mysecretkeyid`.
7. Regex-special characters in a key (e.g. `abc.+key`) are escaped and matched literally.

**Docs**: `00-overview.md §4`.

---

#### `src/errors.ts` + `src/errors.test.ts`

**Responsibility**: Define `UsageError` (exit 1), extend with named subclasses if needed. `AlpacaApiError` can live here or in `types.ts` — choose `errors.ts` to keep types.ts data-only. `cli.ts` owns the top-level catch mapping.

**Test cases**:
1. `new UsageError("foo")` → `instanceof Error`, `name === "UsageError"`, `message === "foo"`.
2. `new AlpacaApiError("foo", 403)` → `instanceof Error`, `name === "AlpacaApiError"`, `code === 403`.
3. Throwing and catching `UsageError` preserves message.
4. `AlpacaApiError.message` does NOT contain the literal key value when constructed via `redactTwo`.

**Docs**: `00-overview.md §7`.

---

#### `src/config.ts` + `src/config.test.ts`

**Responsibility**: `resolveConfig({ live?: boolean })` reads env vars, applies aliases, sets URLs, throws `UsageError` on missing creds. Determines `isLive`. No network calls.

**Test cases**:
1. With `APCA_API_KEY_ID` + `APCA_API_SECRET_KEY` set → returns correct `keyId` and `secretKey`.
2. With only `ALPACA_API_KEY_ID` + `ALPACA_API_SECRET_KEY` set → resolves via alias.
3. Missing both key env vars → throws `UsageError` naming `APCA_API_KEY_ID` / `ALPACA_API_KEY_ID`.
4. Missing both secret env vars → throws `UsageError` naming `APCA_API_SECRET_KEY` / `ALPACA_API_SECRET_KEY`.
5. Default (no `--live`) → `tradingBaseUrl === "https://paper-api.alpaca.markets"`, `isLive === false`.
6. `resolveConfig({ live: true })` → `tradingBaseUrl === "https://api.alpaca.markets"`, `isLive === true`.
7. `APCA_API_BASE_URL` set to live URL → `isLive === true`.
8. `dataBaseUrl` is always `"https://data.alpaca.markets"` regardless of env.

**Docs**: `00-overview.md §3`, `§5`, `§6`.

---

### Wave 2 — HTTP Client (depends on Wave 1)

**Gate**: `pnpm test` green + `pnpm typecheck` clean.

---

#### `src/client.ts` + `src/client.test.ts`

**Responsibility**: `AlpacaClient` class. Exposes `tradingBase` and `dataBase` as public readonly strings. All HTTP methods attach `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY` headers. `handleResponse` handles 204 (return null), error JSON (`{code, message}` shape), redacts both secrets from all error messages before throwing `AlpacaApiError`. GET uses `buildQueryParams` + `URLSearchParams`.

**Test cases**:
1. `get(url)` calls `fetch` with correct URL and both auth headers.
2. `post(url, body)` sends `Content-Type: application/json` with JSON-stringified body.
3. `patch(url, body)` sends method `PATCH`.
4. `delete(url)` sends method `DELETE` with no body.
5. HTTP 204 response returns `null` without throwing.
6. HTTP 401 with `{ code: 40110000, message: "unauthorized" }` throws `AlpacaApiError` with `code === 40110000`.
7. Error message containing the literal `secretKey` value is redacted to `[REDACTED]`.
8. HTTP 207 response (cancel-all) is returned as-is (treated as success, not error).
9. Network-level `fetch` failure (rejected promise) propagates as-is (no swallowing).

**Imports**: `types.ts`, `utils.ts`, `redact.ts`, `errors.ts`, `config.ts` (for `AlpacaClientConfig` interface only).  
**Docs**: `00-overview.md §4`, `§7`.

---

### Wave 3 — Commands (all parallel; depends on Wave 1 + 2)

Each command module: imports `AlpacaClient` from `../client.js`, `safeStringify` from `../redact.js`, `UsageError` from `../errors.js`, `buildQueryParams` from `../utils.js`, and relevant types from `../types.js`. Uses `parseArgs` from `node:util`. Writes to `process.stdout.write(safeStringify(result, keyId, secretKey) + '\n')`. Never calls `process.exit`.

---

#### `src/commands/account.ts` + `account.test.ts`

**Functions**: `runAccount(client, args, keyId, secretKey)`, `runActivities(client, args, keyId, secretKey)`, `runPortfolioHistory(client, args, keyId, secretKey)`.

**Test cases**:
1. `runAccount` calls `GET` on `${tradingBase}/v2/account`.
2. `runActivities` with `--types FILL,DIV` passes `activity_types=FILL%2CDIV` in query.
3. `runActivities <type>` positional routes to `GET /v2/account/activities/FILL`.
4. `runPortfolioHistory --period 1M` passes `period=1M`.
5. `runPortfolioHistory --start 2024-01-01 --end 2024-06-01` passes correct params.
6. Output of `runAccount` does not contain raw `keyId` or `secretKey`.

**Docs**: `01-trading-account-orders-positions.md §1`, `02-trading-assets-watchlists-market-meta.md §7`.

---

#### `src/commands/orders.ts` + `orders.test.ts`

**Functions**: `runOrdersList`, `runOrdersGet`, `runOrdersGetByClientId`, `runOrdersCreate`, `runOrdersReplace`, `runOrdersCancel`, `runOrdersCancelAll`.

**Test cases**:
1. `runOrdersList --status open --limit 10` → `GET /v2/orders?status=open&limit=10`.
2. `runOrdersGet <uuid>` → `GET /v2/orders/{uuid}`.
3. `runOrdersGetByClientId my-ref` → `GET /v2/orders:by_client_order_id?client_order_id=my-ref`.
4. `runOrdersCreate --symbol AAPL --qty 10 --side buy --type market --tif day` → `POST /v2/orders` with correct JSON body.
5. `runOrdersCreate` missing `--symbol` throws `UsageError`.
6. `runOrdersCreate --notional 500 --symbol MSFT --side buy --type market --tif day` omits `qty` and passes `notional`.
7. `runOrdersCreate` with `--order-class bracket --take-profit-limit 155 --stop-loss-stop 140` includes nested `take_profit`/`stop_loss` in body.
8. `runOrdersReplace <uuid> --qty 5` → `PATCH /v2/orders/{uuid}` body `{qty:"5"}`.
9. `runOrdersCancel <uuid>` → `DELETE /v2/orders/{uuid}`.
10. `runOrdersCancelAll` → `DELETE /v2/orders`.

**Docs**: `01-trading-account-orders-positions.md §2`.

---

#### `src/commands/positions.ts` + `positions.test.ts`

**Functions**: `runPositionsList`, `runPositionsGet`, `runPositionsClose`, `runPositionsCloseAll`.

**Test cases**:
1. `runPositionsList` → `GET /v2/positions`.
2. `runPositionsGet AAPL` → `GET /v2/positions/AAPL`.
3. `runPositionsClose AAPL` with no flags → `DELETE /v2/positions/AAPL` (no query params).
4. `runPositionsClose AAPL --qty 50` → appends `?qty=50`.
5. `runPositionsClose AAPL --percentage 0.5` → appends `?percentage=0.5`.
6. `runPositionsClose` missing symbol positional → `UsageError`.
7. `runPositionsCloseAll` → `DELETE /v2/positions`.
8. `runPositionsCloseAll --cancel-orders` → appends `?cancel_orders=true`.

**Docs**: `01-trading-account-orders-positions.md §3`.

---

#### `src/commands/assets.ts` + `assets.test.ts`

**Functions**: `runAssetsList`, `runAssetsGet`.

**Test cases**:
1. `runAssetsList` with no flags → `GET /v2/assets` (no query params).
2. `runAssetsList --status active --asset-class us_equity` → `GET /v2/assets?status=active&asset_class=us_equity`.
3. `runAssetsList --exchange NASDAQ` → includes `exchange=NASDAQ`.
4. `runAssetsGet AAPL` → `GET /v2/assets/AAPL`.
5. `runAssetsGet` missing positional → `UsageError`.

**Docs**: `02-trading-assets-watchlists-market-meta.md §2`.

---

#### `src/commands/watchlists.ts` + `watchlists.test.ts`

**Functions**: `runWatchlistsList`, `runWatchlistsGet`, `runWatchlistsCreate`, `runWatchlistsUpdate`, `runWatchlistsDelete`, `runWatchlistsAdd`, `runWatchlistsRemove`.

**Test cases**:
1. `runWatchlistsList` → `GET /v2/watchlists`.
2. `runWatchlistsGet <id>` → `GET /v2/watchlists/{id}`.
3. `runWatchlistsCreate --name "Tech"` → `POST /v2/watchlists` body `{name:"Tech"}`.
4. `runWatchlistsCreate --name "Tech" --symbols AAPL,TSLA` → body includes `symbols:["AAPL","TSLA"]`.
5. `runWatchlistsCreate` missing `--name` → `UsageError`.
6. `runWatchlistsUpdate <id> --name "New"` → `PUT /v2/watchlists/{id}` body `{name:"New"}`.
7. `runWatchlistsDelete <id>` → `DELETE /v2/watchlists/{id}`.
8. `runWatchlistsAdd <id> --symbol MSFT` → `POST /v2/watchlists/{id}` body `{symbol:"MSFT"}`.
9. `runWatchlistsRemove <id> --symbol MSFT` → `DELETE /v2/watchlists/{id}/MSFT`.
10. `runWatchlistsGet` missing `<id>` positional → `UsageError`.

**Docs**: `02-trading-assets-watchlists-market-meta.md §3`.

---

#### `src/commands/meta.ts` + `meta.test.ts`

**Functions**: `runCalendar`, `runClock`.

**Test cases**:
1. `runCalendar` with no flags → `GET /v2/calendar`.
2. `runCalendar --start 2024-01-01 --end 2024-01-31` → `GET /v2/calendar?start=2024-01-01&end=2024-01-31`.
3. `runClock` → `GET /v2/clock` with no query params.
4. Output does not contain raw credentials.

**Docs**: `02-trading-assets-watchlists-market-meta.md §4`, `§5`.

---

#### `src/commands/stocks.ts` + `stocks.test.ts`

**Functions**: `runStocksBars`, `runStocksBarsMuti`, `runStocksBarsLatest`, `runStocksQuotes`, `runStocksQuotesLatest`, `runStocksTrades`, `runStocksTradesLatest`, `runStocksSnapshot`, `runStocksSnapshots`.

> All stock data commands use `client.dataBase` (i.e., `https://data.alpaca.markets`).

**Test cases**:
1. `runStocksBars AAPL --timeframe 1Day` → `GET data.alpaca.markets/v2/stocks/AAPL/bars?timeframe=1Day`.
2. `runStocksBars` missing symbol → `UsageError`.
3. `runStocksBarsMuti --symbols AAPL,MSFT --timeframe 1Hour --start 2024-01-01` → `GET /v2/stocks/bars` with `symbols=AAPL%2CMSFT`.
4. `runStocksBarsMuti` missing `--symbols` → `UsageError`.
5. `runStocksBarsLatest AAPL` → `GET /v2/stocks/AAPL/bars/latest`.
6. `runStocksQuotes AAPL --limit 500 --feed sip` → `GET /v2/stocks/AAPL/quotes?limit=500&feed=sip`.
7. `runStocksQuotesLatest AAPL` → `GET /v2/stocks/AAPL/quotes/latest`.
8. `runStocksTrades AAPL --start 2024-01-01` → correct URL with `start` param.
9. `runStocksSnapshot AAPL` → `GET /v2/stocks/AAPL/snapshot`.
10. `runStocksSnapshots --symbols AAPL,TSLA` → `GET /v2/stocks/snapshots?symbols=AAPL%2CTSLA`.

**Docs**: `03-market-data.md §Stocks`.

---

#### `src/commands/crypto.ts` + `crypto.test.ts`

**Functions**: `runCryptoBars`, `runCryptoBarsLatest`, `runCryptoQuotes`, `runCryptoQuotesLatest`, `runCryptoTrades`, `runCryptoTradesLatest`.

> Crypto commands use `client.dataBase`. The `{loc}` path segment is always `us`.

**Test cases**:
1. `runCryptoBars "BTC/USD" --timeframe 1Hour` → `GET data.alpaca.markets/v1beta3/crypto/us/bars?symbols=BTC%2FUSD&timeframe=1Hour`.
2. Positional pair is passed as `symbols` query param (CSV-safe if multiple).
3. `runCryptoBars` missing symbol positional → `UsageError`.
4. `runCryptoBarsLatest "ETH/USD"` → `GET /v1beta3/crypto/us/latest/bars?symbols=ETH%2FUSD`.
5. `runCryptoQuotes "BTC/USD" --limit 100` → `GET /v1beta3/crypto/us/quotes?symbols=...&limit=100`.
6. `runCryptoTrades "BTC/USD" --start 2024-01-01 --end 2024-01-31` → correct URL.

**Docs**: `03-market-data.md §Crypto`.

---

#### `src/commands/news.ts` + `news.test.ts`

**Function**: `runNews`.

**Test cases**:
1. `runNews` with no flags → `GET data.alpaca.markets/v1beta1/news`.
2. `runNews --symbols AAPL,TSLA --limit 10` → `symbols=AAPL%2CTSLA&limit=10`.
3. `runNews --include-content` → `include_content=true`.
4. `runNews --start 2024-01-01 --end 2024-03-01` → correct params.
5. `runNews --limit 51` → `UsageError` (max 50 per page for news endpoint).

**Docs**: `03-market-data.md §News`.

---

#### `src/commands/options.ts` + `options.test.ts`

**Functions**: `runOptionsContracts`, `runOptionsContract`, `runOptionsChain`, `runOptionsBars`, `runOptionsTrades`, `runOptionsTradesLatest`, `runOptionsQuotesLatest`, `runOptionsSnapshot`, `runOptionsExchanges`.

> Options data commands use `client.dataBase` with `/v1beta1` prefix. Options contract search uses `client.tradingBase` with `/v2` prefix.

**Test cases**:
1. `runOptionsContracts --underlying AAPL --type call --expiration-gte 2025-07-01` → `GET tradingBase/v2/options/contracts?underlying_symbols=AAPL&type=call&expiration_date_gte=2025-07-01`.
2. `runOptionsContracts` with no flags → `GET /v2/options/contracts` (no query params beyond default status=active).
3. `runOptionsContracts --strike-gte 100 --strike-lte 200` → includes `strike_price_gte=100&strike_price_lte=200`.
4. `runOptionsContract AAPL250620C00200000` → `GET /v2/options/contracts/AAPL250620C00200000`.
5. `runOptionsContract` missing positional → `UsageError`.
6. `runOptionsChain AAPL --type call --expiration 2025-07-18` → `GET dataBase/v1beta1/options/snapshots/AAPL?type=call&expiration_date=2025-07-18`.
7. `runOptionsChain` missing positional → `UsageError`.
8. `runOptionsBars AAPL250620C00200000 --timeframe 1Day` → `GET dataBase/v1beta1/options/bars?symbols=AAPL250620C00200000&timeframe=1Day`.
9. `runOptionsTrades AAPL250620C00200000` → `GET dataBase/v1beta1/options/trades?symbols=AAPL250620C00200000`.
10. `runOptionsTradesLatest AAPL250620C00200000` → `GET dataBase/v1beta1/options/trades/latest?symbols=AAPL250620C00200000`.
11. `runOptionsQuotesLatest AAPL250620C00200000` → `GET dataBase/v1beta1/options/quotes/latest?symbols=AAPL250620C00200000`.
12. `runOptionsSnapshot AAPL250620C00200000` → `GET dataBase/v1beta1/options/snapshots?symbols=AAPL250620C00200000`.
13. `runOptionsExchanges` → `GET dataBase/v1beta1/options/meta/exchanges`.
14. Output of snapshot commands includes `greeks` and `impliedVolatility` fields.

**Docs**: `04-options-and-extras.md §1, §2`.

---

#### `src/commands/screeners.ts` + `screeners.test.ts`

**Functions**: `runMostActive`, `runMovers`.

> Screener commands use `client.dataBase` with `/v1beta1` prefix.

**Test cases**:
1. `runMostActive` with no flags → `GET dataBase/v1beta1/screener/stocks/most-actives`.
2. `runMostActive --by trades --top 20` → `GET /v1beta1/screener/stocks/most-actives?by=trades&top=20`.
3. `runMovers stocks` → `GET dataBase/v1beta1/screener/stocks/movers`.
4. `runMovers crypto --top 5` → `GET dataBase/v1beta1/screener/crypto/movers?top=5`.
5. `runMovers` missing market-type positional → `UsageError`.

**Docs**: `04-options-and-extras.md §3`.

---

#### Updates to existing command modules (built in same parallel wave)

**`src/commands/orders.ts`** — extend `runOrdersCreate`:
- Add `--order-class mleg` support with `--legs` flag accepting JSON array string
- Each leg: `{"symbol": "...", "ratio_qty": N, "side": "buy|sell", "position_intent": "..."}`
- When `order_class=mleg`, top-level `--symbol` and `--side` must NOT be passed → `UsageError`
- When `order_class=mleg`, `--qty` is required → `UsageError` if missing
- Legs are validated: 2-4 required, all symbols unique
- Add `--position-intent` flag for single-leg option orders (`buy_to_open`, `buy_to_close`, `sell_to_open`, `sell_to_close`)
- LIVE WARNING on `orders create` applies to options orders too

**Test cases (orders.ts additions)**:
1. `runOrdersCreate --symbol AAPL250620C00200000 --qty 1 --side buy --type market --tif day --position-intent buy_to_open` → body includes `position_intent`.
2. `runOrdersCreate --qty 1 --type market --tif day --order-class mleg --legs '[{"symbol":"A","ratio_qty":1,"side":"buy"},{"symbol":"B","ratio_qty":1,"side":"sell"}]'` → body includes `order_class: "mleg"` and `legs` array.
3. `runOrdersCreate --order-class mleg` missing `--qty` → `UsageError`.
4. `runOrdersCreate --order-class mleg --qty 1 --symbol AAPL --legs [...]` → `UsageError` (symbol not allowed with mleg).
5. `runOrdersCreate --order-class mleg --qty 1 --legs '[{"symbol":"A","ratio_qty":1,"side":"buy"}]'` → `UsageError` (min 2 legs).

**`src/commands/positions.ts`** — add `runPositionsExercise`, `runPositionsDoNotExercise`:

**Test cases (positions.ts additions)**:
1. `runPositionsExercise AAPL250620C00200000` → `POST tradingBase/v2/positions/AAPL250620C00200000/exercise` with empty body.
2. `runPositionsExercise` missing positional → `UsageError`.
3. `runPositionsDoNotExercise AAPL250620C00200000` → `POST tradingBase/v2/positions/AAPL250620C00200000/do-not-exercise`.
4. Exercise and do-not-exercise commands emit LIVE WARNING when `--live` is active.

**`src/commands/crypto.ts`** — add `runCryptoSnapshots`, `runCryptoOrderbook`:

**Test cases (crypto.ts additions)**:
1. `runCryptoSnapshots "BTC/USD"` → `GET dataBase/v1beta3/crypto/us/snapshots?symbols=BTC%2FUSD`.
2. `runCryptoOrderbook "BTC/USD"` → `GET dataBase/v1beta3/crypto/us/latest/orderbooks?symbols=BTC%2FUSD`.

**`src/commands/account.ts`** — add `runAccountConfig`, `runAccountUpdateConfig`:

**Test cases (account.ts additions)**:
1. `runAccountConfig` → `GET tradingBase/v2/account/configurations`.
2. `runAccountUpdateConfig --max-options-trading-level 2` → `PATCH /v2/account/configurations` body `{max_options_trading_level: 2}`.
3. `runAccountUpdateConfig --no-shorting` → body `{no_shorting: true}`.
4. `runAccountUpdateConfig` with no flags → `UsageError` (at least one field required).

**`src/commands/meta.ts`** — add `runCorporateActions`, `runCorporateAction`:

**Test cases (meta.ts additions)**:
1. `runCorporateActions --ca-types dividend,split --since 2025-01-01 --until 2025-03-31` → `GET tradingBase/v2/corporate_actions/announcements?ca_types=dividend%2Csplit&since=2025-01-01&until=2025-03-31`.
2. `runCorporateActions --symbol AAPL` → includes `symbol=AAPL`.
3. `runCorporateActions` missing `--ca-types` → `UsageError`.
4. `runCorporateActions` missing `--since` or `--until` → `UsageError`.
5. `runCorporateAction <id>` → `GET /v2/corporate_actions/announcements/{id}`.

**Docs**: `04-options-and-extras.md §4, §5, §6`.

---

### Wave 4 — Wiring (depends on all earlier waves)

---

#### `src/cli.ts` + `src/cli.test.ts`

**Responsibility**: Top-level entry point (shebang: `#!/usr/bin/env node`). Parse first two args to identify command group and subcommand. Extract global `--live` / `--paper` flags. Call `resolveConfig`. Print to `process.stderr`: `[paper]` or `[LIVE ⚠ REAL MONEY]`. Dispatch to the appropriate `run*` function. Top-level try/catch: `UsageError` → `process.stderr.write(err.message + '\n')` + `process.exit(1)`; `AlpacaApiError` → print JSON error + `process.exit(1)`; unknown → print message + `process.exit(1)`. No-args → print help summary + `process.exit(0)`.

**Command dispatch table** (maps `argv[2]` + `argv[3]` to module):
- `account` → `commands/account.ts`  (`activities`, `portfolio-history`, `config`, `update-config` as subcommands)
- `orders <list|get|get-by-client-id|create|replace|cancel|cancel-all>` → `commands/orders.ts`
- `positions <list|get|close|close-all|exercise|do-not-exercise>` → `commands/positions.ts`
- `assets <list|get>` → `commands/assets.ts`
- `watchlists <list|get|create|update|delete|add|remove>` → `commands/watchlists.ts`
- `calendar` → `commands/meta.ts`
- `clock` → `commands/meta.ts`
- `corporate-actions` → `commands/meta.ts` (`get <id>` as subcommand)
- `stocks <bars|bars-multi|bars-latest|quotes|quotes-latest|trades|trades-latest|snapshot|snapshots|most-active|movers>` → `commands/stocks.ts` + `commands/screeners.ts`
- `crypto <bars|bars-latest|quotes|quotes-latest|trades|trades-latest|snapshots|orderbook>` → `commands/crypto.ts`
- `options <contracts|contract|chain|bars|trades|trades-latest|quotes-latest|snapshot|exchanges>` → `commands/options.ts`
- `news` → `commands/news.ts`

**Test cases** (integration, mock `fetch`):
1. Running with no args exits 0 and prints help to stdout.
2. `APCA_API_KEY_ID` missing → exits 1, stderr contains env var name.
3. Valid credentials + `alpaca clock` → STDERR contains `[paper]`.
4. `--live` flag → STDERR contains `[LIVE`.
5. `UsageError` from a command → exits 1, message printed to STDERR.
6. `AlpacaApiError` (HTTP 401) → exits 1, message is redacted.
7. Unknown command → exits 1 with helpful message.

**Docs**: all.

---

#### `SKILL.md` (§D below)

**Responsibility**: AI-agent usage guide for this CLI. See §D for required sections.

---

#### `README.md`

**Responsibility**: Human-facing setup guide. Sections: Install, Auth Setup, Quick Start, Command Reference (link to table), Paper vs. Live, Contributing.

---

## D. SKILL.md Outline

```markdown
---
name: alpaca
description: >
  CLI wrapper for the Alpaca Trading + Market Data API.
  Place orders, manage positions, and fetch market data from the terminal.
  Defaults to PAPER (sandbox) — no real money unless --live is explicitly passed.
---

## Setup

### Environment variables (required)
APCA_API_KEY_ID=<your-paper-key-id>
APCA_API_SECRET_KEY=<your-paper-secret>
# Aliases also accepted: ALPACA_API_KEY_ID, ALPACA_API_SECRET_KEY

### Build
cd /path/to/alpaca && pnpm install && pnpm build
# Binary available as: ./dist/cli.js  (or `alpaca` if globally linked)

## ⚠ Paper vs. Live Safety

- DEFAULT: all commands target PAPER (fake money, separate key pair)
- Pass `--live` to target the live environment (REAL money)
- The CLI prints `[paper]` or `[LIVE ⚠ REAL MONEY]` to STDERR before every command
- Order-creating and position-closing commands emit an additional LIVE WARNING to STDERR

## Command Cheat-Sheet

### Check account
alpaca account

### Place a paper market order
alpaca orders create --symbol AAPL --qty 10 --side buy --type market --tif day

### Place a paper limit order
alpaca orders create --symbol TSLA --qty 5 --side buy --type limit --tif gtc --limit-price 200.00

### Place a bracket order (entry + take-profit + stop-loss)
alpaca orders create --symbol MSFT --qty 10 --side buy --type market --tif day \
  --order-class bracket --take-profit-limit 430 --stop-loss-stop 380 --stop-loss-limit 378

### List open orders
alpaca orders list --status open

### Cancel an order
alpaca orders cancel <order-uuid>

### List positions
alpaca positions list

### Close a position (50 shares)
alpaca positions close AAPL --qty 50

### Get market clock
alpaca clock

### Get trading calendar (date range)
alpaca calendar --start 2024-01-01 --end 2024-01-31

### Fetch daily bars for AAPL (last 30 days)
alpaca stocks bars AAPL --timeframe 1Day --start 2024-01-01

### Fetch latest quote
alpaca stocks quotes-latest AAPL

### Fetch stock snapshot
alpaca stocks snapshot AAPL

### Fetch crypto bars (BTC/USD hourly)
alpaca crypto bars "BTC/USD" --timeframe 1Hour --start 2024-01-01

### Fetch news for AAPL
alpaca news --symbols AAPL --limit 5

### Search option contracts for AAPL calls expiring next month
alpaca options contracts --underlying AAPL --type call --expiration-gte 2025-07-01 --expiration-lte 2025-07-31

### Get full option chain for AAPL
alpaca options chain AAPL

### Get option snapshot with Greeks/IV
alpaca options snapshot AAPL250620C00200000

### Get latest option quote
alpaca options quotes-latest AAPL250620C00200000

### Place a single-leg option order (buy to open a call)
alpaca orders create --symbol AAPL250620C00200000 --qty 1 --side buy --type market --tif day --position-intent buy_to_open

### Place a bull call spread (multi-leg)
alpaca orders create --qty 1 --type limit --tif day --limit-price -1.50 --order-class mleg \
  --legs '[{"symbol":"AAPL250620C00190000","ratio_qty":1,"side":"buy"},{"symbol":"AAPL250620C00200000","ratio_qty":1,"side":"sell"}]'

### Exercise an option position
alpaca positions exercise AAPL250620C00200000

### Most active stocks today
alpaca stocks most-active --top 10

### Top market movers
alpaca stocks movers stocks --top 5

### Corporate actions (dividends + splits for AAPL)
alpaca corporate-actions --ca-types dividend,split --since 2025-01-01 --until 2025-03-31 --symbol AAPL

### View account configuration
alpaca account config

### Crypto orderbook
alpaca crypto orderbook "BTC/USD"

### LIVE order (⚠ real money — use with caution)
alpaca orders create --live --symbol AAPL --qty 1 --side buy --type market --tif day

## Output & Exit Codes

- All output is JSON (pretty-printed, 2-space indent) to STDOUT
- Credentials (keyId, secretKey) are ALWAYS redacted from stdout and stderr
- Exit 0: success
- Exit 1: usage error, API error, unknown command
- STDERR: environment label + any error messages (never credentials)

## Global Flags

--live      Target live trading environment (real money)
--paper     Explicit paper mode (default; no-op if already default)
--help      Print help for the current command
--json      Alias accepted; output is always JSON
```

---

## E. Import Dependency Graph

```
config.ts     ← errors.ts
types.ts      (no src/ imports)
utils.ts      (no src/ imports)
redact.ts     ← utils.ts (formatJson)
errors.ts     (no src/ imports — or imports AlpacaApiError from types.ts)
client.ts     ← types.ts, utils.ts, redact.ts, errors.ts
commands/*    ← client.ts, types.ts, utils.ts, redact.ts, errors.ts
  account.ts     — account, activities, portfolio-history, config, update-config
  orders.ts      — list, get, get-by-client-id, create (incl. mleg), replace, cancel, cancel-all
  positions.ts   — list, get, close, close-all, exercise, do-not-exercise
  assets.ts      — list, get
  watchlists.ts  — list, get, create, update, delete, add, remove
  meta.ts        — calendar, clock, corporate-actions, corporate-action
  stocks.ts      — bars, bars-multi, bars-latest, quotes, quotes-latest, trades, trades-latest, snapshot, snapshots
  crypto.ts      — bars, bars-latest, quotes, quotes-latest, trades, trades-latest, snapshots, orderbook
  news.ts        — news
  options.ts     — contracts, contract, chain, bars, trades, trades-latest, quotes-latest, snapshot, exchanges
  screeners.ts   — most-active, movers
cli.ts         ← config.ts, client.ts, commands/*
```

---

## F. Test Harness Reference

```typescript
// Mock fetch in all tests:
import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.stubGlobal('fetch', vi.fn());

// Typical command test pattern:
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ /* response shape */ }),
});
const client = new AlpacaClient({ keyId: 'kid', secretKey: 'skey', tradingBaseUrl: 'https://paper-api.alpaca.markets', dataBaseUrl: 'https://data.alpaca.markets' });
// assert fetch was called with correct URL + headers
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/v2/account'),
  expect.objectContaining({ headers: expect.objectContaining({ 'APCA-API-KEY-ID': 'kid' }) }),
);
```

---

## G. Coverage Gaps

The following API surfaces are not mapped to CLI commands:

| Gap | Reason |
|-----|--------|
| Streaming WebSocket endpoints | Out of scope — requires persistent connection, not REST |
| Broker API (Basic auth) | Explicitly out of scope |
| Fixed income data (bond/treasury quotes by ISIN) | Narrow audience; skip for now |
| Short-sale locates (`get_locates`, `create_locate`) | Only useful for short sellers |
| Doc search tools (`search_alpaca_docs`, etc.) | Agent-facing MCP tools, not CLI-shaped |
| `intraday_reporting` / `pnl_reset` / `cashflow_types` on portfolio history | Parameters accepted but not validated — passed through raw |
| News `images` field | Returned raw in JSON output; no dedicated flag to filter |
| `APCA_API_BASE_URL` pointing to a non-standard host | Accepted as tradingBaseUrl but `isLive` detection only checks for `api.alpaca.markets` |
| Crypto `{loc}` values other than `us` | Only `us` is implemented; other locales (e.g. `eu`) not wired |
| Paid-plan `sip`/`otc`/`opra` feed error handling | 403 from feed access falls through generic AlpacaApiError path |
