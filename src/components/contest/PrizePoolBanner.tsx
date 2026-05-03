import { useEffect, useState } from "react";
import { Trophy, Clock, Users } from "lucide-react";

export const PrizePoolBanner = () => {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const end = Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 5;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--gold)/0.3)] bg-gradient-to-r from-[hsl(var(--gold)/0.12)] via-[hsl(var(--orange)/0.08)] to-[hsl(var(--secondary)/0.08)] p-3 lg:p-4">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[hsl(var(--gold)/0.15)] blur-3xl" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-[hsl(var(--secondary)/0.1)] blur-3xl" />

      <div className="relative flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--orange))] flex items-center justify-center shadow-[0_0_24px_hsl(var(--gold)/0.5)]">
            <Trophy className="w-5 h-5 text-background" />
          </div>
          <div>
            <div className="text-[9px] tracking-[0.25em] text-muted-foreground/70 font-bold">WEEKLY CONTEST</div>
            <div className="text-lg lg:text-xl font-black gold-shimmer leading-tight">$10,000 PRIZE POOL</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Users className="w-3 h-3" />
            <span className="font-mono"><b className="text-foreground">2,481</b> traders</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/60 border border-[hsl(var(--gold)/0.25)]">
            <Clock className="w-3 h-3 text-[hsl(var(--gold))]" />
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
              <span>{pad(time.d)}d</span><span className="text-muted-foreground/40">:</span>
              <span>{pad(time.h)}h</span><span className="text-muted-foreground/40">:</span>
              <span>{pad(time.m)}m</span><span className="text-muted-foreground/40">:</span>
              <span className="text-[hsl(var(--gold))]">{pad(time.s)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
