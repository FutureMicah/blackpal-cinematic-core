import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, Crosshair, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeuralChartProps {
  symbol: string;
}

export const NeuralChart = ({ symbol }: NeuralChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  // Map symbols to TradingView format
  const getTVSymbol = (sym: string): string => {
    const map: Record<string, string> = {
      "BTC/USDT": "BINANCE:BTCUSDT",
      "ETH/USDT": "BINANCE:ETHUSDT",
      "SOL/USDT": "BINANCE:SOLUSDT",
      "PEPE/USDT": "BINANCE:PEPEUSDT",
      "DOGE/USDT": "BINANCE:DOGEUSDT",
      "XRP/USDT": "BINANCE:XRPUSDT",
      "EUR/USD": "FX:EURUSD",
      "GBP/JPY": "FX:GBPJPY",
      "USD/JPY": "FX:USDJPY",
      "GBP/USD": "FX:GBPUSD",
      "XAU/USD": "TVC:GOLD",
      "WTI/USD": "TVC:USOIL",
      "US30": "TVC:DJI",
      "NAS100": "NASDAQ:NDX",
    };
    return map[sym] || "BINANCE:BTCUSDT";
  };

  useEffect(() => {
    if (!containerRef.current) return;
    setChartLoaded(false);
    
    // Clear previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!containerRef.current) return;
      // @ts-ignore
      new TradingView.widget({
        autosize: true,
        symbol: getTVSymbol(symbol),
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
        container_id: "tv-chart-container",
        backgroundColor: "rgba(10, 10, 18, 1)",
        gridColor: "rgba(40, 40, 60, 0.3)",
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        loading_screen: { backgroundColor: "#0a0a12" },
      });
      setChartLoaded(true);
    };

    // Create container div for TV widget
    const tvDiv = document.createElement("div");
    tvDiv.id = "tv-chart-container";
    tvDiv.style.width = "100%";
    tvDiv.style.height = "100%";
    containerRef.current.appendChild(tvDiv);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  // Simulated AI overlay data
  const trend = symbol.includes("BTC") ? "UPTREND" : symbol.includes("EUR") ? "RANGING" : "DOWNTREND";
  const confidence = symbol.includes("BTC") ? 82 : symbol.includes("EUR") ? 54 : 67;
  const entryZone = symbol.includes("BTC") ? "38.2%" : "61.8%";

  return (
    <div className="h-full flex flex-col bg-background/60 relative">
      {/* AI Overlay Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/20 bg-muted/20 backdrop-blur-sm z-10">
        <Brain className="w-4 h-4 text-[hsl(var(--purple))]" />
        <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground">NEURAL ANALYSIS</span>
        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">TREND:</span>
            <span className={cn(
              "text-[10px] font-bold flex items-center gap-1",
              trend === "UPTREND" ? "text-accent" : trend === "DOWNTREND" ? "text-destructive" : "text-[hsl(var(--gold))]"
            )}>
              {trend === "UPTREND" ? <TrendingUp className="w-3 h-3" /> :
               trend === "DOWNTREND" ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {trend}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">ENTRY:</span>
            <span className="text-[10px] font-bold text-primary">{entryZone}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">CONFIDENCE:</span>
            <span className={cn(
              "text-[10px] font-bold",
              confidence >= 70 ? "text-accent" : confidence >= 50 ? "text-[hsl(var(--gold))]" : "text-destructive"
            )}>
              {confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="flex-1 relative">
        {!chartLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Loading {symbol}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
