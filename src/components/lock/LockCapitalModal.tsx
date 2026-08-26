import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const LOCK_PLANS = [
  { key: "starter", label: "Starter Lock", min: 500, max_leverage: 10, daily: 5, dd: 8, target: 8, split: 70 },
  { key: "pro", label: "Pro Lock", min: 2000, max_leverage: 20, daily: 5, dd: 10, target: 10, split: 80 },
  { key: "elite", label: "Elite Lock", min: 10000, max_leverage: 50, daily: 4, dd: 12, target: 12, split: 90 },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  btkBalance: number;
  onOpenAccount: (amount: number, plan: string) => Promise<any>;
}

export const LockCapitalModal = ({ open, onClose, btkBalance, onOpenAccount }: Props) => {
  const [plan, setPlan] = useState<string>("pro");
  const [amount, setAmount] = useState("2000");
  const [busy, setBusy] = useState(false);

  const selected = LOCK_PLANS.find(p => p.key === plan)!;
  const amt = Number(amount) || 0;

  const submit = async () => {
    if (amt < selected.min) { toast.error(`${selected.label} requires at least ${selected.min.toLocaleString()} BTK`); return; }
    if (amt > btkBalance) { toast.error("Not enough BTK in your wallet"); return; }
    setBusy(true);
    const res = await onOpenAccount(amt, plan);
    setBusy(false);
    if (res?.ok) { toast.success(`${amt.toLocaleString()} BTK locked — account live`); onClose(); }
    else toast.error(res?.message || "Could not lock capital");
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-border/20">
        <DialogHeader>
          <DialogTitle className="text-sm font-black tracking-[0.16em] gold-shimmer">LOCK TRADING CAPITAL</DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground/80">
            Your BTK is locked for the challenge. Trade within the rules, hit the target, and withdraw your capital plus your profit share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            {LOCK_PLANS.map(p => (
              <button
                key={p.key}
                onClick={() => { setPlan(p.key); setAmount(String(p.min)); }}
                className={cn(
                  "text-left rounded-xl border p-2.5 transition-all",
                  plan === p.key
                    ? "border-[hsl(var(--gold)/0.5)] bg-[hsl(var(--gold)/0.08)]"
                    : "border-border/20 bg-surface-2/40 hover:border-border/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider">{p.label}</span>
                  <span className="text-[9px] font-mono text-[hsl(var(--gold))]">{p.split}% SPLIT</span>
                </div>
                <p className="text-[9px] text-muted-foreground/70 font-mono mt-0.5">
                  min {p.min.toLocaleString()} BTK · {p.max_leverage}x max · {p.daily}% daily · {p.dd}% DD · {p.target}% target
                </p>
              </button>
            ))}
          </div>

          <div>
            <label className="text-[9px] font-bold tracking-[0.16em] text-muted-foreground/70">LOCK AMOUNT (BTK)</label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="h-9 mt-1 font-mono text-sm bg-surface-2/40 border-border/20"
            />
            <p className="text-[9px] text-muted-foreground/60 mt-1 font-mono">Wallet: {btkBalance.toLocaleString()} BTK</p>
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--orange))] text-background text-[11px] font-black tracking-[0.14em] disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            LOCK {amt.toLocaleString()} BTK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LockCapitalModal;
