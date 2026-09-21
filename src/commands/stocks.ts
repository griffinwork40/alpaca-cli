/**
 * Stocks market data commands — bars, bars-multi, bars-latest, quotes, quotes-latest,
 * trades, trades-latest, snapshot, snapshots.
 * All use dataBase (https://data.alpaca.markets) with /v2 prefix.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runStocksBars(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError('stocks bars: <symbol> positional argument is required');
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      timeframe: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      adjustment: { type: 'string' },
      feed: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
      asof: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['timeframe']) params['timeframe'] = (values['timeframe'] as string | undefined);
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['adjustment']) params['adjustment'] = (values['adjustment'] as string | undefined);
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);
  if (values['asof']) params['asof'] = (values['asof'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/bars` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksBarsMuti(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      symbols: { type: 'string' },
      timeframe: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      adjustment: { type: 'string' },
      feed: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
      asof: { type: 'string' },
    },
    strict: false,
  });

  if (!values['symbols']) {
    throw new UsageError('stocks bars-multi: --symbols is required');
  }

  const params: Record<string, string | undefined> = {
    symbols: values['symbols'] as string | undefined,
  };
  if (values['timeframe']) params['timeframe'] = (values['timeframe'] as string | undefined);
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['adjustment']) params['adjustment'] = (values['adjustment'] as string | undefined);
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);
  if (values['asof']) params['asof'] = (values['asof'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + '/v2/stocks/bars' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksBarsLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'stocks bars-latest: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      feed: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/bars/latest` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksQuotes(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'stocks quotes: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      feed: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
      asof: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);
  if (values['asof']) params['asof'] = (values['asof'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/quotes` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksQuotesLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'stocks quotes-latest: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      feed: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/quotes/latest` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksTrades(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'stocks trades: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      feed: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
      asof: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);
  if (values['asof']) params['asof'] = (values['asof'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/trades` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksTradesLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'stocks trades-latest: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      feed: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/trades/latest` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksSnapshot(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'stocks snapshot: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      feed: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v2/stocks/${symbol}/snapshot` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runStocksSnapshots(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      symbols: { type: 'string' },
      feed: { type: 'string' },
    },
    strict: false,
  });

  if (!values['symbols']) {
    throw new UsageError('stocks snapshots: --symbols is required');
  }

  const params: Record<string, string | undefined> = {
    symbols: values['symbols'] as string | undefined,
  };
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + '/v2/stocks/snapshots' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
