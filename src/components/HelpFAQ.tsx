import { useState } from "react";
import { HelpCircle, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "How do I trade?",
    a: "Tap the Trade tab in the bottom nav. Pick an asset from the matrix on the left, watch the live chart, then place a BUY or SELL order using the one-click panel. Your P&L feeds straight into the active contest.",
  },
  {
    q: "How do ranks work?",
    a: "Your rank is your position on the Ranks leaderboard for the current contest period, sorted by total realized P&L. Ties break on win rate, then trade count. Ranks update in near real-time as trades settle, so a single good trade can move you up several positions.",
  },
  {
    q: "How are streak and XP calculated?",
    a: "Streak = consecutive days with at least one settled trade (resets to 0 if you skip a calendar day in your local timezone). XP = (profitable trades × 10) + (win-rate % × 2) + (streak × 5). Milestone tiers unlock at 100, 500, 1,000, 2,500, and 5,000 XP.",
  },
  {
    q: "Where can I see my milestone progress?",
    a: "Open the Wallet tab — your current XP, streak, and the next milestone bar are pinned at the top. Tap the bar to expand a full breakdown of locked vs unlocked tiers and the rewards waiting at each one.",
  },
  {
    q: "How do I claim contest prizes? (step-by-step)",
    a: "STEPS",
  },
  {
    q: "How do I view contest ranks?",
    a: "Tap the Ranks tab. The leaderboard refreshes from the database and shows every trader's rank, total P&L, trade count, and win rate for the current period.",
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

const CLAIM_STEPS = [
  { title: "Finish the contest period", body: "Wait until the active contest period clock hits 00:00:00. Live P&L freezes and the final leaderboard is locked." },
  { title: "Land in a winning tier", body: "You must place inside a paid rank for that contest (e.g. Top 10 / Top 50 — see the Prize Pool banner for the live tier table)." },
  { title: "Open the Wallet tab", body: "Eligible prizes appear at the top as a CLAIMABLE card with the amount, tier, and contest name." },
  { title: "Verify prerequisites", body: "Account must be email-verified, KYC complete (if required by your tier), and have at least 1 settled trade in the contest period." },
  { title: "Tap CLAIM", body: "Funds credit to your in-app wallet instantly. A PDF receipt is generated and downloadable from the same row." },
  { title: "Withdraw or roll over", body: "From Wallet, choose Withdraw to send to your linked payout method, or Roll Over to enter the next contest with the prize as starting balance." },
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
        className="w-10 h-10 rounded-full glass-pill flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
                className="w-9 h-9 rounded-full glass-pill flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {FAQ.map((item, i) => {
                const isOpen = active === i;
                const isSteps = item.a === "STEPS";
                return (
                  <li key={i} className="rounded-2xl border border-border/30 bg-background/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActive(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <span className="text-[13px] font-bold">{item.q}</span>
                      <span className={cn("text-[18px] leading-none transition-transform", isOpen && "rotate-45")}>+</span>
                    </button>
                    {isOpen && (
                      isSteps ? (
                        <ol className="px-4 pb-4 space-y-2.5">
                          {CLAIM_STEPS.map((s, idx) => (
                            <li key={idx} className="flex gap-3">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--gold)/0.15)] border border-[hsl(var(--gold)/0.35)] text-[hsl(var(--gold))] text-[11px] font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold leading-tight">{s.title}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{s.body}</p>
                              </div>
                            </li>
                          ))}
                          <li className="flex gap-2 pt-2 border-t border-border/20 mt-2 text-[10px] text-muted-foreground/80">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
                            <span>Prerequisites: verified email, KYC if your tier requires it, ≥ 1 settled trade in the contest period, and the contest must be in CLOSED status.</span>
                          </li>
                        </ol>
                      ) : (
                        <p className="px-4 pb-4 text-[12px] leading-relaxed text-muted-foreground">{item.a}</p>
                      )
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
