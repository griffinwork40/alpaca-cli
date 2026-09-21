/**
 * Alpaca CLI — shared type definitions.
 *
 * Design decisions:
 * - All interfaces are PERMISSIVE: `[key: string]: unknown` + documented optional fields.
 * - Money/decimal fields are `string` — Alpaca returns decimals as strings to preserve precision.
 * - No imports from other src/ modules.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

/** Constructor config for AlpacaClient (does not include isLive). */
export interface AlpacaClientConfig {
  keyId: string;
  secretKey: string;
  /** e.g. https://paper-api.alpaca.markets or https://api.alpaca.markets */
  tradingBaseUrl: string;
  /** Always https://data.alpaca.markets */
  dataBaseUrl: string;
}

/** Full resolved config including the isLive flag. */
export interface AlpacaConfig {
  keyId: string;
  secretKey: string;
  tradingBaseUrl: string;
  dataBaseUrl: string;
  isLive: boolean;
}

// ─── Error class ──────────────────────────────────────────────────────────────

/**
 * Canonical `AlpacaApiError` lives in ./errors.ts. It is re-exported here so
 * that `import { AlpacaApiError } from './types.js'` resolves to the SAME class
 * object — preventing `instanceof` mismatches across modules.
 */
export { AlpacaApiError } from './errors.js';

// ─── Trading API response interfaces ──────────────────────────────────────────

/** Account object — GET /v2/account */
export interface AccountData {
  [key: string]: unknown;
  id?: string;
  account_number?: string;
  status?: string;
  crypto_status?: string;
  currency?: string;
  cash?: string;
  buying_power?: string;
  regt_buying_power?: string;
  daytrading_buying_power?: string;
  non_marginable_buying_power?: string;
  equity?: string;
  last_equity?: string;
  long_market_value?: string;
  short_market_value?: string;
  portfolio_value?: string;
  initial_margin?: string;
  maintenance_margin?: string;
  last_maintenance_margin?: string;
  sma?: string;
  accrued_fees?: string;
  pending_transfer_in?: string;
  pending_transfer_out?: string;
  pattern_day_trader?: boolean;
  trading_blocked?: boolean;
  transfers_blocked?: boolean;
  account_blocked?: boolean;
  trade_suspended_by_user?: boolean;
  shorting_enabled?: boolean;
  multiplier?: string;
  daytrade_count?: number;
  created_at?: string;
  options_buying_power?: string;
  options_approved_level?: number;
  options_trading_level?: number;
}

/** Order object — GET /v2/orders, POST /v2/orders, etc. */
export interface OrderData {
  [key: string]: unknown;
  id?: string;
  client_order_id?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id?: string;
  symbol?: string;
  asset_class?: string;
  notional?: string;
  qty?: string;
  filled_qty?: string;
  filled_avg_price?: string;
  order_class?: string;
  order_type?: string;
  type?: string;
  side?: string;
  time_in_force?: string;
  limit_price?: string;
  stop_price?: string;
  status?: string;
  extended_hours?: boolean;
  legs?: unknown[];
  trail_percent?: string;
  trail_price?: string;
  hwm?: string;
  subtag?: string;
  source?: string;
}

/** Position object — GET /v2/positions */
export interface PositionData {
  [key: string]: unknown;
  asset_id?: string;
  symbol?: string;
  exchange?: string;
  asset_class?: string;
  avg_entry_price?: string;
  qty?: string;
  qty_available?: string;
  side?: string;
  market_value?: string;
  cost_basis?: string;
  unrealized_pl?: string;
  unrealized_plpc?: string;
  unrealized_intraday_pl?: string;
  unrealized_intraday_plpc?: string;
  current_price?: string;
  lastday_price?: string;
  change_today?: string;
}

/** Asset object — GET /v2/assets */
export interface AssetData {
  [key: string]: unknown;
  id?: string;
  class?: string;
  exchange?: string;
  symbol?: string;
  name?: string;
  status?: string;
  tradable?: boolean;
  marginable?: boolean;
  shortable?: boolean;
  easy_to_borrow?: boolean;
  fractionable?: boolean;
  min_order_size?: number | null;
  min_trade_increment?: number | null;
  price_increment?: number | null;
  maintenance_margin_requirement?: number | null;
  attributes?: string[] | null;
}

/** Watchlist object — GET /v2/watchlists */
export interface WatchlistData {
  [key: string]: unknown;
  id?: string;
  account_id?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  assets?: AssetData[] | null;
}

/** Calendar day object — GET /v2/calendar */
export interface CalendarDay {
  [key: string]: unknown;
  date?: string;
  open?: string;
  close?: string;
  session_open?: string;
  session_close?: string;
  settlement_date?: string;
}

/** Market clock — GET /v2/clock */
export interface ClockData {
  [key: string]: unknown;
  timestamp?: string;
  is_open?: boolean;
  next_open?: string;
  next_close?: string;
}

/** Portfolio history — GET /v2/account/portfolio/history */
export interface PortfolioHistoryData {
  [key: string]: unknown;
  timestamp?: number[];
  equity?: number[];
  profit_loss?: number[];
  profit_loss_pct?: (number | null)[];
  base_value?: number | null;
  timeframe?: string;
  cashflow?: Record<string, unknown>;
}

/** Account activity (trade or non-trade) — GET /v2/account/activities */
export interface ActivityData {
  [key: string]: unknown;
  id?: string;
  account_id?: string;
  activity_type?: string;
  // TradeActivity fields
  transaction_time?: string;
  type?: string;
  price?: number;
  qty?: number;
  side?: string;
  symbol?: string;
  leaves_qty?: number;
  order_id?: string;
  cum_qty?: number;
  order_status?: string;
  // NonTradeActivity fields
  date?: string;
  net_amount?: number;
  description?: string;
  status?: string;
  per_share_amount?: number;
}

// ─── Market Data response interfaces ──────────────────────────────────────────

/** OHLCV bar — shared by stocks and crypto */
export interface BarData {
  [key: string]: unknown;
  /** Timestamp — start of the bar interval */
  t?: string;
  /** Open price */
  o?: number;
  /** High price */
  h?: number;
  /** Low price */
  l?: number;
  /** Close price */
  c?: number;
  /** Volume */
  v?: number;
  /** Number of trades within the bar interval */
  n?: number;
  /** Volume-weighted average price */
  vw?: number;
}

/** Quote — stocks (NBBO bid/ask) */
export interface QuoteData {
  [key: string]: unknown;
  t?: string;
  ax?: string;
  ap?: number;
  as?: number;
  bx?: string;
  bp?: number;
  bs?: number;
  c?: unknown[];
  z?: string;
}

/** Trade tick */
export interface TradeData {
  [key: string]: unknown;
  t?: string;
  x?: string;
  p?: number;
  s?: number;
  c?: unknown[];
  i?: number | string;
  z?: string;
  /** Taker side (crypto only) */
  tks?: string;
}

/** Snapshot — latest trade + quote + bars combined */
export interface SnapshotData {
  [key: string]: unknown;
  latestTrade?: TradeData;
  latestQuote?: QuoteData;
  minuteBar?: BarData;
  dailyBar?: BarData;
  prevDailyBar?: BarData;
}

/** News article */
export interface NewsArticle {
  [key: string]: unknown;
  id?: number;
  headline?: string;
  summary?: string;
  content?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  url?: string;
  images?: { size?: string; url?: string }[];
  symbols?: string[];
}
