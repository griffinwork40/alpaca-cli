# alpaca-cli

Lightweight CLI for the Alpaca Trading & Market Data API. 62 commands covering stocks, options, crypto, and account management.

## Auth

Requires two env vars:
- `APCA_API_KEY_ID` (or `ALPACA_API_KEY_ID`)
- `APCA_API_SECRET_KEY` (or `ALPACA_API_SECRET_KEY`)

Defaults to paper (sandbox). Pass `--live` for real money.

## Commands

### Account
```bash
alpaca account                    # account info
alpaca account activities         # ledger entries
alpaca account portfolio-history  # equity over time
alpaca account config             # read config (DTBP, shorting, etc.)
alpaca account update-config --dtbp-check entry  # update config [LIVE WARNING]
```

### Orders
```bash
alpaca orders list                                    # open orders
alpaca orders list --status all --limit 50            # all orders
alpaca orders get <order-id>
alpaca orders get-by-client-id <client-order-id>
alpaca orders create --symbol AAPL --qty 10 --side buy --type market --tif day
alpaca orders create --symbol AAPL --qty 5 --side buy --type limit --tif gtc --limit-price 150
alpaca orders replace <order-id> --qty 20             # amend qty/price/tif
alpaca orders cancel <order-id>
alpaca orders cancel-all                              # nuke all open orders [LIVE WARNING]
```

### Options Orders
```bash
# Single leg
alpaca orders create --symbol AAPL250620C00200000 --qty 1 --side buy \
  --type market --tif day --position-intent buy_to_open

# Multi-leg spread
alpaca orders create --qty 1 --type limit --tif day --limit-price -1.50 \
  --order-class mleg --legs '[
    {"symbol":"AAPL250620C00190000","ratio_qty":1,"side":"buy"},
    {"symbol":"AAPL250620C00200000","ratio_qty":1,"side":"sell"}
  ]'
```

### Positions
```bash
alpaca positions list
alpaca positions get AAPL
alpaca positions close AAPL                           # close full position [LIVE WARNING]
alpaca positions close AAPL --qty 5                   # close partial
alpaca positions close-all --cancel-orders            # liquidate everything [LIVE WARNING]
alpaca positions exercise <contract-id>               # exercise option [LIVE WARNING]
alpaca positions do-not-exercise <contract-id>        # DNE [LIVE WARNING]
```

### Market Data
```bash
alpaca stocks bars AAPL --timeframe 1Day --start 2025-01-01
alpaca stocks snapshot AAPL
alpaca stocks snapshots AAPL,MSFT,GOOG
alpaca stocks most-active --top 10
alpaca stocks movers --market-type stocks
alpaca crypto bars "BTC/USD" --timeframe 1Hour --start 2025-01-01
alpaca crypto snapshots "BTC/USD,ETH/USD"
alpaca crypto orderbook "BTC/USD"
alpaca news --symbols AAPL --limit 5
```

### Options Data
```bash
alpaca options contracts --underlying-symbols AAPL --status active
alpaca options contract <symbol-or-id>
alpaca options chain AAPL
alpaca options chain AAPL --expiration-date 2025-06-20 --type call --strike-price-gte 190
alpaca options bars <symbol> --timeframe 1Day --start 2025-01-01
alpaca options snapshot <symbol>                      # Greeks, IV, prices
alpaca options exchanges
```

### Other
```bash
alpaca assets list --status active --asset-class us_equity
alpaca assets get AAPL
alpaca watchlists list
alpaca calendar --start 2025-01-01 --end 2025-12-31
alpaca clock
alpaca corporate-actions --types dividend --start 2025-01-01
```

## Output

All output is JSON to stdout. Credentials are always redacted. Exit 0 = success, 1 = error.
