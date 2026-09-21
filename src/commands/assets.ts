/**
 * Assets commands — list, get.
 * Endpoints: GET /v2/assets, GET /v2/assets/{symbol_or_asset_id}.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runAssetsList(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      status: { type: 'string' },
      'asset-class': { type: 'string' },
      exchange: { type: 'string' },
      attributes: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['status']) params['status'] = (values['status'] as string | undefined);
  if (values['asset-class']) params['asset_class'] = (values['asset-class'] as string | undefined);
  if (values['exchange']) params['exchange'] = (values['exchange'] as string | undefined);
  if (values['attributes']) params['attributes'] = (values['attributes'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url = client.tradingBase + '/v2/assets' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runAssetsGet(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const symbol = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!symbol) {
    throw new UsageError(
      'assets get: <symbol> positional argument is required',
    );
  }

  const result = await client.get<unknown>(
    client.tradingBase + `/v2/assets/${symbol}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
