import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runCryptoBars,
  runCryptoBarsLatest,
  runCryptoQuotes,
  runCryptoQuotesLatest,
  runCryptoTrades,
  runCryptoTradesLatest,
  runCryptoSnapshots,
  runCryptoOrderbook,
} from './crypto.js';
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

describe('runCryptoBars', () => {
  beforeEach(() => mockFetch.mockReset());

  it('passes pair as symbols param', async () => {
    mockOk({ bars: {} });
    const { restore } = captureOutput();
    await runCryptoBars(
      makeClient(),
      ['BTC/USD', '--timeframe', '1Hour'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('data.alpaca.markets');
    expect(url).toContain('/v1beta3/crypto/us/bars');
    expect(url).toContain('symbols=BTC%2FUSD');
    expect(url).toContain('timeframe=1Hour');
  });

  it('throws UsageError when no pair', async () => {
    await expect(
      runCryptoBars(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runCryptoBarsLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/latest/bars with pair as symbols', async () => {
    mockOk({ bars: {} });
    const { restore } = captureOutput();
    await runCryptoBarsLatest(makeClient(), ['ETH/USD'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/latest/bars');
    expect(url).toContain('symbols=ETH%2FUSD');
  });
});

describe('runCryptoQuotes', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/quotes with limit', async () => {
    mockOk({ quotes: {} });
    const { restore } = captureOutput();
    await runCryptoQuotes(
      makeClient(),
      ['BTC/USD', '--limit', '100'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/quotes');
    expect(url).toContain('limit=100');
  });
});

describe('runCryptoQuotesLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/latest/quotes', async () => {
    mockOk({ quotes: {} });
    const { restore } = captureOutput();
    await runCryptoQuotesLatest(makeClient(), ['BTC/USD'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/latest/quotes');
  });
});

describe('runCryptoTrades', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/trades with start and end', async () => {
    mockOk({ trades: {} });
    const { restore } = captureOutput();
    await runCryptoTrades(
      makeClient(),
      ['BTC/USD', '--start', '2024-01-01', '--end', '2024-01-31'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/trades');
    expect(url).toContain('start=2024-01-01');
    expect(url).toContain('end=2024-01-31');
  });
});

describe('runCryptoTradesLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/latest/trades', async () => {
    mockOk({ trades: {} });
    const { restore } = captureOutput();
    await runCryptoTradesLatest(makeClient(), ['BTC/USD'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/latest/trades');
  });
});

describe('runCryptoSnapshots', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/snapshots with pair', async () => {
    mockOk({ snapshots: {} });
    const { restore } = captureOutput();
    await runCryptoSnapshots(makeClient(), ['BTC/USD'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/snapshots');
    expect(url).toContain('symbols=BTC%2FUSD');
  });

  it('throws UsageError when no pair', async () => {
    await expect(
      runCryptoSnapshots(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runCryptoOrderbook', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v1beta3/crypto/us/latest/orderbooks', async () => {
    mockOk({ orderbooks: {} });
    const { restore } = captureOutput();
    await runCryptoOrderbook(makeClient(), ['BTC/USD'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta3/crypto/us/latest/orderbooks');
    expect(url).toContain('symbols=BTC%2FUSD');
  });

  it('throws UsageError when no pair', async () => {
    await expect(
      runCryptoOrderbook(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
