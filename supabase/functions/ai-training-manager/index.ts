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
    // --- Auth validation ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: personnel } = await supabaseAuth.from('personnel').select('tenant_id').eq('auth_user_id', user.id).single();
    if (!personnel?.tenant_id) {
      return new Response(JSON.stringify({ error: 'Accès interdit' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const tenantId = personnel.tenant_id;
    // --- End auth validation ---

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, model_id, session_id, epochs, progress, accuracy } = await req.json();

    console.log(`AI Training Manager - Action: ${action}, Tenant: ${tenantId}`);

    switch (action) {
      case 'start_training': {
        const { data, error } = await supabase.rpc('start_ai_model_training', {
          p_tenant_id: tenantId,
          p_model_id: model_id,
          p_epochs: epochs || 50
        });
        if (error) throw error;
        console.log(`Training started for model ${model_id}:`, data);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'update_progress': {
        const { data, error } = await supabase.rpc('update_training_progress', {
          p_session_id: session_id,
          p_epochs_completed: progress,
          p_current_accuracy: accuracy
        });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'complete_training': {
        const { data, error } = await supabase.rpc('complete_training_session', {
          p_session_id: session_id,
          p_final_accuracy: accuracy,
          p_status: 'completed'
        });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'cancel_training': {
        const { error } = await supabase
          .from('ai_training_sessions')
          .update({ status: 'cancelled', completed_at: new Date().toISOString() })
          .eq('id', session_id);
        if (error) throw error;
        await supabase
          .from('ai_learning_models')
          .update({ status: 'pending', progress: 0 })
          .eq('id', model_id);
        return new Response(JSON.stringify({ success: true, message: 'Training cancelled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_metrics': {
        const { data, error } = await supabase.rpc('get_ai_learning_metrics', { p_tenant_id: tenantId });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'simulate_training': {
        const simulatedProgress = Math.min(100, (progress || 0) + Math.random() * 10);
        const simulatedAccuracy = (accuracy || 85) + Math.random() * 0.5;
        return new Response(JSON.stringify({
          success: true,
          progress: Math.round(simulatedProgress),
          accuracy: Math.round(simulatedAccuracy * 100) / 100
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Action inconnue' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('AI Training Manager error:', error);
    return new Response(JSON.stringify({ error: 'Une erreur est survenue' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
