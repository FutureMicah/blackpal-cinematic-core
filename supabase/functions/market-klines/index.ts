import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/klines",
  "https://api.binance.com/api/v3/klines",
  "https://api1.binance.com/api/v3/klines",
  "https://api2.binance.com/api/v3/klines",
];

const TICKERS = [
  "https://data-api.binance.vision/api/v3/ticker/24hr",
  "https://api.binance.com/api/v3/ticker/24hr",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const interval = url.searchParams.get("interval") || "5m";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 500);
  const kind = url.searchParams.get("kind") || "klines"; // klines | ticker

  if (!symbol) {
    return new Response(JSON.stringify({ error: "symbol required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const endpoints = kind === "ticker" ? TICKERS : ENDPOINTS;

  for (const endpoint of endpoints) {
    const qs = kind === "ticker"
      ? `?symbol=${symbol}`
      : `?symbol=${symbol}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(endpoint + qs, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const body = await res.text();
      return new Response(body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=5",
        },
      });
    } catch {
      continue;
    }
  }

  return new Response(JSON.stringify({ error: "upstream unavailable" }), {
    status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
