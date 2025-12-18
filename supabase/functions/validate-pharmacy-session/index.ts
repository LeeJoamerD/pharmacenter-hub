import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { session_token } = await req.json()
    
    console.log('validate-pharmacy-session: Validating token...')
    
    if (!session_token) {
      console.log('validate-pharmacy-session: No token provided')
      return new Response(
        JSON.stringify({ valid: false, error: 'Token de session requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      console.log('validate-pharmacy-session: Session invalide ou expirée', sessionError?.message)
      return new Response(
        JSON.stringify({ valid: false, error: 'Session invalide ou expirée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('validate-pharmacy-session: Session trouvée, pharmacy_id:', session.pharmacy_id)

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
      console.log('validate-pharmacy-session: Pharmacie non trouvée', pharmacyError?.message)
      return new Response(
        JSON.stringify({ valid: false, error: 'Pharmacie non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('validate-pharmacy-session: Success - Pharmacy:', pharmacy.name)

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
    console.error('validate-pharmacy-session: Error:', error.message)
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
