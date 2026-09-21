/**
 * CLI-level error types.
 *
 * Design:
 * - No imports from other src/ modules (to avoid circular dependencies).
 * - AlpacaApiError is defined here (not in types.ts) to keep types.ts data-only.
 *   types.ts re-exports AlpacaApiError for convenience so both import paths work.
 * - cli.ts owns the single top-level catch that maps each error to an exit code:
 *     UsageError     → exit 1
 *     AlpacaApiError → exit 1
 *     anything else  → exit 1
 */

/**
 * Thrown when required flags/positionals are missing or invalid.
 * Maps to exit code 1 in cli.ts.
 */
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

/**
 * Thrown by AlpacaClient when the API responds with a non-2xx status.
 * Maps to exit code 1 in cli.ts.
 */
export class AlpacaApiError extends Error {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'AlpacaApiError';
    this.code = code;
  }
}
