import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runPositionsList,
  runPositionsGet,
  runPositionsClose,
  runPositionsCloseAll,
  runPositionsExercise,
  runPositionsDoNotExercise,
} from './positions.js';
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

function captureStderr(): { restore: () => string } {
  let captured = '';
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk: unknown) => {
    captured += String(chunk);
    return true;
  };
  return {
    restore: () => {
      process.stderr.write = orig;
      return captured;
    },
  };
}

describe('runPositionsList', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/positions', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runPositionsList(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toMatch(/\/v2\/positions$/);
  });
});

describe('runPositionsGet', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/positions/AAPL', async () => {
    mockOk({ symbol: 'AAPL' });
    const { restore } = captureOutput();
    await runPositionsGet(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/positions/AAPL');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runPositionsGet(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runPositionsClose', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DELETE /v2/positions/AAPL with no flags', async () => {
    mockOk({ id: 'ord1' });
    const { restore } = captureOutput();
    await runPositionsClose(makeClient(), ['AAPL'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/positions/AAPL');
    expect(init.method).toBe('DELETE');
    expect(url).not.toContain('qty');
  });

  it('DELETE with --qty=50 appends query param', async () => {
    mockOk({ id: 'ord2' });
    const { restore } = captureOutput();
    await runPositionsClose(makeClient(), ['AAPL', '--qty', '50'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('qty=50');
  });

  it('DELETE with --percentage=0.5 appends query param', async () => {
    mockOk({ id: 'ord3' });
    const { restore } = captureOutput();
    await runPositionsClose(
      makeClient(),
      ['AAPL', '--percentage', '0.5'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('percentage=0.5');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runPositionsClose(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runPositionsCloseAll', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DELETE /v2/positions', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runPositionsCloseAll(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toMatch(/\/v2\/positions$/);
    expect(init.method).toBe('DELETE');
  });

  it('--cancel-orders appends ?cancel_orders=true', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runPositionsCloseAll(
      makeClient(),
      ['--cancel-orders'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('cancel_orders=true');
  });
});

describe('runPositionsExercise', () => {
  beforeEach(() => mockFetch.mockReset());

  it('POST /v2/positions/{symbol}/exercise', async () => {
    mock204();
    const { restore } = captureOutput();
    await runPositionsExercise(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/positions/AAPL250620C00200000/exercise');
    expect(init.method).toBe('POST');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runPositionsExercise(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });

  it('emits LIVE WARNING when isLive=true', async () => {
    mock204();
    const { restore: restoreOut } = captureOutput();
    const { restore: restoreErr } = captureStderr();
    await runPositionsExercise(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
      true,
    );
    restoreOut();
    const err = restoreErr();
    expect(err).toContain('LIVE WARNING');
  });
});

describe('runPositionsDoNotExercise', () => {
  beforeEach(() => mockFetch.mockReset());

  it('POST /v2/positions/{symbol}/do-not-exercise', async () => {
    mock204();
    const { restore } = captureOutput();
    await runPositionsDoNotExercise(
      makeClient(),
      ['AAPL250620C00200000'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    const init = (mockFetch.mock.calls[0] as [string, RequestInit])[1];
    expect(url).toContain('/v2/positions/AAPL250620C00200000/do-not-exercise');
    expect(init.method).toBe('POST');
  });

  it('throws UsageError when no symbol', async () => {
    await expect(
      runPositionsDoNotExercise(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
