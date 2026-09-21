/**
 * AlpacaClient — HTTP client for the Alpaca Trading and Market Data APIs.
 *
 * Design decisions (locked):
 * - Two auth headers on every request: APCA-API-KEY-ID and APCA-API-SECRET-KEY.
 * - tradingBase and dataBase are exposed as public readonly strings so commands can
 *   construct full URLs via: `client.tradingBase + '/v2/account'`.
 * - Methods take a FULL URL (callers prepend the base).
 * - delete() accepts optional query params (appended via URLSearchParams + buildQueryParams).
 * - handleResponse:
 *     204                → return null as T
 *     2xx (incl. 207)   → parse JSON safely (.json().catch(→null)), return body or null
 *     non-2xx           → parse { code, message }, redact both secrets, throw AlpacaApiError
 *   A rejected fetch promise propagates as-is (never swallowed).
 */

import type { AlpacaClientConfig } from './types.js';
import { AlpacaApiError } from './errors.js';
import { redactTwo } from './redact.js';
import { buildQueryParams } from './utils.js';

export class AlpacaClient {
  /** Resolved trading base URL (e.g. https://paper-api.alpaca.markets) */
  readonly tradingBase: string;
  /** Resolved data base URL (always https://data.alpaca.markets) */
  readonly dataBase: string;

  private readonly keyId: string;
  private readonly secretKey: string;

  constructor(config: AlpacaClientConfig) {
    this.keyId = config.keyId;
    this.secretKey = config.secretKey;
    this.tradingBase = config.tradingBaseUrl;
    this.dataBase = config.dataBaseUrl;
  }

  // ─── Public HTTP methods ────────────────────────────────────────────────────

  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: this.authHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  async post<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });
    return this.handleResponse<T>(res);
  }

  async patch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> {
    let finalUrl = url;
    if (params) {
      const qs = buildQueryParams(params);
      const queryString = new URLSearchParams(qs).toString();
      if (queryString) {
        finalUrl = `${url}?${queryString}`;
      }
    }

    const res = await fetch(finalUrl, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private authHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.keyId,
      'APCA-API-SECRET-KEY': this.secretKey,
    };
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    // 204 No Content — no body to parse
    if (res.status === 204) {
      return null as T;
    }

    // Parse JSON body safely — catch malformed or empty bodies
    const json = await res.json().catch(() => null) as unknown;

    // 2xx success (including 207 Multi-Status from cancel-all)
    if (res.ok) {
      if (json === null) {
        return null as T;
      }
      return json as T;
    }

    // non-2xx error — extract { code, message } from JSON body
    let errorMessage: string;
    let errorCode: number;

    const errorBody = json as { code?: unknown; message?: unknown } | null;
    const bodyMessage = typeof errorBody?.message === 'string' ? errorBody.message : null;
    const bodyCode =
      typeof errorBody?.code === 'number' ? errorBody.code : null;

    errorMessage = bodyMessage ?? `HTTP ${res.status} ${res.statusText}`;
    errorCode = bodyCode ?? res.status;

    // Redact both secrets before surfacing in the error
    const safeMessage = redactTwo(errorMessage, this.keyId, this.secretKey);

    throw new AlpacaApiError(safeMessage, errorCode);
  }
}
