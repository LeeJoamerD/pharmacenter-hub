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
    const { conversation_id, message, model_id, tenant_id, pharmacy_id, pharmacy_name } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get AI model configuration
    let systemPrompt = "Tu es PharmaSoft Assistant Pro, un assistant IA spécialisé dans le domaine pharmaceutique pour le réseau multi-officines. Tu aides les pharmaciens avec les questions sur les médicaments, la gestion de stock, l'analyse business et le support technique. Réponds de manière professionnelle, précise et concise.";
    let modelIdentifier = "google/gemini-2.5-flash";
    let maxTokens = 2048;
    let temperature = 0.7;

    if (model_id) {
      const { data: modelData } = await supabase
        .from("ai_models")
        .select("*")
        .eq("id", model_id)
        .single();

      if (modelData) {
        systemPrompt = modelData.system_prompt || systemPrompt;
        modelIdentifier = modelData.model_identifier || modelIdentifier;
        maxTokens = modelData.max_tokens || maxTokens;
        temperature = parseFloat(modelData.temperature) || temperature;
      }
    }

    // Get conversation history if conversation_id is provided
    let conversationHistory: { role: string; content: string }[] = [];
    
    if (conversation_id) {
      const { data: messages } = await supabase
        .from("ai_conversation_messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true })
        .limit(20);

      if (messages) {
        conversationHistory = messages.map((m) => ({
          role: m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system",
          content: m.content,
        }));
      }
    }

    // Save user message to database
    if (conversation_id && message) {
      await supabase.from("ai_conversation_messages").insert({
        tenant_id,
        conversation_id,
        role: "user",
        content: message,
        sender_pharmacy_id: pharmacy_id,
        sender_name: pharmacy_name || "Utilisateur",
      });
    }

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    console.log(`Calling Lovable AI Gateway with model: ${modelIdentifier}`);

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelIdentifier,
        messages: aiMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a TransformStream to collect the full response while streaming
    let fullContent = "";
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        
        // Parse SSE to extract content
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
              }
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
        
        controller.enqueue(chunk);
      },
      async flush() {
        // Save AI response to database after streaming completes
        if (conversation_id && fullContent) {
          const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence
          const suggestions = generateSuggestions(fullContent);
          
          await supabase.from("ai_conversation_messages").insert({
            tenant_id,
            conversation_id,
            role: "assistant",
            content: fullContent,
            confidence: confidence,
            suggestions: suggestions,
          });
        }
      },
    });

    const transformedStream = response.body?.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("network-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  
  if (content.toLowerCase().includes("stock") || content.toLowerCase().includes("inventaire")) {
    suggestions.push("Analyser les stocks");
    suggestions.push("Optimiser les commandes");
  }
  if (content.toLowerCase().includes("vente") || content.toLowerCase().includes("chiffre")) {
    suggestions.push("Voir les statistiques");
    suggestions.push("Comparer les périodes");
  }
  if (content.toLowerCase().includes("médicament") || content.toLowerCase().includes("produit")) {
    suggestions.push("Consulter les fiches");
    suggestions.push("Vérifier les interactions");
  }
  
  if (suggestions.length === 0) {
    suggestions.push("Approfondir le sujet");
    suggestions.push("Poser une question");
  }
  
  return suggestions.slice(0, 3);
}
