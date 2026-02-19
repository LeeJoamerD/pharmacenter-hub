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
      return new Response(JSON.stringify({ success: false, error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // --- End auth validation ---

    const { pharmaml_url } = await req.json();

    if (!pharmaml_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL PharmaML manquante' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Testing PharmaML connection to: ${pharmaml_url}`);

    const startTime = Date.now();
    
    try {
      const response = await fetch(pharmaml_url, {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml' },
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();
      const isReachable = response.status >= 200 && response.status < 500;

      return new Response(
        JSON.stringify({
          success: isReachable, status: response.status, statusText: response.statusText,
          duration_ms: duration,
          message: isReachable ? `Serveur PharmaML accessible (${duration}ms)` : `Erreur de connexion: ${response.statusText}`,
          response_preview: responseText.substring(0, 200),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      const duration = Date.now() - startTime;
      return new Response(
        JSON.stringify({ success: false, status: 0, duration_ms: duration, message: 'Impossible de joindre le serveur' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('PharmaML test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Une erreur est survenue' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
