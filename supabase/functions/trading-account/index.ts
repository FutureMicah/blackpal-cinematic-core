import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PLANS: Record<string, { label: string; max_leverage: number; daily: number; dd: number; target: number; split: number }> = {
  starter: { label: "Starter Lock", max_leverage: 10, daily: 5, dd: 8, target: 8, split: 70 },
  pro: { label: "Pro Lock", max_leverage: 20, daily: 5, dd: 10, target: 10, split: 80 },
  elite: { label: "Elite Lock", max_leverage: 50, daily: 4, dd: 12, target: 12, split: 90 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, code: "unauthenticated", message: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ ok: false, code: "unauthenticated", message: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const admin = createClient(url, service);

    if (action === "open") {
      const amount = Number(body?.amount);
      const planKey = String(body?.plan ?? "pro");
      const plan = PLANS[planKey];
      if (!plan) return json({ ok: false, code: "BAD_PLAN", message: "Unknown plan" }, 400);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
        return json({ ok: false, code: "INVALID_AMOUNT", message: "Enter a valid lock amount" }, 400);
      }
      const { data, error } = await admin.rpc("open_trading_account", {
        p_user_id: user.id,
        p_amount: amount,
        p_label: plan.label,
        p_max_leverage: plan.max_leverage,
        p_daily_loss_limit_pct: plan.daily,
        p_max_drawdown_pct: plan.dd,
        p_profit_target_pct: plan.target,
        p_profit_split_pct: plan.split,
      });
      if (error) throw error;
      return json(data);
    }

    if (action === "apply_result") {
      const pnl = Number(body?.pnl);
      if (!Number.isFinite(pnl)) return json({ ok: false, code: "INVALID_PNL", message: "Invalid P&L" }, 400);
      const { data, error } = await admin.rpc("apply_trade_result", { p_user_id: user.id, p_pnl: pnl });
      if (error) throw error;
      return json(data);
    }

    if (action === "payout") {
      const accountId = String(body?.account_id ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(accountId)) {
        return json({ ok: false, code: "BAD_ACCOUNT", message: "Invalid account" }, 400);
      }
      const { data, error } = await admin.rpc("request_account_payout", { p_user_id: user.id, p_account_id: accountId });
      if (error) throw error;
      return json(data);
    }

    return json({ ok: false, code: "BAD_ACTION", message: "Unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, code: "INTERNAL", message: (e as Error).message ?? "Internal error" }, 500);
  }
});
