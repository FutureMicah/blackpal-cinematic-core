import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CountryData {
  country_code: string;
  country_name: string;
  region: string;
  currency: string;
  student_fee: number;
  investor_fee: number;
  payment_methods: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    console.log('Detecting country for IP:', clientIp);

    // Try to detect country from Cloudflare headers first
    let countryCode = req.headers.get('cf-ipcountry') || 
                      req.headers.get('x-vercel-ip-country') ||
                      null;

    // If no header detected, use IP geolocation API
    if (!countryCode || countryCode === 'XX') {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`);
        const geoData = await geoResponse.json();
        countryCode = geoData.country_code;
        console.log('Country detected via IP API:', countryCode);
      } catch (error) {
        console.error('IP geolocation failed:', error);
        countryCode = 'DEFAULT';
      }
    }

    // Default to international if detection fails
    if (!countryCode) {
      countryCode = 'DEFAULT';
    }

    // Query Supabase for country pricing
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const pricingResponse = await fetch(
      `${supabaseUrl}/rest/v1/country_pricing?country_code=eq.${countryCode}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    let countryData: CountryData | null = null;
    
    if (pricingResponse.ok) {
      const data = await pricingResponse.json();
      if (data && data.length > 0) {
        countryData = data[0];
      }
    }

    // Fallback to DEFAULT pricing if country not found
    if (!countryData) {
      const defaultResponse = await fetch(
        `${supabaseUrl}/rest/v1/country_pricing?country_code=eq.DEFAULT`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const defaultData = await defaultResponse.json();
      countryData = defaultData[0];
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          detected_ip: clientIp,
          ...countryData,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error detecting country:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});