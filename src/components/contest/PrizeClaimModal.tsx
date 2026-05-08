import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Sparkles, CheckCircle2, XCircle, Loader2, Clock, ExternalLink, PartyPopper, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { openReceiptPrint } from "@/lib/printReceipt";

interface Props {
  open: boolean;
  onClose: () => void;
  contestPeriod: string;
  onClaimed?: () => void;
}

const TIERS = [
  { tier: "GOLD", rank: "#1", amount: 5000, grad: "from-[hsl(var(--gold))] to-[hsl(var(--orange))]" },
  { tier: "SILVER", rank: "#2", amount: 2500, grad: "from-zinc-200 to-zinc-400" },
  { tier: "BRONZE", rank: "#3", amount: 1000, grad: "from-[hsl(var(--orange))] to-[hsl(var(--destructive))]" },
  { tier: "TOP_10", rank: "#4–10", amount: 500, grad: "from-[hsl(var(--primary))] to-[hsl(var(--purple))]" },
  { tier: "TOP_50", rank: "#11–50", amount: 100, grad: "from-[hsl(var(--purple))] to-[hsl(var(--secondary))]" },
];

interface Receipt {
  rank: number;
  tier: string;
  amount: number;
  pnl: number;
  period: string;
  claimed_at: string;
}

// Compute end of current ISO week (next Monday 00:00 UTC)
const periodEnd = () => {
  const d = new Date();
  const day = d.getUTCDay();
  const daysToMonday = (8 - day) % 7 || 7;
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToMonday));
  return end;
};

export const PrizeClaimModal = ({ open, onClose, contestPeriod, onClaimed }: Props) => {
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPnl, setMyPnl] = useState<number>(0);
  const [existingClaim, setExistingClaim] = useState<Receipt | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const endsAt = useMemo(() => periodEnd(), []);
  const isContestActive = now < endsAt.getTime();

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setReceipt(null);
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: lb } = await supabase.rpc("get_contest_leaderboard", {});
      const me = (lb as any[] | null)?.find((r) => r.user_id === session.user.id);
      setMyRank(me?.rank ?? null);
      setMyPnl(Number(me?.total_pnl ?? 0));

      const { data: claim } = await supabase
        .from("contest_claims")
        .select("rank, prize_tier, prize_amount, claimed_at, contest_period")
        .eq("user_id", session.user.id)
        .eq("contest_period", contestPeriod)
        .maybeSingle();
      setExistingClaim(claim ? {
        rank: claim.rank,
        tier: claim.prize_tier,
        amount: Number(claim.prize_amount),
        pnl: 0,
        period: claim.contest_period,
        claimed_at: claim.claimed_at,
      } : null);
      setLoading(false);
    })();
  }, [open, contestPeriod]);

  const eligibleTier = (() => {
    if (!myRank) return null;
    if (myRank === 1) return TIERS[0];
    if (myRank === 2) return TIERS[1];
    if (myRank === 3) return TIERS[2];
    if (myRank <= 10) return TIERS[3];
    if (myRank <= 50) return TIERS[4];
    return null;
  })();

  const handleClaim = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_contest_prize", { p_contest_period: contestPeriod });
    setClaiming(false);
    const result = data as any;
    if (error || !result?.success) {
      const code = result?.code;
      const msg =
        code === "contest_active" ? "Contest is still active — claims open after it ends" :
        code === "already_claimed" ? "You've already claimed this period" :
        code === "no_trades" ? "Place at least one trade to qualify" :
        code === "rank_too_low" ? `Rank #${result?.rank} is outside the prize tiers` :
        code === "unauthenticated" ? "Please sign in" :
        result?.error || error?.message || "Claim failed";
      toast.error(msg);
      return;
    }
    const r: Receipt = {
      rank: result.rank, tier: result.tier, amount: Number(result.amount),
      pnl: Number(result.pnl ?? 0), period: result.period, claimed_at: result.claimed_at,
    };
    setReceipt(r);
    setExistingClaim(r);
    toast.success(`🎉 Claimed ${r.amount} BTK · ${r.tier.replace("_", " ")}`);
    onClaimed?.();
  };

  // Countdown timer
  const remaining = Math.max(0, endsAt.getTime() - now);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const renderReceipt = (r: Receipt, justClaimed: boolean) => (
    <div className="space-y-3">
      <div className="rounded-xl p-4 bg-gradient-to-br from-[hsl(var(--gold)/0.12)] to-[hsl(var(--orange)/0.06)] border border-[hsl(var(--gold)/0.3)] text-center">
        {justClaimed && <PartyPopper className="w-7 h-7 text-[hsl(var(--gold))] mx-auto mb-2" />}
        <div className="text-[9px] tracking-[0.25em] text-muted-foreground/70 font-bold">
          {justClaimed ? "PRIZE CLAIMED" : "ALREADY CLAIMED"}
        </div>
        <div className="text-3xl font-mono font-black gold-shimmer mt-1 tabular-nums">+{r.amount.toLocaleString()} BTK</div>
        <div className="text-[10px] text-muted-foreground mt-1">{r.tier.replace("_", " ")} · Rank #{r.rank}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <ReceiptRow label="Period" value={r.period} />
        <ReceiptRow label="Claimed" value={format(new Date(r.claimed_at), "MMM d · HH:mm")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => openReceiptPrint(r)}
          className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold))] text-[11px] font-bold tracking-wider hover:bg-[hsl(var(--gold)/0.15)] transition-all"
        >
          <Printer className="w-3 h-3" /> RECEIPT
        </button>
        <Link
          to="/claims"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-border/30 bg-card/60 hover:bg-card text-[11px] font-bold tracking-wider transition-all"
        >
          ALL CLAIMS <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-5 h-5 text-[hsl(var(--gold))]" />
            Claim Contest Prize
          </DialogTitle>
          <DialogDescription className="text-xs">
            Period: <span className="font-mono">{contestPeriod}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : receipt ? (
          renderReceipt(receipt, true)
        ) : existingClaim ? (
          renderReceipt(existingClaim, false)
        ) : (
          <div className="space-y-4">
            {/* Contest countdown / status */}
            {isContestActive && (
              <div className="rounded-xl p-3 bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.25)] flex items-center gap-3">
                <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
                <div className="flex-1">
                  <div className="text-[10px] font-bold tracking-wider">CONTEST IN PROGRESS</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono tabular-nums">
                    Ends in {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
                  </div>
                </div>
              </div>
            )}

            {/* Eligibility status */}
            <div className={cn(
              "rounded-xl p-3 border flex items-center gap-3",
              eligibleTier ? "bg-[hsl(var(--accent)/0.08)] border-[hsl(var(--accent)/0.25)]" : "bg-muted/20 border-border/20"
            )}>
              {eligibleTier ? <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))]" /> : <XCircle className="w-5 h-5 text-muted-foreground" />}
              <div className="flex-1">
                <div className="text-[11px] font-bold tracking-wider">
                  {eligibleTier ? "ELIGIBLE FOR PRIZE" : myRank ? "OUTSIDE PRIZE TIER" : "NOT RANKED"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {myRank
                    ? <>Rank <b className="text-foreground">#{myRank}</b> · P&L <b className={myPnl >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--destructive))]"}>{myPnl >= 0 ? "+" : ""}{myPnl.toFixed(0)}</b></>
                    : "Place a trade to qualify"}
                </div>
              </div>
            </div>

            {/* Prize tiers */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground/70">PRIZE TIERS</div>
              {TIERS.map((t) => (
                <div
                  key={t.tier}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border transition-all",
                    eligibleTier?.tier === t.tier ? "border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.06)]" : "border-border/15 bg-muted/10"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", t.grad)}>
                    <Sparkles className="w-3.5 h-3.5 text-background" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold">{t.tier.replace("_", " ")}</div>
                    <div className="text-[9px] text-muted-foreground">Rank {t.rank}</div>
                  </div>
                  <div className="text-[12px] font-mono font-bold text-[hsl(var(--gold))]">+{t.amount} BTK</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleClaim}
              disabled={!eligibleTier || isContestActive || claiming}
              aria-disabled={!eligibleTier || isContestActive || claiming}
              title={isContestActive ? "Claims open after the contest ends" : !eligibleTier ? "You're not in a prize tier" : ""}
              className={cn(
                "w-full h-11 rounded-xl font-bold text-sm tracking-wider transition-all",
                isContestActive
                  ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                  : eligibleTier
                    ? "bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--orange))] text-background hover:shadow-[0_0_24px_hsl(var(--gold)/0.5)] active:scale-[0.98]"
                    : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              )}
            >
              {claiming ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                isContestActive ? "CONTEST ACTIVE — CLAIM LATER" :
                eligibleTier ? `CLAIM ${eligibleTier.amount} BTK` :
                "NOT ELIGIBLE"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg p-2 bg-muted/15 border border-border/10">
    <div className="text-[9px] text-muted-foreground/60 tracking-wider">{label.toUpperCase()}</div>
    <div className="font-mono font-bold mt-0.5 truncate">{value}</div>
  </div>
);
