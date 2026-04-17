import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";

interface MiniChartProps {
  symbol: string;
}

interface Candle { o: number; h: number; l: number; c: number; t: number; }

const symbolToBinance = (s: string) => s.replace("/", "").toLowerCase();

const TIMEFRAMES = [
  { label: "1m", interval: "1m" },
  { label: "5m", interval: "5m" },
  { label: "15m", interval: "15m" },
  { label: "1h", interval: "1h" },
  { label: "4h", interval: "4h" },
];

export const MiniChart = ({ symbol }: MiniChartProps) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tf, setTf] = useState("5m");
  const [price, setPrice] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [high24h, setHigh24h] = useState(0);
  const [low24h, setLow24h] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch historical candles
  useEffect(() => {
    const bSym = symbolToBinance(symbol).toUpperCase();
    fetch(`https://api.binance.com/api/v3/klines?symbol=${bSym}&interval=${tf}&limit=60`)
      .then(r => r.json())
      .then((data: any[][]) => {
        if (!Array.isArray(data)) return;
        const parsed = data.map(d => ({
          t: d[0], o: parseFloat(d[1]), h: parseFloat(d[2]),
          l: parseFloat(d[3]), c: parseFloat(d[4]),
        }));
        setCandles(parsed);
      })
      .catch(() => { /* silent */ });
  }, [symbol, tf]);

  // Live ticker WebSocket for 24h stats + last price
  useEffect(() => {
    const bSym = symbolToBinance(symbol);
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${bSym}@ticker`);
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setPrice(parseFloat(d.c));
        setChange24h(parseFloat(d.P));
        setHigh24h(parseFloat(d.h));
        setLow24h(parseFloat(d.l));
        setVolume24h(parseFloat(d.q));
      } catch { /* ignore */ }
    };
    ws.onerror = () => { /* silent */ };
    return () => { try { ws.close(); } catch { /* */ } };
  }, [symbol]);

  // Live kline WebSocket — updates last candle
  useEffect(() => {
    const bSym = symbolToBinance(symbol);
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${bSym}@kline_${tf}`);
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        const k = d.k;
        const newCandle: Candle = {
          t: k.t, o: parseFloat(k.o), h: parseFloat(k.h),
          l: parseFloat(k.l), c: parseFloat(k.c),
        };
        setCandles(prev => {
          if (prev.length === 0) return [newCandle];
          const last = prev[prev.length - 1];
          if (last.t === newCandle.t) {
            return [...prev.slice(0, -1), newCandle];
          }
          return [...prev.slice(-59), newCandle];
        });
      } catch { /* ignore */ }
    };
    ws.onerror = () => { /* silent */ };
    return () => { try { ws.close(); } catch { /* */ } };
  }, [symbol, tf]);

  // Draw candles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const highs = candles.map(c => c.h);
    const lows = candles.map(c => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const range = max - min || 1;
    const padTop = 8, padBot = 8;
    const drawH = H - padTop - padBot;
    const candleW = W / candles.length;
    const bodyW = Math.max(1, candleW * 0.7);

    // Grid lines
    ctx.strokeStyle = "hsl(45 60% 50% / 0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = padTop + (drawH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Candles
    candles.forEach((c, i) => {
      const x = i * candleW + candleW / 2;
      const yHigh = padTop + ((max - c.h) / range) * drawH;
      const yLow = padTop + ((max - c.l) / range) * drawH;
      const yOpen = padTop + ((max - c.o) / range) * drawH;
      const yClose = padTop + ((max - c.c) / range) * drawH;
      const bullish = c.c >= c.o;
      const color = bullish ? "hsl(150 100% 45%)" : "hsl(0 84% 60%)";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh); ctx.lineTo(x, yLow); ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
      ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyHeight);
    });

    // Last price line
    const last = candles[candles.length - 1];
    const yLast = padTop + ((max - last.c) / range) * drawH;
    ctx.strokeStyle = "hsl(45 100% 50% / 0.6)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yLast); ctx.lineTo(W, yLast); ctx.stroke();
    ctx.setLineDash([]);
  }, [candles]);

  const isPositive = change24h >= 0;
  const fmtPrice = (n: number) => n > 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toFixed(4);

  return (
    <div className="panel-luxe overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/15 shrink-0">
        <div className="flex items-center gap-2">
          <Icon3D name="candlestick" size={14} />
          <span className="text-sm font-mono font-bold text-foreground number-mono">{symbol}</span>
          <span className={cn(
            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded number-mono",
            isPositive ? "text-bid bg-bid/10" : "text-ask bg-ask/10"
          )}>
            {isPositive ? "+" : ""}{change24h.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map(t => (
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

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 px-3 py-1.5 border-b border-border/10 shrink-0 text-[9px]">
        <Stat label="LAST" value={fmtPrice(price)} accent={isPositive ? "bid" : "ask"} />
        <Stat label="24H HIGH" value={fmtPrice(high24h)} />
        <Stat label="24H LOW" value={fmtPrice(low24h)} />
        <Stat label="24H VOL" value={`${(volume24h / 1e6).toFixed(1)}M`} accent="gold" />
      </div>

      {/* Chart canvas */}
      <div className="flex-1 relative min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/50">
            Loading chart…
          </div>
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
