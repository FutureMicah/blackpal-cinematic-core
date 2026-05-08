import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeWallet } from "@/hooks/useRealtimeWallet";
import { AppShell } from "@/components/AppShell";
import { ArrowUpRight, ArrowDownRight, ArrowRight, Plus, Sparkles, Trophy, Flame, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

interface ContestRow {
  user_id: string;
  rank: number;
  total_pnl: number;
  trade_count: number;
  win_count: number;
}

interface RecentTrade {
  symbol: string;
  side: "BUY" | "SELL";
  pnl: number;
  ts: number;
}

const TOKEN_GRADIENT: Record<string, string> = {
  BTK: "hero-gradient-violet",
  BTAX: "hero-gradient-emerald",
  USDT: "hero-gradient-blue",
  BTC: "hero-gradient-coral",
  ETH: "hero-gradient-blue",
};

const Home = () => {
  const navigate = useNavigate();
  const { balances } = useRealtimeWallet();
  const [authChecked, setAuthChecked] = useState(false);
  const [me, setMe] = useState<ContestRow | null>(null);
  const [recent, setRecent] = useState<RecentTrade[]>([]);
  const [weekly, setWeekly] = useState<{ pnl: number; pct: number }>({ pnl: 0, pct: 0 });
  const [today, setToday] = useState<{ pnl: number; pct: number }>({ pnl: 0, pct: 0 });
  const [claimsTotal, setClaimsTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setAuthChecked(true);

      // Contest stats (me)
      const { data: lb } = await supabase.rpc("get_contest_leaderboard", {});
      const mine = (lb as ContestRow[] | null)?.find((r) => r.user_id === session.user.id);
      if (mine) setMe(mine);

      // Recent trades — last 30 for sparkline & weekly/today P&L
      const { data: acts } = await (supabase.from("user_activities") as any)
        .select("metadata, created_at")
        .eq("user_id", session.user.id)
        .eq("activity_type", "trade_executed")
        .gte("created_at", subDays(new Date(), 7).toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      let weeklyPnl = 0, todayPnl = 0;
      const todayStr = new Date().toDateString();
      const trades: RecentTrade[] = [];
      for (const a of (acts ?? [])) {
        const pnl = Number(a.metadata?.pnl ?? 0);
        weeklyPnl += pnl;
        if (new Date(a.created_at).toDateString() === todayStr) todayPnl += pnl;
        if (trades.length < 5) {
          trades.push({
            symbol: a.metadata?.symbol || "—",
            side: (a.metadata?.side?.toUpperCase() as "BUY" | "SELL") || "BUY",
            pnl,
            ts: new Date(a.created_at).getTime(),
          });
        }
      }
      setRecent(trades);
      const btk = balances.BTK || 1;
      setWeekly({ pnl: weeklyPnl, pct: (weeklyPnl / btk) * 100 });
      setToday({ pnl: todayPnl, pct: (todayPnl / btk) * 100 });

      // Claims total
      const { data: claims } = await (supabase.from("contest_claims") as any)
        .select("prize_amount")
        .eq("user_id", session.user.id);
      setClaimsTotal((claims ?? []).reduce((s: number, c: any) => s + Number(c.prize_amount || 0), 0));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tokenList = useMemo(() => {
    const entries = Object.entries(balances);
    return entries.length > 0 ? entries : [["BTK", 0], ["BTAX", 0]];
  }, [balances]);

  if (!authChecked) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[hsl(var(--primary)/0.3)] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell title="Welcome Back">
      <div className="space-y-5 max-w-md mx-auto">
        {/* CAPITAL FLOW — Weekly + Today hero cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-bold tracking-tight">Capital Flow</h2>
            <button onClick={() => navigate("/terminal")} className="w-9 h-9 rounded-full glass-pill flex items-center justify-center hover:scale-105 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatHero
              label="WEEKLY"
              value={weekly.pnl}
              pct={weekly.pct}
              gradient="hero-gradient-violet"
              icon={<Flame className="w-5 h-5" />}
            />
            <StatHero
              label="TODAY"
              value={today.pnl}
              pct={today.pct}
              gradient="hero-gradient-coral"
              icon={<Sparkles className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* EARNING PROCESS — Donut-ish summary using real contest stats */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold tracking-tight">Earning Process</h3>
            <span className="text-[22px] font-black gradient-text-cyber">
              {me?.trade_count ? Math.round((Number(me.win_count) / Number(me.trade_count)) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-5">
            <DonutGauge
              value={me?.trade_count ? Math.round((Number(me.win_count) / Number(me.trade_count)) * 100) : 0}
              total={Number(me?.total_pnl ?? 0)}
            />
            <div className="flex-1 space-y-2.5">
              <RankRow label="Rank" value={me?.rank ? `#${me.rank}` : "—"} color="hsl(var(--gold))" />
              <RankRow label="Trades" value={`${me?.trade_count ?? 0}`} color="hsl(var(--primary))" />
              <RankRow label="Wins" value={`${me?.win_count ?? 0}`} color="hsl(var(--accent))" />
              <RankRow label="Claimed" value={`${claimsTotal.toLocaleString()} BTK`} color="hsl(var(--coral))" />
            </div>
          </div>
        </section>

        {/* TOKEN WALLETS — Exchange-style stacked cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-bold tracking-tight">Wallets</h2>
            <button
              onClick={() => navigate("/futures")}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[hsl(var(--primary))] glass-pill px-3 py-1.5 hover:scale-105 transition-transform"
            >
              <Repeat className="w-3.5 h-3.5" /> Exchange
            </button>
          </div>
          <div className="space-y-3">
            {tokenList.map(([sym, bal], i) => (
              <TokenCard key={sym} symbol={sym} balance={Number(bal)} accent={TOKEN_GRADIENT[sym] || (i % 2 ? "hero-gradient-violet" : "hero-gradient-blue")} />
            ))}
          </div>
        </section>

        {/* RECENT TRADES */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-bold tracking-tight">Recent Trades</h2>
            <button onClick={() => navigate("/terminal")} className="text-[12px] font-bold text-[hsl(var(--primary))]">View all →</button>
          </div>
          <div className="glass-card p-2">
            {recent.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No trades yet.{" "}
                <button onClick={() => navigate("/terminal")} className="text-[hsl(var(--primary))] font-bold">Open the trading terminal</button>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {recent.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      t.side === "BUY" ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]" : "bg-[hsl(var(--coral)/0.15)] text-[hsl(var(--coral))]"
                    )}>
                      {t.side === "BUY" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold">{t.symbol}</div>
                      <div className="text-[10px] text-muted-foreground">{format(t.ts, "MMM d · HH:mm")} · {t.side}</div>
                    </div>
                    <div className={cn(
                      "text-[13px] font-mono font-black tabular-nums",
                      t.pnl >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--coral))]"
                    )}>
                      {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <button
          onClick={() => navigate("/claims")}
          className="w-full glass-card p-4 flex items-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl hero-gradient-coral flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[14px] font-bold">My Prize Claims</div>
            <div className="text-[11px] text-muted-foreground">Receipts, history & filters</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </AppShell>
  );
};

// ──────── pieces ────────

const StatHero = ({ label, value, pct, gradient, icon }: { label: string; value: number; pct: number; gradient: string; icon: React.ReactNode }) => {
  const positive = value >= 0;
  return (
    <div className={cn("relative rounded-3xl p-4 overflow-hidden text-white", gradient)} style={{ minHeight: 130 }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)] opacity-10" />
      <div className="relative flex items-start justify-between">
        <span className="text-[10px] tracking-[0.18em] font-bold opacity-80">{label}</span>
        <div className="opacity-90">{icon}</div>
      </div>
      <div className="relative mt-4">
        <div className="text-[26px] font-black tabular-nums leading-none">
          {positive ? "+" : ""}{Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold opacity-90">
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {pct.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

const RankRow = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
    <span className="text-[13px] font-bold tabular-nums">{value}</span>
  </div>
);

const DonutGauge = ({ value, total }: { value: number; total: number }) => {
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--purple))" />
            <stop offset="100%" stopColor="hsl(var(--coral))" />
          </linearGradient>
        </defs>
        <circle cx="55" cy="55" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="url(#donutGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[16px] font-black gradient-text-cyber tabular-nums">
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
        </div>
        <div className="text-[9px] text-muted-foreground tracking-wider mt-0.5">7 Days</div>
      </div>
    </div>
  );
};

const TokenCard = ({ symbol, balance, accent }: { symbol: string; balance: number; accent: string }) => {
  const navigate = useNavigate();
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[13px] font-black shadow-lg", accent)}>
        {symbol.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold tracking-wide">{symbol}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] font-bold">+30/h</span>
        </div>
        <div className="text-[20px] font-black tabular-nums mt-0.5">{balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
      </div>
      <button
        onClick={() => navigate("/futures")}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--purple))] flex items-center justify-center text-white shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)] hover:scale-105 active:scale-95 transition-transform"
        aria-label={`Trade ${symbol}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Home;
