import { Lock, ShieldAlert, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountMetrics, TradingAccount } from "@/hooks/useTradingAccount";

interface Props {
  account: TradingAccount | null;
  metrics: AccountMetrics;
  onLock: () => void;
  compact?: boolean;
}

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "gold" }) => (
  <div className="flex flex-col leading-tight min-w-0">
    <span className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</span>
    <span
      className={cn(
        "text-xs font-mono font-bold tabular-nums truncate",
        tone === "up" && "text-[hsl(var(--accent))]",
        tone === "down" && "text-destructive",
        tone === "gold" && "text-[hsl(var(--gold))]",
      )}
    >
      {value}
    </span>
  </div>
);

export const AccountHeaderBar = ({ account, metrics, onLock, compact }: Props) => {
  if (!account || account.status === "closed") {
    return (
      <button
        onClick={onLock}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border border-[hsl(var(--gold)/0.3)] bg-gradient-to-r from-[hsl(var(--gold)/0.12)] to-[hsl(var(--orange)/0.06)] active:scale-[0.99] transition-transform"
      >
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[hsl(var(--gold))]" />
          <span className="text-[11px] font-black tracking-[0.16em] gold-shimmer">LOCK CAPITAL TO TRADE</span>
        </span>
        <span className="text-[9px] text-muted-foreground/70 tracking-wider">CHOOSE A PLAN →</span>
      </button>
    );
  }

  const statusChip = {
    active: { label: "LIVE", cls: "text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.35)] bg-[hsl(var(--accent)/0.1)]", Icon: Zap },
    breached: { label: "BREACHED", cls: "text-destructive border-destructive/40 bg-destructive/10", Icon: ShieldAlert },
    passed: { label: "PASSED", cls: "text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.1)]", Icon: Trophy },
    closed: { label: "CLOSED", cls: "text-muted-foreground border-border/30 bg-card/40", Icon: Lock },
  }[account.status];
  const StatusIcon = statusChip.Icon;

  return (
    <div className="rounded-2xl border border-border/15 bg-card/50 backdrop-blur-xl px-3 py-2 flex items-center gap-3 overflow-x-auto scrollbar-thin">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-background" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-black tracking-[0.14em]">{account.label.toUpperCase()}</span>
          <span className="text-[8px] text-muted-foreground/60 font-mono">{Number(account.locked_amount).toLocaleString()} BTK LOCKED</span>
        </div>
      </div>

      <span className={cn("shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider", statusChip.cls)}>
        <StatusIcon className="w-3 h-3" />
        {statusChip.label}
      </span>

      <div className="flex items-center gap-4 shrink-0">
        <Stat label="Equity" value={`${metrics.equity.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} tone="gold" />
        <Stat label="Balance" value={`${Number(account.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat
          label="P&L"
          value={`${metrics.pnl >= 0 ? "+" : ""}${metrics.pnl.toFixed(2)} (${metrics.pnlPct.toFixed(2)}%)`}
          tone={metrics.pnl >= 0 ? "up" : "down"}
        />
        {!compact && <Stat label="Max Lev" value={`${account.max_leverage}x`} />}
        {!compact && <Stat label="Split" value={`${account.profit_split_pct}%`} tone="gold" />}
      </div>
    </div>
  );
};

export default AccountHeaderBar;
