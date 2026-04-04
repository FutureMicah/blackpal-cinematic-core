import { useState } from "react";
import { ArrowUp, ArrowDown, AlertTriangle, Lightbulb, Shield, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TradeEngineProps {
  symbol: string;
  btkBalance: number;
}

export const TradeEngine = ({ symbol, btkBalance }: TradeEngineProps) => {
  const [tradeSize, setTradeSize] = useState("500");
  const [riskPercent, setRiskPercent] = useState(2);
  const [leverage, setLeverage] = useState([5]);
  const [slMode, setSlMode] = useState<"auto" | "manual">("auto");
  const [tpMode, setTpMode] = useState<"auto" | "manual">("auto");
  const [slValue, setSlValue] = useState("");
  const [tpValue, setTpValue] = useState("");

  const tradeSizeNum = parseFloat(tradeSize) || 0;
  const riskAmount = (btkBalance * riskPercent) / 100;
  const isRiskHigh = riskPercent > 5;
  const isOversized = tradeSizeNum > btkBalance * 0.3;

  return (
    <div className="h-full flex flex-col bg-background/80 backdrop-blur-xl border-l border-border/30">
      {/* Header */}
      <div className="p-3 border-b border-border/20">
        <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground mb-1">TRADE ENGINE</h2>
        <p className="text-[10px] text-muted-foreground">{symbol}</p>
      </div>

      {/* Balance */}
      <div className="mx-3 mt-3 p-3 rounded-xl bg-muted/20 border border-border/20">
        <p className="text-[10px] text-muted-foreground mb-0.5">BTK BALANCE</p>
        <p className="text-lg font-bold font-mono tracking-tight">
          {btkBalance.toLocaleString()} <span className="text-xs text-primary">BTK</span>
        </p>
      </div>

      {/* Trade Form */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Trade Size */}
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

        {/* Risk */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider">RISK</label>
            <span className={cn("text-[10px] font-mono font-bold", isRiskHigh ? "text-destructive" : "text-accent")}>
              {riskPercent}% ({riskAmount.toFixed(0)} BTK)
            </span>
          </div>
          <Slider
            value={[riskPercent]}
            onValueChange={v => setRiskPercent(v[0])}
            min={0.5}
            max={10}
            step={0.5}
            className="py-1"
          />
        </div>

        {/* SL / TP */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">STOP LOSS</label>
            <div className="flex gap-1 mb-1.5">
              {(["auto", "manual"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setSlMode(m)}
                  className={cn(
                    "flex-1 text-[10px] py-1 rounded-md transition-all",
                    slMode === m ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-muted/30 text-muted-foreground"
                  )}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            {slMode === "manual" && (
              <Input value={slValue} onChange={e => setSlValue(e.target.value)} placeholder="Price" className="h-7 text-xs font-mono bg-muted/20 border-border/20" />
            )}
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">TAKE PROFIT</label>
            <div className="flex gap-1 mb-1.5">
              {(["auto", "manual"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setTpMode(m)}
                  className={cn(
                    "flex-1 text-[10px] py-1 rounded-md transition-all",
                    tpMode === m ? "bg-accent/20 text-accent border border-accent/30" : "bg-muted/30 text-muted-foreground"
                  )}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            {tpMode === "manual" && (
              <Input value={tpValue} onChange={e => setTpValue(e.target.value)} placeholder="Price" className="h-7 text-xs font-mono bg-muted/20 border-border/20" />
            )}
          </div>
        </div>

        {/* Leverage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider">LEVERAGE</label>
            <span className="text-[10px] font-mono font-bold text-[hsl(var(--gold))]">{leverage[0]}x</span>
          </div>
          <Slider value={leverage} onValueChange={setLeverage} min={1} max={100} step={1} className="py-1" />
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
            Suggested: {Math.floor(btkBalance * 0.02)} BTK @ 2% risk
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t border-border/20 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent/90 hover:bg-accent text-accent-foreground font-bold text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)] active:scale-[0.97]">
            <ArrowUp className="w-4 h-4" />
            BUY
          </button>
          <button className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground font-bold text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)] active:scale-[0.97]">
            <ArrowDown className="w-4 h-4" />
            SELL
          </button>
        </div>
        <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[hsl(var(--purple)/0.15)] hover:bg-[hsl(var(--purple)/0.25)] text-[hsl(var(--purple))] text-xs font-semibold transition-all border border-[hsl(var(--purple)/0.2)]">
          <Zap className="w-3.5 h-3.5" />
          AUTO SNIPER
        </button>
      </div>
    </div>
  );
};
