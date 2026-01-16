-- Corriger la fonction register_pharmacy_with_admin avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
    pharmacy_data jsonb, 
    admin_data jsonb, 
    admin_email text, 
    admin_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
    v_pharmacy_id UUID;
    v_admin_user_id UUID;
    v_personnel_id UUID;
    v_reference_agent TEXT;
BEGIN
    -- Vérifier que l'utilisateur est authentifié
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Valider les données requises
    IF pharmacy_data IS NULL OR admin_data IS NULL OR admin_email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Missing required data'
        );
    END IF;

    -- Générer l'ID de la pharmacie
    v_pharmacy_id := gen_random_uuid();

    -- Utiliser l'utilisateur actuel comme admin
    v_admin_user_id := auth.uid();

    -- Créer la pharmacie avec tenant_id = id
    INSERT INTO public.pharmacies (
        id,
        tenant_id,
        name,
        code,
        address,
        quartier,
        arrondissement,
        city,
        departement,
        region,
        pays,
        telephone_appel,
        telephone_whatsapp,
        email,
        type,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_pharmacy_id,
        v_pharmacy_id,
        COALESCE(pharmacy_data->>'name', 'Nouvelle Pharmacie'),
        COALESCE(pharmacy_data->>'licence_number', ''),
        COALESCE(pharmacy_data->>'address', ''),
        COALESCE(pharmacy_data->>'quartier', ''),
        COALESCE(pharmacy_data->>'arrondissement', ''),
        COALESCE(pharmacy_data->>'city', ''),
        COALESCE(pharmacy_data->>'departement', ''),
        COALESCE(pharmacy_data->>'region', ''),
        COALESCE(pharmacy_data->>'pays', 'Cameroun'),
        COALESCE(pharmacy_data->>'telephone_appel', ''),
        COALESCE(pharmacy_data->>'telephone_whatsapp', ''),
        COALESCE(pharmacy_data->>'email', admin_email),
        COALESCE(pharmacy_data->>'type', 'pharmacie'),
        'active',
        now(),
        now()
    );

    -- Générer une référence agent unique
    v_reference_agent := 'AGT-' || SUBSTRING(v_pharmacy_id::text, 1, 8) || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Créer le personnel administrateur avec les BONNES colonnes
    INSERT INTO public.personnel (
        id,
        tenant_id,
        auth_user_id,
        noms,
        prenoms,
        email,
        telephone_appel,
        telephone_whatsapp,
        role,
        reference_agent,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_pharmacy_id,
        v_admin_user_id,
        COALESCE(admin_data->>'noms', 'Admin'),
        COALESCE(admin_data->>'prenoms', ''),
        admin_email,
        COALESCE(admin_data->>'telephone_principal', ''),
        COALESCE(admin_data->>'whatsapp', ''),
        'Admin',
        COALESCE(admin_data->>'reference', v_reference_agent),
        true,
        now(),
        now()
    )
    RETURNING id INTO v_personnel_id;

    -- Initialiser les rôles et permissions pour ce tenant (si la fonction existe)
    BEGIN
        PERFORM public.initialize_tenant_roles_permissions(v_pharmacy_id);
    EXCEPTION WHEN undefined_function THEN
        -- La fonction n'existe pas encore, on continue
        NULL;
    END;

    -- Créer une entrée dans audit_logs avec les BONNES colonnes
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        personnel_id,
        action,
        table_name,
        record_id,
        new_values,
        status,
        created_at
    ) VALUES (
        v_pharmacy_id,
        v_admin_user_id,
        v_personnel_id,
        'PHARMACY_REGISTRATION',
        'pharmacies',
        v_pharmacy_id,
        jsonb_build_object(
            'pharmacy_id', v_pharmacy_id,
            'personnel_id', v_personnel_id,
            'admin_email', admin_email,
            'pharmacy_name', pharmacy_data->>'name'
        ),
        'success',
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'pharmacy_id', v_pharmacy_id,
        'personnel_id', v_personnel_id,
        'message', 'Pharmacie et administrateur créés avec succès'
    );

EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur avec les BONNES colonnes
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        table_name,
        new_values,
        status,
        error_message,
        created_at
    ) VALUES (
        COALESCE(v_pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid),
        v_admin_user_id,
        'PHARMACY_REGISTRATION_FAILED',
        'pharmacies',
        jsonb_build_object(
            'error', SQLERRM,
            'admin_email', admin_email
        ),
        'failed',
        SQLERRM,
        now()
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;