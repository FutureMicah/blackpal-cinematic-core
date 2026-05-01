import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { TradeEngine } from "@/components/terminal/TradeEngine";
import { LiveIntelPanel } from "@/components/terminal/LiveIntelPanel";
import { AutoSniper } from "@/components/terminal/AutoSniper";
import { OneClickTrading } from "@/components/terminal/OneClickTrading";
import { TradeJournal } from "@/components/terminal/TradeJournal";
import { OrderBook } from "@/components/terminal/OrderBook";
import { PositionsPanel } from "@/components/terminal/PositionsPanel";
import { MiniChart } from "@/components/terminal/MiniChart";
import { TimeSales } from "@/components/terminal/TimeSales";
import { PortfolioMiniChart } from "@/components/terminal/PortfolioMiniChart";
import { analyzeBehavior, type TradeRecord, type BehaviorWarning } from "@/components/terminal/BehaviorEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeWallet } from "@/hooks/useRealtimeWallet";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";

type MobileTab = "trade" | "assets" | "chart" | "book" | "tape" | "positions" | "journal" | "intel";
type DesktopTab = "positions" | "journal" | "sniper" | "intel";

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("trade");
  const [desktopTab, setDesktopTab] = useState<DesktopTab>("positions");
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [behaviorWarnings, setBehaviorWarnings] = useState<BehaviorWarning[]>([]);
  const [prefillPrice, setPrefillPrice] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Realtime wallet — keeps balance synced with the other BlackPAL app
  const { balances, refetch: refetchWallet } = useRealtimeWallet();
  const btkBalance = balances.BTK || 0;

  const handleOrderBookClick = (price: string) => {
    // Append timestamp so identical clicks still re-trigger autofill
    setPrefillPrice(`${price}|${Date.now()}`);
  };

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
    if (!loading) { loadTradeHistory(); }
  }, [loading, loadTradeHistory]);

  const handleTradeExecuted = () => { refetchWallet(); loadTradeHistory(); };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[hsl(var(--gold)/0.3)] border-t-[hsl(var(--gold))] rounded-full animate-spin" />
          <span className="text-[10px] gold-shimmer tracking-[0.3em] uppercase font-bold">Initializing Terminal</span>
        </div>
      </div>
    );
  }

  // ═══════════ MOBILE ═══════════
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
        <div className="flex items-center justify-between px-3 py-2 panel-luxe rounded-none border-b border-[hsl(var(--gold)/0.15)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.8)] animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] gold-shimmer">BLACK · TERMINAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{selectedAsset}</span>
            <div className="h-3 w-px bg-[hsl(var(--gold)/0.3)]" />
            <span className="text-[10px] font-mono font-bold text-[hsl(var(--gold))] number-mono">{btkBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {mobileTab === "trade" && (
            <div className="h-full overflow-y-auto p-2 space-y-2">
              <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
              <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} prefillPrice={prefillPrice} />
            </div>
          )}
          {mobileTab === "assets" && (
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobileTab("trade"); }} />
          )}
          {mobileTab === "chart" && <div className="h-full p-2"><MiniChart symbol={selectedAsset} /></div>}
          {mobileTab === "book" && <OrderBook symbol={selectedAsset} onPriceClick={(p) => { handleOrderBookClick(p); setMobileTab("trade"); }} />}
          {mobileTab === "tape" && <TimeSales symbol={selectedAsset} />}
          {mobileTab === "positions" && <PositionsPanel onPositionClosed={refetchWallet} />}
          {mobileTab === "journal" && <TradeJournal />}
          {mobileTab === "intel" && <LiveIntelPanel />}
        </div>

        <nav aria-label="Primary" className="flex items-center panel-luxe rounded-none border-t border-[hsl(var(--gold)/0.15)] shrink-0">
          {([
            { key: "trade" as MobileTab, icon: "trade" as const, label: "Trade" },
            { key: "assets" as MobileTab, icon: "assets" as const, label: "Markets" },
            { key: "chart" as MobileTab, icon: "candlestick" as const, label: "Chart" },
            { key: "book" as MobileTab, icon: "analytics" as const, label: "Book" },
            { key: "tape" as MobileTab, icon: "trade" as const, label: "Tape" },
            { key: "positions" as MobileTab, icon: "wallet" as const, label: "Positions" },
          ]).map(t => {
            const active = mobileTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setMobileTab(t.key)}
                aria-current={active ? "page" : undefined}
                aria-label={t.label}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-inset",
                  active ? "text-[hsl(var(--gold))]" : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.6)] animate-scale-in origin-center"
                  />
                )}
                <Icon3D name={t.icon} size={18} />
                <span className="text-[9px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => navigate("/chart")}
          className="fixed bottom-20 right-3 w-12 h-12 rounded-2xl panel-luxe-gold flex items-center justify-center transition-all active:scale-90 z-50"
        >
          <Icon3D name="candlestick" size={22} />
        </button>
      </div>
    );
  }

  // ═══════════ DESKTOP — 4-zone luxury workstation ═══════════
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={{ cursor: "auto" }}>
      {/* Top command bar */}
      <div className="flex items-center justify-between px-4 py-2 panel-luxe-gold rounded-none border-b border-[hsl(var(--gold)/0.2)] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--gold))] shadow-[0_0_10px_hsl(var(--gold)/0.8)] animate-pulse" />
            <span className="text-sm font-black tracking-[0.25em] gold-shimmer">BLACK · TERMINAL</span>
          </div>
          <div className="hairline-gold-v h-5" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-widest text-muted-foreground/70">PAIR</span>
            <span className="text-sm font-mono font-bold text-foreground number-mono">{selectedAsset}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chart")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-[hsl(var(--gold)/0.2)] hover:border-[hsl(var(--gold)/0.4)] text-[10px] font-bold tracking-wider text-[hsl(var(--gold))] transition-all"
          >
            <Icon3D name="candlestick" size={14} />
            CHART VIEW
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg panel-luxe border border-[hsl(var(--gold)/0.2)]">
            <Icon3D name="wallet" size={14} />
            <div className="flex flex-col leading-tight">
              <span className="text-[8px] text-muted-foreground/60 tracking-wider">BALANCE</span>
              <span className="text-xs font-mono font-bold gold-shimmer number-mono">{btkBalance.toLocaleString()} BTK</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bid/10 border border-bid/20">
            <div className="w-1.5 h-1.5 rounded-full bg-bid animate-pulse shadow-[0_0_6px_hsl(var(--bid)/0.8)]" />
            <span className="text-[10px] text-bid tracking-wider font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Workstation grid */}
      <div className="flex-1 flex overflow-hidden gap-2 p-2 bg-surface-1">
        {/* ZONE 1 — Asset Matrix */}
        <div className="w-52 lg:w-56 xl:w-60 shrink-0 overflow-hidden panel-luxe">
          <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
        </div>

        {/* ZONE 2 — Mini Chart + Order Book stack */}
        <div className="w-56 lg:w-64 xl:w-72 shrink-0 flex flex-col gap-2 overflow-hidden">
          <div className="h-44 lg:h-52 xl:h-60 shrink-0">
            <MiniChart symbol={selectedAsset} />
          </div>
          <div className="flex-1 overflow-hidden">
            <OrderBook symbol={selectedAsset} onPriceClick={handleOrderBookClick} />
          </div>
        </div>

        {/* ZONE 2b — Time & Sales */}
        <div className="w-44 lg:w-48 xl:w-56 shrink-0 overflow-hidden">
          <TimeSales symbol={selectedAsset} />
        </div>

        {/* ZONE 3 — Trade Engine + Quick Trade + Portfolio chart */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 gap-2">
          <div className="shrink-0">
            <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
          </div>
          <div className="shrink-0">
            <PortfolioMiniChart />
          </div>
          <div className="flex-1 overflow-hidden panel-luxe">
            <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} prefillPrice={prefillPrice} />
          </div>
        </div>

        {/* ZONE 4 — Tabbed: Positions / Journal / Sniper / Intel */}
        <div className="w-72 lg:w-80 xl:w-96 shrink-0 flex flex-col overflow-hidden panel-luxe">
          <div className="flex items-center border-b border-border/15 shrink-0">
            {([
              { key: "positions" as DesktopTab, icon: "trade" as const, label: "Positions" },
              { key: "journal" as DesktopTab, icon: "journal" as const, label: "Journal" },
              { key: "sniper" as DesktopTab, icon: "sniper" as const, label: "Sniper" },
              { key: "intel" as DesktopTab, icon: "intel" as const, label: "Intel" },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setDesktopTab(t.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold tracking-[0.15em] transition-all relative",
                  desktopTab === t.key ? "text-[hsl(var(--gold))]" : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                {desktopTab === t.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.6)]" />
                )}
                <Icon3D name={t.icon} size={12} />
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {desktopTab === "positions" && <PositionsPanel onPositionClosed={refetchWallet} />}
            {desktopTab === "journal" && <TradeJournal />}
            {desktopTab === "sniper" && <AutoSniper symbol={selectedAsset} />}
            {desktopTab === "intel" && <LiveIntelPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackTerminal;
