import { describe, it, expect, vi } from 'vitest';
import { buildQueryParams, formatJson, parsePositiveInt, sleep } from './utils.js';

describe('buildQueryParams', () => {
  it('drops undefined values', () => {
    const result = buildQueryParams({ a: 'hello', b: undefined, c: 'world' });
    expect(result).toEqual({ a: 'hello', c: 'world' });
    expect('b' in result).toBe(false);
  });

  it('drops null values', () => {
    const result = buildQueryParams({ a: 'hello', b: null, c: 'world' });
    expect(result).toEqual({ a: 'hello', c: 'world' });
    expect('b' in result).toBe(false);
  });

  it('coerces false to "false"', () => {
    const result = buildQueryParams({ flag: false });
    expect(result).toEqual({ flag: 'false' });
  });

  it('coerces 0 to "0"', () => {
    const result = buildQueryParams({ n: 0 });
    expect(result).toEqual({ n: '0' });
  });

  it('coerces empty string to ""', () => {
    const result = buildQueryParams({ a: '' });
    expect(result).toEqual({ a: '' });
  });

  it('coerces numbers to strings', () => {
    const result = buildQueryParams({ limit: 20, offset: 0 });
    expect(result).toEqual({ limit: '20', offset: '0' });
  });

  it('coerces true to "true"', () => {
    const result = buildQueryParams({ active: true });
    expect(result).toEqual({ active: 'true' });
  });

  it('returns empty object when all values are null/undefined', () => {
    const result = buildQueryParams({ a: undefined, b: null });
    expect(result).toEqual({});
  });
});

describe('formatJson', () => {
  it('pretty-prints with 2-space indent', () => {
    const result = formatJson({ hello: 'world', num: 42 });
    expect(result).toBe(JSON.stringify({ hello: 'world', num: 42 }, null, 2));
  });

  it('handles nested objects', () => {
    const data = { a: { b: [1, 2, 3] } };
    expect(formatJson(data)).toBe(JSON.stringify(data, null, 2));
  });
});

describe('parsePositiveInt', () => {
  it('parses a valid positive integer', () => {
    expect(parsePositiveInt('50', '--limit')).toBe(50);
    expect(parsePositiveInt('1', '--count')).toBe(1);
  });

  it('throws with flagName in message on non-numeric input', () => {
    expect(() => parsePositiveInt('abc', '--limit')).toThrow(
      '--limit must be a positive integer',
    );
  });

  it('throws on 0', () => {
    expect(() => parsePositiveInt('0', '--limit')).toThrow(
      '--limit must be a positive integer',
    );
  });

  it('throws on negative integer', () => {
    expect(() => parsePositiveInt('-5', '--offset')).toThrow(
      '--offset must be a positive integer',
    );
  });

  it('throws on float string', () => {
    expect(() => parsePositiveInt('3.14', '--limit')).toThrow(
      '--limit must be a positive integer',
    );
  });

  it('throws on empty string', () => {
    expect(() => parsePositiveInt('', '--limit')).toThrow(
      '--limit must be a positive integer',
    );
  });
});

describe('sleep', () => {
  it('resolves without error for sleep(0)', async () => {
    await expect(sleep(0)).resolves.toBeUndefined();
  });

  it('resolves after the given delay', async () => {
    vi.useFakeTimers();
    const p = sleep(100);
    vi.advanceTimersByTime(100);
    await expect(p).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
