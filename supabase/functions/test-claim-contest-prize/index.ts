// Stub edge function to host integration tests for the claim_contest_prize RPC.
// The actual tests live in index.test.ts.
import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(
    JSON.stringify({ ok: true, info: "Run `lovable-exec test` for integration tests." }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
