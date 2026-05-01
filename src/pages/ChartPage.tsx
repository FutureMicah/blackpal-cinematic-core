import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NeuralChart } from "@/components/terminal/NeuralChart";
import { ChartErrorBoundary } from "@/components/terminal/ChartErrorBoundary";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ChartPage = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [loading, setLoading] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/15 bg-muted/5 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Icon3D name="candlestick" size={20} />
          <span className="text-xs font-bold tracking-[0.12em] text-primary">CHART VIEW</span>
          <div className="w-px h-4 bg-border/20" />
          <span className="text-xs text-muted-foreground font-mono">{selectedAsset}</span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/15 text-[10px] font-bold text-muted-foreground transition-all"
        >
          <Icon3D name="trade" size={14} />
          TRADE
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Asset sidebar (desktop) */}
        {!isMobile && (
          <>
            <div className={cn(
              "shrink-0 overflow-hidden transition-all duration-300 relative",
              leftCollapsed ? "w-0" : "w-52 lg:w-56"
            )}>
              <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
              <button
                onClick={() => setLeftCollapsed(!leftCollapsed)}
                className="absolute top-1/2 -translate-y-1/2 -right-0 z-10 w-4 h-8 flex items-center justify-center bg-muted/40 hover:bg-muted/60 border border-border/20 rounded-r-md text-muted-foreground transition-all"
              >
                {leftCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
              </button>
            </div>
            {leftCollapsed && (
              <button
                onClick={() => setLeftCollapsed(false)}
                className="shrink-0 w-5 flex items-center justify-center bg-muted/10 hover:bg-muted/20 border-r border-border/15 text-muted-foreground transition-all"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </>
        )}

        {/* Chart */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <ChartErrorBoundary symbol={selectedAsset}>
            <NeuralChart symbol={selectedAsset} />
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Mobile asset selector */}
      {isMobile && (
        <div className="px-2 py-1.5 border-t border-border/20 bg-background/95 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {["BTC/USDT", "ETH/USDT", "SOL/USDT", "EUR/USD", "XAU/USD", "GBP/JPY"].map(s => (
              <button
                key={s}
                onClick={() => setSelectedAsset(s)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border",
                  selectedAsset === s
                    ? "bg-primary/15 text-primary border-primary/25"
                    : "bg-muted/15 text-muted-foreground/60 border-transparent"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav — keyboard accessible, animated active state */}
      <nav aria-label="Primary" className="flex items-center border-t border-border/20 bg-background/95 backdrop-blur-md shrink-0">
        {[
          { path: "/", icon: "home" as const, label: "Home", active: false },
          { path: "/chart", icon: "candlestick" as const, label: "Chart", active: true },
          { path: "/futures", icon: "analytics" as const, label: "Futures", active: false },
          { path: "/", icon: "trade" as const, label: "Trade", active: false },
          { path: "/", icon: "journal" as const, label: "Journal", active: false },
        ].map((t, i) => (
          <button
            key={i}
            onClick={() => navigate(t.path)}
            aria-current={t.active ? "page" : undefined}
            aria-label={t.label}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
              t.active ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
            )}
          >
            {t.active && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] animate-scale-in origin-center"
              />
            )}
            <Icon3D name={t.icon} size={20} />
            <span className="text-[9px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ChartPage;
