import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsultationRequest {
  question: string;
  consultationType: 'drug_info' | 'interaction' | 'dosage' | 'contraindication' | 'recommendation' | 'general';
  context?: {
    drugNames?: string[];
    patientInfo?: string;
    currentMedications?: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, consultationType, context } = await req.json() as ConsultationRequest;

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'La question est requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build specialized pharmaceutical prompt
    const systemPrompt = `Tu es un expert pharmaceutique et pharmacologue clinicien hautement qualifié.
Tu réponds aux questions avec précision, en te basant sur les données scientifiques et les recommandations officielles.
Tu fournis toujours les sources et le niveau de preuve de tes recommandations quand possible.
Tu signales systématiquement les contre-indications et interactions importantes.

Pour chaque réponse:
- Sois précis et concis
- Cite les sources officielles (ANSM, EMA, FDA, HAS) quand applicable
- Indique le niveau de preuve (A, B, C) si pertinent
- Signale les précautions d'emploi importantes
- Mentionne les alternatives si approprié

Pour les recommandations thérapeutiques, indique:
- Traitements de 1ère intention
- Alternatives thérapeutiques
- Contre-indications principales
- Durée recommandée
- Points de surveillance

Pour les interactions, indique:
- Niveau de sévérité (mineur, modéré, majeur, contre-indiqué)
- Mécanisme de l'interaction
- Conduite à tenir
- Alternatives possibles

IMPORTANT: Tu réponds UNIQUEMENT en français.`;

    let userPrompt = question;

    // Enhance prompt based on consultation type
    if (consultationType === 'drug_info' && context?.drugNames?.length) {
      userPrompt = `Information sur le médicament "${context.drugNames[0]}": ${question}`;
    } else if (consultationType === 'interaction' && context?.drugNames?.length) {
      userPrompt = `Vérification d'interaction entre: ${context.drugNames.join(' et ')}. ${question}`;
    } else if (consultationType === 'dosage') {
      userPrompt = `Question sur la posologie: ${question}`;
      if (context?.patientInfo) {
        userPrompt += ` Contexte patient: ${context.patientInfo}`;
      }
    } else if (consultationType === 'contraindication') {
      userPrompt = `Vérification des contre-indications: ${question}`;
    } else if (consultationType === 'recommendation') {
      userPrompt = `Recommandation thérapeutique: ${question}`;
    }

    if (context?.currentMedications?.length) {
      userPrompt += ` Traitement actuel du patient: ${context.currentMedications.join(', ')}.`;
    }

    console.log('Sending pharma consultation request:', { consultationType, questionLength: question.length });

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more factual responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.',
            retryAfter: 30 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content || '';

    // Calculate confidence based on response characteristics
    let confidence = 0.85;
    if (aiContent.includes('ANSM') || aiContent.includes('EMA') || aiContent.includes('HAS')) {
      confidence = 0.95;
    } else if (aiContent.includes('peut-être') || aiContent.includes('probablement')) {
      confidence = 0.7;
    }

    console.log('Pharma consultation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        response: aiContent,
        confidence: confidence,
        consultationType: consultationType,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pharma consultation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Une erreur est survenue lors de la consultation',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
