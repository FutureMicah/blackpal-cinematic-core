import { useState } from "react";
import { Crosshair, TrendingUp, TrendingDown, Minus, Zap, Eye, EyeOff, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface SniperSignal {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  trend: "UPTREND" | "DOWNTREND" | "RANGING";
  bos: boolean; // Break of Structure
  fibEntry: number; // Fib retracement level
  entryZone: string;
  sl: string;
  tp1: string;
  tp2: string;
  sessionFilter: "LONDON" | "NY" | "ASIA" | "OVERLAP";
  momentum: number; // -100 to 100
  timestamp: number;
}

// Simulated 1H trend analysis engine
function analyzeAsset(symbol: string): SniperSignal {
  const hash = symbol.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const isBullish = hash % 3 === 0;
  const isBearish = hash % 3 === 1;

  const now = new Date();
  const hour = now.getUTCHours();
  const session: SniperSignal["sessionFilter"] =
    hour >= 0 && hour < 8 ? "ASIA" :
    hour >= 8 && hour < 13 ? "LONDON" :
    hour >= 13 && hour < 17 ? "OVERLAP" : "NY";

  const confidence = 50 + (hash % 40);
  const momentum = isBullish ? 30 + (hash % 50) : isBearish ? -(30 + (hash % 50)) : (hash % 20) - 10;

  return {
    id: symbol,
    symbol,
    direction: isBullish ? "LONG" : isBearish ? "SHORT" : "NEUTRAL",
    confidence,
    trend: isBullish ? "UPTREND" : isBearish ? "DOWNTREND" : "RANGING",
    bos: confidence > 70,
    fibEntry: confidence > 75 ? 38.2 : confidence > 60 ? 50 : 61.8,
    entryZone: confidence > 70 ? "OPTIMAL" : "FAIR",
    sl: isBullish ? "-2.1%" : "+2.1%",
    tp1: isBullish ? "+3.2%" : "-3.2%",
    tp2: isBullish ? "+5.8%" : "-5.8%",
    sessionFilter: session,
    momentum,
    timestamp: Date.now(),
  };
}

interface AutoSniperProps {
  symbol: string;
  onExecuteSignal?: (signal: SniperSignal) => void;
}

export const AutoSniper = ({ symbol, onExecuteSignal }: AutoSniperProps) => {
  const [active, setActive] = useState(false);
  const [riskPct, setRiskPct] = useState([2]);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string[]>(["LONDON", "NY", "OVERLAP"]);

  const signal = analyzeAsset(symbol);

  const toggleSession = (s: string) => {
    setSessionFilter(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const isValidSession = sessionFilter.includes(signal.sessionFilter);
  const isExecutable = signal.confidence >= 65 && signal.bos && isValidSession && signal.direction !== "NEUTRAL";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[hsl(var(--purple))]" />
          <span className="text-xs font-bold tracking-[0.15em] text-muted-foreground">AUTO SNIPER</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActive(!active)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
              active
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-muted/30 text-muted-foreground border border-border/20"
            )}
          >
            {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {active ? "ARMED" : "OFF"}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-border/20 space-y-3 bg-muted/10">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">
              RISK PER TRADE: {riskPct[0]}%
            </label>
            <Slider value={riskPct} onValueChange={setRiskPct} min={0.5} max={5} step={0.5} className="py-1" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wider block mb-1.5">
              SESSION FILTER
            </label>
            <div className="flex gap-1">
              {["ASIA", "LONDON", "NY", "OVERLAP"].map(s => (
                <button
                  key={s}
                  onClick={() => toggleSession(s)}
                  className={cn(
                    "px-2 py-1 text-[10px] rounded-md transition-all",
                    sessionFilter.includes(s)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Strategy: 1H Trend → BOS Confirmation → Fib 38.2% Entry
          </div>
        </div>
      )}

      {/* Signal Analysis */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Trend */}
        <div className="p-3 rounded-xl bg-muted/15 border border-border/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">1H TREND</span>
            <span className={cn(
              "text-[11px] font-bold flex items-center gap-1",
              signal.trend === "UPTREND" ? "text-accent" : signal.trend === "DOWNTREND" ? "text-destructive" : "text-[hsl(var(--gold))]"
            )}>
              {signal.trend === "UPTREND" ? <TrendingUp className="w-3.5 h-3.5" /> :
               signal.trend === "DOWNTREND" ? <TrendingDown className="w-3.5 h-3.5" /> :
               <Minus className="w-3.5 h-3.5" />}
              {signal.trend}
            </span>
          </div>

          {/* BOS */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Break of Structure</span>
            <span className={cn("text-[10px] font-bold", signal.bos ? "text-accent" : "text-muted-foreground")}>
              {signal.bos ? "✓ CONFIRMED" : "— WAITING"}
            </span>
          </div>

          {/* Fib Entry */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Fib Retracement</span>
            <span className={cn(
              "text-[10px] font-bold font-mono",
              signal.fibEntry === 38.2 ? "text-accent" : signal.fibEntry === 50 ? "text-[hsl(var(--gold))]" : "text-muted-foreground"
            )}>
              {signal.fibEntry}%
            </span>
          </div>

          {/* Session */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Session</span>
            <span className={cn(
              "text-[10px] font-bold",
              isValidSession ? "text-primary" : "text-muted-foreground"
            )}>
              {signal.sessionFilter} {isValidSession ? "✓" : "✗"}
            </span>
          </div>
        </div>

        {/* Momentum */}
        <div className="p-3 rounded-xl bg-muted/15 border border-border/15">
          <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">MOMENTUM</span>
          <div className="mt-2 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                signal.momentum > 0 ? "bg-accent" : signal.momentum < 0 ? "bg-destructive" : "bg-muted-foreground"
              )}
              style={{
                width: `${Math.abs(signal.momentum)}%`,
                marginLeft: signal.momentum < 0 ? `${100 - Math.abs(signal.momentum)}%` : 0,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-destructive">BEARISH</span>
            <span className={cn("text-[10px] font-bold font-mono", signal.momentum > 0 ? "text-accent" : "text-destructive")}>
              {signal.momentum > 0 ? "+" : ""}{signal.momentum}
            </span>
            <span className="text-[9px] text-accent">BULLISH</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="p-3 rounded-xl bg-muted/15 border border-border/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">CONFIDENCE</span>
            <span className={cn(
              "text-sm font-bold font-mono",
              signal.confidence >= 75 ? "text-accent" : signal.confidence >= 60 ? "text-[hsl(var(--gold))]" : "text-destructive"
            )}>
              {signal.confidence}%
            </span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                signal.confidence >= 75 ? "bg-accent" : signal.confidence >= 60 ? "bg-[hsl(var(--gold))]" : "bg-destructive"
              )}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>

        {/* Targets */}
        {signal.direction !== "NEUTRAL" && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/15 text-center">
              <p className="text-[9px] text-muted-foreground">SL</p>
              <p className="text-[11px] font-mono font-bold text-destructive">{signal.sl}</p>
            </div>
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/15 text-center">
              <p className="text-[9px] text-muted-foreground">TP1</p>
              <p className="text-[11px] font-mono font-bold text-accent">{signal.tp1}</p>
            </div>
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/15 text-center">
              <p className="text-[9px] text-muted-foreground">TP2</p>
              <p className="text-[11px] font-mono font-bold text-accent">{signal.tp2}</p>
            </div>
          </div>
        )}
      </div>

      {/* Execute Button */}
      <div className="p-3 border-t border-border/20">
        {active && isExecutable ? (
          <button
            onClick={() => onExecuteSignal?.(signal)}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[hsl(var(--purple)/0.2)] hover:bg-[hsl(var(--purple)/0.3)] text-[hsl(var(--purple))] font-bold text-sm transition-all border border-[hsl(var(--purple)/0.3)] hover:shadow-[0_0_20px_hsl(var(--purple)/0.3)]"
          >
            <Zap className="w-4 h-4" />
            EXECUTE SIGNAL
          </button>
        ) : (
          <div className={cn(
            "w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-medium",
            active ? "bg-muted/20 text-muted-foreground" : "bg-muted/10 text-muted-foreground/50"
          )}>
            {!active ? "Sniper is OFF" : !isExecutable ? "Waiting for valid setup..." : "Ready"}
          </div>
        )}
      </div>
    </div>
  );
};
