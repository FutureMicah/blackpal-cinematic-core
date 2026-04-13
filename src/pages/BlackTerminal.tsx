import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { TradeEngine } from "@/components/terminal/TradeEngine";
import { LiveIntelPanel } from "@/components/terminal/LiveIntelPanel";
import { AutoSniper } from "@/components/terminal/AutoSniper";
import { OneClickTrading } from "@/components/terminal/OneClickTrading";
import { TradeJournal } from "@/components/terminal/TradeJournal";
import { analyzeBehavior, type TradeRecord, type BehaviorWarning } from "@/components/terminal/BehaviorEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";

type MobileTab = "trade" | "assets" | "journal" | "sniper" | "intel";

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [btkBalance, setBtkBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("trade");
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
          <span className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Initializing</span>
        </div>
      </div>
    );
  }

  // ═══════════ MOBILE ═══════════
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "trade" && (
            <div className="h-full overflow-y-auto">
              <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
              <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} />
            </div>
          )}
          {mobileTab === "assets" && (
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobileTab("trade"); }} />
          )}
          {mobileTab === "journal" && <TradeJournal />}
          {mobileTab === "sniper" && <AutoSniper symbol={selectedAsset} />}
          {mobileTab === "intel" && <LiveIntelPanel />}
        </div>

        {/* Bottom Nav */}
        <div className="flex items-center border-t border-border/20 bg-background/95 backdrop-blur-md shrink-0">
          {([
            { key: "trade" as MobileTab, icon: "trade" as const, label: "Trade" },
            { key: "assets" as MobileTab, icon: "assets" as const, label: "Markets" },
            { key: "journal" as MobileTab, icon: "journal" as const, label: "Journal" },
            { key: "sniper" as MobileTab, icon: "sniper" as const, label: "Sniper" },
            { key: "intel" as MobileTab, icon: "intel" as const, label: "Intel" },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setMobileTab(t.key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 transition-all relative",
                mobileTab === t.key ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {mobileTab === t.key && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              )}
              <Icon3D name={t.icon} size={20} />
              <span className="text-[9px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Chart FAB */}
        <button
          onClick={() => navigate("/chart")}
          className="fixed bottom-20 right-3 w-12 h-12 rounded-2xl bg-primary/90 hover:bg-primary shadow-[0_4px_20px_hsl(var(--primary)/0.4)] flex items-center justify-center transition-all active:scale-90 z-50"
        >
          <Icon3D name="candlestick" size={24} />
        </button>
      </div>
    );
  }

  // ═══════════ DESKTOP ═══════════
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chart")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/15 text-[10px] font-bold text-muted-foreground transition-all"
          >
            <Icon3D name="candlestick" size={16} />
            CHART VIEW
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/15 border border-border/10">
            <Icon3D name="wallet" size={14} />
            <span className="text-xs font-mono font-bold text-accent">{btkBalance.toLocaleString()}</span>
            <span className="text-[10px] text-primary font-bold">BTK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_hsl(var(--accent)/0.5)]" />
            <span className="text-[10px] text-muted-foreground tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 3 columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Asset Matrix */}
        <div className="w-52 lg:w-56 xl:w-64 shrink-0 overflow-hidden border-r border-border/10">
          <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
        </div>

        {/* Center: Trade Engine + One-Click + Positions */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* One-click trading */}
            <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
            {/* Full trade engine */}
            <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} />
          </div>
          {/* Bottom: Positions / Intel */}
          <div className="h-44 lg:h-48 xl:h-56 shrink-0 overflow-hidden border-t border-border/10">
            <LiveIntelPanel />
          </div>
        </div>

        {/* Right: Journal + Sniper */}
        <div className="w-72 lg:w-80 xl:w-88 shrink-0 overflow-hidden border-l border-border/10">
          <TradeJournal />
        </div>
      </div>
    </div>
  );
};

export default BlackTerminal;
