import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SentimentAnalysisRequest {
  text: string;
  tenant_id: string;
  source?: string;
  category?: string;
  client_id?: string;
  save_result?: boolean;
}

interface SentimentResult {
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  score: number;
  emotions: string[];
  keywords: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { text, tenant_id, source = 'manual', category, client_id, save_result = true }: SentimentAnalysisRequest = await req.json();

    if (!text || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "text and tenant_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI Gateway for sentiment analysis
    const systemPrompt = `Tu es un expert en analyse de sentiment pour le domaine pharmaceutique. Analyse le texte fourni et retourne un JSON avec:
- sentiment: une des valeurs exactes parmi "very_positive", "positive", "neutral", "negative", "very_negative"
- score: un nombre décimal entre 0 et 1 représentant l'intensité (0.95 pour très positif, 0.75 pour positif, 0.50 pour neutre, 0.25 pour négatif, 0.05 pour très négatif)
- emotions: un tableau de mots décrivant les émotions détectées (max 5) en français comme "satisfaction", "confiance", "gratitude", "frustration", "déception", "impatience", "sérénité"
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
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse AI response
    let sentimentResult: SentimentResult;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = aiContent;
      if (aiContent.includes("```json")) {
        jsonStr = aiContent.split("```json")[1].split("```")[0].trim();
      } else if (aiContent.includes("```")) {
        jsonStr = aiContent.split("```")[1].split("```")[0].trim();
      }
      sentimentResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Fallback to neutral sentiment
      sentimentResult = {
        sentiment: 'neutral',
        score: 0.5,
        emotions: ['analyse_échouée'],
        keywords: []
      };
    }

    // Validate and normalize score
    sentimentResult.score = Math.max(0, Math.min(1, sentimentResult.score));

    // Save to database if requested
    let savedAnalysis = null;
    if (save_result) {
      const { data, error: insertError } = await supabase
        .from('ai_sentiment_analyses')
        .insert({
          tenant_id,
          text,
          sentiment: sentimentResult.sentiment,
          score: sentimentResult.score,
          emotions: sentimentResult.emotions || [],
          category,
          source,
          client_id,
          keywords: sentimentResult.keywords || [],
          analysis_metadata: { model: 'google/gemini-2.5-flash', analyzed_at: new Date().toISOString() }
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error saving analysis:", insertError);
      } else {
        savedAnalysis = data;
      }

      // Update keywords frequency
      for (const keyword of (sentimentResult.keywords || [])) {
        const keywordSentiment = sentimentResult.score >= 0.5 ? 'positive' : 'negative';
        
        const { error: upsertError } = await supabase
          .from('ai_sentiment_keywords')
          .upsert({
            tenant_id,
            word: keyword.toLowerCase(),
            sentiment: keywordSentiment,
            frequency: 1,
            last_detected_at: new Date().toISOString()
          }, {
            onConflict: 'tenant_id,word',
            ignoreDuplicates: false
          });

        if (!upsertError) {
          // Increment frequency for existing keyword
          await supabase.rpc('increment_keyword_frequency', {
            p_tenant_id: tenant_id,
            p_word: keyword.toLowerCase()
          }).catch(() => {
            // RPC might not exist, that's ok
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: sentimentResult,
        analysis: savedAnalysis
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-sentiment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
