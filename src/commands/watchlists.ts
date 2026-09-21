/**
 * Watchlists commands — list, get, create, update, delete, add, remove.
 * Endpoints under tradingBase /v2/watchlists.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';

export async function runWatchlistsList(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.get<unknown>(
    client.tradingBase + '/v2/watchlists',
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runWatchlistsGet(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError(
      'watchlists get: <id> positional argument is required',
    );
  }

  const result = await client.get<unknown>(
    client.tradingBase + `/v2/watchlists/${id}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runWatchlistsCreate(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      name: { type: 'string' },
      symbols: { type: 'string' },
    },
    strict: false,
  });

  if (!values['name']) {
    throw new UsageError('watchlists create: --name is required');
  }

  const body: Record<string, unknown> = { name: values['name'] };
  if (values['symbols']) {
    body['symbols'] = (values['symbols'] as string).split(',').map((s) => s.trim());
  }

  const result = await client.post<unknown>(
    client.tradingBase + '/v2/watchlists',
    body,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runWatchlistsUpdate(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError(
      'watchlists update: <id> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      name: { type: 'string' },
      symbols: { type: 'string' },
    },
    strict: false,
  });

  const body: Record<string, unknown> = {};
  if (values['name']) body['name'] = values['name'];
  if (values['symbols']) {
    body['symbols'] = (values['symbols'] as string).split(',').map((s) => s.trim());
  }

  const result = await client.put<unknown>(
    client.tradingBase + `/v2/watchlists/${id}`,
    body,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runWatchlistsDelete(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError(
      'watchlists delete: <id> positional argument is required',
    );
  }

  const result = await client.delete<unknown>(
    client.tradingBase + `/v2/watchlists/${id}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runWatchlistsAdd(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError(
      'watchlists add: <id> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbol: { type: 'string' },
    },
    strict: false,
  });

  if (!values['symbol']) {
    throw new UsageError('watchlists add: --symbol is required');
  }

  const result = await client.post<unknown>(
    client.tradingBase + `/v2/watchlists/${id}`,
    { symbol: values['symbol'] },
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runWatchlistsRemove(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError(
      'watchlists remove: <id> positional argument is required',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      symbol: { type: 'string' },
    },
    strict: false,
  });

  if (!values['symbol']) {
    throw new UsageError('watchlists remove: --symbol is required');
  }

  const result = await client.delete<unknown>(
    client.tradingBase + `/v2/watchlists/${id}/${values['symbol']}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
