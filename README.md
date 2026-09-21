# alpaca-cli

Lightweight CLI wrapper for the [Alpaca Trading & Market Data API](https://alpaca.markets). Stocks, options, crypto, and more from the terminal.

**Paper-first safety** -- defaults to sandbox (fake money). Real trading requires an explicit `--live` flag.

## Install

```bash
git clone https://github.com/griffinwork40/alpaca-cli.git
cd alpaca-cli
pnpm install
pnpm build
```

The binary is at `./dist/cli.js`. Optionally link it globally:

```bash
npm link  # now available as `alpaca` in your PATH
```

## Auth Setup

```bash
export APCA_API_KEY_ID=your-paper-key-id
export APCA_API_SECRET_KEY=your-paper-secret
# Aliases also accepted: ALPACA_API_KEY_ID, ALPACA_API_SECRET_KEY
```

Get keys from the [Alpaca Dashboard](https://app.alpaca.markets/paper/dashboard/overview) (free paper trading account).

## Quick Start

```bash
# Check account
alpaca account

# Market clock
alpaca clock

# Place a paper market order
alpaca orders create --symbol AAPL --qty 10 --side buy --type market --tif day

# List positions
alpaca positions list

# Stock snapshot
alpaca stocks snapshot AAPL

# Option chain for AAPL
alpaca options chain AAPL

# Buy a call option
alpaca orders create --symbol AAPL250620C00200000 --qty 1 --side buy \
  --type market --tif day --position-intent buy_to_open

# Bull call spread (multi-leg)
alpaca orders create --qty 1 --type limit --tif day --limit-price -1.50 \
  --order-class mleg --legs '[
    {"symbol":"AAPL250620C00190000","ratio_qty":1,"side":"buy"},
    {"symbol":"AAPL250620C00200000","ratio_qty":1,"side":"sell"}
  ]'

# Crypto bars
alpaca crypto bars "BTC/USD" --timeframe 1Hour --start 2025-01-01

# News
alpaca news --symbols AAPL --limit 5

# Most active stocks
alpaca stocks most-active --top 10
```

## Commands (62 total)

| Group | Commands |
|-------|----------|
| **account** | `account`, `account activities`, `account portfolio-history`, `account config`, `account update-config` |
| **orders** | `orders list`, `orders get`, `orders get-by-client-id`, `orders create`, `orders replace`, `orders cancel`, `orders cancel-all` |
| **positions** | `positions list`, `positions get`, `positions close`, `positions close-all`, `positions exercise`, `positions do-not-exercise` |
| **assets** | `assets list`, `assets get` |
| **watchlists** | `watchlists list/get/create/update/delete/add/remove` |
| **calendar/clock** | `calendar`, `clock` |
| **corporate-actions** | `corporate-actions`, `corporate-actions get` |
| **stocks** | `stocks bars/bars-multi/bars-latest/quotes/quotes-latest/trades/trades-latest/snapshot/snapshots/most-active/movers` |
| **crypto** | `crypto bars/bars-latest/quotes/quotes-latest/trades/trades-latest/snapshots/orderbook` |
| **options** | `options contracts/contract/chain/bars/trades/trades-latest/quotes-latest/snapshot/exchanges` |
| **news** | `news` |

## Paper vs. Live

```bash
# Default: paper (sandbox, fake money)
alpaca orders create --symbol AAPL --qty 1 --side buy --type market --tif day
# stderr: [paper]

# Live: real money (use with caution)
alpaca orders create --live --symbol AAPL --qty 1 --side buy --type market --tif day
# stderr: [LIVE ⚠ REAL MONEY]
# stderr: ⚠ WARNING: LIVE TRADING — this order uses REAL MONEY
```

Order-creating, position-closing, and option-exercising commands print an additional LIVE WARNING to stderr.

## Output

- All output is JSON (pretty-printed, 2-space indent) to stdout
- Credentials are **always** redacted from stdout and stderr
- Exit 0: success
- Exit 1: usage error, API error, unknown command
- stderr: environment label + error messages

## Global Flags

| Flag | Description |
|------|-------------|
| `--live` | Target live trading environment (real money) |
| `--paper` | Explicit paper mode (default) |
| `--help` | Show help |

## Development

```bash
pnpm test          # 230 tests
pnpm typecheck     # TypeScript strict mode
pnpm build         # Build to dist/
pnpm test:watch    # Watch mode
```

## License

MIT
