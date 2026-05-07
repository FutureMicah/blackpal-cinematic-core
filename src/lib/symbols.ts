/**
 * Centralized symbol resolution for Binance + TradingView across all charts.
 * Handles USD/USDT aliasing and various input formats (BTCUSD, BTC/USD, BTC-USDT, etc.)
 */

const STABLECOIN_QUOTES = ["USDT", "USDC", "BUSD", "USD"];

const CRYPTO_BASES = new Set([
  "BTC", "ETH", "SOL", "XRP", "DOGE", "PEPE", "BNB", "ADA", "AVAX", "MATIC",
  "LINK", "DOT", "LTC", "TRX", "SHIB", "ATOM", "NEAR", "APT", "ARB", "OP",
  "INJ", "SUI", "TIA", "RNDR", "FIL", "ICP", "UNI", "AAVE", "MKR", "TON",
]);

const FOREX_PAIRS = new Set([
  "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "AUDUSD", "USDCAD", "USDCHF",
  "NZDUSD", "EURJPY", "EURGBP", "AUDJPY", "CHFJPY", "EURCHF", "EURAUD",
  "GBPAUD", "GBPCHF", "GBPCAD",
]);

const COMMODITY_MAP: Record<string, string> = {
  XAUUSD: "TVC:GOLD",
  XAGUSD: "TVC:SILVER",
  WTIUSD: "TVC:USOIL",
  USOIL: "TVC:USOIL",
  UKOIL: "TVC:UKOIL",
  XPTUSD: "TVC:PLATINUM",
  XPDUSD: "TVC:PALLADIUM",
};

const INDEX_MAP: Record<string, string> = {
  US30: "TVC:DJI",
  NAS100: "NASDAQ:NDX",
  SPX500: "TVC:SPX",
  GER40: "TVC:DAX",
  UK100: "TVC:UKX",
  JPN225: "TVC:NI225",
};

/** Strip separators and uppercase. "btc/usd" -> "BTCUSD" */
export const normalizeSymbol = (s: string): string =>
  (s || "").replace(/[\/\-_\s:]/g, "").toUpperCase();

/** Returns the Binance trading symbol (e.g. "BTCUSDT") or null if unsupported. */
export const toBinanceSymbol = (input: string): string | null => {
  const sym = normalizeSymbol(input);
  for (const quote of STABLECOIN_QUOTES) {
    if (sym.endsWith(quote)) {
      const base = sym.slice(0, -quote.length);
      if (CRYPTO_BASES.has(base)) {
        // Binance uses USDT, not USD, for crypto
        return base + (quote === "USD" ? "USDT" : quote);
      }
    }
  }
  return null;
};

/** Returns the TradingView ticker string (e.g. "BINANCE:BTCUSDT" or "FX:EURUSD"). */
export const toTradingViewSymbol = (input: string): string => {
  const sym = normalizeSymbol(input);
  if (INDEX_MAP[sym]) return INDEX_MAP[sym];
  if (COMMODITY_MAP[sym]) return COMMODITY_MAP[sym];
  if (FOREX_PAIRS.has(sym)) return `FX:${sym}`;
  const binance = toBinanceSymbol(sym);
  if (binance) return `BINANCE:${binance}`;
  return `BINANCE:${sym}`;
};

/** Pretty display form: "BTC/USDT" */
export const prettySymbol = (input: string): string => {
  const sym = normalizeSymbol(input);
  for (const quote of [...STABLECOIN_QUOTES, "JPY", "EUR", "GBP", "CHF", "CAD", "AUD", "NZD"]) {
    if (sym.endsWith(quote) && sym.length > quote.length) {
      return `${sym.slice(0, -quote.length)}/${quote}`;
    }
  }
  return sym;
};

export const isCrypto = (input: string): boolean => toBinanceSymbol(input) !== null;
