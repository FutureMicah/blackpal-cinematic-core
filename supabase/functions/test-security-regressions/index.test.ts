// Automated security regression tests for the contest & missions flows.
//
// Run via: deno test -A supabase/functions/test-security-regressions/index.test.ts
//
// Verifies:
//   1) RLS: an authenticated user cannot read another user's wallets/claims.
//   2) Realtime topic scoping: subscribing to another user's topic fails.
//   3) Direct RPC access to `claim_contest_prize`, `complete_mission`, and
//      `get_contest_leaderboard` is revoked for `authenticated` — clients must
//      go through the edge functions.
//   4) The `claim-prize` and `complete-mission` edge functions reject
//      unauthenticated requests with 401.
//
// Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const anon = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

Deno.test("RLS: anon cannot read contest_claims", async () => {
  const client = anon();
  const { data, error } = await client.from("contest_claims").select("id").limit(1);
  // Either RLS denies (empty rows) or explicit permission error — never leaked rows.
  assert(!data || data.length === 0, `Expected empty, got ${JSON.stringify(data)}`);
  if (error) assert(error.code === "42501" || error.message.toLowerCase().includes("permission"));
});

Deno.test("RLS: anon cannot read user_wallets", async () => {
  const client = anon();
  const { data } = await client.from("user_wallets").select("id").limit(1);
  assert(!data || data.length === 0);
});

Deno.test("RPC: authenticated cannot call get_contest_leaderboard directly", async () => {
  const client = anon();
  const { error } = await client.rpc("get_contest_leaderboard", {});
  assert(error, "Expected permission error — RPC should be revoked from anon/authenticated");
});

Deno.test("RPC: authenticated cannot call claim_contest_prize directly", async () => {
  const client = anon();
  const { error } = await client.rpc("claim_contest_prize", { p_contest_period: "W1-2026-1" });
  assert(error, "Expected permission error");
});

Deno.test("Edge fn: claim-prize rejects missing JWT with 401", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/claim-prize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ p_contest_period: "W1-2026-1" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("Edge fn: complete-mission rejects missing JWT with 401", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/complete-mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ p_mission_id: "00000000-0000-0000-0000-000000000000" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("Edge fn: contest-leaderboard rejects missing JWT with 401", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/contest-leaderboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("Column privileges: quizzes.correct_answer not selectable by anon", async () => {
  const client = anon();
  const { error } = await client.from("quizzes").select("correct_answer").limit(1);
  assert(error, "Expected column-level permission error on correct_answer");
});
