import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { NeuralChart } from "@/components/terminal/NeuralChart";
import { TradeEngine } from "@/components/terminal/TradeEngine";
import { LiveIntelPanel } from "@/components/terminal/LiveIntelPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Menu, X, BarChart3, Zap, Activity } from "lucide-react";

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [btkBalance, setBtkBalance] = useState(12450);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"assets" | "chart" | "trade" | "intel">("chart");
  const [showAssets, setShowAssets] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground tracking-[0.2em]">INITIALIZING BLACK TERMINAL</span>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
        {/* Mobile Nav */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 bg-background/90 backdrop-blur-sm">
          <span className="text-xs font-bold tracking-[0.15em] text-primary">BLACK TERMINAL</span>
          <span className="text-[10px] font-mono text-accent">{btkBalance.toLocaleString()} BTK</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mobilePanel === "assets" && (
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobilePanel("chart"); }} />
          )}
          {mobilePanel === "chart" && <NeuralChart symbol={selectedAsset} />}
          {mobilePanel === "trade" && <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} />}
          {mobilePanel === "intel" && <LiveIntelPanel />}
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex items-center border-t border-border/20 bg-background/90 backdrop-blur-sm">
          {[
            { key: "assets" as const, icon: Menu, label: "Assets" },
            { key: "chart" as const, icon: BarChart3, label: "Chart" },
            { key: "trade" as const, icon: Zap, label: "Trade" },
            { key: "intel" as const, icon: Activity, label: "Intel" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setMobilePanel(t.key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 transition-all",
                mobilePanel === t.key ? "text-primary" : "text-muted-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              <span className="text-[9px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/20 bg-muted/10 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-[0.15em] text-primary">⚫ BLACK TERMINAL</span>
          <div className="w-px h-4 bg-border/30" />
          <span className="text-xs text-muted-foreground">{selectedAsset}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-accent">{btkBalance.toLocaleString()} BTK</span>
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] text-muted-foreground">LIVE</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Asset Matrix */}
        <div className="w-56 xl:w-64 shrink-0 overflow-hidden">
          <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
        </div>

        {/* Center + Bottom */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Center: Chart */}
          <div className="flex-1 overflow-hidden">
            <NeuralChart symbol={selectedAsset} />
          </div>
          {/* Bottom: Intel */}
          <div className="h-48 xl:h-56 shrink-0 overflow-hidden">
            <LiveIntelPanel />
          </div>
        </div>

        {/* Right: Trade Engine */}
        <div className="w-64 xl:w-72 shrink-0 overflow-hidden">
          <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} />
        </div>
      </div>
    </div>
  );
};

export default BlackTerminal;
