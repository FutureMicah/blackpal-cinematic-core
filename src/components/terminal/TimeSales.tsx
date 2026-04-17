import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";

interface TimeSalesProps {
  symbol: string;
}

interface Trade {
  id: number;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean; // true = sell aggression, false = buy aggression
}

const symbolToBinance = (s: string) => s.replace("/", "").toLowerCase();

export const TimeSales = ({ symbol }: TimeSalesProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
  const idRef = useRef(0);

  useEffect(() => {
    setTrades([]);
    const bSym = symbolToBinance(symbol);
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${bSym}@trade`);

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        const t: Trade = {
          id: idRef.current++,
          price: parseFloat(d.p),
          qty: parseFloat(d.q),
          time: d.T,
          isBuyerMaker: d.m,
        };
        setTrades(prev => [t, ...prev].slice(0, 40));
      } catch { /* ignore */ }
    };
    ws.onerror = () => { /* silent */ };

    return () => { try { ws.close(); } catch { /* */ } };
  }, [symbol]);

  const fmtPrice = (n: number) => n > 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toFixed(4);
  const fmtSize = (n: number) => n < 1 ? n.toFixed(4) : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const fmtTime = (t: number) => {
    const d = new Date(t);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  const filtered = trades.filter(t => {
    if (filter === "buy") return !t.isBuyerMaker;
    if (filter === "sell") return t.isBuyerMaker;
    return true;
  });

  // Highlight large prints (> avg size * 3)
  const avgSize = trades.length ? trades.reduce((a, b) => a + b.qty, 0) / trades.length : 0;

  return (
    <div className="h-full flex flex-col panel-luxe overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/15 shrink-0">
        <div className="flex items-center gap-2">
          <Icon3D name="trade" size={14} />
          <span className="text-[10px] font-bold tracking-[0.18em] gold-shimmer">TIME &amp; SALES</span>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "buy", "sell"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-mono uppercase transition-all",
                filter === f
                  ? f === "buy" ? "bg-bid/15 text-bid border border-bid/30"
                  : f === "sell" ? "bg-ask/15 text-ask border border-ask/30"
                  : "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]"
                  : "text-muted-foreground/50 hover:text-muted-foreground border border-transparent"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] font-semibold tracking-wider text-muted-foreground/60 border-b border-border/10 shrink-0">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TIME</span>
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-center text-[10px] text-muted-foreground/50">Awaiting trades…</div>
        ) : filtered.map((t) => {
          const isBuy = !t.isBuyerMaker;
          const isLarge = t.qty > avgSize * 3;
          return (
            <div
              key={t.id}
              className={cn(
                "relative grid grid-cols-3 px-3 py-[3px] text-[10px] font-mono number-mono group transition-colors",
                isBuy ? "hover:bg-bid/5" : "hover:bg-ask/5",
                isLarge && (isBuy ? "bg-bid/10" : "bg-ask/10")
              )}
            >
              {isLarge && (
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-0.5",
                  isBuy ? "bg-bid shadow-[0_0_4px_hsl(var(--bid))]" : "bg-ask shadow-[0_0_4px_hsl(var(--ask))]"
                )} />
              )}
              <span className={cn("text-left", isBuy ? "text-bid" : "text-ask")}>{fmtPrice(t.price)}</span>
              <span className={cn(
                "text-right",
                isLarge ? "font-bold text-foreground" : "text-foreground/70"
              )}>{fmtSize(t.qty)}</span>
              <span className="text-right text-muted-foreground/60">{fmtTime(t.time)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
