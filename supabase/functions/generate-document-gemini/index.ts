import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  templateId?: string;
  templateType?: string;
  variables: Record<string, any>;
  customPrompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { templateId, templateType, variables, customPrompt }: GenerationRequest = await req.json();

    let prompt = customPrompt || '';

    // If templateId or templateType is provided, get the template
    if (templateId || templateType) {
      const query = supabase
        .from('ai_templates')
        .select('*');

      if (templateId) {
        query.eq('id', templateId);
      } else if (templateType) {
        query.eq('type', templateType);
      }

      const { data: templates, error: templateError } = await query.first();
      
      if (templateError || !templates) {
        throw new Error('Template not found');
      }

      prompt = templates.prompt_template;

      // Replace variables in template
      const templateVariables = templates.variables as string[] || [];
      templateVariables.forEach((variable: string) => {
        const value = variables[variable] || `{${variable}}`;
        const regex = new RegExp(`\\{${variable}\\}`, 'g');
        prompt = prompt.replace(regex, value);
      });
    }

    console.log('Generating document with Gemini...');
    console.log('Prompt:', prompt.substring(0, 200) + '...');

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorData}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API Response received');

    // Extract generated text
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No text generated from Gemini');
    }

    // Get current user tenant
    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!personnel) {
      throw new Error('Personnel not found');
    }

    // Create document record
    const documentData = {
      tenant_id: personnel.tenant_id,
      name: `Document généré IA - ${new Date().toLocaleString('fr-FR')}`,
      original_filename: 'document_ia.txt',
      file_type: 'text/plain',
      category: templateType === 'patient_communication' ? 'Correspondance Patient' :
                templateType === 'professional_communication' ? 'Courrier Officiel' :
                templateType === 'regulatory' ? 'Réglementaire' :
                templateType === 'commercial' ? 'Commercial' :
                templateType === 'procedure' ? 'Qualité' : 'Manuel',
      description: `Document généré automatiquement via IA Gemini`,
      tags: ['IA', 'Gemini', 'Généré'],
      file_size: Buffer.byteLength(generatedText, 'utf8'),
      author_id: user.id,
      document_type: 'ai_generated',
      ai_generated: true,
      template_id: templateId || null
    };

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (docError) {
      console.error('Database error:', docError);
      throw new Error('Failed to save document');
    }

    console.log('Document created successfully:', document.id);

    return new Response(JSON.stringify({
      success: true,
      document: document,
      generatedText: generatedText,
      message: 'Document généré avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-document-gemini function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Une erreur est survenue lors de la génération'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});