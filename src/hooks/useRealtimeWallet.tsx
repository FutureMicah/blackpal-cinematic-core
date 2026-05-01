import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime updates on user_wallets and transactions for the current user.
 * Both BlackPAL apps use this — any wallet change on one app reflects on the other in real time.
 *
 * Returns balances keyed by token symbol (e.g. { BTK: 12345.67, BTAX: 200 }).
 */
export const useRealtimeWallet = () => {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setUserId(session.user.id);
    const { data } = await supabase
      .from("user_wallets")
      .select("balance, tokens:token_id(symbol)")
      .eq("user_id", session.user.id);
    if (data) {
      const map: Record<string, number> = {};
      for (const row of data as any[]) {
        const sym = row.tokens?.symbol;
        if (sym) map[sym] = Number(row.balance);
      }
      setBalances(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime subscription — refetch on any wallet/transaction change for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`wallet-sync-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_wallets", filter: `user_id=eq.${userId}` },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => refetch(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, refetch]);

  return { balances, loading, refetch };
};
