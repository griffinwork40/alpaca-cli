import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlpacaClient } from '../client.js';
import {
  runCalendar,
  runClock,
  runCorporateActions,
  runCorporateAction,
} from './meta.js';
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

describe('runCalendar', () => {
  beforeEach(() => mockFetch.mockReset());

  it('no flags → GET /v2/calendar', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runCalendar(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toMatch(/\/v2\/calendar$/);
  });

  it('--start --end passes query params', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runCalendar(
      makeClient(),
      ['--start', '2024-01-01', '--end', '2024-01-31'],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('start=2024-01-01');
    expect(url).toContain('end=2024-01-31');
  });

  it('output does not contain credentials', async () => {
    mockOk([{ date: '2024-01-02' }]);
    const { restore } = captureOutput();
    await runCalendar(makeClient(), [], 'mysecretkeyid', 'mysecretkey');
    const out = restore();
    expect(out).not.toContain('mysecretkeyid');
    expect(out).not.toContain('mysecretkey');
  });
});

describe('runClock', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/clock', async () => {
    mockOk({ is_open: true });
    const { restore } = captureOutput();
    await runClock(makeClient(), [], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toMatch(/\/v2\/clock$/);
  });
});

describe('runCorporateActions', () => {
  beforeEach(() => mockFetch.mockReset());

  it('passes ca_types, since, until', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runCorporateActions(
      makeClient(),
      [
        '--ca-types', 'dividend,split',
        '--since', '2025-01-01',
        '--until', '2025-03-31',
      ],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/corporate_actions/announcements');
    expect(url).toContain('ca_types=dividend%2Csplit');
    expect(url).toContain('since=2025-01-01');
    expect(url).toContain('until=2025-03-31');
  });

  it('includes --symbol when provided', async () => {
    mockOk([]);
    const { restore } = captureOutput();
    await runCorporateActions(
      makeClient(),
      [
        '--ca-types', 'dividend',
        '--since', '2025-01-01',
        '--until', '2025-03-31',
        '--symbol', 'AAPL',
      ],
      'kid',
      'skey',
    );
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('symbol=AAPL');
  });

  it('throws UsageError when --ca-types missing', async () => {
    await expect(
      runCorporateActions(
        makeClient(),
        ['--since', '2025-01-01', '--until', '2025-03-31'],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });

  it('throws UsageError when --since missing', async () => {
    await expect(
      runCorporateActions(
        makeClient(),
        ['--ca-types', 'dividend', '--until', '2025-03-31'],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });

  it('throws UsageError when --until missing', async () => {
    await expect(
      runCorporateActions(
        makeClient(),
        ['--ca-types', 'dividend', '--since', '2025-01-01'],
        'kid',
        'skey',
      ),
    ).rejects.toBeInstanceOf(UsageError);
  });
});

describe('runCorporateAction', () => {
  beforeEach(() => mockFetch.mockReset());

  it('GET /v2/corporate_actions/announcements/{id}', async () => {
    mockOk({ id: 'ca-123' });
    const { restore } = captureOutput();
    await runCorporateAction(makeClient(), ['ca-123'], 'kid', 'skey');
    restore();
    const url = (mockFetch.mock.calls[0] as string[])[0];
    expect(url).toContain('/v2/corporate_actions/announcements/ca-123');
  });

  it('throws UsageError when no id', async () => {
    await expect(
      runCorporateAction(makeClient(), [], 'kid', 'skey'),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
