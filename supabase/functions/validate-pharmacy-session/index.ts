import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SessionSchema = z.object({
  session_token: z.string().min(1).max(500).trim(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // --- Input validation ---
    const rawBody = await req.json()
    const parseResult = SessionSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token de session invalide' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { session_token } = parseResult.data

    // Créer un client Supabase avec service_role pour bypasser RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier la session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('pharmacy_sessions')
      .select('id, pharmacy_id, expires_at, is_active')
      .eq('session_token', session_token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Session invalide ou expirée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mettre à jour la dernière activité
    await supabaseAdmin
      .from('pharmacy_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id)

    // Récupérer les données de la pharmacie
    const { data: pharmacy, error: pharmacyError } = await supabaseAdmin
      .from('pharmacies')
      .select('*')
      .eq('id', session.pharmacy_id)
      .single()

    if (pharmacyError || !pharmacy) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Pharmacie non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        valid: true,
        pharmacy: pharmacy,
        session_id: session.id,
        expires_at: session.expires_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('validate-pharmacy-session error:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Une erreur est survenue' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
