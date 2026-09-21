/**
 * Account commands — account, activities, portfolio-history, config, update-config.
 * Uses tradingBase for all endpoints.
 */
import { parseArgs } from 'node:util';
import type { AlpacaClient } from '../client.js';
import { safeStringify } from '../redact.js';
import { UsageError } from '../errors.js';
import { buildQueryParams } from '../utils.js';

export async function runAccount(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.get<unknown>(client.tradingBase + '/v2/account');
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runActivities(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  // First positional after "activities" may be an activity type
  const firstArg = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  const parsedArgs = firstArg ? args.slice(1) : args;

  const { values } = parseArgs({
    args: parsedArgs,
    options: {
      types: { type: 'string' },
      date: { type: 'string' },
      after: { type: 'string' },
      until: { type: 'string' },
      direction: { type: 'string' },
      'page-size': { type: 'string' },
      'page-token': { type: 'string' },
    },
    strict: false,
  });

  let path: string;
  const params: Record<string, string | undefined> = {};

  if (firstArg) {
    path = `/v2/account/activities/${firstArg}`;
    if (values['date']) params['date'] = (values['date'] as string | undefined);
    if (values['after']) params['after'] = (values['after'] as string | undefined);
    if (values['until']) params['until'] = (values['until'] as string | undefined);
    if (values['direction']) params['direction'] = (values['direction'] as string | undefined);
    if (values['page-size']) params['page_size'] = (values['page-size'] as string | undefined);
    if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);
  } else {
    path = '/v2/account/activities';
    if (values['types']) params['activity_types'] = (values['types'] as string | undefined);
    if (values['date']) params['date'] = (values['date'] as string | undefined);
    if (values['after']) params['after'] = (values['after'] as string | undefined);
    if (values['until']) params['until'] = (values['until'] as string | undefined);
    if (values['direction']) params['direction'] = (values['direction'] as string | undefined);
    if (values['page-size']) params['page_size'] = (values['page-size'] as string | undefined);
    if (values['page-token']) params['page_token'] = (values['page-token'] as string | undefined);
  }

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url = client.tradingBase + path + (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runPortfolioHistory(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      period: { type: 'string' },
      timeframe: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      'extended-hours': { type: 'boolean' },
    },
    strict: false,
  });

  const params: Record<string, string | boolean | undefined> = {};
  if (values['period']) params['period'] = (values['period'] as string | undefined);
  if (values['timeframe']) params['timeframe'] = (values['timeframe'] as string | undefined);
  if (values['start']) params['start'] = (values['start'] as string | undefined);
  if (values['end']) params['end'] = (values['end'] as string | undefined);
  if (values['extended-hours'] !== undefined) {
    params['extended_hours'] = (values['extended-hours'] as string | undefined);
  }

  const qs = buildQueryParams(params);
  const query = new URLSearchParams(qs).toString();
  const url =
    client.tradingBase +
    '/v2/account/portfolio/history' +
    (query ? `?${query}` : '');
  const result = await client.get<unknown>(url);
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runAccountConfig(
  client: AlpacaClient,
  _args: string[],
  keyId: string,
  secretKey: string,
): Promise<void> {
  const result = await client.get<unknown>(
    client.tradingBase + '/v2/account/configurations',
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}

export async function runAccountUpdateConfig(
  client: AlpacaClient,
  args: string[],
  keyId: string,
  secretKey: string,
  isLive = false,
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      'fractional-trading': { type: 'boolean' },
      'max-margin-multiplier': { type: 'string' },
      'no-shorting': { type: 'boolean' },
      'suspend-trade': { type: 'boolean' },
      'trade-confirm-email': { type: 'string' },
      'max-options-trading-level': { type: 'string' },
    },
    strict: false,
  });

  const body: Record<string, unknown> = {};
  if (values['fractional-trading'] !== undefined) {
    body['fractional_trading'] = values['fractional-trading'];
  }
  if (values['max-margin-multiplier'] !== undefined) {
    body['max_margin_multiplier'] = values['max-margin-multiplier'];
  }
  if (values['no-shorting'] !== undefined) {
    body['no_shorting'] = values['no-shorting'];
  }
  if (values['suspend-trade'] !== undefined) {
    body['suspend_trade'] = values['suspend-trade'];
  }
  if (values['trade-confirm-email'] !== undefined) {
    body['trade_confirm_email'] = values['trade-confirm-email'];
  }
  if (values['max-options-trading-level'] !== undefined) {
    body['max_options_trading_level'] = Number(
      values['max-options-trading-level'],
    );
  }

  if (Object.keys(body).length === 0) {
    throw new UsageError(
      'account update-config: at least one flag is required (e.g. --no-shorting, --max-options-trading-level)',
    );
  }

  if (isLive) {
    process.stderr.write(
      '⚠️  LIVE WARNING: account update-config modifies real account configuration.\n',
    );
  }

  const result = await client.patch<unknown>(
    client.tradingBase + '/v2/account/configurations',
    body,
  );
  process.stdout.write(safeStringify(result, keyId, secretKey) + '\n');
}
