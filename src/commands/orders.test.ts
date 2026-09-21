import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runOrdersList,
  runOrdersGet,
  runOrdersGetByClientId,
  runOrdersCreate,
  runOrdersReplace,
  runOrdersCancel,
  runOrdersCancelAll,
} from './orders.js';
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

describe('runOrdersList', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/orders?status=open&limit=10', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runOrdersList(
      makeClient(),
      ['--status', 'open', '--limit', '10'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/orders');
    expect(url).toContain('status=open');
    expect(url).toContain('limit=10');
  });
});

describe('runOrdersGet', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/orders/{uuid}', async () => {
    mockOk({ id: 'uuid-123' });
    const { restore } = captureOutput();
    await runOrdersGet(makeClient(), ['uuid-123'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/orders/uuid-123');
  });

  it('throws UsageError when no id', async () => {
    await expect(
      runOrdersGet(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runOrdersGetByClientId', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/orders:by_client_order_id?client_order_id=my-ref', async () => {
    mockOk({ client_order_id: 'my-ref' });
    const { restore } = captureOutput();
    await runOrdersGetByClientId(makeClient(), ['my-ref'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/orders:by_client_order_id');
    expect(url).toContain('client_order_id=my-ref');
  });
});

describe('runOrdersCreate', () => {
  beforeEach(() => mockFetch.mockReset());

  it('POST /v2/orders with correct body for market order', async () => {
    mockOk({ id: 'ord1' });
    const { restore } = captureOutput();
    await runOrdersCreate(
      makeClient(),
      [
        '--symbol', 'AAPL',
        '--qty', '10',
        '--side', 'buy',
        '--type', 'market',
        '--tif', 'day',
      ],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['symbol']).toBe('AAPL');
    expect(body['qty']).toBe('10');
    expect(body['side']).toBe('buy');
    expect(body['type']).toBe('market');
    expect(body['time_in_force']).toBe('day');
  });

  it('throws UsageError when --symbol is missing', async () => {
    await expect(
      runOrdersCreate(
        makeClient(),
        ['--qty', '10', '--side', 'buy', '--type', 'market', '--tif', 'day'],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });

  it('notional order omits qty', async () => {
    mockOk({ id: 'ord2' });
    const { restore } = captureOutput();
    await runOrdersCreate(
      makeClient(),
      [
        '--symbol', 'MSFT',
        '--notional', '500',
        '--side', 'buy',
        '--type', 'market',
        '--tif', 'day',
      ],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['notional']).toBe('500');
    expect(body['qty']).toBeUndefined();
  });

  it('bracket order includes take_profit and stop_loss', async () => {
    mockOk({ id: 'ord3' });
    const { restore } = captureOutput();
    await runOrdersCreate(
      makeClient(),
      [
        '--symbol', 'AAPL',
        '--qty', '10',
        '--side', 'buy',
        '--type', 'market',
        '--tif', 'day',
        '--order-class', 'bracket',
        '--take-profit-limit', '155',
        '--stop-loss-stop', '140',
      ],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['order_class']).toBe('bracket');
    expect((body['take_profit'] as Record<string, unknown>)['limit_price']).toBe('155');
    expect((body['stop_loss'] as Record<string, unknown>)['stop_price']).toBe('140');
  });

  it('position_intent included for option order', async () => {
    mockOk({ id: 'ord4' });
    const { restore } = captureOutput();
    await runOrdersCreate(
      makeClient(),
      [
        '--symbol', 'AAPL250620C00200000',
        '--qty', '1',
        '--side', 'buy',
        '--type', 'market',
        '--tif', 'day',
        '--position-intent', 'buy_to_open',
      ],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['position_intent']).toBe('buy_to_open');
  });

  it('mleg order with valid legs', async () => {
    mockOk({ id: 'ord5' });
    const { restore } = captureOutput();
    const legs = JSON.stringify([
      { symbol: 'A', ratio_qty: 1, side: 'buy' },
      { symbol: 'B', ratio_qty: 1, side: 'sell' },
    ]);
    await runOrdersCreate(
      makeClient(),
      [
        '--qty', '1',
        '--type', 'market',
        '--tif', 'day',
        '--order-class', 'mleg',
        '--legs', legs,
      ],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['order_class']).toBe('mleg');
    expect(Array.isArray(body['legs'])).toBe(true);
    expect((body['legs'] as unknown[]).length).toBe(2);
  });

  it('mleg missing --qty throws UsageError', async () => {
    await expect(
      runOrdersCreate(
        makeClient(),
        [
          '--type', 'market',
          '--tif', 'day',
          '--order-class', 'mleg',
          '--legs', '[{"symbol":"A","ratio_qty":1,"side":"buy"},{"symbol":"B","ratio_qty":1,"side":"sell"}]',
        ],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });

  it('mleg with --symbol throws UsageError', async () => {
    await expect(
      runOrdersCreate(
        makeClient(),
        [
          '--symbol', 'AAPL',
          '--qty', '1',
          '--type', 'market',
          '--tif', 'day',
          '--order-class', 'mleg',
          '--legs', '[{"symbol":"A","ratio_qty":1,"side":"buy"},{"symbol":"B","ratio_qty":1,"side":"sell"}]',
        ],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });

  it('mleg with only 1 leg throws UsageError', async () => {
    await expect(
      runOrdersCreate(
        makeClient(),
        [
          '--qty', '1',
          '--type', 'market',
          '--tif', 'day',
          '--order-class', 'mleg',
          '--legs', '[{"symbol":"A","ratio_qty":1,"side":"buy"}]',
        ],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runOrdersReplace', () => {
  beforeEach(() => mockFetch.mockReset());

  it('PATCH /v2/orders/{uuid} with qty', async () => {
    mockOk({ id: 'uuid-123' });
    const { restore } = captureOutput();
    await runOrdersReplace(
      makeClient(),
      ['uuid-123', '--qty', '5'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/orders/uuid-123');
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['qty']).toBe('5');
  });
});

describe('runOrdersCancel', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DELETE /v2/orders/{uuid}', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    } as Response);
    const { restore } = captureOutput();
    await runOrdersCancel(makeClient(), ['uuid-456'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/orders/uuid-456');
    expect(init.method).toBe('DELETE');
  });
});

describe('runOrdersCancelAll', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DELETE /v2/orders', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runOrdersCancelAll(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toMatch(/\/v2\/orders$/);
    expect(init.method).toBe('DELETE');
  });
});
