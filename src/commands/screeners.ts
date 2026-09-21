/**
 * Screeners commands — most-active, movers.
 * Uses dataBase /v1beta1/screener prefix.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runMostActive(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      by: { type: 'string' },
      top: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['by']) params['by'] = (values['by'] as string | undefined);
  if (values['top']) params['top'] = (values['top'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    '/v1beta1/screener/stocks/most-actives' +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runMovers(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const marketType =
    args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!marketType) {
    throw new UsageError(
      'stocks movers: <market-type> positional argument is required (stocks or crypto)',
    );
  }

  const restArgs = args.slice(1);
  const { values } = parseArgs({
    args: restArgs,
    options: {
      top: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['top']) params['top'] = (values['top'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase +
    `/v1beta1/screener/${marketType}/movers` +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
