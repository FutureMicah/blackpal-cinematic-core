/**
 * Centralized symbol resolution for Binance + TradingView across all charts.
 * Handles USD/USDT aliasing and various input formats (BTCUSD, BTC/USD, BTC-USDT, etc.)
 */

const STABLECOIN_QUOTES = ["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "USD"];

export const CRYPTO_BASES = new Set([
  // Majors
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "TRX", "TON", "AVAX",
  // L1 / L2 / popular
  "MATIC", "POL", "DOT", "LTC", "BCH", "LINK", "UNI", "ATOM", "NEAR", "APT",
  "ARB", "OP", "INJ", "SUI", "TIA", "SEI", "STX", "FTM", "EGLD", "ALGO",
  "FLOW", "HBAR", "XLM", "VET", "THETA", "ICP", "FIL", "RNDR", "GRT", "AAVE",
  "MKR", "SNX", "LDO", "CRV", "COMP", "1INCH", "DYDX", "GMX",
  // Memes
  "PEPE", "SHIB", "FLOKI", "WIF", "BONK", "MEME",
  // Gaming / metaverse
  "AXS", "SAND", "MANA", "IMX", "GALA", "APE", "ENS",
]);

export const FOREX_PAIRS = new Set([
  // Majors
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
  // Crosses
  "EURJPY", "GBPJPY", "EURGBP", "AUDJPY", "CHFJPY", "EURCHF", "EURAUD",
  "EURCAD", "EURNZD", "GBPAUD", "GBPCHF", "GBPCAD", "GBPNZD", "AUDCAD",
  "AUDCHF", "AUDNZD", "CADJPY", "CADCHF", "NZDJPY", "NZDCAD", "NZDCHF",
  // Exotics
  "USDMXN", "USDZAR", "USDSGD", "USDHKD", "USDTRY", "USDNOK", "USDSEK",
  "USDPLN", "USDDKK", "USDCNH", "USDINR", "USDTHB",
]);

const COMMODITY_MAP: Record<string, string> = {
  XAUUSD: "TVC:GOLD",
  XAGUSD: "TVC:SILVER",
  WTIUSD: "TVC:USOIL",
  USOIL: "TVC:USOIL",
  UKOIL: "TVC:UKOIL",
  XPTUSD: "TVC:PLATINUM",
  XPDUSD: "TVC:PALLADIUM",
  XCUUSD: "TVC:COPPER",
  NATGAS: "TVC:NATURALGAS",
};

const INDEX_MAP: Record<string, string> = {
  US30: "TVC:DJI",
  NAS100: "NASDAQ:NDX",
  SPX500: "TVC:SPX",
  GER40: "TVC:DAX",
  UK100: "TVC:UKX",
  JPN225: "TVC:NI225",
  FRA40: "TVC:CAC40",
  AUS200: "TVC:AS51",
  HK50: "TVC:HSI",
  ESP35: "TVC:IBC",
};

/** Strip separators and uppercase. "btc/usd" -> "BTCUSD" */
export const normalizeSymbol = (s: string): string =>
  (s || "").replace(/[\/\-_\s:]/g, "").toUpperCase();

/** Returns the Binance trading symbol (e.g. "BTCUSDT") or null if unsupported. */
export const toBinanceSymbol = (input: string): string | null => {
  const sym = normalizeSymbol(input);
  // Already a known base alone (e.g. "BTC") → default to USDT pair
  if (CRYPTO_BASES.has(sym)) return `${sym}USDT`;

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
export const isForex = (input: string): boolean => FOREX_PAIRS.has(normalizeSymbol(input));
