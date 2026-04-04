import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Brain, ShieldAlert, TrendingDown, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TradeRecord {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  size: number;
  entry_price: number;
  sl_price?: number;
  tp_price?: number;
  pnl?: number;
  timestamp: number;
  leverage: number;
}

export interface BehaviorWarning {
  id: string;
  type: "overtrading" | "bad_sl" | "losing_streak" | "revenge_trade" | "oversized";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  suggestion: string;
  timestamp: number;
}

interface BehaviorState {
  tradesLast1H: number;
  tradesLast4H: number;
  consecutiveLosses: number;
  avgSlDistance: number;
  lastTradePnl: number;
  timeSinceLastTrade: number;
  riskExposure: number;
}

const THRESHOLDS = {
  overtrading_1h: 5,
  overtrading_4h: 12,
  losing_streak: 3,
  revenge_trade_seconds: 30,
  bad_sl_pct: 0.5,
  risk_exposure_pct: 30,
};

export function analyzeBehavior(trades: TradeRecord[], btkBalance: number): BehaviorWarning[] {
  const warnings: BehaviorWarning[] = [];
  const now = Date.now();
  const oneHour = 3600000;
  const fourHours = oneHour * 4;

  const tradesLast1H = trades.filter(t => now - t.timestamp < oneHour).length;
  const tradesLast4H = trades.filter(t => now - t.timestamp < fourHours).length;

  // Overtrading detection
  if (tradesLast1H >= THRESHOLDS.overtrading_1h) {
    warnings.push({
      id: "overtrade-1h",
      type: "overtrading",
      severity: tradesLast1H >= 8 ? "critical" : "high",
      message: `${tradesLast1H} trades in the last hour — overtrading detected`,
      suggestion: "Step away for 15 minutes. Quality over quantity.",
      timestamp: now,
    });
  } else if (tradesLast4H >= THRESHOLDS.overtrading_4h) {
    warnings.push({
      id: "overtrade-4h",
      type: "overtrading",
      severity: "medium",
      message: `${tradesLast4H} trades in 4 hours — high frequency`,
      suggestion: "Consider reducing trade frequency. Wait for A+ setups only.",
      timestamp: now,
    });
  }

  // Losing streak
  const recentTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);
  let consecutiveLosses = 0;
  for (const t of recentTrades) {
    if (t.pnl !== undefined && t.pnl < 0) consecutiveLosses++;
    else break;
  }

  if (consecutiveLosses >= THRESHOLDS.losing_streak) {
    warnings.push({
      id: "losing-streak",
      type: "losing_streak",
      severity: consecutiveLosses >= 5 ? "critical" : "high",
      message: `${consecutiveLosses} consecutive losses — losing streak active`,
      suggestion: consecutiveLosses >= 5
        ? "STOP trading. Review your last 5 trades before continuing."
        : "Take a break. Reassess market conditions before next trade.",
      timestamp: now,
    });
  }

  // Revenge trading (trade placed < 30s after a loss)
  if (recentTrades.length >= 2) {
    const lastTrade = recentTrades[0];
    const prevTrade = recentTrades[1];
    if (
      prevTrade.pnl !== undefined && prevTrade.pnl < 0 &&
      lastTrade.timestamp - prevTrade.timestamp < THRESHOLDS.revenge_trade_seconds * 1000
    ) {
      warnings.push({
        id: "revenge-trade",
        type: "revenge_trade",
        severity: "high",
        message: "Possible revenge trade — opened position immediately after a loss",
        suggestion: "Wait at least 2 minutes between trades after a loss.",
        timestamp: now,
      });
    }
  }

  // Bad SL placement
  const tradesWithSl = recentTrades.filter(t => t.sl_price && t.entry_price);
  for (const t of tradesWithSl.slice(0, 3)) {
    if (!t.sl_price || !t.entry_price) continue;
    const slDistPct = Math.abs((t.sl_price - t.entry_price) / t.entry_price) * 100;
    if (slDistPct < THRESHOLDS.bad_sl_pct) {
      warnings.push({
        id: `bad-sl-${t.id}`,
        type: "bad_sl",
        severity: "medium",
        message: `SL too tight on ${t.symbol} (${slDistPct.toFixed(2)}%) — likely to get stopped out`,
        suggestion: "Use ATR-based SL or at least 1% distance for crypto.",
        timestamp: now,
      });
      break;
    }
    if (slDistPct > 10) {
      warnings.push({
        id: `bad-sl-wide-${t.id}`,
        type: "bad_sl",
        severity: "medium",
        message: `SL too wide on ${t.symbol} (${slDistPct.toFixed(1)}%) — excessive risk per trade`,
        suggestion: "Tighten your SL or reduce position size to maintain risk limits.",
        timestamp: now,
      });
      break;
    }
  }

  // Oversized position
  const openExposure = trades
    .filter(t => t.pnl === undefined)
    .reduce((sum, t) => sum + t.size, 0);
  
  if (btkBalance > 0 && (openExposure / btkBalance) * 100 > THRESHOLDS.risk_exposure_pct) {
    warnings.push({
      id: "oversized",
      type: "oversized",
      severity: "high",
      message: `Total exposure ${((openExposure / btkBalance) * 100).toFixed(0)}% of balance — dangerous`,
      suggestion: "Close some positions. Max recommended exposure is 30%.",
      timestamp: now,
    });
  }

  return warnings;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: { bg: "bg-destructive/15", border: "border-destructive/30", text: "text-destructive", icon: "text-destructive" },
  high: { bg: "bg-destructive/10", border: "border-destructive/20", text: "text-destructive", icon: "text-destructive" },
  medium: { bg: "bg-[hsl(var(--gold)/0.1)]", border: "border-[hsl(var(--gold)/0.2)]", text: "text-[hsl(var(--gold))]", icon: "text-[hsl(var(--gold))]" },
  low: { bg: "bg-muted/20", border: "border-border/20", text: "text-muted-foreground", icon: "text-muted-foreground" },
};

const WARNING_ICONS: Record<string, typeof AlertTriangle> = {
  overtrading: Clock,
  bad_sl: ShieldAlert,
  losing_streak: TrendingDown,
  revenge_trade: AlertTriangle,
  oversized: Activity,
};

export const BehaviorPanel = ({ warnings }: { warnings: BehaviorWarning[] }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
      {warnings.map(w => {
        const style = SEVERITY_STYLES[w.severity];
        const Icon = WARNING_ICONS[w.type] || AlertTriangle;
        return (
          <div
            key={w.id}
            className={cn(
              "flex items-start gap-2 p-2.5 rounded-xl border transition-all",
              style.bg, style.border
            )}
          >
            <div className={cn("mt-0.5 shrink-0", style.icon)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-[11px] font-semibold", style.text)}>{w.message}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Brain className="w-3 h-3 text-[hsl(var(--purple))]" />
                {w.suggestion}
              </p>
            </div>
            {w.severity === "critical" && (
              <span className="text-[9px] font-bold text-destructive bg-destructive/20 px-1.5 py-0.5 rounded-md animate-pulse">
                CRITICAL
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
