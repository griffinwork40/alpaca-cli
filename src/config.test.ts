import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveConfig } from './config.js';
import { UsageError } from './errors.js';

// Keys we manage in tests
const ENV_KEYS = [
  'APCA_API_KEY_ID',
  'ALPACA_API_KEY_ID',
  'APCA_API_SECRET_KEY',
  'ALPACA_API_SECRET_KEY',
  'APCA_API_BASE_URL',
];

// Save and restore environment around each test so tests are hermetic
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const saved = savedEnv[key];
    if (saved === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved;
    }
  }
});

describe('resolveConfig — credential resolution', () => {
  it('resolves keyId and secretKey from primary env vars', () => {
    process.env['APCA_API_KEY_ID'] = 'primary-key-id';
    process.env['APCA_API_SECRET_KEY'] = 'primary-secret';
    const cfg = resolveConfig();
    expect(cfg.keyId).toBe('primary-key-id');
    expect(cfg.secretKey).toBe('primary-secret');
  });

  it('resolves via alias env vars when primary are absent', () => {
    process.env['ALPACA_API_KEY_ID'] = 'alias-key-id';
    process.env['ALPACA_API_SECRET_KEY'] = 'alias-secret';
    const cfg = resolveConfig();
    expect(cfg.keyId).toBe('alias-key-id');
    expect(cfg.secretKey).toBe('alias-secret');
  });

  it('primary takes precedence over alias for keyId', () => {
    process.env['APCA_API_KEY_ID'] = 'primary-key';
    process.env['ALPACA_API_KEY_ID'] = 'alias-key';
    process.env['APCA_API_SECRET_KEY'] = 'secret';
    const cfg = resolveConfig();
    expect(cfg.keyId).toBe('primary-key');
  });

  it('throws UsageError naming both key env vars when both absent', () => {
    process.env['APCA_API_SECRET_KEY'] = 'secret'; // secret present, key absent
    expect(() => resolveConfig()).toThrow(UsageError);
    expect(() => resolveConfig()).toThrow(/APCA_API_KEY_ID/);
    expect(() => resolveConfig()).toThrow(/ALPACA_API_KEY_ID/);
  });

  it('throws UsageError naming both secret env vars when both absent', () => {
    process.env['APCA_API_KEY_ID'] = 'key-id'; // key present, secret absent
    expect(() => resolveConfig()).toThrow(UsageError);
    expect(() => resolveConfig()).toThrow(/APCA_API_SECRET_KEY/);
    expect(() => resolveConfig()).toThrow(/ALPACA_API_SECRET_KEY/);
  });
});

describe('resolveConfig — paper vs. live', () => {
  beforeEach(() => {
    // Set valid credentials for all URL/isLive tests
    process.env['APCA_API_KEY_ID'] = 'test-key';
    process.env['APCA_API_SECRET_KEY'] = 'test-secret';
  });

  it('defaults to paper trading URL and isLive=false', () => {
    const cfg = resolveConfig();
    expect(cfg.tradingBaseUrl).toBe('https://paper-api.alpaca.markets');
    expect(cfg.isLive).toBe(false);
  });

  it('resolveConfig({ live: true }) sets live URL and isLive=true', () => {
    const cfg = resolveConfig({ live: true });
    expect(cfg.tradingBaseUrl).toBe('https://api.alpaca.markets');
    expect(cfg.isLive).toBe(true);
  });

  it('resolveConfig({ live: false }) stays paper', () => {
    const cfg = resolveConfig({ live: false });
    expect(cfg.tradingBaseUrl).toBe('https://paper-api.alpaca.markets');
    expect(cfg.isLive).toBe(false);
  });

  it('APCA_API_BASE_URL set to live URL makes isLive=true', () => {
    process.env['APCA_API_BASE_URL'] = 'https://api.alpaca.markets';
    const cfg = resolveConfig();
    expect(cfg.isLive).toBe(true);
    expect(cfg.tradingBaseUrl).toBe('https://api.alpaca.markets');
  });

  it('APCA_API_BASE_URL set to paper URL keeps isLive=false', () => {
    process.env['APCA_API_BASE_URL'] = 'https://paper-api.alpaca.markets';
    const cfg = resolveConfig();
    expect(cfg.isLive).toBe(false);
    expect(cfg.tradingBaseUrl).toBe('https://paper-api.alpaca.markets');
  });

  it('paper-api.alpaca.markets is NOT treated as live (substring trap)', () => {
    // The string 'api.alpaca.markets' is a substring of 'paper-api.alpaca.markets'
    // Ensure we don't incorrectly detect this as live
    process.env['APCA_API_BASE_URL'] = 'https://paper-api.alpaca.markets';
    const cfg = resolveConfig();
    expect(cfg.isLive).toBe(false);
  });

  it('dataBaseUrl is always https://data.alpaca.markets regardless of other env', () => {
    const cfg1 = resolveConfig();
    expect(cfg1.dataBaseUrl).toBe('https://data.alpaca.markets');

    process.env['APCA_API_BASE_URL'] = 'https://api.alpaca.markets';
    const cfg2 = resolveConfig({ live: true });
    expect(cfg2.dataBaseUrl).toBe('https://data.alpaca.markets');
  });

  it('APCA_API_BASE_URL overrides the tradingBaseUrl even when --live not passed', () => {
    const customUrl = 'https://api.alpaca.markets';
    process.env['APCA_API_BASE_URL'] = customUrl;
    const cfg = resolveConfig();
    expect(cfg.tradingBaseUrl).toBe(customUrl);
  });
});
