import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, MoreHorizontal, TrendingUp } from "lucide-react";

/**
 * Dark institutional FUTURES TRADING dashboard.
 * Compact 3-column workstation matching the reference image.
 */

// ─── mock data (real-trader styling) ─────────────────────────────────────────
const KPIS = [
  { label: "Account Balance", value: "$75,000" },
  { label: "Total P/L", value: "$1,450", positive: true },
  { label: "Win Rate", value: "67%" },
];

const TRADE_DETAILS = [
  { tk: "ES", side: "LONG", qtd: "12/01", qty: 3, entry: 4620, exit: 4710, pl: 270, bal: 75000 },
  { tk: "ES", side: "SHORT", qtd: "12/02", qty: 2, entry: 4705, exit: 4680, pl: 100, bal: 75100 },
  { tk: "ES", side: "LONG", qtd: "12/04", qty: 4, entry: 4655, exit: 4630, pl: -200, bal: 74900 },
  { tk: "ES", side: "LONG", qtd: "12/05", qty: 3, entry: 4640, exit: 4720, pl: 480, bal: 75380 },
  { tk: "ES", side: "SHORT", qtd: "12/06", qty: 2, entry: 4730, exit: 4715, pl: 60, bal: 75440 },
  { tk: "ES", side: "LONG", qtd: "12/07", qty: 5, entry: 4690, exit: 4670, pl: -250, bal: 75190 },
  { tk: "ES", side: "LONG", qtd: "12/08", qty: 3, entry: 4660, exit: 4735, pl: 450, bal: 75640 },
];

// Generate deterministic candles
const seed = (i: number) => (Math.sin(i * 12.9898) * 43758.5453) % 1;
const CANDLES = Array.from({ length: 60 }, (_, i) => {
  const base = 4500 + i * 4 + seed(i) * 80;
  const o = base + seed(i + 1) * 30;
  const c = base + seed(i + 2) * 30;
  const h = Math.max(o, c) + Math.abs(seed(i + 3)) * 25;
  const l = Math.min(o, c) - Math.abs(seed(i + 4)) * 25;
  return { o, h, l, c };
});

const PL_BARS = Array.from({ length: 14 }, (_, i) => {
  const v = (seed(i + 100) - 0.3) * 800;
  return Math.round(v);
});

const MARKET_TREND = Array.from({ length: 30 }, (_, i) => 50 + i * 1.2 + seed(i + 200) * 8);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FuturesDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setAuthChecked(true);
    });
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0d12]">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0d12] text-zinc-200" style={{ cursor: "auto" }}>
      {/* ─── Top header ────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800/80 bg-[#0c0f15]">
        <div className="px-3 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              aria-label="Back to terminal"
              className="p-1.5 rounded-md hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm sm:text-base font-bold tracking-[0.2em] text-white uppercase">
              Futures Trading
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {KPIS.map((k) => (
              <div key={k.label} className="px-2 sm:px-3 py-1 border-l border-zinc-800/60 first:border-l-0 sm:first:border-l">
                <div className="text-[9px] sm:text-[10px] text-zinc-500 tracking-wider uppercase">{k.label}</div>
                <div className={cn(
                  "text-sm sm:text-base font-bold font-mono leading-tight",
                  k.positive ? "text-emerald-400" : "text-white"
                )}>
                  {k.value}
                </div>
              </div>
            ))}
            <button
              aria-label="Settings"
              className="hidden sm:flex p-1.5 rounded-md hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Body grid ─────────────────────────────────────────────────── */}
      <main className="p-2 sm:p-3 grid gap-2 sm:gap-3 grid-cols-1 lg:grid-cols-12">
        {/* Left column ─ stacked compact cards */}
        <section className="lg:col-span-3 flex flex-col gap-2 sm:gap-3">
          <Panel title="Profit/Loss by Trade">
            <DonutChart profit={28} loss={10} totalPL={1450} />
          </Panel>

          <Panel title="TRADE SUMMARY" titleClass="tracking-[0.2em] text-[10px]">
            <TradeSummaryCard />
          </Panel>
        </section>

        {/* Center column ─ hero charts + table */}
        <section className="lg:col-span-6 flex flex-col gap-2 sm:gap-3">
          <Panel title="Position Analysis" right={<MiniLegend />}>
            <CandleChart />
          </Panel>

          <Panel title="P/L Analysis">
            <PLBars />
          </Panel>

          <Panel title="TRADE DETAILS" titleClass="tracking-[0.2em] text-[10px]" right={
            <button className="text-[10px] text-zinc-500 hover:text-zinc-200 px-2 py-0.5 rounded border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-600">
              View all
            </button>
          }>
            <TradeTable />
          </Panel>
        </section>

        {/* Right column ─ trends + extras */}
        <section className="lg:col-span-3 flex flex-col gap-2 sm:gap-3">
          <Panel title="Market Trends" right={<TrendingUp className="w-3 h-3 text-sky-400" />}>
            <TrendLine />
          </Panel>

          <Panel title="Risk Exposure" titleClass="tracking-[0.2em] text-[10px]">
            <RiskRows />
          </Panel>
        </section>
      </main>

      {/* Footer hint for mobile */}
      {isMobile && (
        <div className="px-3 py-3 text-center text-[10px] text-zinc-600">
          Compact terminal mode · tap title to return
        </div>
      )}
    </div>
  );
};

export default FuturesDashboard;

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

const Panel = ({
  title, right, children, titleClass,
}: { title: string; right?: React.ReactNode; children: React.ReactNode; titleClass?: string }) => (
  <div className="bg-[#11151c] border border-zinc-800/70 rounded-md shadow-[0_1px_0_rgba(255,255,255,0.02)_inset] overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60">
      <h2 className={cn("text-xs font-semibold text-zinc-300", titleClass)}>{title}</h2>
      {right}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const MiniLegend = () => (
  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-emerald-500" /> Long</span>
    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-rose-500" /> Short</span>
  </div>
);

const DonutChart = ({ profit, loss, totalPL }: { profit: number; loss: number; totalPL: number }) => {
  const total = profit + loss;
  const profitPct = profit / total;
  const C = 2 * Math.PI * 36;
  const profitLen = profitPct * C;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="36" stroke="#27272a" strokeWidth="10" fill="none" />
          <circle
            cx="50" cy="50" r="36" fill="none"
            stroke="hsl(160 84% 45%)" strokeWidth="10"
            strokeDasharray={`${profitLen} ${C}`}
            strokeLinecap="butt"
          />
          <circle
            cx="50" cy="50" r="36" fill="none"
            stroke="hsl(0 80% 55%)" strokeWidth="10"
            strokeDasharray={`${C - profitLen} ${C}`}
            strokeDashoffset={-profitLen}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[9px] text-zinc-500 tracking-wider">Total P/L</div>
          <div className="text-base font-bold text-white font-mono">{totalPL.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 font-mono">10</div>
        </div>
      </div>
      <div className="w-full flex items-center justify-between mt-3 text-[10px] tracking-wider">
        <span className="text-zinc-500">PROFIT <span className="text-emerald-400 font-bold ml-1">{profit}</span></span>
        <span className="text-zinc-500">LOSS <span className="text-rose-400 font-bold ml-1">{loss}</span></span>
      </div>
    </div>
  );
};

const TradeSummaryCard = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">ES</div>
        <div className="leading-tight">
          <div className="text-xs font-bold text-white">ES</div>
          <div className="text-[9px] text-zinc-500">S&amp;P 500 FUTURES</div>
        </div>
      </div>
      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30">Long</span>
    </div>

    <div className="space-y-1.5 text-[11px] font-mono">
      {[
        ["Side", "Long"],
        ["Entry Price", "4,620"],
        ["Position Size", "3 contracts"],
        ["Stop Loss", "4,700"],
        ["Risk/Reward", "3,00"],
      ].map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-2">
          <span className="text-zinc-500">{k}</span>
          <div className="flex-1 mx-2 border-b border-dashed border-zinc-800 mb-0.5" />
          <span className="text-zinc-200">{v}</span>
        </div>
      ))}
    </div>

    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
      <span className="text-[10px] text-zinc-500 tracking-wider">P/L</span>
      <span className="text-base font-bold text-emerald-400 font-mono">$1,200</span>
    </div>
  </div>
);

const CandleChart = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const all = CANDLES.flatMap(c => [c.h, c.l]);
    const max = Math.max(...all), min = Math.min(...all);
    const range = max - min || 1;
    const pad = 6;
    const drawH = h - pad * 2 - 18;
    const cw = (w - pad * 2) / CANDLES.length;
    const bw = Math.max(2, cw * 0.65);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = pad + (drawH / 5) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // candles
    CANDLES.forEach((c, i) => {
      const x = pad + i * cw + cw / 2;
      const yh = pad + ((max - c.h) / range) * drawH;
      const yl = pad + ((max - c.l) / range) * drawH;
      const yo = pad + ((max - c.o) / range) * drawH;
      const yc = pad + ((max - c.c) / range) * drawH;
      const bull = c.c >= c.o;
      ctx.strokeStyle = bull ? "hsl(160 84% 45%)" : "hsl(0 80% 55%)";
      ctx.fillStyle = bull ? "hsl(160 84% 45%)" : "hsl(0 80% 55%)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yh); ctx.lineTo(x, yl); ctx.stroke();
      const top = Math.min(yo, yc);
      ctx.fillRect(x - bw / 2, top, bw, Math.max(1, Math.abs(yc - yo)));
    });

    // MA lines (faint blue)
    const ma = (n: number) => CANDLES.map((_, i) => {
      const start = Math.max(0, i - n);
      const slice = CANDLES.slice(start, i + 1);
      return slice.reduce((s, c) => s + c.c, 0) / slice.length;
    });
    [ma(5), ma(20)].forEach((arr, idx) => {
      ctx.beginPath();
      arr.forEach((v, i) => {
        const x = pad + i * cw + cw / 2;
        const y = pad + ((max - v) / range) * drawH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = idx === 0 ? "rgba(96,165,250,0.5)" : "rgba(125,211,252,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // x labels (months)
    ctx.fillStyle = "rgba(161,161,170,0.5)";
    ctx.font = "9px ui-monospace, monospace";
    MONTHS.forEach((m, i) => {
      const x = (w / MONTHS.length) * i + 4;
      ctx.fillText(m, x, h - 4);
    });

    // y labels (right)
    ctx.fillStyle = "rgba(161,161,170,0.4)";
    for (let i = 0; i <= 4; i++) {
      const v = max - (range / 4) * i;
      const y = pad + (drawH / 4) * i + 3;
      ctx.fillText(v.toFixed(0), w - 32, y);
    }
  }, []);

  return <div className="h-56 sm:h-64 md:h-72 w-full"><canvas ref={ref} className="w-full h-full" /></div>;
};

const PLBars = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...PL_BARS.map(Math.abs)) || 1;
    const pad = 4;
    const bw = (w - pad * 2) / PL_BARS.length;
    const mid = h / 2;
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
    PL_BARS.forEach((v, i) => {
      const x = pad + i * bw + bw * 0.15;
      const barH = (Math.abs(v) / max) * (h / 2 - 6);
      ctx.fillStyle = v >= 0 ? "hsl(160 84% 45%)" : "hsl(0 80% 55%)";
      const y = v >= 0 ? mid - barH : mid;
      ctx.fillRect(x, y, bw * 0.7, barH);
    });
  }, []);
  return <div className="h-24 w-full"><canvas ref={ref} className="w-full h-full" /></div>;
};

const TradeTable = () => (
  <div className="overflow-x-auto -mx-3">
    <table className="w-full text-[11px] font-mono">
      <thead>
        <tr className="text-[9px] text-zinc-500 tracking-widest uppercase border-b border-zinc-800/60">
          <th className="text-left font-medium px-3 py-1.5">Ticker</th>
          <th className="text-left font-medium py-1.5">Qtd</th>
          <th className="text-right font-medium py-1.5">Qty</th>
          <th className="text-right font-medium py-1.5">Entry</th>
          <th className="text-right font-medium py-1.5">Exit</th>
          <th className="text-right font-medium py-1.5">P/L</th>
          <th className="text-right font-medium px-3 py-1.5">Bal.</th>
        </tr>
      </thead>
      <tbody>
        {TRADE_DETAILS.map((t, i) => (
          <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
            <td className="px-3 py-1.5">
              <span className="text-zinc-200 font-bold">{t.tk}</span>
              <span className={cn(
                "ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded-sm",
                t.side === "LONG" ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
              )}>{t.side}</span>
            </td>
            <td className="text-zinc-500 py-1.5">{t.qtd}</td>
            <td className="text-right text-zinc-300 py-1.5">{t.qty}</td>
            <td className="text-right text-zinc-300 py-1.5">{t.entry.toLocaleString()}</td>
            <td className="text-right text-zinc-300 py-1.5">{t.exit.toLocaleString()}</td>
            <td className={cn("text-right font-bold py-1.5", t.pl >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {t.pl >= 0 ? "+" : ""}{t.pl}
            </td>
            <td className="text-right text-zinc-300 px-3 py-1.5">{t.bal.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TrendLine = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...MARKET_TREND), min = Math.min(...MARKET_TREND);
    const range = max - min || 1;
    const pad = 6;
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 1; i < 4; i++) {
      const y = pad + ((h - pad * 2) / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // area
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(56,189,248,0.25)");
    grad.addColorStop(1, "rgba(56,189,248,0)");
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    MARKET_TREND.forEach((v, i) => {
      const x = pad + (i / (MARKET_TREND.length - 1)) * (w - pad * 2);
      const y = pad + ((max - v) / range) * (h - pad * 2);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w - pad, h - pad);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath();
    MARKET_TREND.forEach((v, i) => {
      const x = pad + (i / (MARKET_TREND.length - 1)) * (w - pad * 2);
      const y = pad + ((max - v) / range) * (h - pad * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "rgb(56,189,248)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, []);
  return <div className="h-32 w-full"><canvas ref={ref} className="w-full h-full" /></div>;
};

const RiskRows = () => {
  const rows = [
    { label: "Margin used", value: "12%", bar: 12, color: "bg-sky-500" },
    { label: "Drawdown", value: "4.3%", bar: 22, color: "bg-amber-500" },
    { label: "Open risk", value: "$420", bar: 38, color: "bg-rose-500" },
    { label: "Daily R", value: "+1.8R", bar: 65, color: "bg-emerald-500" },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map(r => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-zinc-500">{r.label}</span>
            <span className="text-zinc-200 font-mono">{r.value}</span>
          </div>
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.bar}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
