import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { NeuralChart } from "@/components/terminal/NeuralChart";
import { ChartErrorBoundary } from "@/components/terminal/ChartErrorBoundary";
import { TradeEngine } from "@/components/terminal/TradeEngine";
import { LiveIntelPanel } from "@/components/terminal/LiveIntelPanel";
import { AutoSniper } from "@/components/terminal/AutoSniper";
import { analyzeBehavior, type TradeRecord, type BehaviorWarning } from "@/components/terminal/BehaviorEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon3D } from "@/components/Icon3D";

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [btkBalance, setBtkBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"assets" | "chart" | "trade" | "intel" | "sniper">("chart");
  const [showSniper, setShowSniper] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
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
      const btkWallet = data.find((w: any) => (w.tokens as any)?.symbol === "BTK");
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
        id: a.id, symbol: a.metadata?.symbol || "", side: a.metadata?.side?.toUpperCase() || "BUY",
        size: a.metadata?.size || 0, entry_price: 0, leverage: a.metadata?.leverage || 1,
        timestamp: new Date(a.created_at).getTime(), pnl: a.metadata?.pnl,
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
    if (!loading) { loadWallet(); loadTradeHistory(); }
  }, [loading, loadWallet, loadTradeHistory]);

  const handleTradeExecuted = () => { loadWallet(); loadTradeHistory(); };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Initializing Black Terminal</span>
        </div>
      </div>
    );
  }

  // MOBILE
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 bg-background/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            <span className="text-[11px] font-bold tracking-[0.15em] text-primary">BLACK TERMINAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{selectedAsset}</span>
            <div className="h-3 w-px bg-border/30" />
            <span className="text-[10px] font-mono font-bold text-accent">{btkBalance.toLocaleString()} BTK</span>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobilePanel === "assets" && (
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobilePanel("chart"); }} />
          )}
          {mobilePanel === "chart" && <ChartErrorBoundary symbol={selectedAsset}><NeuralChart symbol={selectedAsset} /></ChartErrorBoundary>}
          {mobilePanel === "trade" && (
            <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} />
          )}
          {mobilePanel === "intel" && <LiveIntelPanel />}
          {mobilePanel === "sniper" && <AutoSniper symbol={selectedAsset} />}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="flex items-center border-t border-border/20 bg-background/95 backdrop-blur-md shrink-0 safe-area-bottom">
          {[
            { key: "assets" as const, icon: "assets" as const, label: "Assets" },
            { key: "chart" as const, icon: "chart" as const, label: "Chart" },
            { key: "trade" as const, icon: "trade" as const, label: "Trade" },
            { key: "sniper" as const, icon: "sniper" as const, label: "Sniper" },
            { key: "intel" as const, icon: "intel" as const, label: "Intel" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setMobilePanel(t.key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 transition-all relative",
                mobilePanel === t.key ? "text-primary" : "text-muted-foreground/60 opacity-50"
              )}
            >
              {mobilePanel === t.key && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              )}
              <Icon3D name={t.icon} size={22} />
              <span className="text-[9px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // DESKTOP
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/15 bg-muted/5 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          <span className="text-sm font-bold tracking-[0.15em] text-primary">BLACK TERMINAL</span>
          <div className="w-px h-4 bg-border/20" />
          <span className="text-xs text-muted-foreground font-mono">{selectedAsset}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSniper(!showSniper)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
              showSniper
                ? "bg-[hsl(var(--purple)/0.15)] text-[hsl(var(--purple))] border border-[hsl(var(--purple)/0.3)] shadow-[0_0_12px_hsl(var(--purple)/0.15)]"
                : "bg-muted/20 text-muted-foreground border border-border/15 hover:bg-muted/40"
            )}
          >
            <Icon3D name="sniper" size={16} />
            SNIPER
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/15 border border-border/10">
            <span className="text-xs font-mono font-bold text-accent">{btkBalance.toLocaleString()}</span>
            <span className="text-[10px] text-primary font-bold">BTK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_hsl(var(--accent)/0.5)]" />
            <span className="text-[10px] text-muted-foreground tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Asset Matrix */}
        <div className={cn(
          "shrink-0 overflow-hidden transition-all duration-300 relative",
          leftCollapsed ? "w-0" : "w-52 lg:w-56 xl:w-64"
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

        {/* Center: Chart + Intel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChartErrorBoundary symbol={selectedAsset}><NeuralChart symbol={selectedAsset} /></ChartErrorBoundary>
          </div>
          <div className="h-44 lg:h-48 xl:h-56 shrink-0 overflow-hidden">
            <LiveIntelPanel />
          </div>
        </div>

        {/* Right: Trade Engine / Sniper */}
        <div className="w-60 lg:w-64 xl:w-72 shrink-0 overflow-hidden">
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
