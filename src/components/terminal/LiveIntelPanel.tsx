import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { Clock } from "lucide-react";

const TABS = [
  { key: "open", label: "Positions", iconName: "trade" as const },
  { key: "history", label: "History", iconName: "journal" as const },
  { key: "performance", label: "Performance", iconName: "analytics" as const },
  { key: "signals", label: "Signals", iconName: "bot" as const },
] as const;

type TabKey = typeof TABS[number]["key"];

const MOCK_OPEN_TRADES = [
  { id: 1, symbol: "BTC/USDT", side: "BUY", size: "500 BTK", entry: "67,100", current: "67,432", pnl: "+165 BTK", pnlPct: 2.1, time: "2h 14m" },
  { id: 2, symbol: "EUR/USD", side: "SELL", size: "200 BTK", entry: "1.0892", current: "1.0876", pnl: "+32 BTK", pnlPct: 0.8, time: "45m" },
  { id: 3, symbol: "SOL/USDT", side: "BUY", size: "300 BTK", entry: "180.20", current: "178.45", pnl: "-29 BTK", pnlPct: -1.2, time: "1h 30m" },
];

const MOCK_HISTORY = [
  { id: 1, symbol: "ETH/USDT", side: "BUY", pnl: "+420 BTK", pnlPct: 4.2, duration: "3h 22m", date: "Today" },
  { id: 2, symbol: "GBP/JPY", side: "SELL", pnl: "-85 BTK", pnlPct: -1.7, duration: "1h 05m", date: "Today" },
  { id: 3, symbol: "XAU/USD", side: "BUY", pnl: "+210 BTK", pnlPct: 2.8, duration: "5h 10m", date: "Yesterday" },
];

const MOCK_SIGNALS = [
  { id: 1, symbol: "BTC/USDT", direction: "LONG", confidence: 87, entry: "67,200", tp: "68,500", sl: "66,800", strategy: "Fib 38.2" },
  { id: 2, symbol: "EUR/USD", direction: "SHORT", confidence: 72, entry: "1.0890", tp: "1.0820", sl: "1.0920", strategy: "BOS" },
];

export const LiveIntelPanel = () => {
  const [tab, setTab] = useState<TabKey>("open");

  return (
    <div className="h-full flex flex-col bg-background/70 backdrop-blur-xl border-t border-border/20">
      <div className="flex items-center gap-1 px-2 pt-1.5 pb-1 overflow-x-auto scrollbar-none shrink-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
              tab === t.key
                ? "bg-primary/12 text-primary border border-primary/20"
                : "text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground"
            )}
          >
            <Icon3D name={t.iconName} size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 px-1 shrink-0">
          <QuickStat label="Win" value="68%" color="text-accent" />
          <QuickStat label="R:R" value="2.4" color="text-primary" />
          <QuickStat label="Streak" value="🔥5W" color="text-[hsl(var(--gold))]" />
          <QuickStat label="P/L" value="+1,230" color="text-accent" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-1.5 min-h-0">
        {tab === "open" && <OpenTrades />}
        {tab === "history" && <TradeHistory />}
        {tab === "performance" && <Performance />}
        {tab === "signals" && <BotSignals />}
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="text-center hidden md:block">
    <p className="text-[8px] text-muted-foreground/50 leading-none">{label}</p>
    <p className={cn("text-[10px] font-bold font-mono leading-tight", color)}>{value}</p>
  </div>
);

const OpenTrades = () => (
  <div className="space-y-px">
    <div className="grid grid-cols-7 gap-1 text-[8px] text-muted-foreground/50 font-semibold tracking-wider px-1.5 py-0.5">
      <span>PAIR</span><span>SIDE</span><span>SIZE</span><span className="hidden lg:block">ENTRY</span><span className="hidden lg:block">CURRENT</span><span>P/L</span><span>TIME</span>
    </div>
    {MOCK_OPEN_TRADES.map(t => (
      <div key={t.id} className="grid grid-cols-7 gap-1 items-center px-1.5 py-1 rounded-md hover:bg-muted/15 transition-colors text-[10px]">
        <span className="font-semibold truncate">{t.symbol}</span>
        <span className={cn("font-bold", t.side === "BUY" ? "text-accent" : "text-destructive")}>{t.side}</span>
        <span className="font-mono text-muted-foreground truncate">{t.size}</span>
        <span className="font-mono hidden lg:block">{t.entry}</span>
        <span className="font-mono hidden lg:block">{t.current}</span>
        <span className={cn("font-mono font-bold", t.pnlPct >= 0 ? "text-accent" : "text-destructive")}>{t.pnl}</span>
        <span className="flex items-center gap-0.5 text-muted-foreground/60"><Clock className="w-2.5 h-2.5" />{t.time}</span>
      </div>
    ))}
  </div>
);

const TradeHistory = () => (
  <div className="space-y-px">
    <div className="grid grid-cols-5 lg:grid-cols-6 gap-1 text-[8px] text-muted-foreground/50 font-semibold tracking-wider px-1.5 py-0.5">
      <span>PAIR</span><span>SIDE</span><span>P/L</span><span>%</span><span className="hidden lg:block">DURATION</span><span>DATE</span>
    </div>
    {MOCK_HISTORY.map(t => (
      <div key={t.id} className="grid grid-cols-5 lg:grid-cols-6 gap-1 items-center px-1.5 py-1 rounded-md hover:bg-muted/15 transition-colors text-[10px]">
        <span className="font-semibold truncate">{t.symbol}</span>
        <span className={cn("font-bold", t.side === "BUY" ? "text-accent" : "text-destructive")}>{t.side}</span>
        <span className={cn("font-mono font-bold", t.pnlPct >= 0 ? "text-accent" : "text-destructive")}>{t.pnl}</span>
        <span className={cn("font-mono", t.pnlPct >= 0 ? "text-accent" : "text-destructive")}>{t.pnlPct > 0 ? "+" : ""}{t.pnlPct}%</span>
        <span className="text-muted-foreground/60 hidden lg:block">{t.duration}</span>
        <span className="text-muted-foreground/60">{t.date}</span>
      </div>
    ))}
  </div>
);

const Performance = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
    {[
      { label: "Total Trades", value: "142", iconName: "trade" as const },
      { label: "Win Rate", value: "68.3%", iconName: "analytics" as const, color: "text-accent" },
      { label: "Avg R:R", value: "2.4:1", iconName: "chart" as const, color: "text-primary" },
      { label: "Best Trade", value: "+2,340", iconName: "chart" as const, color: "text-accent" },
      { label: "Worst Trade", value: "-890", iconName: "chart" as const, color: "text-destructive" },
      { label: "Total P/L", value: "+18,450", iconName: "analytics" as const, color: "text-accent" },
      { label: "Avg Hold", value: "3h 22m", iconName: "intel" as const },
      { label: "Rank", value: "Sniper 🎯", iconName: "sniper" as const, color: "text-[hsl(var(--gold))]" },
    ].map(s => (
      <div key={s.label} className="p-2 rounded-lg bg-muted/10 border border-border/10">
        <div className="flex items-center gap-1 mb-0.5">
          <Icon3D name={s.iconName} size={12} />
          <span className="text-[9px] text-muted-foreground/60">{s.label}</span>
        </div>
        <p className={cn("text-[11px] font-bold font-mono", s.color || "text-foreground")}>{s.value}</p>
      </div>
    ))}
  </div>
);

const BotSignals = () => (
  <div className="space-y-1.5 py-0.5">
    {MOCK_SIGNALS.map(s => (
      <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/10 border border-border/10 hover:border-primary/15 transition-all">
        <div className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
          s.direction === "LONG" ? "bg-accent/10" : "bg-destructive/10"
        )}>
          <Icon3D name="chart" size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold">{s.symbol}</span>
            <span className={cn("text-[9px] font-bold", s.direction === "LONG" ? "text-accent" : "text-destructive")}>{s.direction}</span>
            <span className="text-[9px] text-[hsl(var(--purple))]">{s.strategy}</span>
          </div>
          <div className="flex gap-2 text-[9px] text-muted-foreground/60 mt-0.5">
            <span>E: <span className="text-foreground font-mono">{s.entry}</span></span>
            <span>TP: <span className="text-accent font-mono">{s.tp}</span></span>
            <span>SL: <span className="text-destructive font-mono">{s.sl}</span></span>
          </div>
        </div>
        <div className={cn("text-[11px] font-bold font-mono shrink-0",
          s.confidence >= 80 ? "text-accent" : "text-[hsl(var(--gold))]"
        )}>
          {s.confidence}%
        </div>
        <button className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[9px] font-bold hover:bg-primary/20 transition-all border border-primary/15 shrink-0">
          EXEC
        </button>
      </div>
    ))}
  </div>
);
