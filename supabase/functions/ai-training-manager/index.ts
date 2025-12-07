import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, tenant_id, model_id, session_id, epochs, progress, accuracy } = await req.json();

    console.log(`AI Training Manager - Action: ${action}, Tenant: ${tenant_id}`);

    switch (action) {
      case 'start_training': {
        // Start training for a model
        const { data, error } = await supabase.rpc('start_ai_model_training', {
          p_tenant_id: tenant_id,
          p_model_id: model_id,
          p_epochs: epochs || 50
        });

        if (error) throw error;

        console.log(`Training started for model ${model_id}:`, data);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_progress': {
        // Update training progress
        const { data, error } = await supabase.rpc('update_training_progress', {
          p_session_id: session_id,
          p_epochs_completed: progress,
          p_current_accuracy: accuracy
        });

        if (error) throw error;

        console.log(`Progress updated for session ${session_id}:`, data);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'complete_training': {
        // Complete training session
        const { data, error } = await supabase.rpc('complete_training_session', {
          p_session_id: session_id,
          p_final_accuracy: accuracy,
          p_status: 'completed'
        });

        if (error) throw error;

        console.log(`Training completed for session ${session_id}:`, data);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cancel_training': {
        // Cancel training session
        const { error } = await supabase
          .from('ai_training_sessions')
          .update({ status: 'cancelled', completed_at: new Date().toISOString() })
          .eq('id', session_id);

        if (error) throw error;

        // Reset model status
        await supabase
          .from('ai_learning_models')
          .update({ status: 'pending', progress: 0 })
          .eq('id', model_id);

        console.log(`Training cancelled for session ${session_id}`);
        return new Response(JSON.stringify({ success: true, message: 'Training cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_metrics': {
        // Get learning metrics
        const { data, error } = await supabase.rpc('get_ai_learning_metrics', {
          p_tenant_id: tenant_id
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'simulate_training': {
        // Simulate training progression for demo purposes
        const simulatedProgress = Math.min(100, (progress || 0) + Math.random() * 10);
        const simulatedAccuracy = (accuracy || 85) + Math.random() * 0.5;

        return new Response(JSON.stringify({
          success: true,
          progress: Math.round(simulatedProgress),
          accuracy: Math.round(simulatedAccuracy * 100) / 100
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('AI Training Manager error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
