import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Sparkles, Loader2, Inbox } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Claim {
  id: string;
  contest_period: string;
  rank: number;
  prize_tier: string;
  prize_amount: number;
  claimed_at: string;
  status: string;
}

const TIER_GRAD: Record<string, string> = {
  GOLD: "from-[hsl(var(--gold))] to-[hsl(var(--orange))]",
  SILVER: "from-zinc-200 to-zinc-400",
  BRONZE: "from-[hsl(var(--orange))] to-[hsl(var(--destructive))]",
  TOP_10: "from-[hsl(var(--primary))] to-[hsl(var(--purple))]",
  TOP_50: "from-[hsl(var(--purple))] to-[hsl(var(--secondary))]",
};

const MyClaims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase
        .from("contest_claims")
        .select("*")
        .eq("user_id", session.user.id)
        .order("claimed_at", { ascending: false });
      const list = (data as Claim[] | null) ?? [];
      setClaims(list);
      setTotal(list.reduce((s, c) => s + Number(c.prize_amount), 0));
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-3 border-b border-border/15 bg-card/40 backdrop-blur-xl flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
          <h1 className="text-sm font-black tracking-[0.2em] gold-shimmer">MY PRIZE CLAIMS</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="rounded-2xl border border-[hsl(var(--gold)/0.25)] bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-transparent p-4">
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground/70 font-bold">TOTAL EARNED</div>
          <div className="text-3xl font-mono font-black gold-shimmer mt-1 tabular-nums">{total.toLocaleString()} BTK</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">{claims.length} claim{claims.length === 1 ? "" : "s"} all-time</div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : claims.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground/60">
            <Inbox className="w-10 h-10" />
            <div className="text-xs">No claims yet — finish a contest in the top 50 to earn BTK</div>
          </div>
        ) : (
          <div className="space-y-2">
            {claims.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/15 bg-card/40 backdrop-blur-xl p-3 flex items-center gap-3 hover:border-[hsl(var(--gold)/0.3)] transition-all">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", TIER_GRAD[c.prize_tier] ?? "from-muted to-muted")}>
                  <Sparkles className="w-4 h-4 text-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold">{c.prize_tier.replace("_", " ")}</span>
                    <span className="text-[10px] text-muted-foreground">· Rank #{c.rank}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {c.contest_period} · {format(new Date(c.claimed_at), "MMM d, yyyy · HH:mm")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-black text-[hsl(var(--gold))] tabular-nums">+{Number(c.prize_amount).toLocaleString()}</div>
                  <div className="text-[9px] tracking-wider text-muted-foreground/60">BTK</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyClaims;
