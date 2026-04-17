import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { Slider } from "@/components/ui/slider";
import { Loader2, X, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface Position {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  size: number;
  lots?: number;
  leverage: number;
  trailing_stop_pips?: number;
  remaining_pct: number;
  unrealized_pnl: number;
  opened_at: number;
}

interface PositionsPanelProps {
  onPositionClosed?: () => void;
}

export const PositionsPanel = ({ onPositionClosed }: PositionsPanelProps) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closePcts, setClosePcts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", session.user.id)
      .in("activity_type", ["trade_executed", "trade_closed"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) { setLoading(false); return; }

    // Build open positions: trades minus the cumulative close % per trade
    const opens = new Map<string, Position>();
    const closeMap = new Map<string, number>();

    // pass 1: collect closes
    for (const a of data) {
      const meta = (a.metadata as any) || {};
      if (a.activity_type === "trade_closed" && meta.original_trade_id) {
        closeMap.set(meta.original_trade_id, (closeMap.get(meta.original_trade_id) || 0) + (meta.close_pct || 0));
      }
    }

    // pass 2: build open positions
    for (const a of data) {
      const meta = (a.metadata as any) || {};
      if (a.activity_type !== "trade_executed") continue;
      const closedPct = closeMap.get(a.id) || 0;
      if (closedPct >= 100) continue;
      // simulate unrealized pnl: random-ish based on time
      const ageMin = (Date.now() - new Date(a.created_at!).getTime()) / 60000;
      const drift = Math.sin(ageMin / 7) * (meta.size || 0) * 0.04 * (meta.leverage || 1);
      opens.set(a.id, {
        id: a.id,
        symbol: meta.symbol || "—",
        side: (meta.side || "buy").toUpperCase(),
        size: meta.size || 0,
        lots: meta.lots,
        leverage: meta.leverage || 1,
        trailing_stop_pips: meta.trailing_stop_pips,
        remaining_pct: 100 - closedPct,
        unrealized_pnl: drift,
        opened_at: new Date(a.created_at!).getTime(),
      });
    }

    setPositions(Array.from(opens.values()).slice(0, 12));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const closePosition = async (pos: Position, pct: number) => {
    if (pct <= 0) { toast.error("Pick a close percentage"); return; }
    setClosingId(pos.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const portionSize = pos.size * (pct / 100) * (pos.remaining_pct / 100);
      const realized = pos.unrealized_pnl * (pct / 100);
      const refund = portionSize + realized;

      const { error } = await supabase.rpc("update_wallet_balance", {
        p_user_id: session.user.id,
        p_token_symbol: "BTK",
        p_amount: refund,
        p_transaction_type: realized >= 0 ? "trade_close_profit" : "trade_close_loss",
        p_description: `Close ${pct}% ${pos.side} ${pos.symbol} — PnL ${realized.toFixed(2)} BTK`,
      });

      if (error) { toast.error(error.message || "Close failed"); return; }

      await supabase.from("user_activities").insert({
        user_id: session.user.id,
        activity_type: "trade_closed",
        title: `CLOSE ${pct}% ${pos.symbol}`,
        description: `Realized PnL: ${realized.toFixed(2)} BTK`,
        metadata: {
          symbol: pos.symbol, side: pos.side, original_trade_id: pos.id,
          close_pct: pct, realized_pnl: realized, leverage: pos.leverage,
        },
      });

      toast.success(`Closed ${pct}% — ${realized >= 0 ? "+" : ""}${realized.toFixed(2)} BTK`);
      onPositionClosed?.();
      await load();
    } catch (err: any) {
      toast.error(err.message || "Close failed");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col panel-luxe overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/15">
        <div className="flex items-center gap-2">
          <Icon3D name="trade" size={14} />
          <span className="text-[10px] font-bold tracking-[0.18em] gold-shimmer">OPEN POSITIONS</span>
          <span className="text-[9px] text-muted-foreground font-mono">({positions.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-1">
            <p className="text-[10px] text-muted-foreground/60">No open positions</p>
            <p className="text-[9px] text-muted-foreground/40">Execute a trade to begin</p>
          </div>
        ) : positions.map(pos => {
          const closePct = closePcts[pos.id] || 25;
          const isProfit = pos.unrealized_pnl >= 0;
          return (
            <div key={pos.id} className="rounded-xl bg-surface-2/50 border border-border/15 p-2.5 space-y-2 hover:border-[hsl(var(--gold)/0.2)] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded",
                      pos.side === "BUY" ? "bg-bid/15 text-bid" : "bg-ask/15 text-ask"
                    )}>
                      {pos.side === "BUY" ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                      {pos.side}
                    </span>
                    <span className="text-[11px] font-bold">{pos.symbol}</span>
                    <span className="text-[9px] text-[hsl(var(--gold))] font-mono">{pos.leverage}x</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                    {pos.lots ? `${pos.lots} lots` : `${pos.size} BTK`} · {pos.remaining_pct}% open
                    {pos.trailing_stop_pips && <span className="text-[hsl(var(--gold))] ml-1">· TSL {pos.trailing_stop_pips}p</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xs font-mono font-bold number-mono", isProfit ? "text-bid" : "text-ask")}>
                    {isProfit ? "+" : ""}{pos.unrealized_pnl.toFixed(2)}
                  </p>
                  <p className="text-[8px] text-muted-foreground/60">BTK</p>
                </div>
              </div>

              {/* Partial close controls */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[25, 50, 75, 100].map(p => (
                    <button
                      key={p}
                      onClick={() => setClosePcts(c => ({ ...c, [pos.id]: p }))}
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold transition-all",
                        closePct === p
                          ? "bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]"
                          : "bg-muted/30 text-muted-foreground/60 border border-transparent hover:bg-muted/50"
                      )}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => closePosition(pos, closePct)}
                  disabled={closingId === pos.id}
                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 hover:bg-destructive/25 text-destructive text-[9px] font-bold transition-all disabled:opacity-50"
                >
                  {closingId === pos.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  CLOSE {closePct}%
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
