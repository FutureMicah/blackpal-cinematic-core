import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Sparkles, Loader2, Inbox, RefreshCw, Search, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { openReceiptPrint } from "@/lib/printReceipt";
import { toast } from "sonner";

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

const TIERS = ["ALL", "GOLD", "SILVER", "BRONZE", "TOP_10", "TOP_50"];
const PAGE_SIZE = 8;

const MyClaims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tierFilter, setTierFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data, error } = await supabase
      .from("contest_claims")
      .select("*")
      .eq("user_id", session.user.id)
      .order("claimed_at", { ascending: false });
    if (error) toast.error("Failed to load claims");
    setClaims((data as Claim[] | null) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const total = useMemo(() => claims.reduce((s, c) => s + Number(c.prize_amount), 0), [claims]);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const tierOk = tierFilter === "ALL" || c.prize_tier === tierFilter;
      const q = search.trim().toLowerCase();
      const searchOk = !q || c.contest_period.toLowerCase().includes(q) || c.prize_tier.toLowerCase().includes(q);
      return tierOk && searchOk;
    });
  }, [claims, tierFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [tierFilter, search]);

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-3 border-b border-border/15 bg-card/40 backdrop-blur-xl flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
          <h1 className="text-sm font-black tracking-[0.2em] gold-shimmer">MY PRIZE CLAIMS</h1>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          aria-label="Refresh claims"
          className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="rounded-2xl border border-[hsl(var(--gold)/0.25)] bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-transparent p-4">
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground/70 font-bold">TOTAL EARNED</div>
          <div className="text-3xl font-mono font-black gold-shimmer mt-1 tabular-nums">{total.toLocaleString()} BTK</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">{claims.length} claim{claims.length === 1 ? "" : "s"} all-time</div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by period (e.g. W18-2026-5) or tier"
              className="pl-9 h-9 text-xs bg-muted/20 border-border/15 rounded-xl"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all border",
                  tierFilter === t
                    ? "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.35)]"
                    : "bg-muted/15 text-muted-foreground border-border/15 hover:bg-muted/25"
                )}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground/60">
            <Inbox className="w-10 h-10" />
            <div className="text-xs text-center">
              {claims.length === 0
                ? "No claims yet — finish a contest in the top 50 to earn BTK"
                : "No claims match your filters"}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((c) => (
                <div key={c.id} className="rounded-xl border border-border/15 bg-card/40 backdrop-blur-xl p-3 flex items-center gap-3 hover:border-[hsl(var(--gold)/0.3)] transition-all">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", TIER_GRAD[c.prize_tier] ?? "from-muted to-muted")}>
                    <Sparkles className="w-4 h-4 text-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold">{c.prize_tier.replace("_", " ")}</span>
                      <span className="text-[10px] text-muted-foreground">· Rank #{c.rank}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                      {c.contest_period} · {format(new Date(c.claimed_at), "MMM d, yyyy · HH:mm")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-black text-[hsl(var(--gold))] tabular-nums">+{Number(c.prize_amount).toLocaleString()}</div>
                    <div className="text-[9px] tracking-wider text-muted-foreground/60">BTK</div>
                  </div>
                  <button
                    onClick={() => openReceiptPrint({
                      tier: c.prize_tier, rank: c.rank, amount: Number(c.prize_amount),
                      period: c.contest_period, claimed_at: c.claimed_at,
                    })}
                    aria-label="Download receipt"
                    title="Download receipt"
                    className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-[hsl(var(--gold))] transition-colors shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/20 bg-card/40 text-[11px] disabled:opacity-40 hover:bg-muted/30 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <div className="text-[10px] text-muted-foreground tracking-wider">
                  PAGE {safePage} / {pageCount} · {filtered.length} CLAIMS
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={safePage === pageCount}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/20 bg-card/40 text-[11px] disabled:opacity-40 hover:bg-muted/30 transition-colors"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyClaims;
