import { useState } from "react";
import { AlertTriangle, BadgeCheck, Banknote, Gauge, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AccountMetrics, TradingAccount } from "@/hooks/useTradingAccount";

interface Props {
  account: TradingAccount | null;
  metrics: AccountMetrics;
  onRequestPayout: (accountId: string) => Promise<any>;
}

const Meter = ({
  label,
  detail,
  usedPct,
  tone,
  Icon,
}: {
  label: string;
  detail: string;
  usedPct: number;
  tone: "danger" | "gold";
  Icon: typeof Gauge;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.14em] text-muted-foreground/80">
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <span className={cn("text-[9px] font-mono font-bold tabular-nums", usedPct >= 80 ? "text-destructive" : "text-muted-foreground")}>
        {detail}
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-surface-2/60 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "danger"
            ? usedPct >= 80
              ? "bg-destructive"
              : "bg-[hsl(var(--orange))]"
            : "bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--orange))]",
        )}
        style={{ width: `${Math.min(100, Math.max(0, usedPct))}%` }}
      />
    </div>
  </div>
);

export const RiskRulesPanel = ({ account, metrics, onRequestPayout }: Props) => {
  const [busy, setBusy] = useState(false);

  if (!account || account.status === "closed") {
    return (
      <div className="rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl p-3">
        <p className="text-[10px] font-bold tracking-[0.16em] gold-shimmer mb-1">RISK RULES</p>
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          Lock capital to activate a rules-enforced account: daily loss limit, max drawdown, leverage cap and a profit target that unlocks your payout.
        </p>
      </div>
    );
  }

  const payout = async () => {
    setBusy(true);
    const res = await onRequestPayout(account.id);
    setBusy(false);
    if (res?.ok) toast.success(`Payout approved — ${Number(res.payout?.net_amount ?? 0).toLocaleString()} BTK credited`);
    else toast.error(res?.message || "Payout unavailable");
  };

  return (
    <div className="rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.16em] gold-shimmer">RISK RULES · ENFORCED</p>
        <span className="text-[9px] font-mono text-muted-foreground/60">MAX {account.max_leverage}x</span>
      </div>

      <Meter
        label="DAILY LOSS"
        detail={`${metrics.dailyLossPct.toFixed(2)}% / ${account.daily_loss_limit_pct}%`}
        usedPct={metrics.dailyLimitUsedPct}
        tone="danger"
        Icon={Gauge}
      />
      <Meter
        label="MAX DRAWDOWN"
        detail={`${metrics.drawdownPct.toFixed(2)}% / ${account.max_drawdown_pct}%`}
        usedPct={metrics.drawdownUsedPct}
        tone="danger"
        Icon={AlertTriangle}
      />
      <Meter
        label="PROFIT TARGET"
        detail={`${metrics.pnlPct.toFixed(2)}% / ${account.profit_target_pct}%`}
        usedPct={metrics.targetProgressPct}
        tone="gold"
        Icon={Target}
      />

      {account.status === "breached" && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-destructive">Trading disabled — rule breached</p>
            <p className="text-[9px] text-muted-foreground/80">{account.breach_reason}</p>
          </div>
        </div>
      )}

      {account.status === "passed" && (
        <div className="space-y-2 rounded-xl border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.08)] p-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[hsl(var(--gold))]">
            <BadgeCheck className="w-3.5 h-3.5" /> Target hit — payout unlocked
          </p>
          <p className="text-[9px] text-muted-foreground/80">
            Your {account.profit_split_pct}% share of {(Number(account.balance) - Number(account.starting_balance)).toFixed(2)} BTK profit plus your locked capital returns to your wallet.
          </p>
          <button
            onClick={payout}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--orange))] text-background text-[10px] font-black tracking-wider disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
            REQUEST PAYOUT
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskRulesPanel;
