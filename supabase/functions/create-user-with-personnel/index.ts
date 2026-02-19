import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = [
  'Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint',
  'Vendeur', 'Caissier', 'Gestionnaire', 'Préparateur',
  'Comptable', 'Magasinier', 'Livreur', 'Stagiaire',
  'Technicien', 'Agent de sécurité'
] as const

const PersonnelSchema = z.object({
  email: z.string().email('Format email invalide').max(255).toLowerCase(),
  password: z.string().min(8, 'Mot de passe: 8 caractères minimum').max(100),
  noms: z.string().min(1).max(100).trim(),
  prenoms: z.string().min(1).max(100).trim(),
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Rôle invalide' }) }),
  telephone_appel: z.string().regex(/^\+?[0-9]{8,15}$/, 'Format téléphone invalide').optional().nullable(),
  tenant_id: z.string().uuid('Format tenant_id invalide'),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // --- Auth validation: require admin/pharmacien ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentification invalide', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify caller is Admin or Pharmacien for their tenant
    const { data: callerPersonnel } = await supabaseAuth
      .from('personnel')
      .select('role, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!callerPersonnel || !['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint'].includes(callerPersonnel.role)) {
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs', success: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // --- End auth validation ---

    // --- Input validation with Zod ---
    const rawBody = await req.json()
    const parseResult = PersonnelSchema.safeParse(rawBody)
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Données invalides'
      return new Response(
        JSON.stringify({ error: firstError, success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { email, password, noms, prenoms, role, telephone_appel, tenant_id } = parseResult.data

    // Enforce tenant isolation: caller can only create personnel in their own tenant
    if (tenant_id !== callerPersonnel.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Accès interdit: tenant différent', success: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating user with personnel:', { email, noms, prenoms, role, tenant_id })

    // Créer le client Supabase avec la clé service
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Créer l'utilisateur dans Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { noms, prenoms, role }
    })

    if (createAuthError) {
      console.error('Auth error:', createAuthError)
      return new Response(
        JSON.stringify({ error: 'Impossible de créer le compte utilisateur', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Générer référence agent
    const reference_agent = `AG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // 3. Créer l'enregistrement personnel
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
        is_active: true
      })
      .select()
      .single()

    if (personnelError) {
      console.error('Personnel error:', personnelError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Impossible de créer le personnel', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Vérifier que le client a été créé par le trigger
    const { data: clientCheck } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('personnel_id', personnelData.id)
      .eq('tenant_id', tenant_id)
      .maybeSingle()

    if (!clientCheck) {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          tenant_id,
          type_client: 'Personnel',
          personnel_id: personnelData.id,
          nom_complet: `${prenoms} ${noms}`,
          telephone: telephone_appel || null,
          adresse: null,
          taux_remise_automatique: 0.00
        })

      if (clientError) {
        console.error('Fallback client creation failed:', clientError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: personnelData,
        message: 'User, personnel and client created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in create-user-with-personnel:', error)
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue', success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
