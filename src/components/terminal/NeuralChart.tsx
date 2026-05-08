import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, Crosshair, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toTradingViewSymbol } from "@/lib/symbols";

interface NeuralChartProps {
  symbol: string;
}

export const NeuralChart = ({ symbol }: NeuralChartProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const tvSymbol = useMemo(() => toTradingViewSymbol(symbol), [symbol]);

  // Use TradingView's embedded widget iframe (no external script required, much more reliable
  // than tv.js which can be blocked by adblockers).
  const src = useMemo(() => {
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval: "60",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_side_toolbar: "0",
      allow_symbol_change: "0",
      save_image: "0",
      studies: "RSI@tv-basicstudies,MACD@tv-basicstudies",
      hide_top_toolbar: "0",
      withdateranges: "1",
      timezone: "Etc/UTC",
      backgroundColor: "rgba(10,10,18,1)",
    });
    // Cache-bust on retry
    if (retryNonce) params.set("_r", String(retryNonce));
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [tvSymbol, retryNonce]);

  useEffect(() => {
    setChartLoaded(false);
    setLoadFailed(false);
    const timer = setTimeout(() => {
      setChartLoaded((loaded) => {
        if (!loaded) setLoadFailed(true);
        return loaded;
      });
    }, 14000);
    return () => clearTimeout(timer);
  }, [src]);

  const trend = symbol.includes("BTC") ? "UPTREND" : symbol.includes("EUR") ? "RANGING" : "DOWNTREND";
  const confidence = symbol.includes("BTC") ? 82 : symbol.includes("EUR") ? 54 : 67;
  const entryZone = symbol.includes("BTC") ? "38.2%" : "61.8%";

  return (
    <div className="h-full flex flex-col bg-background/50 relative">
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 border-b border-border/15 bg-muted/10 backdrop-blur-sm z-10 overflow-x-auto scrollbar-none">
        <Brain className="w-3.5 h-3.5 text-[hsl(var(--purple))] shrink-0" />
        <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 shrink-0 hidden sm:inline">NEURAL</span>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{tvSymbol}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <OverlayStat label="TREND" value={trend}
            icon={trend === "UPTREND" ? TrendingUp : trend === "DOWNTREND" ? TrendingDown : Minus}
            color={trend === "UPTREND" ? "text-accent" : trend === "DOWNTREND" ? "text-destructive" : "text-[hsl(var(--gold))]"} />
          <OverlayStat label="ENTRY" value={entryZone} icon={Crosshair} color="text-primary" />
          <OverlayStat label="CONF" value={`${confidence}%`} icon={Layers}
            color={confidence >= 70 ? "text-accent" : confidence >= 50 ? "text-[hsl(var(--gold))]" : "text-destructive"} />
        </div>
        <button
          onClick={() => setRetryNonce((n) => n + 1)}
          className="ml-1 p-1 rounded hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
          title="Reload chart"
          aria-label="Reload chart"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 relative min-h-0">
        <iframe
          ref={iframeRef}
          key={src}
          src={src}
          title={`TradingView ${tvSymbol}`}
          allow="clipboard-write; fullscreen"
          allowFullScreen
          onLoad={() => { setChartLoaded(true); setLoadFailed(false); }}
          onError={() => setLoadFailed(true)}
          className="w-full h-full border-0 bg-[#0a0a12]"
        />
        {!chartLoaded && !loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-muted-foreground">Loading {symbol}…</span>
            </div>
          </div>
        )}
        {loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-30 p-4">
            <div className="flex flex-col items-center gap-3 text-center max-w-[280px]">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)] flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-[hsl(var(--gold))]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Chart took too long to load</p>
                <p className="text-[10px] text-muted-foreground">TradingView may be blocked by an extension or your network. Disable adblockers or try again.</p>
              </div>
              <button
                onClick={() => setRetryNonce(n => n + 1)}
                className="px-4 py-1.5 rounded-lg border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] text-[10px] font-bold tracking-wider hover:bg-[hsl(var(--gold)/0.2)] transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> RETRY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OverlayStat = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => (
  <div className="flex items-center gap-1">
    <Icon className={cn("w-3 h-3", color)} />
    <span className="text-[9px] text-muted-foreground/60 hidden md:inline">{label}:</span>
    <span className={cn("text-[10px] font-bold", color)}>{value}</span>
  </div>
);
