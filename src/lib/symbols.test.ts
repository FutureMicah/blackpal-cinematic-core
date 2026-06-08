import { describe, it, expect } from "vitest";
import {
  normalizeSymbol,
  toBinanceSymbol,
  toTradingViewSymbol,
  prettySymbol,
  isCrypto,
  isForex,
} from "./symbols";

describe("normalizeSymbol", () => {
  it.each([
    ["btc/usd", "BTCUSD"],
    ["BTC-USDT", "BTCUSDT"],
    ["eth_usdt", "ETHUSDT"],
    [" sol usdt ", "SOLUSDT"],
    ["BINANCE:BTCUSDT", "BINANCEBTCUSDT"],
  ])("normalizes %s -> %s", (input, expected) => {
    expect(normalizeSymbol(input)).toBe(expected);
  });
});

describe("toBinanceSymbol — USD/USDT alias mapping", () => {
  it.each([
    // BTC variants
    ["BTCUSD", "BTCUSDT"],
    ["BTC/USD", "BTCUSDT"],
    ["btc-usd", "BTCUSDT"],
    ["BTC", "BTCUSDT"],
    ["BTCUSDT", "BTCUSDT"],
    ["BTC/USDT", "BTCUSDT"],
    // ETH variants
    ["ETHUSD", "ETHUSDT"],
    ["ETH/USD", "ETHUSDT"],
    ["ETH", "ETHUSDT"],
    // SOL variants
    ["SOLUSD", "SOLUSDT"],
    ["sol/usd", "SOLUSDT"],
    // Other quotes pass through
    ["BTCUSDC", "BTCUSDC"],
    ["ETHFDUSD", "ETHFDUSD"],
    // New additions
    ["TONUSD", "TONUSDT"],
    ["WIFUSD", "WIFUSDT"],
    ["ARBUSDT", "ARBUSDT"],
  ])("%s -> %s", (input, expected) => {
    expect(toBinanceSymbol(input)).toBe(expected);
  });

  it("returns null for non-crypto inputs", () => {
    expect(toBinanceSymbol("EURUSD")).toBeNull();
    expect(toBinanceSymbol("XAUUSD")).toBeNull();
    expect(toBinanceSymbol("UNKNOWN")).toBeNull();
  });
});

describe("toTradingViewSymbol", () => {
  it.each([
    // Crypto USD aliases resolve to Binance USDT pair
    ["BTCUSD", "BINANCE:BTCUSDT"],
    ["BTC/USD", "BINANCE:BTCUSDT"],
    ["ETHUSD", "BINANCE:ETHUSDT"],
    ["SOLUSD", "BINANCE:SOLUSDT"],
    ["DOGE/USD", "BINANCE:DOGEUSDT"],
    // Forex
    ["EURUSD", "FX:EURUSD"],
    ["GBP/JPY", "FX:GBPJPY"],
    ["AUDNZD", "FX:AUDNZD"],
    ["USDMXN", "FX:USDMXN"],
    // Commodities
    ["XAUUSD", "TVC:GOLD"],
    ["XAGUSD", "TVC:SILVER"],
    ["WTIUSD", "TVC:USOIL"],
    // Indices
    ["US30", "TVC:DJI"],
    ["NAS100", "NASDAQ:NDX"],
    ["HK50", "TVC:HSI"],
  ])("%s -> %s", (input, expected) => {
    expect(toTradingViewSymbol(input)).toBe(expected);
  });
});

describe("prettySymbol", () => {
  it("splits base and quote", () => {
    expect(prettySymbol("BTCUSDT")).toBe("BTC/USDT");
    expect(prettySymbol("EURUSD")).toBe("EUR/USD");
    expect(prettySymbol("GBPJPY")).toBe("GBP/JPY");
  });
});

describe("classifiers", () => {
  it("isCrypto / isForex are consistent for USD-aliased crypto", () => {
    expect(isCrypto("BTCUSD")).toBe(true);
    expect(isCrypto("ETH/USD")).toBe(true);
    expect(isCrypto("EURUSD")).toBe(false);
    expect(isForex("EURUSD")).toBe(true);
    expect(isForex("BTCUSD")).toBe(false);
  });
});
