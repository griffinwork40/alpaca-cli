import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import { runAssetsList, runAssetsGet } from './assets.js';
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

describe('runAssetsList', () => {
  beforeEach(() => mockFetch.mockReset());

  it('no flags → GET /v2/assets with no query params', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runAssetsList(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toMatch(/\/v2\/assets$/);
  });

  it('--status active --asset-class us_equity', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runAssetsList(
      makeClient(),
      ['--status', 'active', '--asset-class', 'us_equity'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('status=active');
    expect(url).toContain('asset_class=us_equity');
  });

  it('--exchange NASDAQ', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runAssetsList(makeClient(), ['--exchange', 'NASDAQ'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('exchange=NASDAQ');
  });
});

describe('runAssetsGet', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/assets/AAPL', async () => {
    mockOk({ symbol: 'AAPL' });
    const { restore } = captureOutput();
    await runAssetsGet(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/assets/AAPL');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runAssetsGet(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
