-- 1) Créer la fonction d'initialisation des rôles et permissions pour un nouveau tenant
CREATE OR REPLACE FUNCTION public.initialize_tenant_roles_permissions(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role RECORD;
  v_new_role_id UUID;
  v_template_tenant_id UUID := '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'; -- Pharmacie MAZAYU comme template
BEGIN
  -- Vérifier que le tenant existe
  IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant % not found', p_tenant_id;
  END IF;
  
  -- Ne rien faire si le tenant a déjà des rôles (idempotent)
  IF EXISTS (SELECT 1 FROM public.roles WHERE tenant_id = p_tenant_id) THEN
    RETURN;
  END IF;

  -- Copier les rôles depuis le template MAZAYU
  FOR v_role IN 
    SELECT * FROM public.roles 
    WHERE tenant_id = v_template_tenant_id AND is_active = true
    ORDER BY niveau_hierarchique
  LOOP
    v_new_role_id := gen_random_uuid();
    
    -- Insérer le nouveau rôle pour ce tenant
    INSERT INTO public.roles (id, tenant_id, nom_role, description, niveau_hierarchique, is_active, is_system, created_at, updated_at)
    VALUES (v_new_role_id, p_tenant_id, v_role.nom_role, v_role.description, 
            v_role.niveau_hierarchique, true, v_role.is_system, now(), now());
    
    -- Copier les permissions associées à ce rôle
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
    SELECT p_tenant_id, v_new_role_id, rp.permission_id, rp.accorde, now(), now()
    FROM public.roles_permissions rp
    WHERE rp.role_id = v_role.id AND rp.accorde = true;
  END LOOP;
END;
$$;

-- 2) Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.initialize_tenant_roles_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_tenant_roles_permissions(UUID) TO service_role;

-- 3) Modifier la fonction register_pharmacy_with_admin pour appeler l'initialisation
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
    pharmacy_data JSONB,
    admin_data JSONB,
    admin_email TEXT,
    admin_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pharmacy_id UUID;
    v_admin_user_id UUID;
    v_personnel_id UUID;
    v_result JSONB;
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
    IF pharmacy_data IS NULL OR admin_data IS NULL OR admin_email IS NULL OR admin_password IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Missing required data'
        );
    END IF;

    -- Générer l'ID de la pharmacie
    v_pharmacy_id := gen_random_uuid();

    -- Créer la pharmacie avec tenant_id = id
    INSERT INTO public.pharmacies (
        id,
        tenant_id,
        name,
        address,
        phone,
        email,
        city,
        pays,
        created_at,
        updated_at
    ) VALUES (
        v_pharmacy_id,
        v_pharmacy_id,
        COALESCE(pharmacy_data->>'nom', 'Nouvelle Pharmacie'),
        COALESCE(pharmacy_data->>'adresse', ''),
        COALESCE(pharmacy_data->>'telephone', ''),
        COALESCE(pharmacy_data->>'email', admin_email),
        COALESCE(pharmacy_data->>'ville', ''),
        COALESCE(pharmacy_data->>'pays', 'RDC'),
        now(),
        now()
    );

    -- Utiliser l'utilisateur actuel comme admin
    v_admin_user_id := auth.uid();

    -- Générer une référence agent unique
    v_reference_agent := 'AGT-' || SUBSTRING(v_pharmacy_id::text, 1, 8) || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Créer le personnel administrateur
    INSERT INTO public.personnel (
        id,
        tenant_id,
        user_id,
        nom,
        prenom,
        email,
        telephone,
        role,
        reference_agent,
        is_active,
        is_system_user,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_pharmacy_id,
        v_admin_user_id,
        COALESCE(admin_data->>'nom', 'Admin'),
        COALESCE(admin_data->>'prenom', ''),
        admin_email,
        COALESCE(admin_data->>'telephone', ''),
        'Admin',
        v_reference_agent,
        true,
        false,
        now(),
        now()
    )
    RETURNING id INTO v_personnel_id;

    -- NOUVEAU: Initialiser les rôles et permissions pour ce tenant
    PERFORM public.initialize_tenant_roles_permissions(v_pharmacy_id);

    -- Créer une entrée dans audit_logs
    INSERT INTO public.audit_logs (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data,
        created_by,
        created_at
    ) VALUES (
        v_pharmacy_id,
        'CREATE',
        'pharmacies',
        v_pharmacy_id,
        jsonb_build_object(
            'pharmacy_id', v_pharmacy_id,
            'personnel_id', v_personnel_id,
            'admin_email', admin_email
        ),
        v_admin_user_id,
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'pharmacy_id', v_pharmacy_id,
        'personnel_id', v_personnel_id,
        'message', 'Pharmacy and admin created successfully with default roles and permissions'
    );

EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur
    INSERT INTO public.audit_logs (
        tenant_id,
        action,
        table_name,
        new_data,
        created_at
    ) VALUES (
        COALESCE(v_pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid),
        'ERROR',
        'pharmacies',
        jsonb_build_object(
            'error', SQLERRM,
            'admin_email', admin_email
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 4) Initialiser les rôles et permissions pour le tenant DJL existant (bon UUID)
SELECT public.initialize_tenant_roles_permissions('b51e3719-13d1-4cfb-96ed-2429bb62b411'::UUID);