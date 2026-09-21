/**
 * Options commands — contracts, contract, chain, bars, trades, trades-latest,
 * quotes-latest, snapshot, exchanges.
 *
 * Contract search uses tradingBase /v2/options/contracts.
 * Data endpoints use dataBase /v1beta1/options/*.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

const OPT_DATA = '/v1beta1/options';

export async function runOptionsContracts(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      underlying: { type: 'string' },
      status: { type: 'string' },
      expiration: { type: 'string' },
      'expiration-gte': { type: 'string' },
      'expiration-lte': { type: 'string' },
      'root-symbol': { type: 'string' },
      type: { type: 'string' },
      style: { type: 'string' },
      'strike-gte': { type: 'string' },
      'strike-lte': { type: 'string' },
      limit: { type: 'string' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['underlying'])
    params['underlying_symbols'] = (values['underlying'] as string | undefined);
  if (values['status']) params['status'] = (values['status'] as string | undefined);
  if (values['expiration']) params['expiration_date'] = (values['expiration'] as string | undefined);
  if (values['expiration-gte'])
    params['expiration_date_gte'] = (values['expiration-gte'] as string | undefined);
  if (values['expiration-lte'])
    params['expiration_date_lte'] = (values['expiration-lte'] as string | undefined);
  if (values['root-symbol']) params['root_symbol'] = (values['root-symbol'] as string | undefined);
  if (values['type']) params['type'] = (values['type'] as string | undefined);
  if (values['style']) params['style'] = (values['style'] as string | undefined);
  if (values['strike-gte'])
    params['strike_price_gte'] = (values['strike-gte'] as string | undefined);
  if (values['strike-lte'])
    params['strike_price_lte'] = (values['strike-lte'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase +
    '/v2/options/contracts' +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsContract(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbolOrId =
    args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbolOrId) {
    throw new UsageError(
      'options contract: <symbol-or-id> positional argument is required',
    );
  }

  const result = await client.get<unknown>(
    client.tradingBase + `/v2/options/contracts/${symbolOrId}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsChain(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const underlying =
    args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!underlying) {
    throw new UsageError(
      'options chain: <underlying> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      feed: { type: 'string' },
      type: { type: 'string' },
      'strike-gte': { type: 'string' },
      'strike-lte': { type: 'string' },
      expiration: { type: 'string' },
      'expiration-gte': { type: 'string' },
      'expiration-lte': { type: 'string' },
      'root-symbol': { type: 'string' },
      'updated-since': { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);
  if (values['type']) params['type'] = (values['type'] as string | undefined);
  if (values['strike-gte'])
    params['strike_price_gte'] = (values['strike-gte'] as string | undefined);
  if (values['strike-lte'])
    params['strike_price_lte'] = (values['strike-lte'] as string | undefined);
  if (values['expiration']) params['expiration_date'] = (values['expiration'] as string | undefined);
  if (values['expiration-gte'])
    params['expiration_date_gte'] = (values['expiration-gte'] as string | undefined);
  if (values['expiration-lte'])
    params['expiration_date_lte'] = (values['expiration-lte'] as string | undefined);
  if (values['root-symbol']) params['root_symbol'] = (values['root-symbol'] as string | undefined);
  if (values['updated-since'])
    params['updated_since'] = (values['updated-since'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${OPT_DATA}/snapshots/${underlying}` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsBars(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'options bars: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
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
    symbols: symbol,
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
    client.dataBase + `${OPT_DATA}/bars` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsTrades(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'options trades: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'string' },
      sort: { type: 'string' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {
    symbols: symbol,
  };
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + `${OPT_DATA}/trades` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsTradesLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'options trades-latest: <symbol> positional argument is required',
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

  const params: Record<string, string | undefined> = {
    symbols: symbol,
  };
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${OPT_DATA}/trades/latest` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsQuotesLatest(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'options quotes-latest: <symbol> positional argument is required',
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

  const params: Record<string, string | undefined> = {
    symbols: symbol,
  };
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `${OPT_DATA}/quotes/latest` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsSnapshot(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'options snapshot: <symbol> positional argument is required',
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

  const params: Record<string, string | undefined> = {
    symbols: symbol,
  };
  if (values['feed']) params['feed'] = (values['feed'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + `${OPT_DATA}/snapshots` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOptionsExchanges(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.get<unknown>(
    client.dataBase + `${OPT_DATA}/meta/exchanges`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
