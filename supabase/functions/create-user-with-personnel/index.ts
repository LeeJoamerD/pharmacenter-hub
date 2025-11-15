import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { email, password, noms, prenoms, role, telephone_appel, tenant_id } = await req.json()

    console.log('Creating user with personnel:', { email, noms, prenoms, role, tenant_id })

    // Validation
    if (!email || !password || !noms || !prenoms || !role || !tenant_id) {
      throw new Error('Missing required fields')
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Créer le client Supabase avec la clé service
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Créer l'utilisateur dans Auth
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirme automatiquement l'email
      user_metadata: {
        noms,
        prenoms,
        role
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    console.log('Auth user created:', authData.user.id)

    // 2. Générer référence agent
    const reference_agent = `AG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // 3. Créer l'enregistrement personnel
    console.log('Creating personnel record...')
    const { data: personnelData, error: personnelError } = await supabaseAdmin
      .from('personnel')
      .insert({
        tenant_id,
        auth_user_id: authData.user.id,
        reference_agent,
        noms,
        prenoms,
        email,
        role,
        telephone_appel: telephone_appel || null,
        is_active: true,
        google_verified: false
      })
      .select()
      .single()

    if (personnelError) {
      console.error('Personnel error:', personnelError)
      // Rollback: supprimer l'utilisateur auth si la création du personnel échoue
      console.log('Rolling back auth user...')
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create personnel: ${personnelError.message}`)
    }

    console.log('Personnel created successfully:', personnelData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: personnelData,
        message: 'User and personnel created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in create-user-with-personnel:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})
