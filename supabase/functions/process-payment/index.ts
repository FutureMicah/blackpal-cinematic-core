import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      user_id, 
      amount, 
      currency, 
      payment_method, 
      transaction_type,
      screenshot_url,
      payment_reference,
      metadata 
    } = await req.json();

    console.log('Processing payment:', { user_id, amount, currency, payment_method });

    // Validate required fields
    if (!user_id || !amount || !currency || !payment_method) {
      throw new Error('Missing required payment fields');
    }

    // Create payment transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        transaction_type: transaction_type || 'registration_fee',
        amount,
        currency,
        payment_method,
        status: screenshot_url ? 'processing' : 'pending',
        screenshot_url,
        payment_reference,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      throw transactionError;
    }

    console.log('Payment transaction created:', transaction.id);

    // If screenshot is provided, mark as processing (requires manual verification)
    // If Paystack payment, it will be verified via webhook
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transaction_id: transaction.id,
          status: transaction.status,
          message: screenshot_url 
            ? 'Payment received. Awaiting verification (usually within 10-30 minutes).'
            : 'Payment initiated. Complete payment to proceed.',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});