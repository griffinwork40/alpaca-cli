/**
 * Crypto market data commands — bars, bars-latest, quotes, quotes-latest,
 * trades, trades-latest, snapshots, orderbook.
 * All use dataBase (https://data.alpaca.markets) with /v1beta3/crypto/us prefix.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

const CRYPTO_BASE = '/v1beta3/crypto/us';

export async function runCryptoBars(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError('crypto bars: <pair> positional argument is required');
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
      timeframe: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };
  if (values['timeframe']) params['timeframe'] = (values['timeframe'] as string | undefined);
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + `${CRYPTO_BASE}/bars` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoBarsLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto bars-latest: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${CRYPTO_BASE}/latest/bars` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoQuotes(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto quotes: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + `${CRYPTO_BASE}/quotes` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoQuotesLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto quotes-latest: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${CRYPTO_BASE}/latest/quotes` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoTrades(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto trades: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + `${CRYPTO_BASE}/trades` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoTradesLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto trades-latest: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${CRYPTO_BASE}/latest/trades` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoSnapshots(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto snapshots: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${CRYPTO_BASE}/snapshots` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCryptoOrderbook(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const pair = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!pair) {
    throw new UsageError(
      'crypto orderbook: <pair> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbols: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: (values['symbols'] as string | undefined) ?? pair,
  };

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${CRYPTO_BASE}/latest/orderbooks` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
