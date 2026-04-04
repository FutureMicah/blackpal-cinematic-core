import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { NeuralChart } from "@/components/terminal/NeuralChart";
import { TradeEngine } from "@/components/terminal/TradeEngine";
import { LiveIntelPanel } from "@/components/terminal/LiveIntelPanel";
import { AutoSniper } from "@/components/terminal/AutoSniper";
import { analyzeBehavior, type TradeRecord, type BehaviorWarning } from "@/components/terminal/BehaviorEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BarChart3, Zap, Activity, Layers, Crosshair } from "lucide-react";

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [btkBalance, setBtkBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"assets" | "chart" | "trade" | "intel" | "sniper">("chart");
  const [showSniper, setShowSniper] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [behaviorWarnings, setBehaviorWarnings] = useState<BehaviorWarning[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const loadWallet = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_wallets")
      .select("balance, token_id, tokens:token_id(symbol)")
      .eq("user_id", session.user.id);

    if (data) {
      const btkWallet = data.find((w: any) => {
        const token = w.tokens as any;
        return token?.symbol === "BTK";
      });
      setBtkBalance(btkWallet ? Number(btkWallet.balance) : 0);
    }
  }, []);

  const loadTradeHistory = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("activity_type", "trade_executed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const records: TradeRecord[] = data.map((a: any) => ({
        id: a.id,
        symbol: a.metadata?.symbol || "",
        side: a.metadata?.side?.toUpperCase() || "BUY",
        size: a.metadata?.size || 0,
        entry_price: 0,
        leverage: a.metadata?.leverage || 1,
        timestamp: new Date(a.created_at).getTime(),
        pnl: a.metadata?.pnl,
      }));
      setTradeHistory(records);
      setBehaviorWarnings(analyzeBehavior(records, btkBalance));
    }
  }, [btkBalance]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!loading) {
      loadWallet();
      loadTradeHistory();
    }
  }, [loading, loadWallet, loadTradeHistory]);

  const handleTradeExecuted = () => {
    loadWallet();
    loadTradeHistory();
  };

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
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 bg-background/90 backdrop-blur-sm">
          <span className="text-xs font-bold tracking-[0.15em] text-primary">BLACK TERMINAL</span>
          <span className="text-[10px] font-mono text-accent">{btkBalance.toLocaleString()} BTK</span>
        </div>

        <div className="flex-1 overflow-hidden">
          {mobilePanel === "assets" && (
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobilePanel("chart"); }} />
          )}
          {mobilePanel === "chart" && <NeuralChart symbol={selectedAsset} />}
          {mobilePanel === "trade" && (
            <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} />
          )}
          {mobilePanel === "intel" && <LiveIntelPanel />}
          {mobilePanel === "sniper" && <AutoSniper symbol={selectedAsset} />}
        </div>

        <div className="flex items-center border-t border-border/20 bg-background/90 backdrop-blur-sm">
          {[
            { key: "assets" as const, icon: Layers, label: "Assets" },
            { key: "chart" as const, icon: BarChart3, label: "Chart" },
            { key: "trade" as const, icon: Zap, label: "Trade" },
            { key: "sniper" as const, icon: Crosshair, label: "Sniper" },
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
          <button
            onClick={() => setShowSniper(!showSniper)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
              showSniper
                ? "bg-[hsl(var(--purple)/0.2)] text-[hsl(var(--purple))] border border-[hsl(var(--purple)/0.3)]"
                : "bg-muted/30 text-muted-foreground border border-border/20 hover:bg-muted/50"
            )}
          >
            <Crosshair className="w-3.5 h-3.5" />
            SNIPER
          </button>
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
          <div className="flex-1 overflow-hidden">
            <NeuralChart symbol={selectedAsset} />
          </div>
          <div className="h-48 xl:h-56 shrink-0 overflow-hidden">
            <LiveIntelPanel />
          </div>
        </div>

        {/* Right: Trade Engine or Sniper */}
        <div className="w-64 xl:w-72 shrink-0 overflow-hidden">
          {showSniper ? (
            <AutoSniper symbol={selectedAsset} />
          ) : (
            <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BlackTerminal;
