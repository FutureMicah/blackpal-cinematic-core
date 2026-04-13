import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Icon3D } from "@/components/Icon3D";
import { Input } from "@/components/ui/input";

interface JournalEntry {
  id: string;
  symbol: string;
  side: string;
  size: number;
  leverage: number;
  mode: string;
  lots?: number;
  order_type?: string;
  pnl?: number;
  notes: string;
  created_at: string;
}

const TABS = ["trades", "analytics"] as const;
type Tab = typeof TABS[number];

export const TradeJournal = () => {
  const [tab, setTab] = useState<Tab>("trades");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("activity_type", "trade_executed")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      setEntries(data.map((a: any) => ({
        id: a.id,
        symbol: a.metadata?.symbol || a.title?.split(" ").slice(1).join(" ") || "—",
        side: a.metadata?.side?.toUpperCase() || (a.title?.includes("BUY") ? "BUY" : "SELL"),
        size: a.metadata?.size || 0,
        leverage: a.metadata?.leverage || 1,
        mode: a.metadata?.mode || "crypto",
        lots: a.metadata?.lots,
        order_type: a.metadata?.order_type,
        pnl: a.metadata?.pnl,
        notes: a.metadata?.journal_notes || "",
        created_at: a.created_at,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const saveNote = async (entryId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    // Update the metadata with journal notes
    await supabase.from("user_activities").update({
      metadata: { journal_notes: noteText } as any,
    }).eq("id", entryId);
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, notes: noteText } : e));
    setEditingNote(null);
    setNoteText("");
  };

  // Analytics calculations
  const totalTrades = entries.length;
  const buyTrades = entries.filter(e => e.side === "BUY").length;
  const sellTrades = entries.filter(e => e.side === "SELL").length;
  const tradesWithPnl = entries.filter(e => e.pnl !== undefined);
  const wins = tradesWithPnl.filter(e => (e.pnl || 0) > 0).length;
  const losses = tradesWithPnl.filter(e => (e.pnl || 0) < 0).length;
  const winRate = tradesWithPnl.length > 0 ? ((wins / tradesWithPnl.length) * 100).toFixed(1) : "—";
  const totalPnl = tradesWithPnl.reduce((s, e) => s + (e.pnl || 0), 0);
  const avgSize = entries.length > 0 ? (entries.reduce((s, e) => s + e.size, 0) / entries.length).toFixed(0) : "0";
  const uniqueSymbols = [...new Set(entries.map(e => e.symbol))];
  const mostTraded = uniqueSymbols.sort((a, b) =>
    entries.filter(e => e.symbol === b).length - entries.filter(e => e.symbol === a).length
  )[0] || "—";

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="h-full flex flex-col bg-background/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Icon3D name="journal" size={22} />
          <h2 className="text-xs font-bold tracking-[0.2em] text-foreground">TRADE JOURNAL</h2>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{totalTrades} trades</span>
      </div>

      {/* Tabs */}
      <div className="flex px-3 pt-2 gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all",
              tab === t
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground/60 hover:bg-muted/20"
            )}
          >
            <Icon3D name={t === "trades" ? "journal" : "analytics"} size={14} />
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tab === "trades" ? (
          <div className="space-y-1.5">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Icon3D name="journal" size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-xs text-muted-foreground">No trades yet. Execute a trade to start your journal.</p>
              </div>
            ) : entries.map(e => (
              <div key={e.id} className="p-2.5 rounded-xl bg-muted/10 border border-border/15 hover:border-border/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      e.side === "BUY" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
                    )}>{e.side}</span>
                    <span className="text-[11px] font-bold">{e.symbol}</span>
                    <span className="text-[9px] text-muted-foreground/50 uppercase">{e.mode}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/50">{formatTime(e.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                  <span>Size: <span className="text-foreground font-mono">{e.lots ? `${e.lots} lots` : `${e.size} BTK`}</span></span>
                  <span>Lev: <span className="text-foreground font-mono">{e.leverage}x</span></span>
                  {e.order_type && <span>Type: <span className="text-foreground">{e.order_type}</span></span>}
                  {e.pnl !== undefined && (
                    <span>P&L: <span className={cn("font-mono font-bold", e.pnl >= 0 ? "text-accent" : "text-destructive")}>
                      {e.pnl >= 0 ? "+" : ""}{e.pnl} BTK
                    </span></span>
                  )}
                </div>
                {/* Notes */}
                {editingNote === e.id ? (
                  <div className="flex gap-1.5 mt-2">
                    <Input
                      value={noteText}
                      onChange={ev => setNoteText(ev.target.value)}
                      placeholder="Add trade notes..."
                      className="h-7 text-[10px] bg-muted/20 border-border/20 flex-1"
                      onKeyDown={ev => ev.key === "Enter" && saveNote(e.id)}
                    />
                    <button onClick={() => saveNote(e.id)} className="text-[9px] px-2 py-1 rounded bg-primary/15 text-primary font-bold">Save</button>
                    <button onClick={() => setEditingNote(null)} className="text-[9px] px-2 py-1 rounded bg-muted/30 text-muted-foreground">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingNote(e.id); setNoteText(e.notes); }}
                    className="mt-1.5 text-[9px] text-muted-foreground/40 hover:text-primary transition-colors"
                  >
                    {e.notes ? `📝 ${e.notes}` : "+ Add note"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Analytics Tab */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Total Trades", value: String(totalTrades), color: "text-foreground" },
                { label: "Win Rate", value: `${winRate}%`, color: "text-accent" },
                { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)} BTK`, color: totalPnl >= 0 ? "text-accent" : "text-destructive" },
                { label: "Wins / Losses", value: `${wins}W / ${losses}L`, color: "text-foreground" },
                { label: "Avg Size", value: `${avgSize} BTK`, color: "text-foreground" },
                { label: "Buy / Sell", value: `${buyTrades}B / ${sellTrades}S`, color: "text-foreground" },
                { label: "Most Traded", value: mostTraded, color: "text-primary" },
                { label: "Unique Pairs", value: String(uniqueSymbols.length), color: "text-[hsl(var(--gold))]" },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-xl bg-muted/10 border border-border/15">
                  <p className="text-[9px] text-muted-foreground/50 mb-0.5">{s.label}</p>
                  <p className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Symbol breakdown */}
            {uniqueSymbols.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/10 border border-border/15">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2">PAIR BREAKDOWN</p>
                <div className="space-y-1.5">
                  {uniqueSymbols.slice(0, 8).map(sym => {
                    const count = entries.filter(e => e.symbol === sym).length;
                    const pct = (count / totalTrades * 100).toFixed(0);
                    return (
                      <div key={sym} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-20 truncate">{sym}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
