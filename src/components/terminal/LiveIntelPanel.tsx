import { useState } from "react";
import { Activity, History, BarChart3, Bot, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "open", label: "Open Trades", icon: Activity },
  { key: "history", label: "History", icon: History },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "signals", label: "Bot Signals", icon: Bot },
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
  { id: 4, symbol: "BTC/USDT", side: "SELL", pnl: "+890 BTK", pnlPct: 5.6, duration: "8h 45m", date: "Yesterday" },
];

const MOCK_SIGNALS = [
  { id: 1, symbol: "BTC/USDT", direction: "LONG", confidence: 87, entry: "67,200", tp: "68,500", sl: "66,800", strategy: "Fib 38.2" },
  { id: 2, symbol: "EUR/USD", direction: "SHORT", confidence: 72, entry: "1.0890", tp: "1.0820", sl: "1.0920", strategy: "BOS" },
  { id: 3, symbol: "SOL/USDT", direction: "LONG", confidence: 65, entry: "176.50", tp: "185.00", sl: "174.00", strategy: "Momentum" },
];

export const LiveIntelPanel = () => {
  const [tab, setTab] = useState<TabKey>("open");

  return (
    <div className="h-full flex flex-col bg-background/80 backdrop-blur-xl border-t border-border/30">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",
              tab === t.key
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground hover:bg-muted/30"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
        {/* Quick Stats */}
        <div className="ml-auto flex items-center gap-4 px-2">
          <Stat label="Win Rate" value="68%" color="text-accent" />
          <Stat label="R:R" value="2.4" color="text-primary" />
          <Stat label="Streak" value="🔥 5W" color="text-[hsl(var(--gold))]" />
          <Stat label="Today P/L" value="+1,230 BTK" color="text-accent" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-3 pb-2">
        {tab === "open" && <OpenTrades />}
        {tab === "history" && <TradeHistory />}
        {tab === "performance" && <Performance />}
        {tab === "signals" && <BotSignals />}
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="text-center">
    <p className="text-[9px] text-muted-foreground">{label}</p>
    <p className={cn("text-[11px] font-bold font-mono", color)}>{value}</p>
  </div>
);

const OpenTrades = () => (
  <div className="space-y-1">
    <div className="grid grid-cols-7 gap-2 text-[9px] text-muted-foreground font-semibold tracking-wider px-2 py-1">
      <span>PAIR</span><span>SIDE</span><span>SIZE</span><span>ENTRY</span><span>CURRENT</span><span>P/L</span><span>TIME</span>
    </div>
    {MOCK_OPEN_TRADES.map(t => (
      <div key={t.id} className="grid grid-cols-7 gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors text-xs">
        <span className="font-semibold">{t.symbol}</span>
        <span className={cn("text-[10px] font-bold", t.side === "BUY" ? "text-accent" : "text-destructive")}>{t.side}</span>
        <span className="font-mono text-muted-foreground">{t.size}</span>
        <span className="font-mono">{t.entry}</span>
        <span className="font-mono">{t.current}</span>
        <span className={cn("font-mono font-bold", t.pnlPct >= 0 ? "text-accent" : "text-destructive")}>{t.pnl}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{t.time}</span>
      </div>
    ))}
  </div>
);

const TradeHistory = () => (
  <div className="space-y-1">
    <div className="grid grid-cols-6 gap-2 text-[9px] text-muted-foreground font-semibold tracking-wider px-2 py-1">
      <span>PAIR</span><span>SIDE</span><span>P/L</span><span>%</span><span>DURATION</span><span>DATE</span>
    </div>
    {MOCK_HISTORY.map(t => (
      <div key={t.id} className="grid grid-cols-6 gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors text-xs">
        <span className="font-semibold">{t.symbol}</span>
        <span className={cn("text-[10px] font-bold", t.side === "BUY" ? "text-accent" : "text-destructive")}>{t.side}</span>
        <span className={cn("font-mono font-bold", t.pnlPct >= 0 ? "text-accent" : "text-destructive")}>{t.pnl}</span>
        <span className={cn("font-mono", t.pnlPct >= 0 ? "text-accent" : "text-destructive")}>{t.pnlPct > 0 ? "+" : ""}{t.pnlPct}%</span>
        <span className="text-muted-foreground">{t.duration}</span>
        <span className="text-muted-foreground">{t.date}</span>
      </div>
    ))}
  </div>
);

const Performance = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
    {[
      { label: "Total Trades", value: "142", icon: Activity },
      { label: "Win Rate", value: "68.3%", icon: Target, color: "text-accent" },
      { label: "Avg R:R", value: "2.4:1", icon: TrendingUp, color: "text-primary" },
      { label: "Best Trade", value: "+2,340 BTK", icon: TrendingUp, color: "text-accent" },
      { label: "Worst Trade", value: "-890 BTK", icon: TrendingDown, color: "text-destructive" },
      { label: "Total P/L", value: "+18,450 BTK", icon: BarChart3, color: "text-accent" },
      { label: "Avg Hold Time", value: "3h 22m", icon: Clock },
      { label: "Rank", value: "Sniper 🎯", icon: Target, color: "text-[hsl(var(--gold))]" },
    ].map(s => (
      <div key={s.label} className="p-3 rounded-xl bg-muted/15 border border-border/15">
        <div className="flex items-center gap-1.5 mb-1">
          <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{s.label}</span>
        </div>
        <p className={cn("text-sm font-bold font-mono", s.color || "text-foreground")}>{s.value}</p>
      </div>
    ))}
  </div>
);

const BotSignals = () => (
  <div className="space-y-2 py-1">
    {MOCK_SIGNALS.map(s => (
      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/15 border border-border/15 hover:border-primary/20 transition-all">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
          s.direction === "LONG" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
        )}>
          {s.direction === "LONG" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">{s.symbol}</span>
            <span className={cn("text-[10px] font-bold", s.direction === "LONG" ? "text-accent" : "text-destructive")}>{s.direction}</span>
            <span className="text-[10px] text-[hsl(var(--purple))]">{s.strategy}</span>
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
            <span>Entry: <span className="text-foreground font-mono">{s.entry}</span></span>
            <span>TP: <span className="text-accent font-mono">{s.tp}</span></span>
            <span>SL: <span className="text-destructive font-mono">{s.sl}</span></span>
          </div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-xs font-bold",
            s.confidence >= 80 ? "text-accent" : s.confidence >= 60 ? "text-[hsl(var(--gold))]" : "text-muted-foreground"
          )}>
            {s.confidence}%
          </div>
          <p className="text-[9px] text-muted-foreground">conf.</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25 transition-all border border-primary/20">
          EXECUTE
        </button>
      </div>
    ))}
  </div>
);
