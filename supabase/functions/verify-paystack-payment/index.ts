import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Server-side verification of a Paystack transaction.
 * The frontend MUST call this with the `reference` returned by Paystack.
 * We never trust the client-side `onSuccess` callback alone — we re-verify
 * the transaction with Paystack using the secret key (held only on the server),
 * then mark the user's subscription active in the database.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

    // Authenticate the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { reference } = await req.json();
    if (!reference || typeof reference !== "string" || reference.length > 200) {
      return new Response(JSON.stringify({ success: false, error: "Invalid reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paystackSecret) {
      console.error("PAYSTACK_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Payment verification temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || !verifyJson?.status || verifyJson?.data?.status !== "success") {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const txEmail = (verifyJson.data.customer?.email || "").toLowerCase();
    if (txEmail && user.email && txEmail !== user.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment does not match account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record the transaction with service role (bypasses RLS for server-managed write)
    const admin = createClient(supabaseUrl, serviceKey);
    await admin.from("payment_transactions").insert({
      user_id: user.id,
      transaction_type: "subscription",
      amount: (verifyJson.data.amount ?? 0) / 100,
      currency: verifyJson.data.currency ?? "NGN",
      payment_method: "paystack",
      status: "completed",
      payment_reference: reference,
      metadata: { paystack: verifyJson.data },
    });

    return new Response(
      JSON.stringify({ success: true, amount: verifyJson.data.amount / 100 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("verify-paystack-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
