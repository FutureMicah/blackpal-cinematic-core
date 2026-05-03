import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export const PrizeClaimModal = ({ open, onClose, contestPeriod, onClaimed }: Props) => {
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPnl, setMyPnl] = useState<number>(0);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
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
        .select("id")
        .eq("user_id", session.user.id)
        .eq("contest_period", contestPeriod)
        .maybeSingle();
      setAlreadyClaimed(!!claim);
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
    const result = data as { success?: boolean; error?: string; amount?: number; tier?: string } | null;
    if (error || !result?.success) {
      toast.error(result?.error || error?.message || "Claim failed");
      return;
    }
    toast.success(`🎉 Claimed ${result.amount} BTK · ${result.tier}`);
    setAlreadyClaimed(true);
    onClaimed?.();
  };

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
        ) : (
          <div className="space-y-4">
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
                  {myRank ? <>Rank <b className="text-foreground">#{myRank}</b> · P&L <b className={myPnl >= 0 ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--destructive))]"}>{myPnl >= 0 ? "+" : ""}{myPnl.toFixed(0)}</b></> : "Place a trade to qualify"}
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
              disabled={!eligibleTier || alreadyClaimed || claiming}
              className={cn(
                "w-full h-11 rounded-xl font-bold text-sm tracking-wider transition-all",
                alreadyClaimed
                  ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                  : eligibleTier
                    ? "bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--orange))] text-background hover:shadow-[0_0_24px_hsl(var(--gold)/0.5)] active:scale-[0.98]"
                    : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              )}
            >
              {claiming ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                alreadyClaimed ? "ALREADY CLAIMED" :
                eligibleTier ? `CLAIM ${eligibleTier.amount} BTK` :
                "NOT ELIGIBLE"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
