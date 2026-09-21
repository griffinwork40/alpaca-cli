/**
 * Alpaca CLI — config resolution.
 *
 * Resolves keyId, secretKey, tradingBaseUrl, dataBaseUrl, and isLive from env vars.
 * Throws UsageError (not process.exit) on missing credentials so callers can handle.
 *
 * Import graph: config.ts ← errors.ts (UsageError)
 */

import { UsageError } from './errors.js';
import type { AlpacaConfig } from './types.js';

export type { AlpacaConfig };

/**
 * Resolves the Alpaca API configuration from environment variables.
 *
 * Env var resolution order:
 *   keyId      = APCA_API_KEY_ID    ?? ALPACA_API_KEY_ID
 *   secretKey  = APCA_API_SECRET_KEY ?? ALPACA_API_SECRET_KEY
 *   tradingBaseUrl = APCA_API_BASE_URL ??
 *                    (live ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets')
 *   dataBaseUrl = always 'https://data.alpaca.markets'
 *
 * isLive detection:
 *   - overrides.live === true  → live
 *   - APCA_API_BASE_URL set and its hostname does NOT start with 'paper-' but contains
 *     'api.alpaca.markets' → live
 *   - Otherwise → paper
 *
 * Note: 'api.alpaca.markets' IS a substring of 'paper-api.alpaca.markets', so we must
 * detect live by verifying the host does NOT start with 'paper-'.
 */
export function resolveConfig(overrides?: { live?: boolean }): AlpacaConfig {
  // ── Key ID ──────────────────────────────────────────────────────────────────
  const keyId =
    process.env['APCA_API_KEY_ID'] ?? process.env['ALPACA_API_KEY_ID'];
  if (!keyId) {
    throw new UsageError(
      'Missing required credential: set APCA_API_KEY_ID or ALPACA_API_KEY_ID',
    );
  }

  // ── Secret Key ───────────────────────────────────────────────────────────────
  const secretKey =
    process.env['APCA_API_SECRET_KEY'] ?? process.env['ALPACA_API_SECRET_KEY'];
  if (!secretKey) {
    throw new UsageError(
      'Missing required credential: set APCA_API_SECRET_KEY or ALPACA_API_SECRET_KEY',
    );
  }

  // ── isLive detection ─────────────────────────────────────────────────────────
  // Priority 1: explicit --live flag
  const flagLive = overrides?.live === true;

  // Priority 2: APCA_API_BASE_URL set and points to live host
  const envBaseUrl = process.env['APCA_API_BASE_URL'];
  let envIsLive = false;
  if (envBaseUrl) {
    try {
      const hostname = new URL(envBaseUrl).hostname;
      // 'api.alpaca.markets' is a substring of 'paper-api.alpaca.markets'
      // So detect live by checking: contains 'api.alpaca.markets' AND host does NOT start with 'paper-'
      envIsLive =
        hostname.includes('api.alpaca.markets') && !hostname.startsWith('paper-');
    } catch {
      // Malformed URL — not live
      envIsLive = false;
    }
  }

  const isLive = flagLive || envIsLive;

  // ── Trading base URL ──────────────────────────────────────────────────────────
  const tradingBaseUrl =
    envBaseUrl ??
    (isLive ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets');

  // ── Data base URL ─────────────────────────────────────────────────────────────
  const dataBaseUrl = 'https://data.alpaca.markets';

  return { keyId, secretKey, tradingBaseUrl, dataBaseUrl, isLive };
}
