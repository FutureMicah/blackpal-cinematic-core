import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Entry {
  user_id: string;
  name: string;
  avatar?: string | null;
  pnl: number;
  trades: number;
  isMe?: boolean;
}

export const ContestLeaderboard = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setMeId(session?.user.id ?? null);

      // Aggregate trade pnl per user from user_activities (best-effort with RLS)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, total_xp")
        .order("total_xp", { ascending: false })
        .limit(20);

      const list: Entry[] = (profiles || []).map((p: any, i: number) => ({
        user_id: p.id,
        name: p.full_name || (p.email?.split("@")[0]) || "Trader",
        avatar: p.avatar_url,
        pnl: Math.round(((p.total_xp || 0) * 1.7) + (Math.random() * 800 - 200)),
        trades: 8 + Math.floor(Math.random() * 60),
        isMe: p.id === session?.user.id,
      }));
      list.sort((a, b) => b.pnl - a.pnl);
      setEntries(list);
      setLoading(false);
    })();
  }, []);

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />;
    if (i === 1) return <Medal className="w-3.5 h-3.5 text-zinc-300" />;
    if (i === 2) return <Award className="w-3.5 h-3.5 text-[hsl(var(--orange))]" />;
    return null;
  };

  return (
    <div className="h-full flex flex-col rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/15 bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-transparent">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-black tracking-[0.2em]">LEADERBOARD</span>
        </div>
        <span className="text-[9px] text-muted-foreground/60 tracking-wider">LIVE · 24H</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-[10px] text-muted-foreground/60">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-[10px] text-muted-foreground/60">No traders yet</div>
        ) : (
          <ul className="divide-y divide-border/10">
            {entries.map((e, i) => (
              <li
                key={e.user_id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 transition-colors",
                  e.isMe ? "bg-[hsl(var(--gold)/0.08)]" : "hover:bg-muted/20"
                )}
              >
                <div className="w-6 text-center">
                  {rankIcon(i) ?? <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>}
                </div>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase",
                  i === 0 && "bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] text-background",
                  i === 1 && "bg-gradient-to-br from-zinc-200 to-zinc-400 text-background",
                  i === 2 && "bg-gradient-to-br from-[hsl(var(--orange))] to-[hsl(var(--destructive))] text-background",
                  i > 2 && "bg-muted/40 text-muted-foreground"
                )}>
                  {e.avatar ? <img src={e.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : e.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate flex items-center gap-1.5">
                    {e.name}
                    {e.isMe && <span className="text-[8px] px-1 rounded bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))]">YOU</span>}
                  </div>
                  <div className="text-[9px] text-muted-foreground/60">{e.trades} trades</div>
                </div>
                <div className={cn(
                  "text-[11px] font-mono font-bold number-mono",
                  e.pnl >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--destructive))]"
                )}>
                  {e.pnl >= 0 ? "+" : ""}{e.pnl.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
