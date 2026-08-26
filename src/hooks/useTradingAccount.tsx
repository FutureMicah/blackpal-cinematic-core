import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TradingAccount {
  id: string;
  label: string;
  account_type: string;
  locked_amount: number;
  starting_balance: number;
  balance: number;
  peak_balance: number;
  day_start_balance: number;
  max_leverage: number;
  daily_loss_limit_pct: number;
  max_drawdown_pct: number;
  profit_target_pct: number;
  profit_split_pct: number;
  status: "active" | "breached" | "passed" | "closed";
  breach_reason: string | null;
  created_at: string;
}

export interface AccountMetrics {
  equity: number;
  pnl: number;
  pnlPct: number;
  dailyLossPct: number;
  dailyLimitUsedPct: number;
  drawdownPct: number;
  drawdownUsedPct: number;
  targetProgressPct: number;
  canTrade: boolean;
}

export const deriveMetrics = (a: TradingAccount | null, unrealized = 0): AccountMetrics => {
  if (!a) {
    return { equity: 0, pnl: 0, pnlPct: 0, dailyLossPct: 0, dailyLimitUsedPct: 0, drawdownPct: 0, drawdownUsedPct: 0, targetProgressPct: 0, canTrade: false };
  }
  const equity = Number(a.balance) + unrealized;
  const pnl = equity - Number(a.starting_balance);
  const pnlPct = a.starting_balance > 0 ? (pnl / Number(a.starting_balance)) * 100 : 0;
  const dailyLossPct = a.day_start_balance > 0 ? Math.max(0, ((Number(a.day_start_balance) - equity) / Number(a.day_start_balance)) * 100) : 0;
  const drawdownPct = a.peak_balance > 0 ? Math.max(0, ((Number(a.peak_balance) - equity) / Number(a.peak_balance)) * 100) : 0;
  return {
    equity,
    pnl,
    pnlPct,
    dailyLossPct,
    dailyLimitUsedPct: Math.min(100, (dailyLossPct / Number(a.daily_loss_limit_pct)) * 100),
    drawdownPct,
    drawdownUsedPct: Math.min(100, (drawdownPct / Number(a.max_drawdown_pct)) * 100),
    targetProgressPct: Math.min(100, Math.max(0, (pnlPct / Number(a.profit_target_pct)) * 100)),
    canTrade: a.status === "active",
  };
};

export const useTradingAccount = () => {
  const [account, setAccount] = useState<TradingAccount | null>(null);
  const [history, setHistory] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setUserId(session.user.id);
    const { data } = await (supabase.from("trading_accounts") as any)
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    const rows = (data || []) as TradingAccount[];
    setHistory(rows);
    setAccount(rows.find(r => r.status === "active") || rows.find(r => r.status === "passed") || rows[0] || null);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`trading-account-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trading_accounts", filter: `user_id=eq.${userId}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refetch]);

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("trading-account", { body: payload });
    if (error) return { ok: false, message: error.message } as any;
    await refetch();
    return data as { ok: boolean; code?: string; message?: string; account?: TradingAccount; payout?: any };
  }, [refetch]);

  return {
    account,
    history,
    loading,
    refetch,
    openAccount: (amount: number, plan: string) => call({ action: "open", amount, plan }),
    applyResult: (pnl: number) => call({ action: "apply_result", pnl }),
    requestPayout: (accountId: string) => call({ action: "payout", account_id: accountId }),
  };
};
