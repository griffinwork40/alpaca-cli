/**
 * News command — GET /v1beta1/news.
 * Uses dataBase (https://data.alpaca.markets).
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runNews(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      symbols: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      sort: { type: 'string' },
      limit: { type: 'string' },
      'include-content': { type: 'boolean' },
      'exclude-contentless': { type: 'boolean' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  if (values['limit'] !== undefined) {
    const limit = parseInt(values['limit'] as string, 10);
    if (isNaN(limit) || limit < 1 || limit > 50) {
      throw new UsageError(
        'stocks news: --limit must be between 1 and 50 (news endpoint maximum)',
      );
    }
  }

  const params: Record<string, string | boolean | undefined> = {};
  if (values['symbols']) params['symbols'] = (values['symbols'] as string | undefined);
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['sort']) params['sort'] = (values['sort'] as string | undefined);
  if (values['limit']) params['limit'] = (values['limit'] as string | undefined);
  if (values['include-content'] !== undefined)
    params['include_content'] = (values['include-content'] as string | undefined);
  if (values['exclude-contentless'] !== undefined)
    params['exclude_contentless'] = (values['exclude-contentless'] as string | undefined);
  if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.dataBase + '/v1beta1/news' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
