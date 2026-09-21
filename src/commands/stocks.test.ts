import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runStocksBars,
  runStocksBarsMuti,
  runStocksBarsLatest,
  runStocksQuotes,
  runStocksQuotesLatest,
  runStocksTrades,
  runStocksTradesLatest,
  runStocksSnapshot,
  runStocksSnapshots,
} from './stocks.js';
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

describe('runStocksBars', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET data.alpaca.markets/v2/stocks/AAPL/bars?timeframe=1Day', async () => {
    mockOk({ bars: [] });
    const { restore } = captureOutput();
    await runStocksBars(
      makeClient(),
      ['AAPL', '--timeframe', '1Day'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('data.alpaca.markets');
    expect(url).toContain('/v2/stocks/AAPL/bars');
    expect(url).toContain('timeframe=1Day');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runStocksBars(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runStocksBarsMuti', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/bars with symbols param', async () => {
    mockOk({ bars: {} });
    const { restore } = captureOutput();
    await runStocksBarsMuti(
      makeClient(),
      ['--symbols', 'AAPL,MSFT', '--timeframe', '1Hour', '--start', '2024-01-01'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/bars');
    expect(url).toContain('symbols=AAPL%2CMSFT');
    expect(url).toContain('timeframe=1Hour');
  });

  it('throws UsageError when --symbols missing', async () => {
    await expect(
      runStocksBarsMuti(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runStocksBarsLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/AAPL/bars/latest', async () => {
    mockOk({ bars: {} });
    const { restore } = captureOutput();
    await runStocksBarsLatest(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/AAPL/bars/latest');
  });
});

describe('runStocksQuotes', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/AAPL/quotes with limit and feed', async () => {
    mockOk({ quotes: {} });
    const { restore } = captureOutput();
    await runStocksQuotes(
      makeClient(),
      ['AAPL', '--limit', '500', '--feed', 'sip'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/AAPL/quotes');
    expect(url).toContain('limit=500');
    expect(url).toContain('feed=sip');
  });
});

describe('runStocksQuotesLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/AAPL/quotes/latest', async () => {
    mockOk({ quotes: {} });
    const { restore } = captureOutput();
    await runStocksQuotesLatest(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/AAPL/quotes/latest');
  });
});

describe('runStocksTrades', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/AAPL/trades with start param', async () => {
    mockOk({ trades: {} });
    const { restore } = captureOutput();
    await runStocksTrades(
      makeClient(),
      ['AAPL', '--start', '2024-01-01'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/AAPL/trades');
    expect(url).toContain('start=2024-01-01');
  });
});

describe('runStocksTradesLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/AAPL/trades/latest', async () => {
    mockOk({ trades: {} });
    const { restore } = captureOutput();
    await runStocksTradesLatest(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/AAPL/trades/latest');
  });
});

describe('runStocksSnapshot', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/AAPL/snapshot', async () => {
    mockOk({ latestTrade: {}, latestQuote: {} });
    const { restore } = captureOutput();
    await runStocksSnapshot(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/AAPL/snapshot');
  });
});

describe('runStocksSnapshots', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/stocks/snapshots?symbols=AAPL,TSLA', async () => {
    mockOk({ snapshots: {} });
    const { restore } = captureOutput();
    await runStocksSnapshots(
      makeClient(),
      ['--symbols', 'AAPL,TSLA'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/stocks/snapshots');
    expect(url).toContain('symbols=AAPL%2CTSLA');
  });

  it('throws UsageError when --symbols missing', async () => {
    await expect(
      runStocksSnapshots(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
