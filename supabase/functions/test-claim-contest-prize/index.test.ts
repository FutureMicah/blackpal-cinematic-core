// Integration tests for the claim_contest_prize RPC.
// Run with the Supabase edge-function test runner. Requires SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in the environment.
//
// Covered error states:
//   - unauthenticated   (anon client, no session)
//   - contest_active    (period whose end is still in the future)
//   - no_trades         (authenticated user with zero qualifying activity)
//   - already_claimed   (second call after a successful claim)
//   - duplicate-credit  (wallet must NOT be credited twice)
//
// rank_too_low is deliberately exercised manually — it requires seeding 51+
// users with qualifying trades, which is impractical inside an integration
// test. The branch is exercised by unit assertions on pure SQL elsewhere.

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { assertEquals, assert } from "jsr:@std/assert";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const currentWeekPeriod = () => {
  const d = new Date();
  // Same shape used by the front-end: W{week}-{year}-{month}
  const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86_400_000) + onejan.getUTCDay() + 1) / 7);
  return `W${week}-${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
};

const pastPeriod = () => {
  // Pick a period clearly in the past (4 weeks ago).
  const d = new Date(Date.now() - 28 * 86_400_000);
  const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86_400_000) + onejan.getUTCDay() + 1) / 7);
  return `W${week}-${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
};

const makeUser = async (): Promise<{ id: string; client: SupabaseClient; cleanup: () => Promise<void> }> => {
  const email = `test-${crypto.randomUUID()}@blackpal.test`;
  const password = `Pwd-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("user_create_failed");
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password });
  return {
    id: data.user.id,
    client,
    cleanup: async () => {
      await admin.from("contest_claims").delete().eq("user_id", data.user.id);
      await admin.from("user_activities").delete().eq("user_id", data.user.id);
      await admin.from("user_wallets").delete().eq("user_id", data.user.id);
      await admin.auth.admin.deleteUser(data.user.id);
    },
  };
};

Deno.test("claim_contest_prize :: unauthenticated returns code 'unauthenticated'", async () => {
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data } = await anon.rpc("claim_contest_prize", { p_contest_period: pastPeriod() });
  assertEquals((data as any)?.success, false);
  assertEquals((data as any)?.code, "unauthenticated");
});

Deno.test("claim_contest_prize :: contest_active when period end is in the future", async () => {
  const u = await makeUser();
  try {
    const { data } = await u.client.rpc("claim_contest_prize", { p_contest_period: currentWeekPeriod() });
    assertEquals((data as any)?.success, false);
    assertEquals((data as any)?.code, "contest_active");
  } finally { await u.cleanup(); }
});

Deno.test("claim_contest_prize :: no_trades when user has zero qualifying activities", async () => {
  const u = await makeUser();
  try {
    const { data } = await u.client.rpc("claim_contest_prize", { p_contest_period: pastPeriod() });
    assertEquals((data as any)?.success, false);
    assertEquals((data as any)?.code, "no_trades");
  } finally { await u.cleanup(); }
});

Deno.test("claim_contest_prize :: already_claimed and wallet not double-credited", async () => {
  const u = await makeUser();
  try {
    // Seed a winning trade in the past period window.
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    await admin.from("user_activities").insert({
      user_id: u.id,
      activity_type: "trade_closed",
      title: "Test trade",
      metadata: { pnl: 1234.56 },
      created_at: sevenDaysAgo,
    });

    const period = pastPeriod();
    const { data: first } = await u.client.rpc("claim_contest_prize", { p_contest_period: period });
    assertEquals((first as any)?.success, true, `expected first claim ok, got ${JSON.stringify(first)}`);
    const firstAmount = Number((first as any).amount);
    assert(firstAmount > 0);

    // Capture wallet balance after first claim.
    const { data: token } = await admin.from("tokens").select("id").eq("symbol", "BTK").maybeSingle();
    const { data: w1 } = await admin
      .from("user_wallets").select("balance").eq("user_id", u.id).eq("token_id", token!.id).maybeSingle();
    const balAfterFirst = Number(w1?.balance ?? 0);

    // Second call must be blocked with already_claimed.
    const { data: second } = await u.client.rpc("claim_contest_prize", { p_contest_period: period });
    assertEquals((second as any)?.success, false);
    assertEquals((second as any)?.code, "already_claimed");

    // Wallet balance must be unchanged.
    const { data: w2 } = await admin
      .from("user_wallets").select("balance").eq("user_id", u.id).eq("token_id", token!.id).maybeSingle();
    assertEquals(Number(w2?.balance ?? 0), balAfterFirst, "wallet was double-credited!");

    // Exactly one row in contest_claims.
    const { data: claims } = await admin.from("contest_claims").select("id").eq("user_id", u.id).eq("contest_period", period);
    assertEquals(claims?.length, 1);
  } finally { await u.cleanup(); }
});
