import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "How do I trade?",
    a: "Tap the Trade tab in the bottom nav. Pick an asset from the matrix on the left, watch the live chart, then place a BUY or SELL order using the one-click panel. Your P&L feeds straight into the active contest.",
  },
  {
    q: "How do I view contest ranks?",
    a: "Tap the Ranks tab. The leaderboard refreshes from the database and shows every trader's rank, total P&L, trade count, and win rate for the current period.",
  },
  {
    q: "How do I claim prizes?",
    a: "When a contest period ends and you're in a winning tier, head to the Wallet tab. You'll see eligible claims with a CLAIM button — tap it to credit your wallet, then download a PDF receipt.",
  },
  {
    q: "Where does the Academy link go?",
    a: "The Academy button in the top header opens our sister learning platform in a new tab — courses, lessons, and structured paths to level up your trading before you enter live contests.",
  },
  {
    q: "What does the WS / REST / CACHE pill mean?",
    a: "It shows the chart's live data source. WS = streaming live via WebSocket, REST = polling Binance every few seconds, CACHE = connection dropped and you're viewing the last saved snapshot.",
  },
];

export const HelpFAQ = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open help and FAQ"
        title="Help & FAQ"
        className="w-10 h-10 rounded-full glass-pill flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <HelpCircle className="w-4 h-4 text-foreground/80" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Help and FAQ"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-black tracking-tight">Help & FAQ</h2>
                <p className="text-[11px] text-muted-foreground">Quick answers to common questions</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="w-9 h-9 rounded-full glass-pill flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {FAQ.map((item, i) => {
                const isOpen = active === i;
                return (
                  <li key={i} className="rounded-2xl border border-border/30 bg-background/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActive(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <span className="text-[13px] font-bold">{item.q}</span>
                      <span className={cn("text-[18px] leading-none transition-transform", isOpen && "rotate-45")}>+</span>
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-4 text-[12px] leading-relaxed text-muted-foreground">{item.a}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpFAQ;
