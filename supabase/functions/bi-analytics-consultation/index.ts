import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultation_type, context, question, tenant_id } = await req.json();

    if (!question) {
      throw new Error('La question est requise');
    }

    // Build context-aware system prompt based on consultation type
    let systemPrompt = `Tu es un expert en Business Intelligence et Analytics pour pharmacies. 
Tu analyses les données commerciales et fournis des recommandations actionnables.
Réponds en français de manière professionnelle et concise.`;

    switch (consultation_type) {
      case 'predictive':
        systemPrompt += `
Tu es spécialisé dans l'analyse prédictive client:
- Prédiction de churn et attrition
- Calcul de la valeur vie client (LTV)
- Scoring risque client
- Next Best Action (NBA)

Contexte actuel:
- Taux d'attrition: ${context?.churn_rate || 'N/A'}%
- LTV moyenne: ${context?.avg_ltv || 'N/A'} FCFA
- Clients à risque: ${context?.at_risk_clients || 'N/A'}
- Total clients: ${context?.total_clients || 'N/A'}`;
        break;

      case 'pattern_discovery':
        systemPrompt += `
Tu es spécialisé dans la découverte de patterns business:
- Corrélations ventes/comportements
- Tendances saisonnières
- Associations produits
- Comportements clients récurrents

Patterns actuels découverts: ${context?.patterns_count || 0}
Patterns actionnables: ${context?.actionable_patterns || 0}`;
        break;

      case 'segmentation':
        systemPrompt += `
Tu es spécialisé dans la segmentation client:
- Clustering comportemental
- Analyse RFM (Récence, Fréquence, Montant)
- Calcul CLV par segment
- Recommandations d'actions par segment

Segments actuels:
${context?.segments?.map((s: any) => `- ${s.segment_name}: ${s.size} clients, CLV ${s.clv} FCFA`).join('\n') || 'Aucun segment défini'}`;
        break;

      case 'optimization':
        systemPrompt += `
Tu es spécialisé dans l'optimisation des processus:
- Analyse des temps opérationnels
- Identification des goulots d'étranglement
- Calcul ROI des améliorations
- Priorisation des optimisations

Processus en cours d'analyse:
${context?.processes?.map((p: any) => `- ${p.process_name}: ${p.current_time_minutes}min → ${p.optimized_time_minutes}min (-${p.improvement_percentage}%)`).join('\n') || 'Aucun processus analysé'}`;
        break;

      default:
        systemPrompt += `
Analyse générale Business Intelligence.
Métriques clés:
- Clients: ${context?.total_clients || 'N/A'}
- Patterns: ${context?.patterns_count || 'N/A'}
- Score risque: ${context?.risk_score || 'N/A'}/100`;
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
        'X-Project-Ref': 'pzsoeapzuijhgemjzydo',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requêtes atteinte. Réessayez dans quelques instants.');
      }
      if (response.status === 402) {
        throw new Error('Crédit AI insuffisant.');
      }
      throw new Error(`Erreur AI Gateway: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in bi-analytics-consultation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
