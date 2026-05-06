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
import { ContestRules } from "@/components/contest/ContestRules";
import { PrizeClaimModal } from "@/components/contest/PrizeClaimModal";
import { analyzeBehavior, type TradeRecord, type BehaviorWarning } from "@/components/terminal/BehaviorEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeWallet } from "@/hooks/useRealtimeWallet";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { LineChart, Trophy, Wallet, BarChart3, Gift, BookOpen } from "lucide-react";

type MobileTab = "trade" | "markets" | "positions" | "ranks";

const currentContestPeriod = () => {
  const now = new Date();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  return `W${Math.ceil((monday.getUTCDate()) / 7)}-${monday.getUTCFullYear()}-${monday.getUTCMonth() + 1}`;
};

const BlackTerminal = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("trade");
  const [behaviorWarnings, setBehaviorWarnings] = useState<BehaviorWarning[]>([]);
  const [claimOpen, setClaimOpen] = useState(false);
  const [statsKey, setStatsKey] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const contestPeriod = currentContestPeriod();

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

  const handleTradeExecuted = () => {
    refetchWallet();
    loadTradeHistory();
    setStatsKey(k => k + 1);
  };

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

  const claimBtn = (
    <button
      onClick={() => setClaimOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--orange))] text-background text-[10px] font-black tracking-wider hover:shadow-[0_0_20px_hsl(var(--gold)/0.5)] active:scale-[0.97] transition-all"
    >
      <Gift className="w-3.5 h-3.5" />
      CLAIM PRIZE
    </button>
  );

  // ═══════════ MOBILE ═══════════
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        <header className="px-3 py-2 border-b border-border/15 bg-card/40 backdrop-blur-xl shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
            <span className="text-[11px] font-black tracking-[0.2em] gold-shimmer">CONTEST</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/claims")}
              aria-label="My prize claims"
              className="p-1.5 rounded-lg bg-card/60 border border-border/20 text-muted-foreground active:scale-90 transition-transform"
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setClaimOpen(true)}
              aria-label="Claim prize"
              className="p-1.5 rounded-lg bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] active:scale-90 transition-transform"
            >
              <Gift className="w-3.5 h-3.5" />
            </button>
            <div className="text-[10px] font-mono font-bold text-[hsl(var(--gold))] tabular-nums">{btkBalance.toLocaleString()} BTK</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2 space-y-2">
          {mobileTab === "trade" && (
            <>
              <PrizePoolBanner />
              <ContestStats refreshKey={statsKey} />
              <div className="h-56"><MiniChart symbol={selectedAsset} /></div>
              <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
              <TradeEngine symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} behaviorWarnings={behaviorWarnings} prefillPrice={null} />
              <ContestRules />
            </>
          )}
          {mobileTab === "markets" && (
            <div className="h-[calc(100dvh-130px)]"><AssetMatrix selectedAsset={selectedAsset} onSelectAsset={(s) => { setSelectedAsset(s); setMobileTab("trade"); }} /></div>
          )}
          {mobileTab === "positions" && <div className="h-[calc(100dvh-130px)]"><PositionsPanel onPositionClosed={refetchWallet} /></div>}
          {mobileTab === "ranks" && <div className="h-[calc(100dvh-130px)]"><ContestLeaderboard /></div>}
        </main>

        <nav aria-label="Primary navigation" role="tablist" className="flex items-center bg-card/70 backdrop-blur-xl border-t border-border/15 shrink-0 relative">
          {([
            { key: "trade" as MobileTab, Icon: BarChart3, label: "Trade" },
            { key: "markets" as MobileTab, Icon: LineChart, label: "Markets" },
            { key: "positions" as MobileTab, Icon: Wallet, label: "Positions" },
            { key: "ranks" as MobileTab, Icon: Trophy, label: "Ranks" },
          ]).map((t, i, arr) => {
            const active = mobileTab === t.key;
            const Icon = t.Icon;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                aria-label={t.label}
                tabIndex={active ? 0 : -1}
                onClick={() => setMobileTab(t.key)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") { e.preventDefault(); setMobileTab(arr[(i + 1) % arr.length].key); }
                  if (e.key === "ArrowLeft") { e.preventDefault(); setMobileTab(arr[(i - 1 + arr.length) % arr.length].key); }
                }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-inset",
                  active ? "text-[hsl(var(--gold))]" : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                {active && (
                  <>
                    <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.6)] animate-scale-in" />
                    <span aria-hidden className="absolute inset-x-2 inset-y-1 rounded-xl bg-[hsl(var(--gold)/0.06)] -z-0" />
                  </>
                )}
                <Icon className={cn("w-4 h-4 relative transition-transform", active && "scale-110")} />
                <span className="text-[9px] font-bold tracking-wider relative">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <button onClick={() => navigate("/chart")} aria-label="Open full chart" className="fixed bottom-20 right-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] flex items-center justify-center shadow-[0_0_24px_hsl(var(--gold)/0.5)] active:scale-90 z-50">
          <Icon3D name="candlestick" size={22} />
        </button>

        <PrizeClaimModal open={claimOpen} onClose={() => setClaimOpen(false)} contestPeriod={contestPeriod} onClaimed={refetchWallet} />
      </div>
    );
  }

  // ═══════════ DESKTOP — Balanced split ═══════════
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 bg-card/40 backdrop-blur-xl border-b border-border/15 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] flex items-center justify-center shadow-[0_0_16px_hsl(var(--gold)/0.4)]">
            <Trophy className="w-4 h-4 text-background" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.2em] gold-shimmer leading-none">CONTEST · TERMINAL</div>
            <div className="text-[9px] text-muted-foreground/60 tracking-widest mt-0.5">{contestPeriod}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {claimBtn}
          <button
            onClick={() => navigate("/claims")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 hover:bg-card border border-border/20 hover:border-[hsl(var(--gold)/0.4)] text-[10px] font-bold tracking-wider transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
            MY CLAIMS
          </button>
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
              <span className="text-xs font-mono font-bold gold-shimmer tabular-nums">{btkBalance.toLocaleString()} BTK</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.25)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse shadow-[0_0_6px_hsl(var(--accent)/0.8)]" />
            <span className="text-[10px] text-[hsl(var(--accent))] tracking-wider font-bold">LIVE</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-3 space-y-3 flex flex-col">
        <PrizePoolBanner />
        <ContestStats refreshKey={statsKey} />

        {/* Balanced split: trade left (50) | leaderboard+rules right (50) */}
        <div className="flex-1 grid grid-cols-12 gap-3 overflow-hidden min-h-0">
          {/* Markets rail */}
          <div className="col-span-2 overflow-hidden rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl">
            <AssetMatrix selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
          </div>

          {/* TRADE side (50%) */}
          <div className="col-span-5 flex flex-col gap-3 overflow-hidden min-w-0">
            <div className="flex-1 min-h-0"><MiniChart symbol={selectedAsset} /></div>
            <div className="shrink-0">
              <OneClickTrading symbol={selectedAsset} btkBalance={btkBalance} onTradeExecuted={handleTradeExecuted} />
            </div>
            <div className="h-44 shrink-0 rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl overflow-hidden">
              <PositionsPanel onPositionClosed={refetchWallet} />
            </div>
          </div>

          {/* CONTEST side (50%) */}
          <div className="col-span-5 flex flex-col gap-3 overflow-hidden min-w-0">
            <div className="flex-1 min-h-0">
              <ContestLeaderboard />
            </div>
            <div className="shrink-0">
              <ContestRules />
            </div>
          </div>
        </div>
      </div>

      <PrizeClaimModal open={claimOpen} onClose={() => setClaimOpen(false)} contestPeriod={contestPeriod} onClaimed={refetchWallet} />
    </div>
  );
};

export default BlackTerminal;
