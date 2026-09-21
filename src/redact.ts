/**
 * Credential-redaction utilities.
 *
 * Design decisions (locked):
 * - redactKey(str, key): no-op when key empty or < 4 chars; escapes regex specials.
 * - redactTwo(str, keyId, secretKey): calls redactKey twice (order: keyId first, then secretKey).
 *   When keyId === secretKey, output still has a single [REDACTED] (not double).
 * - safeStringify(data, keyId, secretKey): formatJson then redactTwo.
 */

import { formatJson } from './utils.js';

/**
 * Replaces ALL occurrences of `key` in `str` with `'[REDACTED]'`.
 * No-op when key is empty or shorter than 4 characters.
 * Regex-special characters in the key are escaped before matching.
 */
export function redactKey(str: string, key: string): string {
  if (!key || key.length < 4) return str;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.replace(new RegExp(escaped, 'g'), '[REDACTED]');
}

/**
 * Redacts both `keyId` and `secretKey` from `str`.
 * Applies redactKey sequentially: keyId first, then secretKey.
 * When keyId === secretKey, the result still has a single [REDACTED] per occurrence
 * (second pass is a no-op because the value is already replaced).
 */
export function redactTwo(str: string, keyId: string, secretKey: string): string {
  const after1 = redactKey(str, keyId);
  return redactKey(after1, secretKey);
}

/**
 * JSON-stringifies `data` with 2-space indentation, then redacts both secrets.
 */
export function safeStringify(data: unknown, keyId: string, secretKey: string): string {
  return redactTwo(formatJson(data), keyId, secretKey);
}
