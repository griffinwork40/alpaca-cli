/**
 * Positions commands — list, get, close, close-all, exercise, do-not-exercise.
 * All endpoints under tradingBase /v2/positions.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runPositionsList(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.get<unknown>(
    client.tradingBase + '/v2/positions',
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runPositionsGet(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'positions get: <symbol> positional argument is required',
    );
  }

  const result = await client.get<unknown>(
    client.tradingBase + `/v2/positions/${symbol}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runPositionsClose(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
  isLive = false,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'positions close: <symbol> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      qty: { type: 'string' },
      percentage: { type: 'string' },
    },
    strict: false,
  });

  if (isLive) {
    process.stderr.write(
      '⚠️  LIVE WARNING: positions close will submit a REAL liquidating order.\n',
    );
  }

  const params: Record<string, string | undefined> = {};
  if (values['qty']) params['qty'] = (values['qty'] as string | undefined);
  if (values['percentage']) params['percentage'] = (values['percentage'] as string | undefined);

  const result = await client.delete<unknown>(
    client.tradingBase + `/v2/positions/${symbol}`,
    params,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runPositionsCloseAll(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
  isLive = false,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      'cancel-orders': { type: 'boolean' },
    },
    strict: false,
  });

  if (isLive) {
    process.stderr.write(
      '⚠️  LIVE WARNING: positions close-all will liquidate ALL positions with real money.\n',
    );
  }

  const params: Record<string, boolean | undefined> = {};
  if (values['cancel-orders'] !== undefined) {
    params['cancel_orders'] = values['cancel-orders'] as boolean | undefined;
  }

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase + '/v2/positions' + (query ? `?${query}` : '');
  const result = await client.delete<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runPositionsExercise(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
  isLive = false,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'positions exercise: <symbol> positional argument is required',
    );
  }

  if (isLive) {
    process.stderr.write(
      '⚠️  LIVE WARNING: positions exercise will exercise a REAL option contract.\n',
    );
  }

  const result = await client.post<unknown>(
    client.tradingBase + `/v2/positions/${symbol}/exercise`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runPositionsDoNotExercise(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
  isLive = false,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'positions do-not-exercise: <symbol> positional argument is required',
    );
  }

  if (isLive) {
    process.stderr.write(
      '⚠️  LIVE WARNING: positions do-not-exercise submits a do-not-exercise instruction.\n',
    );
  }

  const result = await client.post<unknown>(
    client.tradingBase + `/v2/positions/${symbol}/do-not-exercise`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
