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
    const { question, consultation_type, context_data, tenant_id } = await req.json();

    if (!question || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Question et tenant_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service IA non configuré' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build specialized system prompt based on consultation type
    let systemPrompt = `Tu es un expert comptable et fiscal spécialisé dans le système SYSCOHADA (Système Comptable OHADA) utilisé en Afrique francophone.
Tu assistes les pharmacies et entreprises dans leurs questions comptables, fiscales et de conformité.

Expertise principale:
- Plan Comptable OHADA et normes SYSCOHADA
- Fiscalité des entreprises pharmaceutiques (TVA, IS, Patente, IRPP)
- Déclarations fiscales et obligations légales
- Optimisation fiscale légale
- Écritures comptables et saisie des opérations
- Balance, Grand Livre, Journal
- Rapprochement bancaire
- Clôture des exercices comptables

Contexte régional: CEMAC/UEMOA, devises XAF/XOF

Instructions:
- Réponds toujours en français
- Sois précis et cite les références légales quand pertinent
- Propose des solutions concrètes et actionnables
- Si la question dépasse ton expertise, recommande de consulter un expert-comptable agréé`;

    switch (consultation_type) {
      case 'fiscal':
        systemPrompt += `\n\nFocus spécifique: Questions fiscales, déclarations, optimisation fiscale, TVA, IS, obligations fiscales.`;
        break;
      case 'accounting':
        systemPrompt += `\n\nFocus spécifique: Écritures comptables, plan comptable OHADA, balance, grand livre, journal.`;
        break;
      case 'tax_optimization':
        systemPrompt += `\n\nFocus spécifique: Stratégies d'optimisation fiscale légales, déductions, crédits d'impôt, provisions.`;
        break;
      case 'compliance':
        systemPrompt += `\n\nFocus spécifique: Conformité réglementaire, audit, contrôles fiscaux, documentation obligatoire.`;
        break;
      case 'audit':
        systemPrompt += `\n\nFocus spécifique: Préparation audit, contrôle fiscal, documentation, justificatifs.`;
        break;
    }

    // Add context if provided
    let userPrompt = question;
    if (context_data) {
      const ctx = context_data;
      let contextInfo = '\n\nContexte actuel de l\'entreprise:';
      if (ctx.total_entries) contextInfo += `\n- Nombre d\'écritures: ${ctx.total_entries}`;
      if (ctx.fiscal_year) contextInfo += `\n- Exercice fiscal: ${ctx.fiscal_year}`;
      if (ctx.pending_anomalies) contextInfo += `\n- Anomalies en attente: ${ctx.pending_anomalies}`;
      if (ctx.upcoming_obligations) contextInfo += `\n- Obligations à venir: ${ctx.upcoming_obligations}`;
      if (ctx.accounting_system) contextInfo += `\n- Système comptable: ${ctx.accounting_system}`;
      userPrompt = question + contextInfo;
    }

    console.log(`[accounting-expert] Consultation type: ${consultation_type}, tenant: ${tenant_id}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[accounting-expert] AI Gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits IA épuisés. Veuillez recharger votre compte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erreur du service IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await response.json();
    const aiResponse = aiResult.choices?.[0]?.message?.content || 'Aucune réponse générée.';
    
    // Calculate confidence based on response length and structure
    const confidence = Math.min(0.95, 0.7 + (aiResponse.length > 500 ? 0.15 : 0) + (aiResponse.includes('Article') || aiResponse.includes('OHADA') ? 0.1 : 0));

    console.log(`[accounting-expert] Response generated, confidence: ${confidence}`);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        confidence: confidence,
        consultation_type: consultation_type || 'general',
        model_used: 'gemini-2.5-flash'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[accounting-expert] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
