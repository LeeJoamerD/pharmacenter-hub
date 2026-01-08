import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pharmaml_url } = await req.json();

    if (!pharmaml_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL PharmaML manquante' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Testing PharmaML connection to: ${pharmaml_url}`);

    // Test de connexion au serveur PharmaML
    const startTime = Date.now();
    
    try {
      const response = await fetch(pharmaml_url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
        },
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();

      // Le serveur PharmaML répond généralement avec une page HTML ou XML
      const isReachable = response.status >= 200 && response.status < 500;

      console.log(`PharmaML response: status=${response.status}, duration=${duration}ms`);

      return new Response(
        JSON.stringify({
          success: isReachable,
          status: response.status,
          statusText: response.statusText,
          duration_ms: duration,
          message: isReachable 
            ? `Serveur PharmaML accessible (${duration}ms)` 
            : `Erreur de connexion: ${response.statusText}`,
          // Inclure un aperçu de la réponse pour le debug
          response_preview: responseText.substring(0, 200),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      const duration = Date.now() - startTime;
      console.error('PharmaML fetch error:', fetchError);

      return new Response(
        JSON.stringify({
          success: false,
          status: 0,
          duration_ms: duration,
          message: `Impossible de joindre le serveur: ${fetchError.message}`,
          error: fetchError.message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('PharmaML test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
