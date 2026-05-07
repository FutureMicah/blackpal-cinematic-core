import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { toBinanceSymbol, prettySymbol } from "@/lib/symbols";

interface MiniChartProps {
  symbol: string;
}

interface Candle { o: number; h: number; l: number; c: number; t: number; }

const CACHE_PREFIX = "mini-chart-cache:";
const WS_BASE = "wss://stream.binance.com/ws";
const REST_ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/klines",
  "https://api.binance.com/api/v3/klines",
] as const;

const logHealth = (event: string, detail?: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.info(`[chart-health] ${event}`, detail ?? {});
};

const TIMEFRAMES = [
  { label: "1m", interval: "1m" },
  { label: "5m", interval: "5m" },
  { label: "15m", interval: "15m" },
  { label: "1h", interval: "1h" },
  { label: "4h", interval: "4h" },
];

const loadCachedCandles = (key: string): Candle[] => {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveCachedCandles = (key: string, candles: Candle[]) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(candles.slice(-60)));
  } catch {
    // ignore cache failures
  }
};

export const MiniChart = ({ symbol }: MiniChartProps) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tf, setTf] = useState("5m");
  const [price, setPrice] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [high24h, setHigh24h] = useState(0);
  const [low24h, setLow24h] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transport, setTransport] = useState<"live" | "fallback">("live");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const bSym = useMemo(() => toBinanceSymbol(symbol), [symbol]);
  const display = useMemo(() => prettySymbol(symbol), [symbol]);
  const cacheKey = `${CACHE_PREFIX}${bSym ?? "NA"}:${tf}`;

  const [retryNonce, setRetryNonce] = useState(0);
  const wsHealthyRef = useRef(false);

  // REST fetch with exponential backoff and endpoint rotation
  useEffect(() => {
    if (!bSym) {
      setLoadError(`${display} is not available on Binance`);
      setCandles([]);
      return;
    }
    setLoadError(null);
    setTransport("live");
    const cached = typeof window !== "undefined" ? loadCachedCandles(cacheKey) : [];
    if (cached.length) setCandles(cached);

    let cancelled = false;

    const fetchOnce = async (endpoint: string, attempt: number): Promise<Candle[] | null> => {
      const controller = new AbortController();
      const timeoutMs = 5000 + attempt * 2500;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${endpoint}?symbol=${bSym}&interval=${tf}&limit=60`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("EMPTY");
        return data.map((d: any[]) => ({
          t: d[0], o: parseFloat(d[1]), h: parseFloat(d[2]), l: parseFloat(d[3]), c: parseFloat(d[4]),
        }));
      } catch (err) {
        clearTimeout(timer);
        logHealth("rest_fail", { endpoint, symbol: bSym, attempt, err: String(err) });
        return null;
      }
    };

    const fetchCandles = async () => {
      // 4 attempts × 2 endpoints, exponential backoff between attempts
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        for (const endpoint of REST_ENDPOINTS) {
          if (cancelled) return;
          const result = await fetchOnce(endpoint, attempt);
          if (result) {
            setCandles(result);
            saveCachedCandles(cacheKey, result);
            setLoadError(null);
            setTransport("live");
            logHealth("rest_ok", { endpoint, symbol: bSym, attempt });
            return;
          }
        }
        // Exponential backoff with jitter: 600, 1200, 2400, 4800ms
        const delay = 600 * Math.pow(2, attempt) + Math.random() * 250;
        await new Promise((r) => setTimeout(r, delay));
      }
      if (!cancelled) {
        setTransport(wsHealthyRef.current ? "live" : "fallback");
        setLoadError(
          cached.length
            ? "Live feed delayed — showing cached data"
            : "Couldn't reach Binance — tap retry"
        );
      }
    };

    void fetchCandles();
    return () => { cancelled = true; };
  }, [bSym, tf, cacheKey, retryNonce, display]);

  // WebSocket streaming with auto-reconnect and health tracking
  useEffect(() => {
    if (!bSym) return;
    let tickerWs: WebSocket | null = null;
    let klineWs: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;
    let isCancelled = false;

    const scheduleReconnect = () => {
      if (isCancelled || reconnectTimer !== null) return;
      const delay = Math.min(15000, 1500 * Math.pow(1.6, reconnectAttempts++));
      logHealth("ws_reconnect_scheduled", { symbol: bSym, delay, attempts: reconnectAttempts });
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (isCancelled) return;

      tickerWs = new WebSocket(`${WS_BASE}/${bSym.toLowerCase()}@ticker`);
      tickerWs.onopen = () => {
        wsHealthyRef.current = true;
        reconnectAttempts = 0;
        logHealth("ws_open", { stream: "ticker", symbol: bSym });
      };
      tickerWs.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          setPrice(parseFloat(d.c));
          setChange24h(parseFloat(d.P));
          setHigh24h(parseFloat(d.h));
          setLow24h(parseFloat(d.l));
          setVolume24h(parseFloat(d.q));
          setTransport("live");
          setLoadError((prev) => (prev === "Live feed delayed — showing cached data" ? null : prev));
        } catch {
          // ignore
        }
      };
      tickerWs.onerror = () => {
        wsHealthyRef.current = false;
        setTransport("fallback");
        logHealth("ws_error", { stream: "ticker", symbol: bSym });
      };
      tickerWs.onclose = () => {
        wsHealthyRef.current = false;
        scheduleReconnect();
      };

      klineWs = new WebSocket(`${WS_BASE}/${bSym.toLowerCase()}@kline_${tf}`);
      klineWs.onopen = () => logHealth("ws_open", { stream: "kline", symbol: bSym, tf });
      klineWs.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          const k = d.k;
          const newCandle: Candle = {
            t: k.t,
            o: parseFloat(k.o),
            h: parseFloat(k.h),
            l: parseFloat(k.l),
            c: parseFloat(k.c),
          };
          setCandles((prev) => {
            if (prev.length === 0) return [newCandle];
            const last = prev[prev.length - 1];
            const next = last.t === newCandle.t
              ? [...prev.slice(0, -1), newCandle]
              : [...prev.slice(-59), newCandle];
            saveCachedCandles(cacheKey, next);
            return next;
          });
          setTransport("live");
        } catch {
          // ignore
        }
      };
      klineWs.onerror = () => {
        setTransport("fallback");
        logHealth("ws_error", { stream: "kline", symbol: bSym });
      };
      klineWs.onclose = () => scheduleReconnect();
    };

    connect();
    return () => {
      isCancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      try { tickerWs?.close(); } catch { /* noop */ }
      try { klineWs?.close(); } catch { /* noop */ }
    };
  }, [bSym, tf, cacheKey]);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || candles.length === 0) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      const highs = candles.map((c) => c.h);
      const lows = candles.map((c) => c.l);
      const max = Math.max(...highs);
      const min = Math.min(...lows);
      const range = max - min || 1;
      const padTop = 8;
      const padBot = 8;
      const drawH = H - padTop - padBot;
      const candleW = W / candles.length;
      const bodyW = Math.max(1, candleW * 0.7);

      ctx.strokeStyle = "hsl(45 60% 50% / 0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = padTop + (drawH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      candles.forEach((c, i) => {
        const x = i * candleW + candleW / 2;
        const yHigh = padTop + ((max - c.h) / range) * drawH;
        const yLow = padTop + ((max - c.l) / range) * drawH;
        const yOpen = padTop + ((max - c.o) / range) * drawH;
        const yClose = padTop + ((max - c.c) / range) * drawH;
        const bullish = c.c >= c.o;
        const color = bullish ? "hsl(150 100% 45%)" : "hsl(0 84% 60%)";

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        ctx.fillStyle = color;
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
        ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyHeight);
      });

      const last = candles[candles.length - 1];
      const yLast = padTop + ((max - last.c) / range) * drawH;
      ctx.strokeStyle = "hsl(45 100% 50% / 0.6)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, yLast);
      ctx.lineTo(W, yLast);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    draw();
    if (!canvasRef.current) return;
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = new ResizeObserver(draw);
    resizeObserverRef.current.observe(canvasRef.current);
    return () => resizeObserverRef.current?.disconnect();
  }, [candles]);

  const isPositive = change24h >= 0;
  const fmtPrice = (n: number) => n > 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toFixed(4);

  return (
    <div className="panel-luxe overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/15 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Icon3D name="candlestick" size={14} />
          <span className="text-sm font-mono font-bold text-foreground number-mono truncate">{display}</span>
          <span className={cn(
            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded number-mono",
            isPositive ? "text-bid bg-bid/10" : "text-ask bg-ask/10"
          )}>
            {isPositive ? "+" : ""}{change24h.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[9px] font-bold tracking-wider",
            transport === "live" ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--gold))]"
          )}>
            {transport === "live" ? "LIVE" : "CACHE"}
          </span>
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.interval}
                onClick={() => setTf(t.interval)}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-mono transition-all",
                  tf === t.interval
                    ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]"
                    : "text-muted-foreground/50 hover:text-muted-foreground border border-transparent"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-3 py-1.5 border-b border-border/10 shrink-0 text-[9px]">
        <Stat label="LAST" value={fmtPrice(price)} accent={isPositive ? "bid" : "ask"} />
        <Stat label="24H HIGH" value={fmtPrice(high24h)} />
        <Stat label="24H LOW" value={fmtPrice(low24h)} />
        <Stat label="24H VOL" value={`${(volume24h / 1e6).toFixed(1)}M`} accent="gold" />
      </div>

      <div className="flex-1 relative min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-label={`${symbol} price chart`} />
        {candles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] gap-2">
            {loadError ? (
              <>
                <span className="text-[hsl(var(--gold))]">⚠ {loadError}</span>
                <button
                  onClick={() => setRetryNonce((n) => n + 1)}
                  className="px-3 py-1 rounded-lg border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold))] text-[9px] font-bold tracking-wider hover:bg-[hsl(var(--gold)/0.15)] transition-all"
                >
                  RETRY
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground/60">
                <div className="w-3 h-3 border border-[hsl(var(--gold)/0.3)] border-t-[hsl(var(--gold))] rounded-full animate-spin" />
                Loading chart…
              </div>
            )}
          </div>
        )}
        {candles.length > 0 && loadError && (
          <button
            onClick={() => setRetryNonce((n) => n + 1)}
            className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[hsl(var(--gold)/0.12)] border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] text-[8px] font-bold tracking-wider hover:bg-[hsl(var(--gold)/0.2)]"
            aria-label="Retry chart connection"
          >
            ⟳ RETRY
          </button>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: "bid" | "ask" | "gold" }) => (
  <div className="flex flex-col leading-tight min-w-0">
    <span className="text-[8px] text-muted-foreground/50 tracking-wider truncate">{label}</span>
    <span className={cn(
      "font-mono font-bold number-mono truncate",
      accent === "bid" && "text-bid",
      accent === "ask" && "text-ask",
      accent === "gold" && "text-[hsl(var(--gold))]",
      !accent && "text-foreground"
    )}>{value}</span>
  </div>
);
