import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { country_code, country_name, region, xp_gained, milestone } = await req.json();

    console.log('Updating country activity:', { country_code, country_name, region });

    // Check if activity record exists
    const { data: existingActivity } = await supabaseClient
      .from('country_activity')
      .select('*')
      .eq('country_code', country_code)
      .eq('region', region || 'General')
      .single();

    if (existingActivity) {
      // Update existing record
      const updates: any = {
        total_xp: existingActivity.total_xp + (xp_gained || 0),
        updated_at: new Date().toISOString(),
      };

      // Add milestone if provided
      if (milestone) {
        const milestones = Array.isArray(existingActivity.recent_milestones) 
          ? existingActivity.recent_milestones 
          : [];
        milestones.unshift({ ...milestone, timestamp: new Date().toISOString() });
        updates.recent_milestones = milestones.slice(0, 10); // Keep only last 10
      }

      const { error: updateError } = await supabaseClient
        .from('country_activity')
        .update(updates)
        .eq('id', existingActivity.id);

      if (updateError) {
        console.error('Error updating activity:', updateError);
        throw updateError;
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseClient
        .from('country_activity')
        .insert({
          country_code,
          country_name,
          region: region || 'General',
          city: '',
          active_users: 1,
          total_xp: xp_gained || 0,
          recent_milestones: milestone ? [{ ...milestone, timestamp: new Date().toISOString() }] : [],
        });

      if (insertError) {
        console.error('Error creating activity:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Country activity updated' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in update-country-activity:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
