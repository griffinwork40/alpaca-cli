/**
 * Orders commands — list, get, get-by-client-id, create (incl. mleg), replace, cancel, cancel-all.
 * All endpoints under tradingBase /v2/orders.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runOrdersList(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      status: { type: 'string' },
      limit: { type: 'string' },
      after: { type: 'string' },
      until: { type: 'string' },
      direction: { type: 'string' },
      symbols: { type: 'string' },
      side: { type: 'string' },
      nested: { type: 'boolean' },
    },
    strict: false,
  });

  const params: Record<string, string | boolean | undefined> = {};
  if (values['status']) params['status'] = (values['status'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['after']) params['after'] = (values['after'] as string | undefined);
  if (values['until']) params['until'] = (values['until'] as string | undefined);
  if (values['direction']) params['direction'] = (values['direction'] as string | undefined);
  if (values['symbols']) params['symbols'] = (values['symbols'] as string | undefined);
  if (values['side']) params['side'] = (values['side'] as string | undefined);
  if (values['nested'] !== undefined) params['nested'] = (values['nested'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url = client.tradingBase + '/v2/orders' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOrdersGet(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError('orders get: <id> positional argument is required');
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      nested: { type: 'boolean' },
    },
    strict: false,
  });

  const params: Record<string, boolean | undefined> = {};
  if (values['nested'] !== undefined) params['nested'] = values['nested'] as boolean | undefined;

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase + `/v2/orders/${id}` + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOrdersGetByClientId(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const clientOrderId =
    args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!clientOrderId) {
    throw new UsageError(
      'orders get-by-client-id: <client-order-id> positional argument is required',
    );
  }

  const qs = buildQueryParams({ client_order_id: clientOrderId });
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase + '/v2/orders:by_client_order_id' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

interface LegObject {
  symbol?: unknown;
  ratio_qty?: unknown;
  side?: unknown;
  position_intent?: unknown;
  [key: string]: unknown;
}

export async function runOrdersCreate(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
  isLive = false,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      symbol: { type: 'string' },
      qty: { type: 'string' },
      notional: { type: 'string' },
      side: { type: 'string' },
      type: { type: 'string' },
      tif: { type: 'string' },
      'limit-price': { type: 'string' },
      'stop-price': { type: 'string' },
      'trail-price': { type: 'string' },
      'trail-percent': { type: 'string' },
      'extended-hours': { type: 'boolean' },
      'client-order-id': { type: 'string' },
      'order-class': { type: 'string' },
      'take-profit-limit': { type: 'string' },
      'stop-loss-stop': { type: 'string' },
      'stop-loss-limit': { type: 'string' },
      'position-intent': { type: 'string' },
      legs: { type: 'string' },
    },
    strict: false,
  });

  const orderClass = values['order-class'];
  const isMleg = orderClass === 'mleg';

  if (isMleg) {
    // mleg validation
    if (values['symbol']) {
      throw new UsageError(
        'orders create: --symbol must not be provided for mleg orders (use --legs)',
      );
    }
    if (values['side']) {
      throw new UsageError(
        'orders create: --side must not be provided for mleg orders (use leg side)',
      );
    }
    if (!values['qty']) {
      throw new UsageError('orders create: --qty is required for mleg orders');
    }
    if (!values['legs']) {
      throw new UsageError(
        'orders create: --legs (JSON array) is required for mleg orders',
      );
    }

    let legs: LegObject[];
    try {
      legs = JSON.parse(values['legs'] as string) as LegObject[];
    } catch {
      throw new UsageError('orders create: --legs must be a valid JSON array');
    }

    if (!Array.isArray(legs) || legs.length < 2 || legs.length > 4) {
      throw new UsageError(
        'orders create: --legs must contain 2-4 legs',
      );
    }

    const symbols = legs.map((l) => l['symbol']);
    const uniqueSymbols = new Set(symbols);
    if (uniqueSymbols.size !== symbols.length) {
      throw new UsageError(
        'orders create: all leg symbols must be unique',
      );
    }
  } else {
    // Standard order validation
    if (!values['symbol']) {
      throw new UsageError('orders create: --symbol is required');
    }
    if (!values['side']) {
      throw new UsageError('orders create: --side is required');
    }
  }

  if (!values['type']) {
    throw new UsageError('orders create: --type is required');
  }
  if (!values['tif']) {
    throw new UsageError('orders create: --tif is required');
  }

  if (isLive) {
    process.stderr.write(
      '⚠️  LIVE WARNING: orders create will place a REAL order with real money.\n',
    );
  }

  const body: Record<string, unknown> = {};

  if (!isMleg) {
    body['symbol'] = values['symbol'];
    body['side'] = values['side'];
  }

  body['type'] = values['type'];
  body['time_in_force'] = values['tif'];

  if (values['qty']) body['qty'] = values['qty'];
  if (values['notional']) body['notional'] = values['notional'];
  if (values['limit-price']) body['limit_price'] = values['limit-price'];
  if (values['stop-price']) body['stop_price'] = values['stop-price'];
  if (values['trail-price']) body['trail_price'] = values['trail-price'];
  if (values['trail-percent']) body['trail_percent'] = values['trail-percent'];
  if (values['extended-hours'] !== undefined)
    body['extended_hours'] = values['extended-hours'];
  if (values['client-order-id'])
    body['client_order_id'] = values['client-order-id'];
  if (orderClass) body['order_class'] = orderClass;
  if (values['position-intent'])
    body['position_intent'] = values['position-intent'] as string;

  if (isMleg && values['legs']) {
    body['legs'] = JSON.parse(values['legs'] as string) as unknown;
  }

  // Bracket / OCO / OTO nested orders
  if (values['take-profit-limit']) {
    body['take_profit'] = { limit_price: values['take-profit-limit'] };
  }
  if (values['stop-loss-stop'] || values['stop-loss-limit']) {
    const stopLoss: Record<string, string> = {};
    if (values['stop-loss-stop']) stopLoss['stop_price'] = values['stop-loss-stop'] as string;
    if (values['stop-loss-limit']) stopLoss['limit_price'] = values['stop-loss-limit'] as string;
    body['stop_loss'] = stopLoss;
  }

  const result = await client.post<unknown>(
    client.tradingBase + '/v2/orders',
    body,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOrdersReplace(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError('orders replace: <id> positional argument is required');
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      qty: { type: 'string' },
      'limit-price': { type: 'string' },
      'stop-price': { type: 'string' },
      trail: { type: 'string' },
      tif: { type: 'string' },
      'client-order-id': { type: 'string' },
    },
    strict: false,
  });

  const body: Record<string, unknown> = {};
  if (values['qty']) body['qty'] = values['qty'];
  if (values['limit-price']) body['limit_price'] = values['limit-price'];
  if (values['stop-price']) body['stop_price'] = values['stop-price'];
  if (values['trail']) body['trail'] = values['trail'];
  if (values['tif']) body['time_in_force'] = values['tif'];
  if (values['client-order-id'])
    body['client_order_id'] = values['client-order-id'];

  const result = await client.patch<unknown>(
    client.tradingBase + `/v2/orders/${id}`,
    body,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOrdersCancel(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError('orders cancel: <id> positional argument is required');
  }

  const result = await client.delete<unknown>(
    client.tradingBase + `/v2/orders/${id}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runOrdersCancelAll(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.delete<unknown>(
    client.tradingBase + '/v2/orders',
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
