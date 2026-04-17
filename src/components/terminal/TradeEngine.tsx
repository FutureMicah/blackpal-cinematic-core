import { useState } from "react";
import { ArrowUp, ArrowDown, AlertTriangle, Lightbulb, Shield, Zap, Loader2, BarChart3, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BehaviorPanel, type BehaviorWarning } from "./BehaviorEngine";

interface TradeEngineProps {
  symbol: string;
  btkBalance: number;
  onTradeExecuted?: () => void;
  behaviorWarnings?: BehaviorWarning[];
}

type PanelMode = "crypto" | "mt5";
type OrderType = "market" | "limit" | "stop";

const LOT_PRESETS = [0.01, 0.05, 0.1, 0.5, 1.0, 5.0];

export const TradeEngine = ({ symbol, btkBalance, onTradeExecuted, behaviorWarnings = [] }: TradeEngineProps) => {
  const [mode, setMode] = useState<PanelMode>("crypto");
  const [tradeSize, setTradeSize] = useState("500");
  const [lotSize, setLotSize] = useState("0.10");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [riskPercent, setRiskPercent] = useState(2);
  const [leverage, setLeverage] = useState([5]);
  const [slMode, setSlMode] = useState<"auto" | "manual">("auto");
  const [tpMode, setTpMode] = useState<"auto" | "manual">("auto");
  const [slValue, setSlValue] = useState("");
  const [tpValue, setTpValue] = useState("");
  const [slPips, setSlPips] = useState("50");
  const [tpPips, setTpPips] = useState("100");
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingPips, setTrailingPips] = useState("20");
  const [executing, setExecuting] = useState<"buy" | "sell" | null>(null);

  const tradeSizeNum = mode === "crypto" ? (parseFloat(tradeSize) || 0) : (parseFloat(lotSize) || 0) * 1000;
  const riskAmount = (btkBalance * riskPercent) / 100;
  const isRiskHigh = riskPercent > 5;
  const isOversized = tradeSizeNum > btkBalance * 0.3;
  const hasCriticalWarning = behaviorWarnings.some(w => w.severity === "critical");
  const marginRequired = mode === "mt5" ? (tradeSizeNum / leverage[0]).toFixed(0) : null;

  const executeTrade = async (side: "buy" | "sell") => {
    if (tradeSizeNum <= 0 || tradeSizeNum > btkBalance) {
      toast.error("Invalid trade size");
      return;
    }
    if (hasCriticalWarning) {
      toast.error("Trading blocked — resolve critical warnings first");
      return;
    }
    if (orderType !== "market" && !limitPrice) {
      toast.error(`Enter a ${orderType} price`);
      return;
    }

    setExecuting(side);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const { data: walletResult, error: walletErr } = await supabase.rpc("update_wallet_balance", {
        p_user_id: session.user.id,
        p_token_symbol: "BTK",
        p_amount: -tradeSizeNum,
        p_transaction_type: "trade_open",
        p_description: `${side.toUpperCase()} ${symbol} — ${mode === "mt5" ? lotSize + " lots" : tradeSizeNum + " BTK"} @ ${leverage[0]}x`,
      });

      if (walletErr) {
        if (walletErr.message?.includes("Token not found")) {
          toast.error("BTK token not configured. Contact admin.");
        } else {
          toast.error(walletErr.message || "Trade failed");
        }
        return;
      }

      await supabase.from("user_activities").insert({
        user_id: session.user.id,
        activity_type: "trade_executed",
        title: `${side.toUpperCase()} ${symbol}`,
        description: mode === "mt5"
          ? `${lotSize} lots @ ${leverage[0]}x leverage (${orderType})`
          : `${tradeSizeNum} BTK @ ${leverage[0]}x leverage`,
        metadata: {
          symbol, side, mode, order_type: orderType,
          size: tradeSizeNum, lots: mode === "mt5" ? parseFloat(lotSize) : undefined,
          leverage: leverage[0], risk_percent: riskPercent,
          sl_mode: slMode, tp_mode: tpMode,
          sl_pips: mode === "mt5" ? slPips : undefined,
          tp_pips: mode === "mt5" ? tpPips : undefined,
          limit_price: orderType !== "market" ? limitPrice : undefined,
          trailing_stop_pips: trailingEnabled ? parseFloat(trailingPips) : undefined,
        },
      });

      toast.success(`${side.toUpperCase()} ${symbol} — ${mode === "mt5" ? lotSize + " lots" : tradeSizeNum + " BTK"} executed`);
      onTradeExecuted?.();
    } catch (err: any) {
      toast.error(err.message || "Trade execution failed");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/80 backdrop-blur-xl border-l border-border/30">
      {/* Header */}
      <div className="p-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground">TRADE ENGINE</h2>
          <span className="text-[10px] text-muted-foreground">{symbol}</span>
        </div>
        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-muted/20 border border-border/20 p-0.5">
          {(["crypto", "mt5"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all",
                mode === m
                  ? m === "crypto"
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
                    : "bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)] shadow-[0_0_8px_hsl(var(--gold)/0.15)]"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              {m === "crypto" ? <BarChart3 className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
              {m === "crypto" ? "CRYPTO" : "MT5"}
            </button>
          ))}
        </div>
      </div>

      {/* Balance */}
      <div className="mx-3 mt-3 p-3 rounded-xl bg-muted/20 border border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">BTK BALANCE</p>
            <p className="text-lg font-bold font-mono tracking-tight">
              {btkBalance.toLocaleString()} <span className="text-xs text-primary">BTK</span>
            </p>
          </div>
          {mode === "mt5" && marginRequired && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground mb-0.5">MARGIN REQ</p>
              <p className="text-sm font-bold font-mono text-[hsl(var(--gold))]">{marginRequired} BTK</p>
            </div>
          )}
        </div>
      </div>

      {/* Trade Form */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <BehaviorPanel warnings={behaviorWarnings} />

        {/* Order Type (MT5 only) */}
        {mode === "mt5" && (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">ORDER TYPE</label>
            <div className="flex gap-1">
              {(["market", "limit", "stop"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={cn(
                    "flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all",
                    orderType === t
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            {orderType !== "market" && (
              <Input
                type="number"
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                placeholder={`${orderType === "limit" ? "Limit" : "Stop"} price`}
                className="h-8 text-xs font-mono bg-muted/20 border-border/20 mt-1.5"
              />
            )}
          </div>
        )}

        {/* Size Input */}
        {mode === "crypto" ? (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">TRADE SIZE (BTK)</label>
            <Input
              type="number"
              value={tradeSize}
              onChange={e => setTradeSize(e.target.value)}
              className="h-9 text-sm font-mono bg-muted/20 border-border/20"
            />
            <div className="flex gap-1 mt-1.5">
              {[10, 25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  onClick={() => setTradeSize(String(Math.floor(btkBalance * pct / 100)))}
                  className="flex-1 text-[10px] py-1 rounded-md bg-muted/30 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">LOT SIZE</label>
            <Input
              type="number"
              value={lotSize}
              onChange={e => setLotSize(e.target.value)}
              step="0.01"
              min="0.01"
              className="h-9 text-sm font-mono bg-muted/20 border-border/20"
            />
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {LOT_PRESETS.map(lot => (
                <button
                  key={lot}
                  onClick={() => setLotSize(String(lot))}
                  className={cn(
                    "text-[10px] py-1 px-2 rounded-md transition-all border",
                    parseFloat(lotSize) === lot
                      ? "bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.3)]"
                      : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                  )}
                >
                  {lot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Risk */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider">RISK</label>
            <span className={cn("text-[10px] font-mono font-bold", isRiskHigh ? "text-destructive" : "text-accent")}>
              {riskPercent}% ({riskAmount.toFixed(0)} BTK)
            </span>
          </div>
          <Slider value={[riskPercent]} onValueChange={v => setRiskPercent(v[0])} min={0.5} max={10} step={0.5} className="py-1" />
        </div>

        {/* SL / TP */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">STOP LOSS</label>
            {mode === "crypto" ? (
              <>
                <div className="flex gap-1 mb-1.5">
                  {(["auto", "manual"] as const).map(m => (
                    <button key={m} onClick={() => setSlMode(m)} className={cn(
                      "flex-1 text-[10px] py-1 rounded-md transition-all",
                      slMode === m ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-muted/30 text-muted-foreground"
                    )}>{m.toUpperCase()}</button>
                  ))}
                </div>
                {slMode === "manual" && (
                  <Input value={slValue} onChange={e => setSlValue(e.target.value)} placeholder="Price" className="h-7 text-xs font-mono bg-muted/20 border-border/20" />
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={slPips}
                  onChange={e => setSlPips(e.target.value)}
                  className="h-8 text-xs font-mono bg-muted/20 border-border/20"
                />
                <span className="text-[9px] text-muted-foreground shrink-0">pips</span>
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">TAKE PROFIT</label>
            {mode === "crypto" ? (
              <>
                <div className="flex gap-1 mb-1.5">
                  {(["auto", "manual"] as const).map(m => (
                    <button key={m} onClick={() => setTpMode(m)} className={cn(
                      "flex-1 text-[10px] py-1 rounded-md transition-all",
                      tpMode === m ? "bg-accent/20 text-accent border border-accent/30" : "bg-muted/30 text-muted-foreground"
                    )}>{m.toUpperCase()}</button>
                  ))}
                </div>
                {tpMode === "manual" && (
                  <Input value={tpValue} onChange={e => setTpValue(e.target.value)} placeholder="Price" className="h-7 text-xs font-mono bg-muted/20 border-border/20" />
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={tpPips}
                  onChange={e => setTpPips(e.target.value)}
                  className="h-8 text-xs font-mono bg-muted/20 border-border/20"
                />
                <span className="text-[9px] text-muted-foreground shrink-0">pips</span>
              </div>
            )}
          </div>
        </div>

        {/* Leverage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider">LEVERAGE</label>
            <span className="text-[10px] font-mono font-bold text-[hsl(var(--gold))]">{leverage[0]}x</span>
          </div>
          <Slider value={leverage} onValueChange={setLeverage} min={1} max={mode === "mt5" ? 500 : 100} step={1} className="py-1" />
        </div>

        {/* Trailing Stop Loss */}
        <div className="rounded-lg bg-[hsl(var(--gold)/0.05)] border border-[hsl(var(--gold)/0.15)] p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[hsl(var(--gold))]" />
              <span className="text-[10px] font-bold tracking-wider text-[hsl(var(--gold))]">TRAILING STOP</span>
            </div>
            <button
              onClick={() => setTrailingEnabled(!trailingEnabled)}
              className={cn(
                "w-8 h-4 rounded-full transition-all relative",
                trailingEnabled ? "bg-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.5)]" : "bg-muted/40"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                trailingEnabled ? "left-[18px]" : "left-0.5"
              )} />
            </button>
          </div>
          {trailingEnabled && (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={trailingPips}
                onChange={e => setTrailingPips(e.target.value)}
                className="h-7 text-xs font-mono bg-muted/20 border-border/20"
                placeholder="Distance"
              />
              <span className="text-[9px] text-muted-foreground shrink-0 font-mono">{mode === "mt5" ? "pips" : "%"}</span>
            </div>
          )}
        </div>

        {/* Warnings */}
        {(isRiskHigh || isOversized) && (
          <div className="space-y-1.5">
            {isRiskHigh && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                <p className="text-[10px] text-destructive">Risk exceeds 5% — high exposure</p>
              </div>
            )}
            {isOversized && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.2)]">
                <Lightbulb className="w-3.5 h-3.5 text-[hsl(var(--gold))] shrink-0" />
                <p className="text-[10px] text-[hsl(var(--gold))]">Position size &gt;30% of balance</p>
              </div>
            )}
          </div>
        )}

        {/* Smart Suggestion */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--purple)/0.1)] border border-[hsl(var(--purple)/0.15)]">
          <Shield className="w-3.5 h-3.5 text-[hsl(var(--purple))] shrink-0" />
          <p className="text-[10px] text-[hsl(var(--purple))]">
            Suggested: {mode === "mt5" ? "0.10 lots" : `${Math.floor(btkBalance * 0.02)} BTK`} @ 2% risk
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t border-border/20 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => executeTrade("buy")}
            disabled={!!executing || hasCriticalWarning}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent/90 hover:bg-accent text-accent-foreground font-bold text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)] active:scale-[0.97]",
              (executing || hasCriticalWarning) && "opacity-50 cursor-not-allowed"
            )}
          >
            {executing === "buy" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            BUY
          </button>
          <button
            onClick={() => executeTrade("sell")}
            disabled={!!executing || hasCriticalWarning}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground font-bold text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)] active:scale-[0.97]",
              (executing || hasCriticalWarning) && "opacity-50 cursor-not-allowed"
            )}
          >
            {executing === "sell" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDown className="w-4 h-4" />}
            SELL
          </button>
        </div>
      </div>
    </div>
  );
};
