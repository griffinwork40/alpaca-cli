import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runWatchlistsList,
  runWatchlistsGet,
  runWatchlistsCreate,
  runWatchlistsUpdate,
  runWatchlistsDelete,
  runWatchlistsAdd,
  runWatchlistsRemove,
} from './watchlists.js';
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

function mock204() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 204,
    json: async () => null,
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

describe('runWatchlistsList', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/watchlists', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runWatchlistsList(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toMatch(/\/v2\/watchlists$/);
  });
});

describe('runWatchlistsGet', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/watchlists/{id}', async () => {
    mockOk({ id: 'wl-1' });
    const { restore } = captureOutput();
    await runWatchlistsGet(makeClient(), ['wl-1'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/watchlists/wl-1');
  });

  it('throws UsageError when no id', async () => {
    await expect(
      runWatchlistsGet(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runWatchlistsCreate', () => {
  beforeEach(() => mockFetch.mockReset());

  it('POST /v2/watchlists with name', async () => {
    mockOk({ id: 'wl-1', name: 'Tech' });
    const { restore } = captureOutput();
    await runWatchlistsCreate(makeClient(), ['--name', 'Tech'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toMatch(/\/v2\/watchlists$/);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['name']).toBe('Tech');
  });

  it('includes symbols array when --symbols provided', async () => {
    mockOk({ id: 'wl-1', name: 'Tech' });
    const { restore } = captureOutput();
    await runWatchlistsCreate(
      makeClient(),
      ['--name', 'Tech', '--symbols', 'AAPL,TSLA'],
      'kid',
      'skey',
    );
    restore();
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['symbols']).toEqual(['AAPL', 'TSLA']);
  });

  it('throws UsageError when --name missing', async () => {
    await expect(
      runWatchlistsCreate(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runWatchlistsUpdate', () => {
  beforeEach(() => mockFetch.mockReset());

  it('PUT /v2/watchlists/{id} with new name', async () => {
    mockOk({ id: 'wl-1', name: 'New' });
    const { restore } = captureOutput();
    await runWatchlistsUpdate(
      makeClient(),
      ['wl-1', '--name', 'New'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/watchlists/wl-1');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['name']).toBe('New');
  });
});

describe('runWatchlistsDelete', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DELETE /v2/watchlists/{id}', async () => {
    mock204();
    const { restore } = captureOutput();
    await runWatchlistsDelete(makeClient(), ['wl-1'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/watchlists/wl-1');
    expect(init.method).toBe('DELETE');
  });
});

describe('runWatchlistsAdd', () => {
  beforeEach(() => mockFetch.mockReset());

  it('POST /v2/watchlists/{id} with symbol body', async () => {
    mockOk({ id: 'wl-1' });
    const { restore } = captureOutput();
    await runWatchlistsAdd(
      makeClient(),
      ['wl-1', '--symbol', 'MSFT'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/watchlists/wl-1');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['symbol']).toBe('MSFT');
  });
});

describe('runWatchlistsRemove', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DELETE /v2/watchlists/{id}/{symbol}', async () => {
    mock204();
    const { restore } = captureOutput();
    await runWatchlistsRemove(
      makeClient(),
      ['wl-1', '--symbol', 'MSFT'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/watchlists/wl-1/MSFT');
    expect(init.method).toBe('DELETE');
  });
});
