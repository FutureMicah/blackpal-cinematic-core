/**
 * Integration tests for MiniChart — verifies the WS/REST/CACHE status pill
 * reflects the active transport when assets are switched and the live
 * WebSocket connection changes state.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { MiniChart } from "./MiniChart";

// ── Mock WebSocket ────────────────────────────────────────────────────────────
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: ((ev?: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  onclose: ((ev?: any) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  // Test helpers
  open() { this.readyState = 1; this.onopen?.(); }
  fail() { this.onerror?.(); }
  send() {}
}

const sampleKlines = Array.from({ length: 60 }, (_, i) => [
  Date.now() - (60 - i) * 60_000,
  "100", "110", "95", "105", "1000", 0, "0", 0, "0", "0", "0",
]);

const restFetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => sampleKlines,
}));

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as any).WebSocket = MockWebSocket as unknown as typeof WebSocket;
  (globalThis as any).fetch = restFetch;
  restFetch.mockClear();
  // jsdom canvas stub
  HTMLCanvasElement.prototype.getContext = (() => ({
    setTransform: () => {}, clearRect: () => {}, beginPath: () => {},
    moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fillRect: () => {},
  })) as any;
  // ResizeObserver stub
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
  window.localStorage.clear();
});

afterEach(() => { cleanup(); vi.useRealTimers(); });

const pill = () => screen.getByTestId("chart-status-pill");

describe("MiniChart status pill — transport transitions", () => {
  it("starts in REST while polling Binance for the initial pair", async () => {
    render(<MiniChart symbol="BTC/USDT" />);
    await waitFor(() => expect(restFetch).toHaveBeenCalled());
    expect(pill().getAttribute("data-transport")).toBe("rest");
    expect(pill().textContent).toContain("REST");
  });

  it("flips to WS once the WebSocket opens and pushes a ticker message", async () => {
    render(<MiniChart symbol="BTC/USDT" />);
    await waitFor(() => expect(MockWebSocket.instances.length).toBeGreaterThan(0));
    const ticker = MockWebSocket.instances.find((w) => w.url.includes("@ticker"))!;
    expect(ticker).toBeDefined();
    await act(async () => {
      ticker.open();
      ticker.onmessage?.({ data: JSON.stringify({ c: "100", P: "1.2", h: "110", l: "95", q: "1000" }) });
    });
    await waitFor(() => expect(pill().getAttribute("data-transport")).toBe("ws"));
    expect(pill().textContent).toContain("WS");
  });

  it("falls back to CACHE pill when the ticker socket errors out", async () => {
    render(<MiniChart symbol="ETH/USDT" />);
    await waitFor(() => expect(MockWebSocket.instances.length).toBeGreaterThan(0));
    const ticker = MockWebSocket.instances.find((w) => w.url.includes("@ticker"))!;
    await act(async () => { ticker.fail(); });
    await waitFor(() => expect(pill().getAttribute("data-transport")).toBe("fallback"));
    expect(pill().textContent).toContain("CACHE");
  });

  it("resets the pill back to REST when the user switches to a new asset", async () => {
    const { rerender } = render(<MiniChart symbol="BTC/USDT" />);
    await waitFor(() => expect(MockWebSocket.instances.length).toBeGreaterThan(0));
    const ticker = MockWebSocket.instances.find((w) => w.url.includes("@ticker"))!;
    await act(async () => {
      ticker.open();
      ticker.onmessage?.({ data: JSON.stringify({ c: "1", P: "0", h: "1", l: "1", q: "1" }) });
    });
    await waitFor(() => expect(pill().getAttribute("data-transport")).toBe("ws"));

    // Switch asset — old sockets close, new REST poll starts
    restFetch.mockClear();
    rerender(<MiniChart symbol="SOL/USDT" />);
    await waitFor(() => expect(restFetch).toHaveBeenCalled());
    expect(pill().getAttribute("data-transport")).toBe("rest");
  });

  it("shows the unsupported pair fallback CTA for an unresolvable symbol", async () => {
    render(<MiniChart symbol="FOO/BAR" />);
    await waitFor(() => expect(screen.getByTestId("chart-empty-state")).toBeInTheDocument());
    expect(screen.getByText(/Unsupported pair/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /BTC\/USDT/i })).toBeInTheDocument();
  });
});
