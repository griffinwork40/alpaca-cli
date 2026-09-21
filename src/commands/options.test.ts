import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runOptionsContracts,
  runOptionsContract,
  runOptionsChain,
  runOptionsBars,
  runOptionsTrades,
  runOptionsTradesLatest,
  runOptionsQuotesLatest,
  runOptionsSnapshot,
  runOptionsExchanges,
} from './options.js';
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

describe('runOptionsContracts', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET tradingBase/v2/options/contracts with underlying, type, expiration-gte', async () => {
    mockOk({ option_contracts: [] });
    const { restore } = captureOutput();
    await runOptionsContracts(
      makeClient(),
      [
        '--underlying', 'AAPL',
        '--type', 'call',
        '--expiration-gte', '2025-07-01',
      ],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('paper-api.alpaca.markets');
    expect(url).toContain('/v2/options/contracts');
    expect(url).toContain('underlying_symbols=AAPL');
    expect(url).toContain('type=call');
    expect(url).toContain('expiration_date_gte=2025-07-01');
  });

  it('no flags → GET /v2/options/contracts with no required params', async () => {
    mockOk({ option_contracts: [] });
    const { restore } = captureOutput();
    await runOptionsContracts(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/options/contracts');
  });

  it('--strike-gte and --strike-lte', async () => {
    mockOk({ option_contracts: [] });
    const { restore } = captureOutput();
    await runOptionsContracts(
      makeClient(),
      ['--strike-gte', '100', '--strike-lte', '200'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('strike_price_gte=100');
    expect(url).toContain('strike_price_lte=200');
  });
});

describe('runOptionsContract', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/options/contracts/AAPL250620C00200000', async () => {
    mockOk({ symbol: 'AAPL250620C00200000' });
    const { restore } = captureOutput();
    await runOptionsContract(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/options/contracts/AAPL250620C00200000');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runOptionsContract(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runOptionsChain', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/snapshots/AAPL with filters', async () => {
    mockOk({ snapshots: {} });
    const { restore } = captureOutput();
    await runOptionsChain(
      makeClient(),
      ['AAPL', '--type', 'call', '--expiration', '2025-07-18'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('data.alpaca.markets');
    expect(url).toContain('/v1beta1/options/snapshots/AAPL');
    expect(url).toContain('type=call');
    expect(url).toContain('expiration_date=2025-07-18');
  });

  it('throws UsageError when no underlying', async () => {
    await expect(
      runOptionsChain(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runOptionsBars', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/bars?symbols=...&timeframe=1Day', async () => {
    mockOk({ bars: {} });
    const { restore } = captureOutput();
    await runOptionsBars(
      makeClient(),
      ['AAPL250620C00200000', '--timeframe', '1Day'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/options/bars');
    expect(url).toContain('symbols=AAPL250620C00200000');
    expect(url).toContain('timeframe=1Day');
  });
});

describe('runOptionsTrades', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/trades?symbols=...', async () => {
    mockOk({ trades: {} });
    const { restore } = captureOutput();
    await runOptionsTrades(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/options/trades');
    expect(url).toContain('symbols=AAPL250620C00200000');
  });
});

describe('runOptionsTradesLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/trades/latest?symbols=...', async () => {
    mockOk({ trades: {} });
    const { restore } = captureOutput();
    await runOptionsTradesLatest(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/options/trades/latest');
    expect(url).toContain('symbols=AAPL250620C00200000');
  });
});

describe('runOptionsQuotesLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/quotes/latest?symbols=...', async () => {
    mockOk({ quotes: {} });
    const { restore } = captureOutput();
    await runOptionsQuotesLatest(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/options/quotes/latest');
    expect(url).toContain('symbols=AAPL250620C00200000');
  });
});

describe('runOptionsSnapshot', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/snapshots?symbols=...', async () => {
    mockOk({
      snapshots: {
        AAPL250620C00200000: {
          greeks: { delta: 0.65 },
          impliedVolatility: 0.285,
        },
      },
    });
    const { restore } = captureOutput();
    await runOptionsSnapshot(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    const out = restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/options/snapshots');
    expect(url).toContain('symbols=AAPL250620C00200000');
    // Output should contain greeks and impliedVolatility
    expect(out).toContain('greeks');
    expect(out).toContain('impliedVolatility');
  });
});

describe('runOptionsExchanges', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET dataBase/v1beta1/options/meta/exchanges', async () => {
    mockOk({ A: 'NYSE American Options' });
    const { restore } = captureOutput();
    await runOptionsExchanges(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v1beta1/options/meta/exchanges');
  });
});
