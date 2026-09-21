/**
 * Meta commands — calendar, clock, corporate-actions, corporate-action.
 * Calendar/clock/corporate-actions use tradingBase.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runCalendar(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      start: { type: 'string' },
      end: { type: 'string' },
    },
    strict: false,
  });

  const params: Record<string, string | undefined> = {};
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase + '/v2/calendar' + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runClock(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.get<unknown>(
    client.tradingBase + '/v2/clock',
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCorporateActions(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      'ca-types': { type: 'string' },
      since: { type: 'string' },
      until: { type: 'string' },
      symbol: { type: 'string' },
      cusip: { type: 'string' },
      'date-type': { type: 'string' },
    },
    strict: false,
  });

  if (!values['ca-types']) {
    throw new UsageError('corporate-actions: --ca-types is required');
  }
  if (!values['since']) {
    throw new UsageError('corporate-actions: --since is required');
  }
  if (!values['until']) {
    throw new UsageError('corporate-actions: --until is required');
  }

  const params: Record<string, string | undefined> = {
    ca_types: values['ca-types'] as string | undefined,
    since: values['since'] as string | undefined,
    until: values['until'] as string | undefined,
  };
  if (values['symbol']) params['symbol'] = (values['symbol'] as string | undefined);
  if (values['cusip']) params['cusip'] = (values['cusip'] as string | undefined);
  if (values['date-type']) params['date_type'] = (values['date-type'] as string | undefined);

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase +
    '/v2/corporate_actions/announcements' +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runCorporateAction(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const id = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  if (!id) {
    throw new UsageError(
      'corporate-actions get: <id> positional argument is required',
    );
  }

  const result = await client.get<unknown>(
    client.tradingBase + `/v2/corporate_actions/announcements/${id}`,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
