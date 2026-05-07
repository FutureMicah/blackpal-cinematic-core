import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, Crosshair, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toTradingViewSymbol } from "@/lib/symbols";

interface NeuralChartProps {
  symbol: string;
}

export const NeuralChart = ({ symbol }: NeuralChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setChartLoaded(false);
    setLoadFailed(false);

    // Hard fallback: surface failure UI after 12s so user can retry
    const fallback = setTimeout(() => {
      if (!chartLoaded) setLoadFailed(true);
    }, 12000);

    if (widgetRef.current && widgetRef.current.parentNode) {
      widgetRef.current.parentNode.removeChild(widgetRef.current);
    }

    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    widgetRef.current = wrapper;
    container.appendChild(wrapper);

    const tvDiv = document.createElement("div");
    tvDiv.id = `tv-chart-${Date.now()}`;
    tvDiv.style.width = "100%";
    tvDiv.style.height = "100%";
    wrapper.appendChild(tvDiv);

    const tvSymbol = toTradingViewSymbol(symbol);

    const initWidget = () => {
      if (!containerRef.current || !widgetRef.current) return;
      try {
        // @ts-ignore
        new TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0a0a12",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: tvDiv.id,
          backgroundColor: "rgba(10, 10, 18, 1)",
          gridColor: "rgba(40, 40, 60, 0.3)",
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "MASimple@tv-basicstudies"],
          loading_screen: { backgroundColor: "#0a0a12" },
          allow_symbol_change: false,
          details: true,
          hotlist: false,
          calendar: false,
        });
        setChartLoaded(true);
        setLoadFailed(false);
      } catch (e) {
        console.warn("[chart-health] tradingview_init_error", { symbol: tvSymbol, err: String(e) });
        setLoadFailed(true);
      }
    };

    // @ts-ignore
    if (typeof TradingView !== "undefined" && (window as any).TradingView?.widget) {
      initWidget();
    } else {
      const existing = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", initWidget, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = initWidget;
        script.onerror = () => {
          console.warn("[chart-health] tradingview_script_failed", { symbol: tvSymbol });
          setLoadFailed(true);
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      clearTimeout(fallback);
      if (widgetRef.current && widgetRef.current.parentNode) {
        try { widgetRef.current.parentNode.removeChild(widgetRef.current); } catch { /* noop */ }
      }
      widgetRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, retryNonce]);

  const trend = symbol.includes("BTC") ? "UPTREND" : symbol.includes("EUR") ? "RANGING" : "DOWNTREND";
  const confidence = symbol.includes("BTC") ? 82 : symbol.includes("EUR") ? 54 : 67;
  const entryZone = symbol.includes("BTC") ? "38.2%" : "61.8%";

  return (
    <div className="h-full flex flex-col bg-background/50 relative">
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 border-b border-border/15 bg-muted/10 backdrop-blur-sm z-10 overflow-x-auto scrollbar-none">
        <Brain className="w-3.5 h-3.5 text-[hsl(var(--purple))] shrink-0" />
        <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 shrink-0 hidden sm:inline">NEURAL</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <OverlayStat label="TREND" value={trend}
            icon={trend === "UPTREND" ? TrendingUp : trend === "DOWNTREND" ? TrendingDown : Minus}
            color={trend === "UPTREND" ? "text-accent" : trend === "DOWNTREND" ? "text-destructive" : "text-[hsl(var(--gold))]"} />
          <OverlayStat label="ENTRY" value={entryZone} icon={Crosshair} color="text-primary" />
          <OverlayStat label="CONF" value={`${confidence}%`} icon={Layers}
            color={confidence >= 70 ? "text-accent" : confidence >= 50 ? "text-[hsl(var(--gold))]" : "text-destructive"} />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative min-h-0">
        {!chartLoaded && !loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-muted-foreground">Loading {symbol}…</span>
            </div>
          </div>
        )}
        {loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-30 p-4">
            <div className="flex flex-col items-center gap-3 text-center max-w-[260px]">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)] flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-[hsl(var(--gold))]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Chart took too long to load</p>
                <p className="text-[10px] text-muted-foreground">TradingView may be blocked or slow. Try again or check your network.</p>
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
