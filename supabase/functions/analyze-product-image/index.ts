import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { imageBase64, imageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let imageContent;
    if (imageBase64) {
      imageContent = {
        type: "image_url",
        image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` }
      };
    } else if (imageUrl) {
      imageContent = { type: "image_url", image_url: { url: imageUrl } };
    } else {
      throw new Error("Either imageBase64 or imageUrl is required");
    }

    const systemPrompt = `Tu es un assistant spécialisé dans la reconnaissance de produits pharmaceutiques.
Analyse l'image fournie et extrait les informations suivantes de manière précise:

1. **Nom du produit**: Le nom complet du médicament ou produit pharmaceutique visible
2. **Code-barres/CIP**: Le code-barres ou code CIP si lisible (format numérique)
3. **Prix**: Le prix affiché si visible (format numérique avec devise)
4. **Date d'expiration**: La date de péremption si visible (format YYYY-MM-DD)
5. **État de l'emballage**: intact, endommagé, ouvert, ou inconnu
6. **Étiquetage prix**: présent, absent, illisible, ou inconnu
7. **Stock estimé**: Si visible, le nombre d'unités

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:
{
  "product_name": "string ou null",
  "barcode": "string ou null",
  "price": number ou null,
  "expiry_date": "YYYY-MM-DD ou null",
  "packaging_status": "intact" | "damaged" | "opened" | "unknown",
  "price_label_status": "present" | "absent" | "illegible" | "unknown",
  "estimated_stock": number ou null,
  "confidence": number entre 0 et 100,
  "additional_notes": "string avec observations supplémentaires"
}

Ne retourne que le JSON, sans texte explicatif avant ou après.`;

    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: "Analyse cette image de produit pharmaceutique et retourne les informations au format JSON." },
            imageContent
          ]}
        ],
        max_tokens: 1000,
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.error("AI Gateway error:", response.status);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    let parsedResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      parsedResult = {
        product_name: null, barcode: null, price: null, expiry_date: null,
        packaging_status: "unknown", price_label_status: "unknown",
        estimated_stock: null, confidence: 0,
        additional_notes: "Failed to parse AI response",
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedResult, processing_time_ms: processingTime }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-product-image:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
