import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, Crosshair, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeuralChartProps {
  symbol: string;
}

const TV_SYMBOL_MAP: Record<string, string> = {
  "BTC/USDT": "BINANCE:BTCUSDT", "BTC/USD": "BINANCE:BTCUSDT", "BTCUSD": "BINANCE:BTCUSDT", "BTCUSDT": "BINANCE:BTCUSDT",
  "ETH/USDT": "BINANCE:ETHUSDT", "ETH/USD": "BINANCE:ETHUSDT",
  "SOL/USDT": "BINANCE:SOLUSDT", "SOL/USD": "BINANCE:SOLUSDT",
  "PEPE/USDT": "BINANCE:PEPEUSDT", "DOGE/USDT": "BINANCE:DOGEUSDT", "XRP/USDT": "BINANCE:XRPUSDT",
  "EUR/USD": "FX:EURUSD", "GBP/JPY": "FX:GBPJPY", "USD/JPY": "FX:USDJPY", "GBP/USD": "FX:GBPUSD",
  "XAU/USD": "TVC:GOLD", "WTI/USD": "TVC:USOIL", "US30": "TVC:DJI", "NAS100": "NASDAQ:NDX",
};

export const NeuralChart = ({ symbol }: NeuralChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setChartLoaded(false);

    // Hard fallback: dismiss loading after 8s no matter what so user isn't stuck
    const fallback = setTimeout(() => setChartLoaded(true), 8000);

    // Remove previous widget wrapper if it exists
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

    const initWidget = () => {
      if (!containerRef.current || !widgetRef.current) return;
      try {
        // @ts-ignore
        new TradingView.widget({
          autosize: true,
          symbol: TV_SYMBOL_MAP[symbol] || "BINANCE:BTCUSDT",
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
      } catch (e) {
        console.warn("TradingView widget error:", e);
        setChartLoaded(true); // dismiss loader on error too
      }
    };

    // If the script is already on the page (re-mount), init immediately
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
        script.onerror = () => setChartLoaded(true);
        document.head.appendChild(script);
      }
    }

    return () => {
      clearTimeout(fallback);
      if (widgetRef.current && widgetRef.current.parentNode) {
        try {
          widgetRef.current.parentNode.removeChild(widgetRef.current);
        } catch (e) { /* already removed */ }
      }
      widgetRef.current = null;
    };
  }, [symbol]);

  const trend = symbol.includes("BTC") ? "UPTREND" : symbol.includes("EUR") ? "RANGING" : "DOWNTREND";
  const confidence = symbol.includes("BTC") ? 82 : symbol.includes("EUR") ? 54 : 67;
  const entryZone = symbol.includes("BTC") ? "38.2%" : "61.8%";

  return (
    <div className="h-full flex flex-col bg-background/50 relative">
      {/* AI Overlay */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 border-b border-border/15 bg-muted/10 backdrop-blur-sm z-10 overflow-x-auto scrollbar-none">
        <Brain className="w-3.5 h-3.5 text-[hsl(var(--purple))] shrink-0" />
        <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground/70 shrink-0 hidden sm:inline">NEURAL</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <OverlayStat
            label="TREND"
            value={trend}
            icon={trend === "UPTREND" ? TrendingUp : trend === "DOWNTREND" ? TrendingDown : Minus}
            color={trend === "UPTREND" ? "text-accent" : trend === "DOWNTREND" ? "text-destructive" : "text-[hsl(var(--gold))]"}
          />
          <OverlayStat label="ENTRY" value={entryZone} icon={Crosshair} color="text-primary" />
          <OverlayStat
            label="CONF"
            value={`${confidence}%`}
            icon={Layers}
            color={confidence >= 70 ? "text-accent" : confidence >= 50 ? "text-[hsl(var(--gold))]" : "text-destructive"}
          />
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        {!chartLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-muted-foreground">Loading {symbol}...</span>
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
