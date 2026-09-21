/**
 * Shared utility functions — mirrors hunter-io/src/utils.ts exactly.
 * No imports from other src/ modules.
 */

/**
 * Builds a query-param record suitable for URLSearchParams.
 * Drops undefined and null. Coerces everything else (including '', false, 0) to string.
 */
export function buildQueryParams(
  args: Record<string, string | number | boolean | undefined | null>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;
    result[key] = String(value);
  }
  return result;
}

/**
 * Pretty-prints any value as JSON with 2-space indentation.
 */
export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parses a base-10 integer from a string; throws a user-facing error if invalid or <= 0.
 */
export function parsePositiveInt(value: string, flagName: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n <= 0 || String(n) !== value.trim()) {
    throw new Error(`${flagName} must be a positive integer`);
  }
  return n;
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
