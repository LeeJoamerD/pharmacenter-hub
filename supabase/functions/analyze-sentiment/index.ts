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
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: personnelData } = await supabaseAuth.from('personnel').select('tenant_id').eq('auth_user_id', user.id).single();
    if (!personnelData?.tenant_id) {
      return new Response(JSON.stringify({ error: 'Accès interdit' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const tenantId = personnelData.tenant_id;
    // --- End auth validation ---

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { text, source = 'manual', category, client_id, save_result = true } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Le texte est requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es un expert en analyse de sentiment pour le domaine pharmaceutique. Analyse le texte fourni et retourne un JSON avec:
- sentiment: une des valeurs exactes parmi "very_positive", "positive", "neutral", "negative", "very_negative"
- score: un nombre décimal entre 0 et 1
- emotions: un tableau de mots décrivant les émotions détectées (max 5) en français
- keywords: un tableau des mots-clés importants du texte (max 5)

Réponds UNIQUEMENT avec le JSON valide, sans explication.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse le sentiment de ce texte: "${text}"` }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    let sentimentResult;
    try {
      let jsonStr = aiContent;
      if (aiContent.includes("```json")) {
        jsonStr = aiContent.split("```json")[1].split("```")[0].trim();
      } else if (aiContent.includes("```")) {
        jsonStr = aiContent.split("```")[1].split("```")[0].trim();
      }
      sentimentResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      sentimentResult = { sentiment: 'neutral', score: 0.5, emotions: ['analyse_échouée'], keywords: [] };
    }

    sentimentResult.score = Math.max(0, Math.min(1, sentimentResult.score));

    let savedAnalysis = null;
    if (save_result) {
      const { data, error: insertError } = await supabase
        .from('ai_sentiment_analyses')
        .insert({
          tenant_id: tenantId,
          text, sentiment: sentimentResult.sentiment, score: sentimentResult.score,
          emotions: sentimentResult.emotions || [], category, source, client_id,
          keywords: sentimentResult.keywords || [],
          analysis_metadata: { model: 'google/gemini-2.5-flash', analyzed_at: new Date().toISOString() }
        })
        .select().single();

      if (insertError) console.error("Error saving analysis:", insertError);
      else savedAnalysis = data;

      for (const keyword of (sentimentResult.keywords || [])) {
        const keywordSentiment = sentimentResult.score >= 0.5 ? 'positive' : 'negative';
        await supabase.from('ai_sentiment_keywords').upsert({
          tenant_id: tenantId, word: keyword.toLowerCase(), sentiment: keywordSentiment,
          frequency: 1, last_detected_at: new Date().toISOString()
        }, { onConflict: 'tenant_id,word', ignoreDuplicates: false });
      }
    }

    return new Response(
      JSON.stringify({ success: true, result: sentimentResult, analysis: savedAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-sentiment:", error);
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
