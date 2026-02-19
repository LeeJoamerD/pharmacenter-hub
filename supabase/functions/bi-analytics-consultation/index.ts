import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { consultation_type, context, question } = await req.json();

    if (!question) {
      throw new Error('La question est requise');
    }

    let systemPrompt = `Tu es un expert en Business Intelligence et Analytics pour pharmacies. 
Tu analyses les données commerciales et fournis des recommandations actionnables.
Réponds en français de manière professionnelle et concise.`;

    switch (consultation_type) {
      case 'predictive':
        systemPrompt += `\nTu es spécialisé dans l'analyse prédictive client:\n- Prédiction de churn et attrition\n- Calcul de la valeur vie client (LTV)\n- Scoring risque client\n- Next Best Action (NBA)\n\nContexte actuel:\n- Taux d'attrition: ${context?.churn_rate || 'N/A'}%\n- LTV moyenne: ${context?.avg_ltv || 'N/A'} FCFA\n- Clients à risque: ${context?.at_risk_clients || 'N/A'}\n- Total clients: ${context?.total_clients || 'N/A'}`;
        break;
      case 'pattern_discovery':
        systemPrompt += `\nTu es spécialisé dans la découverte de patterns business.\nPatterns actuels découverts: ${context?.patterns_count || 0}\nPatterns actionnables: ${context?.actionable_patterns || 0}`;
        break;
      case 'segmentation':
        systemPrompt += `\nTu es spécialisé dans la segmentation client.\nSegments actuels:\n${context?.segments?.map((s: any) => `- ${s.segment_name}: ${s.size} clients, CLV ${s.clv} FCFA`).join('\n') || 'Aucun segment défini'}`;
        break;
      case 'optimization':
        systemPrompt += `\nTu es spécialisé dans l'optimisation des processus.\nProcessus en cours d'analyse:\n${context?.processes?.map((p: any) => `- ${p.process_name}: ${p.current_time_minutes}min → ${p.optimized_time_minutes}min (-${p.improvement_percentage}%)`).join('\n') || 'Aucun processus analysé'}`;
        break;
      default:
        systemPrompt += `\nAnalyse générale Business Intelligence.\nMétriques clés:\n- Clients: ${context?.total_clients || 'N/A'}\n- Patterns: ${context?.patterns_count || 'N/A'}\n- Score risque: ${context?.risk_score || 'N/A'}/100`;
    }

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
      console.error('AI Gateway error:', response.status);
      if (response.status === 429) throw new Error('Limite de requêtes atteinte.');
      if (response.status === 402) throw new Error('Crédit AI insuffisant.');
      throw new Error(`Erreur AI Gateway: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error) {
    console.error('Error in bi-analytics-consultation:', error);
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
