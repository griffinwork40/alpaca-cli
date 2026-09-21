import { describe, it, expect } from 'vitest';
import { redactKey, redactTwo, safeStringify } from './redact.js';

describe('redactKey', () => {
  it('replaces occurrence at end of string', () => {
    const result = redactKey('abc123secret', 'secret');
    expect(result).toBe('abc123[REDACTED]');
  });

  it('replaces a single occurrence', () => {
    const result = redactKey('The key is MYSECRET123 here', 'MYSECRET123');
    expect(result).toBe('The key is [REDACTED] here');
  });

  it('replaces ALL occurrences', () => {
    const result = redactKey('MYSECRET123 and again MYSECRET123 end', 'MYSECRET123');
    expect(result).toBe('[REDACTED] and again [REDACTED] end');
  });

  it('is a no-op when key is empty string', () => {
    const str = 'some string value';
    expect(redactKey(str, '')).toBe(str);
  });

  it('is a no-op when key is shorter than 4 chars (1 char)', () => {
    const str = 'abc';
    expect(redactKey(str, 'a')).toBe(str);
  });

  it('is a no-op when key is shorter than 4 chars (3 chars)', () => {
    const str = 'hello abc world';
    expect(redactKey(str, 'abc')).toBe(str);
  });

  it('redacts when key is exactly 4 chars', () => {
    const result = redactKey('hello abcd world', 'abcd');
    expect(result).toBe('hello [REDACTED] world');
  });

  it('handles key with regex-special characters (.) — matches literally not as wildcard', () => {
    const key = 'abc.+key';
    const str = 'prefix abc.+key suffix';
    const result = redactKey(str, key);
    expect(result).toBe('prefix [REDACTED] suffix');
    // Ensure it does NOT match regex-expanded pattern "abcXXkey"
    expect(redactKey('abcXXkey', key)).toBe('abcXXkey');
  });

  it('handles key with regex-special characters ($, ^, |)', () => {
    const key = '$ecret|key^here';
    const str = 'token is $ecret|key^here done';
    const result = redactKey(str, key);
    expect(result).toBe('token is [REDACTED] done');
  });

  it('handles key with curly braces and brackets', () => {
    const key = 'key{2}[0]';
    const str = 'value=key{2}[0] end';
    const result = redactKey(str, key);
    expect(result).toBe('value=[REDACTED] end');
  });
});

describe('redactTwo', () => {
  it('redacts keyId occurrence in the string', () => {
    const result = redactTwo('the keyid is KEYID1234 here', 'KEYID1234', 'OTHERSECRET');
    expect(result).not.toContain('KEYID1234');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts secretKey occurrence in the string', () => {
    const result = redactTwo('the secret is MYSECRET5678 here', 'KEYID1234', 'MYSECRET5678');
    expect(result).not.toContain('MYSECRET5678');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts both keyId AND secretKey occurrences in one string', () => {
    const str = 'keyid=KEYID1234 secret=MYSECRET5678';
    const result = redactTwo(str, 'KEYID1234', 'MYSECRET5678');
    expect(result).not.toContain('KEYID1234');
    expect(result).not.toContain('MYSECRET5678');
    const matches = result.match(/\[REDACTED\]/g);
    expect(matches).toHaveLength(2);
  });

  it('when keyId === secretKey, produces single [REDACTED] per occurrence (not double)', () => {
    const key = 'SAMEKEYVALUE1234';
    const str = `value is ${key} here`;
    const result = redactTwo(str, key, key);
    // Should be exactly one [REDACTED], not "[[REDACTED]]" or "[REDACTED][REDACTED]"
    expect(result).toBe('value is [REDACTED] here');
    const matches = result.match(/\[REDACTED\]/g);
    expect(matches).toHaveLength(1);
  });
});

describe('safeStringify', () => {
  it('redacts keyId in stringified object', () => {
    const result = safeStringify({ key: 'mysecretkeyid' }, 'mysecretkeyid', 'other');
    expect(result).not.toContain('mysecretkeyid');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts both secrets in nested object', () => {
    const data = { user: { keyId: 'KEYID1234', secret: 'SECRET5678' } };
    const result = safeStringify(data, 'KEYID1234', 'SECRET5678');
    expect(result).not.toContain('KEYID1234');
    expect(result).not.toContain('SECRET5678');
    expect(result).toContain('[REDACTED]');
  });

  it('pretty-prints with 2-space indent before redacting', () => {
    const data = { a: 1 };
    const result = safeStringify(data, 'somekey', 'otherkey');
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('redacts all occurrences across the whole stringified output', () => {
    const data = { x: 'KEYID1234', y: 'other-KEYID1234-val' };
    const result = safeStringify(data, 'KEYID1234', 'SECRET5678');
    expect(result).not.toContain('KEYID1234');
    const matches = result.match(/\[REDACTED\]/g);
    expect(matches).toHaveLength(2);
  });
});
