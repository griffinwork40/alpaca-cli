import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import { runNews } from './news.js';
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

describe('runNews', () => {
  beforeEach(() => mockFetch.mockReset());

  it('no flags → GET data.alpaca.markets/v1beta1/news', async () => {
    mockOk({ news: [] });
    const { restore } = captureOutput();
    await runNews(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('data.alpaca.markets');
    expect(url).toMatch(/\/v1beta1\/news$/);
  });

  it('--symbols and --limit', async () => {
    mockOk({ news: [] });
    const { restore } = captureOutput();
    await runNews(
      makeClient(),
      ['--symbols', 'AAPL,TSLA', '--limit', '10'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('symbols=AAPL%2CTSLA');
    expect(url).toContain('limit=10');
  });

  it('--include-content passes include_content=true', async () => {
    mockOk({ news: [] });
    const { restore } = captureOutput();
    await runNews(makeClient(), ['--include-content'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('include_content=true');
  });

  it('--start --end passes correct params', async () => {
    mockOk({ news: [] });
    const { restore } = captureOutput();
    await runNews(
      makeClient(),
      ['--start', '2024-01-01', '--end', '2024-03-01'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('start=2024-01-01');
    expect(url).toContain('end=2024-03-01');
  });

  it('--limit 51 throws UsageError (max 50)', async () => {
    await expect(
      runNews(makeClient(), ['--limit', '51'], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
