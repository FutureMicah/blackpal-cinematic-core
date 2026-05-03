import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AssetMatrix } from "@/components/terminal/AssetMatrix";
import { TradeEngine } from "@/components/terminal/TradeEngine";
import { OneClickTrading } from "@/components/terminal/OneClickTrading";
import { PositionsPanel } from "@/components/terminal/PositionsPanel";
import { MiniChart } from "@/components/terminal/MiniChart";
import { PrizePoolBanner } from "@/components/contest/PrizePoolBanner";
import { ContestStats } from "@/components/contest/ContestStats";
import { ContestLeaderboard } from "@/components/contest/ContestLeaderboard";
import { analyzeBehavior, type TradeRecord, type BehaviorWarning } from "@/components/terminal/BehaviorEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeWallet } from "@/hooks/useRealtimeWallet";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { LineChart, Trophy, Wallet, BarChart3 } from "lucide-react";

type MobileTab = "trade" | "markets" | "positions" | "leaderboard";

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("trade");
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [behaviorWarnings, setBehaviorWarnings] = useState<BehaviorWarning[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { balances, refetch: refetchWallet } = useRealtimeWallet();
  const btkBalance = balances.BTK || 0;

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
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => { if (!loading) loadTradeHistory(); }, [loading, loadTradeHistory]);

  const handleTradeExecuted = () => { refetchWallet(); loadTradeHistory(); };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[hsl(var(--gold)/0.3)] border-t-[hsl(var(--gold))] rounded-full animate-spin" />
          <span className="text-[10px] gold-shimmer tracking-[0.3em] uppercase font-bold">Loading Contest</span>
        </div>
      </div>
    );
  }

  // ═══════════ MOBILE ═══════════
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/15 bg-card/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
              <span className="text-[11px] font-black tracking-[0.2em] gold-shimmer">CONTEST · TERMINAL</span>
            </div>
            <div className="text-[10px] font-mono font-bold text-[hsl(var(--gold))]">{btkBalance.toLocaleString()} BTK</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-2">
          {mobileTab === "trade" && (
            <>
              <PrizePoolBanner />
              <ContestStats balance={btkBalance} />
              <div className="h-56"><MiniChart symbol={selectedAsset} /></div>
              <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
              <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} prefillPrice={null} />
            </>
          )}
          {mobileTab === "markets" && (
            <div className="h-full"><AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobileTab("trade"); }} /></div>
          )}
          {mobileTab === "positions" && <div className="h-[calc(100dvh-130px)]"><PositionsPanel onPositionClosed={refetchWallet} /></div>}
          {mobileTab === "leaderboard" && <div className="h-[calc(100dvh-130px)]"><ContestLeaderboard /></div>}
        </div>

        <nav aria-label="Primary" className="flex items-center bg-card/60 backdrop-blur-xl border-t border-border/15 shrink-0">
          {([
            { key: "trade" as MobileTab, Icon: BarChart3, label: "Trade" },
            { key: "markets" as MobileTab, Icon: LineChart, label: "Markets" },
            { key: "positions" as MobileTab, Icon: Wallet, label: "Positions" },
            { key: "leaderboard" as MobileTab, Icon: Trophy, label: "Ranks" },
          ]).map(t => {
            const active = mobileTab === t.key;
            const Icon = t.Icon;
            return (
              <button
                key={t.key}
                onClick={() => setMobileTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-inset",
                  active ? "text-[hsl(var(--gold))]" : "text-muted-foreground/50"
                )}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.6)] animate-scale-in" />}
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <button onClick={() => navigate("/chart")} className="fixed bottom-20 right-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] flex items-center justify-center shadow-[0_0_24px_hsl(var(--gold)/0.5)] active:scale-90 z-50">
          <Icon3D name="candlestick" size={22} />
        </button>
      </div>
    );
  }

  // ═══════════ DESKTOP — Simplified contest layout ═══════════
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/40 backdrop-blur-xl border-b border-border/15 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] flex items-center justify-center shadow-[0_0_16px_hsl(var(--gold)/0.4)]">
            <Trophy className="w-4 h-4 text-background" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.2em] gold-shimmer leading-none">CONTEST · TERMINAL</div>
            <div className="text-[9px] text-muted-foreground/60 tracking-widest mt-0.5">IN-APP TRADING ARENA</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/chart")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 hover:bg-card border border-border/20 hover:border-[hsl(var(--gold)/0.4)] text-[10px] font-bold tracking-wider transition-all"
          >
            <Icon3D name="candlestick" size={14} />
            FULL CHART
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[hsl(var(--gold)/0.12)] to-[hsl(var(--orange)/0.08)] border border-[hsl(var(--gold)/0.3)]">
            <Wallet className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[8px] text-muted-foreground/60 tracking-wider">BALANCE</span>
              <span className="text-xs font-mono font-bold gold-shimmer">{btkBalance.toLocaleString()} BTK</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.25)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse shadow-[0_0_6px_hsl(var(--accent)/0.8)]" />
            <span className="text-[10px] text-[hsl(var(--accent))] tracking-wider font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden p-3 space-y-3 flex flex-col">
        <PrizePoolBanner />
        <ContestStats balance={btkBalance} />

        <div className="flex-1 grid grid-cols-12 gap-3 overflow-hidden min-h-0">
          {/* Markets */}
          <div className="col-span-2 overflow-hidden rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl">
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
          </div>

          {/* Chart + Trade */}
          <div className="col-span-6 flex flex-col gap-3 overflow-hidden min-w-0">
            <div className="flex-1 min-h-0"><MiniChart symbol={selectedAsset} /></div>
            <div className="shrink-0">
              <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
            </div>
          </div>

          {/* Positions + Leaderboard stacked */}
          <div className="col-span-4 flex flex-col gap-3 overflow-hidden min-w-0">
            <div className="flex-1 min-h-0 rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl overflow-hidden">
              <PositionsPanel onPositionClosed={refetchWallet} />
            </div>
            <div className="flex-1 min-h-0">
              <ContestLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackTerminal;
