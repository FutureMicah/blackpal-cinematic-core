import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Target, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContestStatsProps {
  refreshKey?: number;
}

export const ContestStats = ({ refreshKey }: ContestStatsProps) => {
  const [pnl, setPnl] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [trades, setTrades] = useState(0);
  const [rank, setRank] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: resp } = await supabase.functions.invoke("contest-leaderboard", { body: {} });
    const me = (resp?.data as any[] | null)?.find((r) => r.user_id === session.user.id);
    if (me) {
      setPnl(Number(me.total_pnl));
      setTrades(Number(me.trade_count));
      setWinRate(me.trade_count > 0 ? Math.round((Number(me.win_count) / Number(me.trade_count)) * 100) : 0);
      setRank(Number(me.rank));
    } else {
      setPnl(0); setTrades(0); setWinRate(0); setRank(null);
    }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("contest-me")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activities" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, refreshKey]);

  const cards = [
    { label: "RANK", value: rank ? `#${rank}` : "—", Icon: Trophy, grad: "from-[hsl(var(--gold))] to-[hsl(var(--orange))]" },
    { label: "P&L", value: `${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}`, Icon: TrendingUp, grad: pnl >= 0 ? "from-[hsl(var(--accent))] to-[hsl(var(--primary))]" : "from-[hsl(var(--destructive))] to-[hsl(var(--secondary))]" },
    { label: "WIN RATE", value: `${winRate}%`, Icon: Target, grad: "from-[hsl(var(--primary))] to-[hsl(var(--purple))]" },
    { label: "TRADES", value: `${trades}`, Icon: Coins, grad: "from-[hsl(var(--purple))] to-[hsl(var(--secondary))]" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map(({ label, value, Icon, grad }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-2xl p-3 border border-border/15 bg-card/40 backdrop-blur-xl transition-all hover:border-[hsl(var(--gold)/0.4)] hover:-translate-y-0.5"
        >
          <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", grad)} />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[9px] tracking-[0.18em] text-muted-foreground/70 font-bold">{label}</div>
              <div className="text-xl font-black mt-1 tabular-nums">{value}</div>
            </div>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br", grad)}>
              <Icon className="w-4 h-4 text-background" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
