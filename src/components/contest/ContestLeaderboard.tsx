import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  total_pnl: number;
  trade_count: number;
  win_count: number;
  rank: number;
}

export const ContestLeaderboard = ({ compact = false }: { compact?: boolean }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setMeId(session?.user.id ?? null);
    const { data, error } = await supabase.rpc("get_contest_leaderboard", {});
    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("contest-lb")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activities" }, () => {
        load();
      })
      .subscribe();
    const poll = setInterval(load, 15000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [load]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const displayName = (r: Row) => r.full_name || r.email?.split("@")[0] || "Trader";
  const initials = (r: Row) => displayName(r).slice(0, 2).toUpperCase();

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />;
    if (rank === 2) return <Medal className="w-3.5 h-3.5 text-zinc-300" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-[hsl(var(--orange))]" />;
    return <span className="text-[10px] font-mono text-muted-foreground/70">#{rank}</span>;
  };

  return (
    <div className="h-full flex flex-col rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/10 shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-bold tracking-[0.22em]">LEADERBOARD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
          <span className="text-[9px] tracking-wider text-muted-foreground/60">LIVE · 7D</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground/60">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/60 p-6 text-center">
          <TrendingUp className="w-6 h-6 opacity-40" />
          <div className="text-[11px]">No qualifying trades yet — be the first!</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Podium */}
          {!compact && podium.length > 0 && (
            <div className="grid grid-cols-3 gap-2 p-3 border-b border-border/10">
              {podium.map((r) => (
                <div
                  key={r.user_id}
                  className={cn(
                    "rounded-xl p-2 text-center border",
                    r.rank === 1 && "bg-gradient-to-b from-[hsl(var(--gold)/0.15)] to-transparent border-[hsl(var(--gold)/0.3)]",
                    r.rank === 2 && "bg-gradient-to-b from-zinc-300/10 to-transparent border-zinc-300/20",
                    r.rank === 3 && "bg-gradient-to-b from-[hsl(var(--orange)/0.12)] to-transparent border-[hsl(var(--orange)/0.25)]",
                  )}
                >
                  <div className="flex justify-center mb-1">{rankBadge(r.rank)}</div>
                  <div className="w-8 h-8 mx-auto rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(r)}
                  </div>
                  <div className="text-[10px] font-semibold mt-1 truncate">{displayName(r)}</div>
                  <div className={cn("text-[10px] font-mono font-bold mt-0.5", r.total_pnl >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--destructive))]")}>
                    {r.total_pnl >= 0 ? "+" : ""}{Number(r.total_pnl).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rest */}
          <ul className="divide-y divide-border/10">
            {(compact ? rows : rest).map((r) => {
              const isMe = r.user_id === meId;
              return (
                <li
                  key={r.user_id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 transition-colors",
                    isMe ? "bg-[hsl(var(--gold)/0.08)]" : "hover:bg-muted/15"
                  )}
                >
                  <div className="w-6 flex justify-center">{rankBadge(r.rank)}</div>
                  <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0">
                    {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(r)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate flex items-center gap-1.5">
                      {displayName(r)}
                      {isMe && <span className="text-[8px] px-1 rounded bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] font-bold">YOU</span>}
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-mono">
                      {r.trade_count} trades · {r.trade_count > 0 ? Math.round((Number(r.win_count) / Number(r.trade_count)) * 100) : 0}% win
                    </div>
                  </div>
                  <div className={cn("text-[11px] font-mono font-bold tabular-nums", Number(r.total_pnl) >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--destructive))]")}>
                    {Number(r.total_pnl) >= 0 ? "+" : ""}{Number(r.total_pnl).toFixed(0)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
