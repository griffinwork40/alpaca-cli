/**
 * Tests for AlpacaClient — Wave 2.
 *
 * All test cases from BUILD-PLAN §C Wave 2:
 *  1. get(url) calls fetch with correct URL and BOTH auth headers
 *  2. post(url, body) sends Content-Type: application/json with JSON-stringified body
 *  3. patch(url, body) uses method PATCH
 *  4. delete(url) uses method DELETE with no body; delete(url, {qty:50}) appends ?qty=50
 *  5. HTTP 204 → resolves to null, no throw
 *  6. HTTP 401 with { code: 40110000, message } → throws AlpacaApiError with correct code
 *  7. Error message containing literal secretKey is redacted to [REDACTED]
 *  8. HTTP 207 → returned as success (not thrown)
 *  9. A rejected fetch promise propagates as-is
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AlpacaClient } from './client.js';
import { AlpacaApiError } from './errors.js';

// Use ≥4-char keys so redaction triggers (redactKey is no-op for keys < 4 chars)
const TEST_KEY_ID = 'TESTKEY_ID_1234';
const TEST_SECRET  = 'TESTSECRET_ABCD';

const TRADING_BASE = 'https://paper-api.alpaca.markets';
const DATA_BASE    = 'https://data.alpaca.markets';

function makeClient() {
  return new AlpacaClient({
    keyId: TEST_KEY_ID,
    secretKey: TEST_SECRET,
    tradingBaseUrl: TRADING_BASE,
    dataBaseUrl: DATA_BASE,
  });
}

function makeOkResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeErrorResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Construction ────────────────────────────────────────────────────────────

describe('AlpacaClient — construction', () => {
  it('exposes tradingBase as the tradingBaseUrl from config', () => {
    const client = makeClient();
    expect(client.tradingBase).toBe(TRADING_BASE);
  });

  it('exposes dataBase as the dataBaseUrl from config', () => {
    const client = makeClient();
    expect(client.dataBase).toBe(DATA_BASE);
  });
});

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('AlpacaClient — get()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test case 1: get(url) calls fetch with correct URL and BOTH auth headers
  it('calls fetch with the exact URL and APCA-API-KEY-ID header', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ status: 'ACTIVE' }));
    const client = makeClient();
    const url = `${TRADING_BASE}/v2/account`;
    await client.get(url);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(url);
    const headers = init?.headers as Record<string, string>;
    expect(headers['APCA-API-KEY-ID']).toBe(TEST_KEY_ID);
  });

  it('calls fetch with APCA-API-SECRET-KEY header', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ status: 'ACTIVE' }));
    const client = makeClient();
    await client.get(`${TRADING_BASE}/v2/account`);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['APCA-API-SECRET-KEY']).toBe(TEST_SECRET);
  });

  it('uses method GET', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ status: 'ACTIVE' }));
    const client = makeClient();
    await client.get(`${TRADING_BASE}/v2/account`);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe('GET');
  });

  it('returns parsed JSON on success', async () => {
    const body = { id: 'abc123', status: 'ACTIVE' };
    fetchMock.mockResolvedValue(makeOkResponse(body));
    const client = makeClient();
    const result = await client.get<typeof body>(`${TRADING_BASE}/v2/account`);
    expect(result).toEqual(body);
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe('AlpacaClient — post()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test case 2: post(url, body) sends Content-Type: application/json with JSON-stringified body
  it('sends Content-Type: application/json header', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    await client.post(`${TRADING_BASE}/v2/orders`, { symbol: 'AAPL', qty: '10' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends JSON-stringified body', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    const body = { symbol: 'AAPL', qty: '10', side: 'buy' };
    await client.post(`${TRADING_BASE}/v2/orders`, body);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init?.body as string)).toEqual(body);
  });

  it('uses method POST', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    await client.post(`${TRADING_BASE}/v2/orders`, { symbol: 'AAPL' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe('POST');
  });

  it('sends both auth headers', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    await client.post(`${TRADING_BASE}/v2/orders`, {});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['APCA-API-KEY-ID']).toBe(TEST_KEY_ID);
    expect(headers['APCA-API-SECRET-KEY']).toBe(TEST_SECRET);
  });

  it('sends empty JSON object when body is omitted', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({}, 200));
    const client = makeClient();
    await client.post(`${TRADING_BASE}/v2/orders`);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.body).toBe('{}');
  });
});

// ─── PUT ─────────────────────────────────────────────────────────────────────

describe('AlpacaClient — put()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses method PUT', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'wl-1' }, 200));
    const client = makeClient();
    await client.put(`${TRADING_BASE}/v2/watchlists/wl-1`, { name: 'Tech' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe('PUT');
  });

  it('sends both auth headers', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'wl-1' }, 200));
    const client = makeClient();
    await client.put(`${TRADING_BASE}/v2/watchlists/wl-1`, { name: 'Tech' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['APCA-API-KEY-ID']).toBe(TEST_KEY_ID);
    expect(headers['APCA-API-SECRET-KEY']).toBe(TEST_SECRET);
  });

  it('sends Content-Type: application/json', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'wl-1' }, 200));
    const client = makeClient();
    await client.put(`${TRADING_BASE}/v2/watchlists/wl-1`, { name: 'Tech' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });
});

// ─── PATCH ───────────────────────────────────────────────────────────────────

describe('AlpacaClient — patch()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test case 3: patch(url, body) uses method PATCH
  it('uses method PATCH', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    await client.patch(`${TRADING_BASE}/v2/orders/order-1`, { qty: '5' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe('PATCH');
  });

  it('sends both auth headers', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    await client.patch(`${TRADING_BASE}/v2/orders/order-1`, { qty: '5' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['APCA-API-KEY-ID']).toBe(TEST_KEY_ID);
    expect(headers['APCA-API-SECRET-KEY']).toBe(TEST_SECRET);
  });

  it('sends Content-Type: application/json', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    await client.patch(`${TRADING_BASE}/v2/orders/order-1`, { qty: '5' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends JSON-stringified body', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ id: 'order-1' }, 200));
    const client = makeClient();
    const body = { qty: '5', limit_price: '150.00' };
    await client.patch(`${TRADING_BASE}/v2/orders/order-1`, body);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init?.body as string)).toEqual(body);
  });
});

// ─── DELETE ──────────────────────────────────────────────────────────────────

describe('AlpacaClient — delete()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test case 4a: delete(url) uses method DELETE with no body
  it('uses method DELETE', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    await client.delete(`${TRADING_BASE}/v2/orders/order-1`);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe('DELETE');
  });

  it('sends both auth headers', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    await client.delete(`${TRADING_BASE}/v2/orders/order-1`);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers['APCA-API-KEY-ID']).toBe(TEST_KEY_ID);
    expect(headers['APCA-API-SECRET-KEY']).toBe(TEST_SECRET);
  });

  it('sends no body when params are omitted', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    await client.delete(`${TRADING_BASE}/v2/orders/order-1`);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.body).toBeUndefined();
  });

  // Test case 4b: delete(url, {qty: 50}) appends ?qty=50
  it('appends query params when provided', async () => {
    fetchMock.mockResolvedValue(makeOkResponse({ symbol: 'AAPL' }));
    const client = makeClient();
    await client.delete(`${TRADING_BASE}/v2/positions/AAPL`, { qty: 50 });

    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('qty=50');
  });

  it('does not append ? when no params given', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    await client.delete(`${TRADING_BASE}/v2/orders/order-1`);

    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).not.toContain('?');
  });

  it('correctly appends multiple params', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    await client.delete(`${TRADING_BASE}/v2/positions`, { cancel_orders: true });

    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('cancel_orders=true');
  });
});

// ─── 204 No Content ───────────────────────────────────────────────────────────

describe('AlpacaClient — 204 No Content', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test case 5: HTTP 204 → resolves to null, no throw
  it('returns null on 204 without throwing', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    const result = await client.delete(`${TRADING_BASE}/v2/orders/order-1`);
    expect(result).toBeNull();
  });

  it('returns null on 204 from a GET call', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = makeClient();
    const result = await client.get(`${TRADING_BASE}/v2/some/endpoint`);
    expect(result).toBeNull();
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('AlpacaClient — error handling', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test case 6: HTTP 401 with { code: 40110000, message } → throws AlpacaApiError with code 40110000
  it('throws AlpacaApiError on 401 with correct code and message', async () => {
    fetchMock.mockResolvedValue(
      makeErrorResponse(
        { code: 40110000, message: 'access key verification failed' },
        401,
      ),
    );
    const client = makeClient();
    let caught: AlpacaApiError | undefined;
    try {
      await client.get(`${TRADING_BASE}/v2/account`);
    } catch (e) {
      caught = e as AlpacaApiError;
    }
    expect(caught).toBeInstanceOf(AlpacaApiError);
    expect(caught?.code).toBe(40110000);
    expect(caught?.message).toBe('access key verification failed');
  });

  it('thrown error is instanceof AlpacaApiError from errors.js', async () => {
    fetchMock.mockResolvedValue(
      makeErrorResponse({ code: 403, message: 'forbidden' }, 403),
    );
    const client = makeClient();
    await expect(client.get(`${TRADING_BASE}/v2/account`)).rejects.toBeInstanceOf(AlpacaApiError);
  });

  it('uses HTTP status as code when response body lacks code field', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = makeClient();
    let caught: AlpacaApiError | undefined;
    try {
      await client.get(`${TRADING_BASE}/v2/orders/bad-id`);
    } catch (e) {
      caught = e as AlpacaApiError;
    }
    expect(caught).toBeInstanceOf(AlpacaApiError);
    expect(caught?.code).toBe(404);
  });

  it('uses fallback message when body cannot be parsed', async () => {
    fetchMock.mockResolvedValue(
      new Response('Not JSON at all', { status: 500, statusText: 'Internal Server Error' }),
    );
    const client = makeClient();
    let caught: AlpacaApiError | undefined;
    try {
      await client.get(`${TRADING_BASE}/v2/account`);
    } catch (e) {
      caught = e as AlpacaApiError;
    }
    expect(caught).toBeInstanceOf(AlpacaApiError);
    expect(caught?.code).toBe(500);
    expect(caught?.message).toContain('500');
  });

  // Test case 7: Error message containing literal secretKey is redacted to [REDACTED]
  it('redacts secretKey from error message before throwing', async () => {
    fetchMock.mockResolvedValue(
      makeErrorResponse(
        {
          code: 40110000,
          message: `Invalid secret key: ${TEST_SECRET} was rejected`,
        },
        401,
      ),
    );
    const client = makeClient();
    let caught: AlpacaApiError | undefined;
    try {
      await client.get(`${TRADING_BASE}/v2/account`);
    } catch (e) {
      caught = e as AlpacaApiError;
    }
    expect(caught).toBeInstanceOf(AlpacaApiError);
    expect(caught?.message).not.toContain(TEST_SECRET);
    expect(caught?.message).toContain('[REDACTED]');
  });

  it('redacts keyId from error message before throwing', async () => {
    fetchMock.mockResolvedValue(
      makeErrorResponse(
        {
          code: 40110000,
          message: `Invalid key id: ${TEST_KEY_ID} is unknown`,
        },
        401,
      ),
    );
    const client = makeClient();
    let caught: AlpacaApiError | undefined;
    try {
      await client.get(`${TRADING_BASE}/v2/account`);
    } catch (e) {
      caught = e as AlpacaApiError;
    }
    expect(caught).toBeInstanceOf(AlpacaApiError);
    expect(caught?.message).not.toContain(TEST_KEY_ID);
    expect(caught?.message).toContain('[REDACTED]');
  });

  // Test case 8: HTTP 207 → returned as success (not thrown)
  it('returns 207 response body as success (not thrown)', async () => {
    const canceledOrders = [{ id: 'order-1', status: 200 }];
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(canceledOrders), {
        status: 207,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = makeClient();
    const result = await client.delete<typeof canceledOrders>(`${TRADING_BASE}/v2/orders`);
    expect(result).toEqual(canceledOrders);
  });

  // Test case 9: A rejected fetch promise propagates as-is
  it('propagates network-level fetch rejection as-is', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(networkError);
    const client = makeClient();
    await expect(client.get(`${TRADING_BASE}/v2/account`)).rejects.toBe(networkError);
  });

  it('propagates network error from post() as-is', async () => {
    const networkError = new TypeError('Network error');
    fetchMock.mockRejectedValue(networkError);
    const client = makeClient();
    await expect(
      client.post(`${TRADING_BASE}/v2/orders`, { symbol: 'AAPL' }),
    ).rejects.toBe(networkError);
  });
});

// ─── 2xx success range ────────────────────────────────────────────────────────

describe('AlpacaClient — 2xx success range', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed body for 200 OK', async () => {
    const body = { is_open: true };
    fetchMock.mockResolvedValue(makeOkResponse(body, 200));
    const client = makeClient();
    const result = await client.get<typeof body>(`${DATA_BASE}/v2/clock`);
    expect(result).toEqual(body);
  });

  it('returns parsed body for 201 Created', async () => {
    const body = { id: 'order-created' };
    fetchMock.mockResolvedValue(makeOkResponse(body, 201));
    const client = makeClient();
    const result = await client.post<typeof body>(`${TRADING_BASE}/v2/orders`, {});
    expect(result).toEqual(body);
  });

  it('returns null when 2xx body is empty/unparseable', async () => {
    fetchMock.mockResolvedValue(
      new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const client = makeClient();
    const result = await client.get(`${TRADING_BASE}/v2/account`);
    expect(result).toBeNull();
  });
});
