import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { provider_type, api_endpoint, api_key, model_name } = await req.json();

    console.log(`Testing AI provider connection: ${provider_type}`);
    const startTime = Date.now();

    let testResult = {
      success: false,
      latency_ms: 0,
      message: '',
      model_info: null as any,
    };

    // Test based on provider type
    if (provider_type === 'ai_gateway' || provider_type === 'lovable') {
      // Test Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        testResult = {
          success: false,
          latency_ms: Date.now() - startTime,
          message: 'LOVABLE_API_KEY non configurée',
          model_info: null,
        };
      } else {
        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model_name || "google/gemini-2.5-flash",
              messages: [
                { role: "user", content: "Réponds uniquement par 'OK' pour tester la connexion." }
              ],
              max_tokens: 10,
            }),
          });

          const latency = Date.now() - startTime;

          if (response.ok) {
            const data = await response.json();
            testResult = {
              success: true,
              latency_ms: latency,
              message: 'Connexion réussie à Lovable AI Gateway',
              model_info: {
                model: data.model || model_name,
                provider: 'Lovable AI Gateway',
              },
            };
          } else {
            const errorText = await response.text();
            testResult = {
              success: false,
              latency_ms: latency,
              message: `Erreur ${response.status}: ${errorText.substring(0, 200)}`,
              model_info: null,
            };
          }
        } catch (error) {
          testResult = {
            success: false,
            latency_ms: Date.now() - startTime,
            message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            model_info: null,
          };
        }
      }
    } else if (provider_type === 'openai' && api_key) {
      // Test OpenAI API
      try {
        const endpoint = api_endpoint || 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model_name || "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
            max_tokens: 5,
          }),
        });

        const latency = Date.now() - startTime;

        if (response.ok) {
          testResult = {
            success: true,
            latency_ms: latency,
            message: 'Connexion réussie à OpenAI',
            model_info: { model: model_name, provider: 'OpenAI' },
          };
        } else {
          testResult = {
            success: false,
            latency_ms: latency,
            message: `Erreur OpenAI: ${response.status}`,
            model_info: null,
          };
        }
      } catch (error) {
        testResult = {
          success: false,
          latency_ms: Date.now() - startTime,
          message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          model_info: null,
        };
      }
    } else if (provider_type === 'gemini' && api_key) {
      // Test Google Gemini API directly
      try {
        const model = model_name || 'gemini-pro';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`;
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });

        const latency = Date.now() - startTime;

        if (response.ok) {
          testResult = {
            success: true,
            latency_ms: latency,
            message: 'Connexion réussie à Google Gemini',
            model_info: { model: model_name, provider: 'Google Gemini' },
          };
        } else {
          testResult = {
            success: false,
            latency_ms: latency,
            message: `Erreur Gemini: ${response.status}`,
            model_info: null,
          };
        }
      } catch (error) {
        testResult = {
          success: false,
          latency_ms: Date.now() - startTime,
          message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          model_info: null,
        };
      }
    } else if (provider_type === 'custom' && api_endpoint) {
      // Test custom endpoint with simple GET/POST
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (api_key) headers['Authorization'] = `Bearer ${api_key}`;

        const response = await fetch(api_endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ test: true }),
        });

        const latency = Date.now() - startTime;

        testResult = {
          success: response.ok,
          latency_ms: latency,
          message: response.ok ? 'Endpoint accessible' : `Erreur: ${response.status}`,
          model_info: { endpoint: api_endpoint, provider: 'Custom' },
        };
      } catch (error) {
        testResult = {
          success: false,
          latency_ms: Date.now() - startTime,
          message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          model_info: null,
        };
      }
    } else {
      testResult = {
        success: false,
        latency_ms: Date.now() - startTime,
        message: 'Type de fournisseur non supporté ou clé API manquante',
        model_info: null,
      };
    }

    console.log(`Test result: ${testResult.success ? 'SUCCESS' : 'FAILED'} - ${testResult.latency_ms}ms`);

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in ai-integration-test:', error);
    return new Response(
      JSON.stringify({
        success: false,
        latency_ms: 0,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        model_info: null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
