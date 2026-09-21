import { describe, it, expect } from 'vitest';
import { UsageError, AlpacaApiError } from './errors.js';
import { redactTwo } from './redact.js';

describe('UsageError', () => {
  it('is an instanceof Error', () => {
    const err = new UsageError('foo');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name === "UsageError"', () => {
    const err = new UsageError('foo');
    expect(err.name).toBe('UsageError');
  });

  it('has message === "foo"', () => {
    const err = new UsageError('foo');
    expect(err.message).toBe('foo');
  });

  it('throwing and catching preserves the message', () => {
    const fn = () => {
      throw new UsageError('missing required --symbol flag');
    };
    expect(fn).toThrow('missing required --symbol flag');
  });
});

describe('AlpacaApiError', () => {
  it('is an instanceof Error', () => {
    const err = new AlpacaApiError('foo', 403);
    expect(err).toBeInstanceOf(Error);
  });

  it('has name === "AlpacaApiError"', () => {
    const err = new AlpacaApiError('foo', 403);
    expect(err.name).toBe('AlpacaApiError');
  });

  it('stores the code', () => {
    const err = new AlpacaApiError('foo', 403);
    expect(err.code).toBe(403);
  });

  it('stores a granular Alpaca error code', () => {
    const err = new AlpacaApiError('unauthorized', 40110000);
    expect(err.code).toBe(40110000);
  });

  it('throwing and catching preserves message and code', () => {
    const fn = () => {
      throw new AlpacaApiError('insufficient buying power', 40310000);
    };
    try {
      fn();
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AlpacaApiError);
      if (e instanceof AlpacaApiError) {
        expect(e.message).toBe('insufficient buying power');
        expect(e.code).toBe(40310000);
      }
    }
  });

  it('AlpacaApiError.message does NOT contain raw key value when built with redactTwo', () => {
    const keyId = 'MYREALKEYID1234';
    const secretKey = 'MYREALSECRET5678';
    const rawMessage = `unauthorized: key=${keyId} secret=${secretKey}`;
    const redacted = redactTwo(rawMessage, keyId, secretKey);
    const err = new AlpacaApiError(redacted, 401);
    expect(err.message).not.toContain(keyId);
    expect(err.message).not.toContain(secretKey);
    expect(err.message).toContain('[REDACTED]');
  });
});
