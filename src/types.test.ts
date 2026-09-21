import { describe, it, expect } from 'vitest';
import {
  AlpacaApiError,
  type AccountData,
  type OrderData,
  type PositionData,
  type BarData,
} from './types.js';

describe('AlpacaApiError', () => {
  it('is an instanceof Error', () => {
    const err = new AlpacaApiError('test message', 403);
    expect(err).toBeInstanceOf(Error);
  });

  it('has name === "AlpacaApiError"', () => {
    const err = new AlpacaApiError('test message', 403);
    expect(err.name).toBe('AlpacaApiError');
  });

  it('preserves the message', () => {
    const err = new AlpacaApiError('insufficient buying power', 40310000);
    expect(err.message).toBe('insufficient buying power');
  });

  it('stores the numeric code', () => {
    const err = new AlpacaApiError('unauthorized', 40110000);
    expect(err.code).toBe(40110000);
  });

  it('code is readonly (TypeScript enforced at compile time)', () => {
    const err = new AlpacaApiError('test', 404);
    // Just verify it exists; TypeScript will catch assignment attempts
    expect(typeof err.code).toBe('number');
  });
});

describe('AccountData interface', () => {
  it('accepts an account response object with optional fields present', () => {
    const account: AccountData = {
      id: 'abc123',
      account_number: 'PA123456',
      status: 'ACTIVE',
      currency: 'USD',
      cash: '10000.00',
      buying_power: '20000.00',
      equity: '25000.00',
      portfolio_value: '25000.00',
      pattern_day_trader: false,
      trading_blocked: false,
      daytrade_count: 0,
      created_at: '2024-01-01T00:00:00Z',
    };
    expect(account.status).toBe('ACTIVE');
    expect(account.cash).toBe('10000.00');
  });

  it('accepts an empty AccountData (all fields optional)', () => {
    const account: AccountData = {};
    expect(account).toEqual({});
  });

  it('accepts extra unknown fields via index signature', () => {
    const account: AccountData = {
      some_future_field: 'value',
      another_field: 42,
    };
    expect(account['some_future_field']).toBe('value');
  });
});

describe('OrderData interface', () => {
  it('accepts an order with only required fields (all optional)', () => {
    const order: OrderData = {
      id: 'order-uuid-123',
      symbol: 'AAPL',
      qty: '10',
      side: 'buy',
      type: 'market',
      status: 'filled',
    };
    expect(order.symbol).toBe('AAPL');
    expect(order.side).toBe('buy');
  });

  it('accepts an order with minimal fields', () => {
    const order: OrderData = {};
    expect(order).toEqual({});
  });
});

describe('PositionData interface', () => {
  it('satisfies PositionData interface with position fields', () => {
    const position: PositionData = {
      asset_id: 'asset-uuid',
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      asset_class: 'us_equity',
      avg_entry_price: '150.00',
      qty: '10',
      side: 'long',
      market_value: '1600.00',
      cost_basis: '1500.00',
      unrealized_pl: '100.00',
      unrealized_plpc: '0.0667',
      current_price: '160.00',
    };
    expect(position.symbol).toBe('AAPL');
    expect(position.unrealized_pl).toBe('100.00');
  });
});

describe('BarData interface', () => {
  it('satisfies BarData with all OHLCV fields', () => {
    const bar: BarData = {
      t: '2024-01-03T05:00:00Z',
      o: 184.15,
      h: 185.88,
      l: 183.43,
      c: 185.52,
      v: 71054600,
      n: 524110,
      vw: 184.916,
    };
    expect(bar.o).toBe(184.15);
    expect(bar.h).toBe(185.88);
    expect(bar.l).toBe(183.43);
    expect(bar.c).toBe(185.52);
    expect(bar.v).toBe(71054600);
    expect(bar.n).toBe(524110);
    expect(bar.vw).toBe(184.916);
  });

  it('accepts minimal bar (all fields optional)', () => {
    const bar: BarData = {};
    expect(bar).toEqual({});
  });
});
