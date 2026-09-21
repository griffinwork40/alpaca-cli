import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runAccount,
  runActivities,
  runPortfolioHistory,
  runAccountConfig,
  runAccountUpdateConfig,
} from './account.js';
import { UsageError } from '../errors.js';

vi.stubGlobal('fetch', vi.fn());

const mockFetch = vi.mocked(fetch);

const CLIENT_CONFIG = {
  keyId: 'kid',
  secretKey: 'skey',
  tradingBaseUrl: 'https://paper-api.alpaca.markets',
  dataBaseUrl: 'https://data.alpaca.markets',
};

function makeClient() {
  return new AlpacaClient(CLIENT_CONFIG);
}

function mockOk(body: unknown = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);
}

function captureOutput(): { restore: () => string } {
  let captured = '';
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk: unknown) => {
    captured += String(chunk);
    return true;
  };
  return {
    restore: () => {
      process.stdout.write = orig;
      return captured;
    },
  };
}

describe('runAccount', () => {
  beforeEach(() => mockFetch.mockReset());

  it('calls GET /v2/account', async () => {
    mockOk({ id: 'acc1', cash: '100' });
    const { restore } = captureOutput();
    await runAccount(makeClient(), [], 'kid', 'skey');
    restore();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v2/account'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'APCA-API-KEY-ID': 'kid' }),
      }),
    );
  });

  it('output does not contain raw keyId or secretKey', async () => {
    mockOk({ id: 'acc1' });
    const { restore } = captureOutput();
    await runAccount(makeClient(), [], 'mykeyid', 'mysecretkey');
    const out = restore();
    expect(out).not.toContain('mykeyid');
    expect(out).not.toContain('mysecretkey');
  });
});

describe('runActivities', () => {
  beforeEach(() => mockFetch.mockReset());

  it('with --types passes activity_types as query param', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runActivities(makeClient(), ['--types', 'FILL,DIV'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('activity_types=FILL%2CDIV');
  });

  it('positional type routes to activities/:type', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runActivities(makeClient(), ['FILL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/account/activities/FILL');
  });

  it('no args hits /v2/account/activities', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runActivities(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/account/activities');
    expect(url).not.toContain('/FILL');
  });
});

describe('runPortfolioHistory', () => {
  beforeEach(() => mockFetch.mockReset());

  it('passes --period', async () => {
    mockOk({});
    const { restore } = captureOutput();
    await runPortfolioHistory(makeClient(), ['--period', '1M'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('period=1M');
  });

  it('passes --start and --end', async () => {
    mockOk({});
    const { restore } = captureOutput();
    await runPortfolioHistory(
      makeClient(),
      ['--start', '2024-01-01', '--end', '2024-06-01'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('start=2024-01-01');
    expect(url).toContain('end=2024-06-01');
  });
});

describe('runAccountConfig', () => {
  beforeEach(() => mockFetch.mockReset());

  it('calls GET /v2/account/configurations', async () => {
    mockOk({ fractional_trading: true });
    const { restore } = captureOutput();
    await runAccountConfig(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/account/configurations');
    expect((mockFetch.mock.calls[0] as [string, RequestInit])[1].method).toBe(
      'GET',
    );
  });
});

describe('runAccountUpdateConfig', () => {
  beforeEach(() => mockFetch.mockReset());

  it('PATCH /v2/account/configurations with max-options-trading-level', async () => {
    mockOk({ max_options_trading_level: 2 });
    const { restore } = captureOutput();
    await runAccountUpdateConfig(
      makeClient(),
      ['--max-options-trading-level', '2'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/account/configurations');
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['max_options_trading_level']).toBe(2);
  });

  it('PATCH with --no-shorting sends no_shorting: true', async () => {
    mockOk({ no_shorting: true });
    const { restore } = captureOutput();
    await runAccountUpdateConfig(
      makeClient(),
      ['--no-shorting'],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['no_shorting']).toBe(true);
  });

  it('throws UsageError if no flags provided', async () => {
    await expect(
      runAccountUpdateConfig(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
