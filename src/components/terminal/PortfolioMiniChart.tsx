import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Range = "1D" | "1W" | "1M" | "3M" | "ALL";
const RANGES: Range[] = ["1D", "1W", "1M", "3M", "ALL"];

interface Point { t: number; v: number; }

/**
 * Compact equity curve from xp_transactions / user_activities pnl.
 * Fully responsive: single-row range selector, scalable canvas height.
 */
export const PortfolioMiniChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [range, setRange] = useState<Range>(() => {
    if (typeof window === "undefined") return "1W";
    const saved = window.localStorage.getItem("portfolio_range");
    return (RANGES.includes(saved as Range) ? saved : "1W") as Range;
  });
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  // Persist range across navigation
  useEffect(() => {
    try { window.localStorage.setItem("portfolio_range", range); } catch { /* ignore */ }
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const sinceMs = (() => {
        const d = Date.now();
        switch (range) {
          case "1D": return d - 24 * 3600_000;
          case "1W": return d - 7 * 24 * 3600_000;
          case "1M": return d - 30 * 24 * 3600_000;
          case "3M": return d - 90 * 24 * 3600_000;
          default: return 0;
        }
      })();
      const q = supabase
        .from("user_activities")
        .select("created_at, metadata")
        .eq("user_id", session.user.id)
        .in("activity_type", ["trade_executed", "trade_closed"])
        .order("created_at", { ascending: true })
        .limit(500);
      const { data } = sinceMs
        ? await q.gte("created_at", new Date(sinceMs).toISOString())
        : await q;
      if (cancelled) return;
      let running = 0;
      const pts: Point[] = (data || []).map((r: any) => {
        const pnl = Number(r.metadata?.pnl ?? r.metadata?.realized_pnl ?? 0);
        running += pnl;
        return { t: new Date(r.created_at).getTime(), v: running };
      });
      setPoints(pts);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const stats = useMemo(() => {
    if (points.length === 0) return { last: 0, change: 0, pct: 0 };
    const last = points[points.length - 1].v;
    const first = points[0].v;
    const change = last - first;
    const pct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;
    return { last, change, pct };
  }, [points]);

  // Draw
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (points.length < 2) return;
    const vals = points.map(p => p.v);
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 0);
    const range = max - min || 1;
    const pad = 4;
    const xs = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
    const ys = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
    const positive = stats.change >= 0;
    const stroke = positive ? "hsl(var(--bid))" : "hsl(var(--ask))";
    // Area fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, positive ? "hsl(var(--bid) / 0.35)" : "hsl(var(--ask) / 0.35)");
    grad.addColorStop(1, "hsl(var(--bid) / 0)");
    ctx.beginPath();
    ctx.moveTo(xs(0), h - pad);
    points.forEach((p, i) => ctx.lineTo(xs(i), ys(p.v)));
    ctx.lineTo(xs(points.length - 1), h - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // Line
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xs(i), ys(p.v)) : ctx.lineTo(xs(i), ys(p.v)));
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [points, stats.change]);

  const positive = stats.change >= 0;

  return (
    <div className="panel-luxe rounded-xl p-3 sm:p-4 w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground/70 font-bold">PORTFOLIO P&amp;L</div>
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <span className="text-lg sm:text-2xl font-bold number-mono">
              {stats.last >= 0 ? "+" : ""}{stats.last.toFixed(2)}
            </span>
            <span className={cn(
              "text-xs font-mono",
              positive ? "text-bid" : "text-ask"
            )}>
              {positive ? "▲" : "▼"} {Math.abs(stats.pct).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart - scalable height */}
      <div className="h-24 sm:h-32 md:h-40 w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
            Loading…
          </div>
        ) : points.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
            No P&amp;L history yet
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full" />
        )}
      </div>

      {/* Quick-skip mobile buttons + range selector */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {/* Quick chips (mobile-friendly large tap targets) */}
        <div className="flex items-center gap-1 sm:hidden">
          {(["1D", "1W", "1M"] as Range[]).map(r => (
            <button
              key={`q-${r}`}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all min-w-[44px] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--gold))]",
                range === r
                  ? "bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.4)]"
                  : "bg-surface-2 text-muted-foreground border border-border/20"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {/* Full range selector — desktop */}
        <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all focus:outline-none focus:ring-1 focus:ring-[hsl(var(--gold))]",
                range === r
                  ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]"
                  : "text-muted-foreground/60 hover:text-foreground border border-transparent"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
