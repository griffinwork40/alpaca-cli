import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import { runMostActive, runMovers } from './screeners.js';
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

describe('runMostActive', () => {
  beforeEach(() => mockFetch.mockReset());

  it('no flags → GET dataBase/v1beta1/screener/stocks/most-actives', async () => {
    mockOk({ most_actives: [] });
    const { restore } = captureOutput();
    await runMostActive(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('data.alpaca.markets');
    expect(url).toMatch(/\/v1beta1\/screener\/stocks\/most-actives$/);
  });

  it('--by trades --top 20 passes query params', async () => {
    mockOk({ most_actives: [] });
    const { restore } = captureOutput();
    await runMostActive(
      makeClient(),
      ['--by', 'trades', '--top', '20'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('by=trades');
    expect(url).toContain('top=20');
  });
});

describe('runMovers', () => {
  beforeEach(() => mockFetch.mockReset());

  it('stocks → GET dataBase/v1beta1/screener/stocks/movers', async () => {
    mockOk({ gainers: [], losers: [] });
    const { restore } = captureOutput();
    await runMovers(makeClient(), ['stocks'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/screener/stocks/movers');
  });

  it('crypto --top 5 → GET /v1beta1/screener/crypto/movers?top=5', async () => {
    mockOk({ gainers: [], losers: [] });
    const { restore } = captureOutput();
    await runMovers(makeClient(), ['crypto', '--top', '5'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/screener/crypto/movers');
    expect(url).toContain('top=5');
  });

  it('throws UsageError when no market-type', async () => {
    await expect(
      runMovers(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
