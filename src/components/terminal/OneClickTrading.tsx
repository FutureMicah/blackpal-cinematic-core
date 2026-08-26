import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OneClickTradingProps {
  symbol: string;
  btkBalance: number;
  onTradeExecuted?: () => void;
  maxLeverage?: number;
  tradingBlocked?: boolean;
  blockedReason?: string;
}

const LOT_PRESETS = [0.01, 0.05, 0.1, 0.5, 1.0];
const RISK_PRESETS = [1, 2, 3, 5];

export const OneClickTrading = ({ symbol, btkBalance, onTradeExecuted, maxLeverage = 200, tradingBlocked = false, blockedReason }: OneClickTradingProps) => {
  const [enabled, setEnabled] = useState(false);
  const [lot, setLot] = useState(0.1);
  const [riskPct, setRiskPct] = useState(2);
  const [leverage, setLeverage] = useState([10]);
  const [executing, setExecuting] = useState<"buy" | "sell" | null>(null);

  const tradeSize = lot * 1000;
  const riskAmount = (btkBalance * riskPct / 100).toFixed(0);

  const quickTrade = async (side: "buy" | "sell") => {
    if (tradingBlocked) {
      toast.error(blockedReason || "Trading is locked on this account");
      return;
    }
    if (leverage[0] > maxLeverage) {
      toast.error(`Account leverage cap is ${maxLeverage}x`);
      return;
    }
    if (!enabled) {
      toast.error("Enable one-click trading first");
      return;
    }
    if (tradeSize > btkBalance) {
      toast.error("Insufficient balance");
      return;
    }
    setExecuting(side);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const { error } = await supabase.rpc("update_wallet_balance", {
        p_user_id: session.user.id,
        p_token_symbol: "BTK",
        p_amount: -tradeSize,
        p_transaction_type: "trade_open",
        p_description: `⚡ ${side.toUpperCase()} ${symbol} — ${lot} lots @ ${leverage[0]}x (1-click)`,
      });

      if (error) { toast.error(error.message || "Trade failed"); return; }

      await supabase.from("user_activities").insert({
        user_id: session.user.id,
        activity_type: "trade_executed",
        title: `${side.toUpperCase()} ${symbol}`,
        description: `⚡ One-click: ${lot} lots @ ${leverage[0]}x`,
        metadata: {
          symbol, side, mode: "one_click",
          size: tradeSize, lots: lot,
          leverage: leverage[0], risk_percent: riskPct,
        },
      });

      toast.success(`⚡ ${side.toUpperCase()} ${symbol} — ${lot} lots executed`);
      onTradeExecuted?.();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-muted/10 border border-border/15 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon3D name="quicktrade" size={18} />
          <span className="text-[10px] font-bold tracking-[0.15em] text-foreground">ONE-CLICK TRADE</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "w-10 h-5 rounded-full transition-all relative",
            enabled ? "bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.4)]" : "bg-muted/30"
          )}
        >
          <div className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
            enabled ? "left-[22px]" : "left-0.5"
          )} />
        </button>
      </div>

      {tradingBlocked && (
        <p className="text-[9px] font-bold tracking-wider text-destructive">{blockedReason || "TRADING LOCKED"}</p>
      )}

      {enabled && (
        <>
          {/* Lot presets */}
          <div>
            <label className="text-[9px] text-muted-foreground/60 font-semibold tracking-wider block mb-1">LOT SIZE</label>
            <div className="flex gap-1">
              {LOT_PRESETS.map(l => (
                <button
                  key={l}
                  onClick={() => setLot(l)}
                  className={cn(
                    "flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-all border",
                    lot === l
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted/20 text-muted-foreground/60 border-transparent hover:bg-muted/40"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Risk presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] text-muted-foreground/60 font-semibold tracking-wider">RISK</label>
              <span className="text-[9px] font-mono text-accent">{riskAmount} BTK</span>
            </div>
            <div className="flex gap-1">
              {RISK_PRESETS.map(r => (
                <button
                  key={r}
                  onClick={() => setRiskPct(r)}
                  className={cn(
                    "flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-all border",
                    riskPct === r
                      ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.3)]"
                      : "bg-muted/20 text-muted-foreground/60 border-transparent hover:bg-muted/40"
                  )}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Leverage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] text-muted-foreground/60 font-semibold tracking-wider">LEVERAGE</label>
              <span className="text-[9px] font-mono text-[hsl(var(--gold))] font-bold">{leverage[0]}x</span>
            </div>
            <Slider value={leverage} onValueChange={v => setLeverage([Math.min(v[0], maxLeverage)])} min={1} max={maxLeverage} step={1} className="py-0.5" />
          </div>

          {/* BUY / SELL */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickTrade("buy")}
              disabled={!!executing || tradingBlocked}
              className={cn(
                "h-12 rounded-xl bg-accent/90 hover:bg-accent text-accent-foreground font-bold text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)] active:scale-[0.96]",
                (executing || tradingBlocked) && "opacity-50 cursor-not-allowed"
              )}
            >
              {executing === "buy" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "LONG"}
            </button>
            <button
              onClick={() => quickTrade("sell")}
              disabled={!!executing || tradingBlocked}
              className={cn(
                "h-12 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground font-bold text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)] active:scale-[0.96]",
                (executing || tradingBlocked) && "opacity-50 cursor-not-allowed"
              )}
            >
              {executing === "sell" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "SHORT"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
