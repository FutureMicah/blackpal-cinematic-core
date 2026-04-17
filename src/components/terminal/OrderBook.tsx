import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";

interface OrderBookProps {
  symbol: string;
  onPriceClick?: (price: string) => void;
}

interface Level {
  price: number;
  size: number;
  total: number;
}

const symbolToBinance = (s: string) => s.replace("/", "").toLowerCase();

export const OrderBook = ({ symbol, onPriceClick }: OrderBookProps) => {
  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);
  const [midPrice, setMidPrice] = useState<number>(0);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [grouping, setGrouping] = useState(0.1);
  const lastMid = useRef(0);

  useEffect(() => {
    const bSym = symbolToBinance(symbol);
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${bSym}@depth20@100ms`);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data.bids || !data.asks) return;

        let bidTotal = 0;
        const newBids: Level[] = data.bids.slice(0, 15).map((b: [string, string]) => {
          const size = parseFloat(b[1]);
          bidTotal += size;
          return { price: parseFloat(b[0]), size, total: bidTotal };
        });

        let askTotal = 0;
        const newAsks: Level[] = data.asks.slice(0, 15).map((a: [string, string]) => {
          const size = parseFloat(a[1]);
          askTotal += size;
          return { price: parseFloat(a[0]), size, total: askTotal };
        });

        setBids(newBids);
        setAsks(newAsks);

        const mid = (newBids[0]?.price + newAsks[0]?.price) / 2;
        if (mid && mid !== lastMid.current) {
          setDirection(mid > lastMid.current ? "up" : "down");
          lastMid.current = mid;
          setMidPrice(mid);
          setTimeout(() => setDirection(null), 600);
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => { /* silent — non-binance pairs will simply show empty */ };

    return () => {
      try { ws.close(); } catch { /* */ }
    };
  }, [symbol]);

  const maxBidTotal = bids[bids.length - 1]?.total || 1;
  const maxAskTotal = asks[asks.length - 1]?.total || 1;
  const spread = asks[0] && bids[0] ? asks[0].price - bids[0].price : 0;
  const spreadPct = midPrice ? (spread / midPrice) * 100 : 0;

  const fmt = (n: number) => {
    if (n === 0) return "—";
    if (n > 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (n > 1) return n.toFixed(4);
    return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  };
  const fmtSize = (n: number) => n < 1 ? n.toFixed(4) : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="h-full flex flex-col panel-luxe overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/15">
        <div className="flex items-center gap-2">
          <Icon3D name="analytics" size={14} />
          <span className="text-[10px] font-bold tracking-[0.18em] gold-shimmer">ORDER BOOK</span>
        </div>
        <div className="flex items-center gap-1">
          {[0.01, 0.1, 1, 10].map(g => (
            <button
              key={g}
              onClick={() => setGrouping(g)}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-mono transition-all",
                grouping === g
                  ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]"
                  : "text-muted-foreground/50 hover:text-muted-foreground border border-transparent"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] font-semibold tracking-wider text-muted-foreground/60 border-b border-border/10">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL</span>
      </div>

      {/* Asks (reversed) */}
      <div className="flex-1 flex flex-col-reverse overflow-hidden">
        <div className="overflow-y-auto scrollbar-none">
          {asks.length === 0 ? (
            <div className="px-3 py-4 text-center text-[10px] text-muted-foreground/50">Awaiting depth data…</div>
          ) : asks.map((lvl, i) => (
            <button
              key={`ask-${i}`}
              onClick={() => onPriceClick?.(String(lvl.price))}
              className="relative w-full grid grid-cols-3 px-3 py-[3px] text-[10px] font-mono number-mono group hover:bg-ask/10 transition-colors"
            >
              <div
                className="absolute right-0 top-0 bottom-0 bg-ask/10"
                style={{ width: `${(lvl.total / maxAskTotal) * 100}%` }}
              />
              <span className="text-ask relative z-10 text-left">{fmt(lvl.price)}</span>
              <span className="text-foreground/80 relative z-10 text-right">{fmtSize(lvl.size)}</span>
              <span className="text-muted-foreground relative z-10 text-right">{fmtSize(lvl.total)}</span>
            </button>
          )).reverse()}
        </div>
      </div>

      {/* Mid-price */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-y border-border/15 bg-surface-2 transition-colors",
        direction === "up" && "price-flash-up",
        direction === "down" && "price-flash-down"
      )}>
        <span className={cn(
          "text-base font-mono font-bold number-mono ticker-glow",
          direction === "up" ? "text-bid" : direction === "down" ? "text-ask" : "text-foreground"
        )}>
          {midPrice ? fmt(midPrice) : "—"}
        </span>
        <div className="text-right">
          <p className="text-[8px] text-muted-foreground/60">SPREAD</p>
          <p className="text-[10px] font-mono text-[hsl(var(--gold))]">{spread.toFixed(4)} ({spreadPct.toFixed(3)}%)</p>
        </div>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {bids.length === 0 ? (
          <div className="px-3 py-4 text-center text-[10px] text-muted-foreground/50">Awaiting depth data…</div>
        ) : bids.map((lvl, i) => (
          <button
            key={`bid-${i}`}
            onClick={() => onPriceClick?.(String(lvl.price))}
            className="relative w-full grid grid-cols-3 px-3 py-[3px] text-[10px] font-mono number-mono group hover:bg-bid/10 transition-colors"
          >
            <div
              className="absolute right-0 top-0 bottom-0 bg-bid/10"
              style={{ width: `${(lvl.total / maxBidTotal) * 100}%` }}
            />
            <span className="text-bid relative z-10 text-left">{fmt(lvl.price)}</span>
            <span className="text-foreground/80 relative z-10 text-right">{fmtSize(lvl.size)}</span>
            <span className="text-muted-foreground relative z-10 text-right">{fmtSize(lvl.total)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
