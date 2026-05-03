import { Trophy, Calendar, Target, TrendingUp, Sparkles } from "lucide-react";

const RULES = [
  { Icon: TrendingUp, title: "Ranking", text: "Total realized P&L from your trades over the last 7 days. Higher P&L = higher rank." },
  { Icon: Calendar, title: "Duration", text: "New contest every Monday 00:00 UTC. Prize claims open after the period ends." },
  { Icon: Target, title: "Eligibility", text: "Must place at least 1 closed trade. All trades count — long, short, leverage." },
  { Icon: Sparkles, title: "Prizes", text: "Paid in BTK to your wallet immediately on claim. One claim per period." },
];

const TIERS = [
  { rank: "#1", label: "GOLD", amount: 5000, color: "text-[hsl(var(--gold))]" },
  { rank: "#2", label: "SILVER", amount: 2500, color: "text-zinc-300" },
  { rank: "#3", label: "BRONZE", amount: 1000, color: "text-[hsl(var(--orange))]" },
  { rank: "#4–10", label: "TOP 10", amount: 500, color: "text-[hsl(var(--primary))]" },
  { rank: "#11–50", label: "TOP 50", amount: 100, color: "text-[hsl(var(--purple))]" },
];

export const ContestRules = () => {
  return (
    <div className="rounded-2xl border border-border/15 bg-card/40 backdrop-blur-xl p-3 lg:p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
        <h3 className="text-[11px] font-black tracking-[0.22em]">CONTEST RULES & PRIZES</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {RULES.map(({ Icon, title, text }) => (
          <div key={title} className="flex gap-2 p-2 rounded-lg bg-muted/15 border border-border/10">
            <Icon className="w-3.5 h-3.5 text-[hsl(var(--gold))] mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold tracking-wider">{title.toUpperCase()}</div>
              <p className="text-[10px] text-muted-foreground/80 leading-snug mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground/70 px-1">PRIZE TIERS</div>
        <div className="grid grid-cols-5 gap-1.5">
          {TIERS.map((t) => (
            <div key={t.label} className="rounded-lg p-2 bg-muted/15 border border-border/10 text-center">
              <div className={`text-[10px] font-bold ${t.color}`}>{t.rank}</div>
              <div className="text-[8px] text-muted-foreground/60 tracking-wider">{t.label}</div>
              <div className="text-[10px] font-mono font-bold mt-0.5">+{t.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
