-- Migration 17: Restore missing RPC functions for pharmacy creation and user debugging
-- Created to fix 404 errors on register_pharmacy_with_admin and debug_user_connection_state

-- =====================================================
-- Function 1: register_pharmacy_with_admin
-- Purpose: Create a new pharmacy with its admin user in a single transaction
-- =====================================================
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
  p_pharmacy_name TEXT,
  p_pharmacy_data JSONB,
  p_admin_noms TEXT,
  p_admin_prenoms TEXT,
  p_admin_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_pharmacy_id UUID;
  v_personnel_id UUID;
  v_result JSONB;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié'
    );
  END IF;

  -- Validate input
  IF p_pharmacy_name IS NULL OR p_admin_noms IS NULL OR p_admin_prenoms IS NULL OR p_admin_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Données manquantes: nom pharmacie, noms, prénoms et email requis'
    );
  END IF;

  -- Generate UUID for the new pharmacy
  v_pharmacy_id := gen_random_uuid();

  -- Insert pharmacy (tenant_id = id for self-reference)
  INSERT INTO public.pharmacies (
    id,
    tenant_id,
    nom_pharmacie,
    telephone_appel,
    telephone_whatsapp,
    email,
    adresse,
    ville,
    pays,
    numero_agrement,
    created_at,
    updated_at
  )
  VALUES (
    v_pharmacy_id,
    v_pharmacy_id,  -- Self-reference: pharmacy is its own tenant
    p_pharmacy_name,
    COALESCE(p_pharmacy_data->>'telephone_appel', ''),
    COALESCE(p_pharmacy_data->>'telephone_whatsapp', ''),
    p_admin_email,
    COALESCE(p_pharmacy_data->>'adresse', ''),
    COALESCE(p_pharmacy_data->>'ville', ''),
    COALESCE(p_pharmacy_data->>'pays', 'Bénin'),
    COALESCE(p_pharmacy_data->>'numero_agrement', ''),
    now(),
    now()
  );

  -- Insert admin personnel record
  INSERT INTO public.personnel (
    id,
    tenant_id,
    auth_user_id,
    reference_agent,
    noms,
    prenoms,
    role,
    email,
    telephone_appel,
    telephone_whatsapp,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_pharmacy_id,
    v_user_id,
    'ADMIN-' || substr(v_user_id::text, 1, 8),
    p_admin_noms,
    p_admin_prenoms,
    'Admin',
    p_admin_email,
    COALESCE(p_pharmacy_data->>'telephone_appel', ''),
    COALESCE(p_pharmacy_data->>'telephone_whatsapp', ''),
    true,
    now(),
    now()
  )
  RETURNING id INTO v_personnel_id;

  -- Log the pharmacy creation in audit_logs
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    personnel_id,
    action,
    table_name,
    record_id,
    new_values,
    created_at
  )
  VALUES (
    v_pharmacy_id,
    v_user_id,
    v_personnel_id,
    'INSERT',
    'pharmacies',
    v_pharmacy_id,
    jsonb_build_object(
      'pharmacy_name', p_pharmacy_name,
      'admin_email', p_admin_email
    ),
    now()
  );

  -- Return success with created IDs
  v_result := jsonb_build_object(
    'success', true,
    'pharmacy_id', v_pharmacy_id,
    'personnel_id', v_personnel_id,
    'message', 'Pharmacie créée avec succès'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error in audit_logs
    INSERT INTO public.audit_logs (
      tenant_id,
      user_id,
      action,
      table_name,
      record_id,
      new_values,
      created_at
    )
    VALUES (
      v_pharmacy_id,
      v_user_id,
      'ERROR',
      'pharmacies',
      NULL,
      jsonb_build_object(
        'error', SQLERRM,
        'function', 'register_pharmacy_with_admin'
      ),
      now()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.register_pharmacy_with_admin(TEXT, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Add documentation comment
COMMENT ON FUNCTION public.register_pharmacy_with_admin IS 'Creates a new pharmacy with its admin user. Must be called by an authenticated user. The pharmacy becomes its own tenant (self-reference).';

-- =====================================================
-- Function 2: debug_user_connection_state
-- Purpose: Return detailed connection state for debugging user issues
-- =====================================================
CREATE OR REPLACE FUNCTION public.debug_user_connection_state()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_personnel_record RECORD;
  v_pharmacy_record RECORD;
  v_result JSONB;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'user_id', NULL,
      'has_personnel_record', false,
      'message', 'Utilisateur non authentifié'
    );
  END IF;

  -- Find personnel record
  SELECT 
    id,
    tenant_id,
    reference_agent,
    noms,
    prenoms,
    role,
    email,
    is_active
  INTO v_personnel_record
  FROM public.personnel
  WHERE auth_user_id = v_user_id
  LIMIT 1;

  -- If no personnel found
  IF v_personnel_record IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'user_id', v_user_id,
      'has_personnel_record', false,
      'personnel_id', NULL,
      'tenant_id', NULL,
      'has_pharmacy', false,
      'message', 'Aucun enregistrement personnel trouvé pour cet utilisateur'
    );
  END IF;

  -- Find associated pharmacy
  SELECT 
    id,
    nom_pharmacie,
    email,
    ville,
    pays
  INTO v_pharmacy_record
  FROM public.pharmacies
  WHERE id = v_personnel_record.tenant_id
  LIMIT 1;

  -- Build result JSON
  v_result := jsonb_build_object(
    'authenticated', true,
    'user_id', v_user_id,
    'has_personnel_record', true,
    'personnel_id', v_personnel_record.id,
    'personnel_reference', v_personnel_record.reference_agent,
    'personnel_name', v_personnel_record.prenoms || ' ' || v_personnel_record.noms,
    'personnel_role', v_personnel_record.role,
    'personnel_email', v_personnel_record.email,
    'personnel_active', v_personnel_record.is_active,
    'tenant_id', v_personnel_record.tenant_id,
    'has_pharmacy', v_pharmacy_record IS NOT NULL,
    'pharmacy_id', v_pharmacy_record.id,
    'pharmacy_name', v_pharmacy_record.nom_pharmacie,
    'pharmacy_email', v_pharmacy_record.email,
    'pharmacy_location', v_pharmacy_record.ville || ', ' || v_pharmacy_record.pays
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'user_id', v_user_id,
      'error', true,
      'error_message', SQLERRM,
      'message', 'Erreur lors de la récupération des informations de connexion'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.debug_user_connection_state() TO authenticated;

-- Add documentation comment
COMMENT ON FUNCTION public.debug_user_connection_state IS 'Returns detailed connection state information for the current authenticated user. Used for debugging user connection issues.';