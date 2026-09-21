#!/usr/bin/env node
/**
 * Alpaca CLI — entry point.
 *
 * Parses global flags (--live, --paper), resolves config, prints env label to STDERR,
 * dispatches to command modules, and maps errors to exit codes.
 */

import { resolveConfig } from './config.js';
import { AlpacaClient } from './client.js';
import { UsageError } from './errors.js';
import { AlpacaApiError } from './errors.js';
import { safeStringify } from './redact.js';

import {
  runAccount,
  runActivities,
  runPortfolioHistory,
  runAccountConfig,
  runAccountUpdateConfig,
} from './commands/account.js';

import {
  runOrdersList,
  runOrdersGet,
  runOrdersGetByClientId,
  runOrdersCreate,
  runOrdersReplace,
  runOrdersCancel,
  runOrdersCancelAll,
} from './commands/orders.js';

import {
  runPositionsList,
  runPositionsGet,
  runPositionsClose,
  runPositionsCloseAll,
  runPositionsExercise,
  runPositionsDoNotExercise,
} from './commands/positions.js';

import { runAssetsList, runAssetsGet } from './commands/assets.js';

import {
  runWatchlistsList,
  runWatchlistsGet,
  runWatchlistsCreate,
  runWatchlistsUpdate,
  runWatchlistsDelete,
  runWatchlistsAdd,
  runWatchlistsRemove,
} from './commands/watchlists.js';

import {
  runCalendar,
  runClock,
  runCorporateActions,
  runCorporateAction,
} from './commands/meta.js';

import {
  runStocksBars,
  runStocksBarsMuti,
  runStocksBarsLatest,
  runStocksQuotes,
  runStocksQuotesLatest,
  runStocksTrades,
  runStocksTradesLatest,
  runStocksSnapshot,
  runStocksSnapshots,
} from './commands/stocks.js';

import {
  runCryptoBars,
  runCryptoBarsLatest,
  runCryptoQuotes,
  runCryptoQuotesLatest,
  runCryptoTrades,
  runCryptoTradesLatest,
  runCryptoSnapshots,
  runCryptoOrderbook,
} from './commands/crypto.js';

import { runNews } from './commands/news.js';

import {
  runOptionsContracts,
  runOptionsContract,
  runOptionsChain,
  runOptionsBars,
  runOptionsTrades,
  runOptionsTradesLatest,
  runOptionsQuotesLatest,
  runOptionsSnapshot,
  runOptionsExchanges,
} from './commands/options.js';

import { runMostActive, runMovers } from './commands/screeners.js';

const HELP = `
Alpaca CLI — Alpaca Trading & Market Data API wrapper

Usage: alpaca <command> [subcommand] [flags]

Global flags:
  --live    Target live trading (real money, ⚠ use with care)
  --paper   Explicit paper mode (default; no-op)
  --help    Show this help

Commands:
  account                     Get account info
  account activities          List account activities
  account portfolio-history   Get portfolio history
  account config              Get account configuration
  account update-config       Update account configuration
  orders list                 List orders
  orders get <id>             Get order by ID
  orders get-by-client-id <id> Get order by client ID
  orders create               Create an order
  orders replace <id>         Replace an order
  orders cancel <id>          Cancel an order
  orders cancel-all           Cancel all open orders
  positions list              List open positions
  positions get <symbol>      Get a position
  positions close <symbol>    Close a position
  positions close-all         Close all positions
  positions exercise <symbol>      Exercise option position
  positions do-not-exercise <symbol>  Do-not-exercise instruction
  assets list                 List assets
  assets get <symbol>         Get asset by symbol
  watchlists list             List watchlists
  watchlists get <id>         Get watchlist by ID
  watchlists create           Create watchlist
  watchlists update <id>      Update watchlist
  watchlists delete <id>      Delete watchlist
  watchlists add <id>         Add symbol to watchlist
  watchlists remove <id>      Remove symbol from watchlist
  calendar                    Get market calendar
  clock                       Get market clock
  corporate-actions           List corporate actions
  corporate-actions get <id>  Get corporate action by ID
  stocks bars <symbol>        Stock OHLCV bars
  stocks bars-multi           Multi-symbol stock bars
  stocks bars-latest <symbol> Latest bar for symbol
  stocks quotes <symbol>      Historical quotes
  stocks quotes-latest <symbol> Latest quote
  stocks trades <symbol>      Historical trades
  stocks trades-latest <symbol> Latest trade
  stocks snapshot <symbol>    Snapshot for symbol
  stocks snapshots            Multi-symbol snapshots
  stocks most-active          Most active stocks
  stocks movers <type>        Market movers
  crypto bars <pair>          Crypto OHLCV bars
  crypto bars-latest <pair>   Latest crypto bar
  crypto quotes <pair>        Historical crypto quotes
  crypto quotes-latest <pair> Latest crypto quote
  crypto trades <pair>        Historical crypto trades
  crypto trades-latest <pair> Latest crypto trade
  crypto snapshots <pair>     Crypto snapshot
  crypto orderbook <pair>     Crypto orderbook
  news                        Financial news
  options contracts           List option contracts
  options contract <symbol>   Get option contract
  options chain <underlying>  Get option chain
  options bars <symbol>       Option OHLCV bars
  options trades <symbol>     Option historical trades
  options trades-latest <symbol> Latest option trade
  options quotes-latest <symbol> Latest option quote
  options snapshot <symbol>   Option snapshot with Greeks
  options exchanges           Option exchange codes
`.trim();

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  // Extract global flags before the command parsing
  const liveIdx = argv.indexOf('--live');
  const paperIdx = argv.indexOf('--paper');
  const helpIdx = argv.findIndex((a) => a === '--help' || a === '-h');

  const isLiveFlag = liveIdx !== -1;

  // Remove global flags from argv before passing to subcommands
  const filteredArgv = argv.filter(
    (a) => a !== '--live' && a !== '--paper' && a !== '--help' && a !== '-h',
  );

  const command = filteredArgv[0];
  const subcommand = filteredArgv[1] && !filteredArgv[1].startsWith('-')
    ? filteredArgv[1]
    : undefined;

  // Help with no command, or explicit --help
  if (!command || helpIdx !== -1) {
    process.stdout.write(HELP + '\n');
    process.exit(0);
  }

  // Resolve config (throws UsageError on missing creds)
  const config = resolveConfig({ live: isLiveFlag });
  const { keyId, secretKey, isLive } = config;

  // Print environment label to STDERR
  if (isLive) {
    process.stderr.write('[LIVE ⚠ REAL MONEY]\n');
  } else {
    process.stderr.write('[paper]\n');
  }

  const client = new AlpacaClient({
    keyId,
    secretKey,
    tradingBaseUrl: config.tradingBaseUrl,
    dataBaseUrl: config.dataBaseUrl,
  });

  // Build the remaining args: everything after command (and subcommand if consumed)
  let remainingArgs: string[];

  switch (command) {
    // ── account ──────────────────────────────────────────────────────────────
    case 'account': {
      if (!subcommand) {
        await runAccount(client, filteredArgv.slice(1), keyId, secretKey);
      } else if (subcommand === 'activities') {
        await runActivities(client, filteredArgv.slice(2), keyId, secretKey);
      } else if (subcommand === 'portfolio-history') {
        await runPortfolioHistory(
          client,
          filteredArgv.slice(2),
          keyId,
          secretKey,
        );
      } else if (subcommand === 'config') {
        await runAccountConfig(client, filteredArgv.slice(2), keyId, secretKey);
      } else if (subcommand === 'update-config') {
        await runAccountUpdateConfig(
          client,
          filteredArgv.slice(2),
          keyId,
          secretKey,
          isLive,
        );
      } else {
        throw new UsageError(`Unknown account subcommand: ${subcommand}`);
      }
      break;
    }

    // ── orders ───────────────────────────────────────────────────────────────
    case 'orders': {
      if (!subcommand) {
        throw new UsageError(
          'orders: subcommand required (list, get, get-by-client-id, create, replace, cancel, cancel-all)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'list') {
        await runOrdersList(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'get') {
        await runOrdersGet(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'get-by-client-id') {
        await runOrdersGetByClientId(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'create') {
        await runOrdersCreate(client, remainingArgs, keyId, secretKey, isLive);
      } else if (subcommand === 'replace') {
        await runOrdersReplace(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'cancel') {
        await runOrdersCancel(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'cancel-all') {
        await runOrdersCancelAll(client, remainingArgs, keyId, secretKey);
      } else {
        throw new UsageError(`Unknown orders subcommand: ${subcommand}`);
      }
      break;
    }

    // ── positions ─────────────────────────────────────────────────────────────
    case 'positions': {
      if (!subcommand) {
        throw new UsageError(
          'positions: subcommand required (list, get, close, close-all, exercise, do-not-exercise)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'list') {
        await runPositionsList(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'get') {
        await runPositionsGet(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'close') {
        await runPositionsClose(
          client,
          remainingArgs,
          keyId,
          secretKey,
          isLive,
        );
      } else if (subcommand === 'close-all') {
        await runPositionsCloseAll(
          client,
          remainingArgs,
          keyId,
          secretKey,
          isLive,
        );
      } else if (subcommand === 'exercise') {
        await runPositionsExercise(
          client,
          remainingArgs,
          keyId,
          secretKey,
          isLive,
        );
      } else if (subcommand === 'do-not-exercise') {
        await runPositionsDoNotExercise(
          client,
          remainingArgs,
          keyId,
          secretKey,
          isLive,
        );
      } else {
        throw new UsageError(`Unknown positions subcommand: ${subcommand}`);
      }
      break;
    }

    // ── assets ────────────────────────────────────────────────────────────────
    case 'assets': {
      if (!subcommand) {
        throw new UsageError(
          'assets: subcommand required (list, get)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'list') {
        await runAssetsList(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'get') {
        await runAssetsGet(client, remainingArgs, keyId, secretKey);
      } else {
        throw new UsageError(`Unknown assets subcommand: ${subcommand}`);
      }
      break;
    }

    // ── watchlists ────────────────────────────────────────────────────────────
    case 'watchlists': {
      if (!subcommand) {
        throw new UsageError(
          'watchlists: subcommand required (list, get, create, update, delete, add, remove)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'list') {
        await runWatchlistsList(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'get') {
        await runWatchlistsGet(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'create') {
        await runWatchlistsCreate(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'update') {
        await runWatchlistsUpdate(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'delete') {
        await runWatchlistsDelete(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'add') {
        await runWatchlistsAdd(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'remove') {
        await runWatchlistsRemove(client, remainingArgs, keyId, secretKey);
      } else {
        throw new UsageError(`Unknown watchlists subcommand: ${subcommand}`);
      }
      break;
    }

    // ── calendar ──────────────────────────────────────────────────────────────
    case 'calendar': {
      await runCalendar(client, filteredArgv.slice(1), keyId, secretKey);
      break;
    }

    // ── clock ─────────────────────────────────────────────────────────────────
    case 'clock': {
      await runClock(client, filteredArgv.slice(1), keyId, secretKey);
      break;
    }

    // ── corporate-actions ─────────────────────────────────────────────────────
    case 'corporate-actions': {
      remainingArgs = filteredArgv.slice(1);
      if (subcommand === 'get') {
        await runCorporateAction(client, filteredArgv.slice(2), keyId, secretKey);
      } else {
        await runCorporateActions(client, remainingArgs, keyId, secretKey);
      }
      break;
    }

    // ── stocks ────────────────────────────────────────────────────────────────
    case 'stocks': {
      if (!subcommand) {
        throw new UsageError(
          'stocks: subcommand required (bars, bars-multi, bars-latest, quotes, quotes-latest, trades, trades-latest, snapshot, snapshots, most-active, movers)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'bars') {
        await runStocksBars(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'bars-multi') {
        await runStocksBarsMuti(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'bars-latest') {
        await runStocksBarsLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'quotes') {
        await runStocksQuotes(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'quotes-latest') {
        await runStocksQuotesLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'trades') {
        await runStocksTrades(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'trades-latest') {
        await runStocksTradesLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'snapshot') {
        await runStocksSnapshot(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'snapshots') {
        await runStocksSnapshots(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'most-active') {
        await runMostActive(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'movers') {
        await runMovers(client, remainingArgs, keyId, secretKey);
      } else {
        throw new UsageError(`Unknown stocks subcommand: ${subcommand}`);
      }
      break;
    }

    // ── crypto ────────────────────────────────────────────────────────────────
    case 'crypto': {
      if (!subcommand) {
        throw new UsageError(
          'crypto: subcommand required (bars, bars-latest, quotes, quotes-latest, trades, trades-latest, snapshots, orderbook)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'bars') {
        await runCryptoBars(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'bars-latest') {
        await runCryptoBarsLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'quotes') {
        await runCryptoQuotes(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'quotes-latest') {
        await runCryptoQuotesLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'trades') {
        await runCryptoTrades(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'trades-latest') {
        await runCryptoTradesLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'snapshots') {
        await runCryptoSnapshots(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'orderbook') {
        await runCryptoOrderbook(client, remainingArgs, keyId, secretKey);
      } else {
        throw new UsageError(`Unknown crypto subcommand: ${subcommand}`);
      }
      break;
    }

    // ── news ──────────────────────────────────────────────────────────────────
    case 'news': {
      await runNews(client, filteredArgv.slice(1), keyId, secretKey);
      break;
    }

    // ── options ───────────────────────────────────────────────────────────────
    case 'options': {
      if (!subcommand) {
        throw new UsageError(
          'options: subcommand required (contracts, contract, chain, bars, trades, trades-latest, quotes-latest, snapshot, exchanges)',
        );
      }
      remainingArgs = filteredArgv.slice(2);
      if (subcommand === 'contracts') {
        await runOptionsContracts(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'contract') {
        await runOptionsContract(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'chain') {
        await runOptionsChain(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'bars') {
        await runOptionsBars(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'trades') {
        await runOptionsTrades(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'trades-latest') {
        await runOptionsTradesLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'quotes-latest') {
        await runOptionsQuotesLatest(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'snapshot') {
        await runOptionsSnapshot(client, remainingArgs, keyId, secretKey);
      } else if (subcommand === 'exchanges') {
        await runOptionsExchanges(client, remainingArgs, keyId, secretKey);
      } else {
        throw new UsageError(`Unknown options subcommand: ${subcommand}`);
      }
      break;
    }

    default:
      throw new UsageError(
        `Unknown command: ${command}. Run 'alpaca --help' for a list of commands.`,
      );
  }
}

main().catch((err: unknown) => {
  if (err instanceof UsageError) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  } else if (err instanceof AlpacaApiError) {
    // safeStringify on a dummy client — we don't have creds here, but the error
    // message has already been redacted by client.ts before throwing
    const out = JSON.stringify({ error: err.message, code: err.code }, null, 2);
    process.stderr.write(out + '\n');
    process.exit(1);
  } else if (err instanceof Error) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  } else {
    process.stderr.write(String(err) + '\n');
    process.exit(1);
  }
});
