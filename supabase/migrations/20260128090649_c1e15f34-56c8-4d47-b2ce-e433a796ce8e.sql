-- ============================================================
-- CORRECTION RBAC : Synchronisation des Rôles et Permissions
-- Template source : Pharmacie MAZAYU (aa8717d1-d450-48dd-a484-66402e435797)
-- ============================================================

-- 1. Corriger la fonction initialize_tenant_roles_permissions avec le bon template
CREATE OR REPLACE FUNCTION public.initialize_tenant_roles_permissions(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role RECORD;
  v_new_role_id UUID;
  v_template_tenant_id UUID := 'aa8717d1-d450-48dd-a484-66402e435797'; -- Pharmacie MAZAYU (source correcte avec 179 permissions)
BEGIN
  -- Vérifier que le tenant existe
  IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant % not found', p_tenant_id;
  END IF;
  
  -- Ne pas traiter le template lui-même
  IF p_tenant_id = v_template_tenant_id THEN
    RETURN;
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
    
    INSERT INTO public.roles (id, tenant_id, nom_role, description, niveau_hierarchique, is_active, is_system, created_at, updated_at)
    VALUES (v_new_role_id, p_tenant_id, v_role.nom_role, v_role.description, 
            v_role.niveau_hierarchique, true, v_role.is_system, now(), now());
    
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
    SELECT p_tenant_id, v_new_role_id, rp.permission_id, rp.accorde, now(), now()
    FROM public.roles_permissions rp
    WHERE rp.role_id = v_role.id AND rp.accorde = true;
  END LOOP;
END;
$$;

-- 2. Créer la fonction de synchronisation pour les tenants existants
CREATE OR REPLACE FUNCTION public.sync_tenant_permissions_from_template()
RETURNS TABLE(tenant_id UUID, tenant_name TEXT, permissions_added INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_tenant_id UUID := 'aa8717d1-d450-48dd-a484-66402e435797';
  v_tenant RECORD;
  v_template_role RECORD;
  v_target_role_id UUID;
  v_added_count INT;
  v_total_added INT := 0;
BEGIN
  FOR v_tenant IN 
    SELECT p.id, p.name FROM pharmacies p WHERE p.id != v_template_tenant_id
  LOOP
    v_added_count := 0;
    
    FOR v_template_role IN
      SELECT r.id, r.nom_role 
      FROM roles r 
      WHERE r.tenant_id = v_template_tenant_id AND r.is_active = true
    LOOP
      SELECT r.id INTO v_target_role_id
      FROM roles r
      WHERE r.tenant_id = v_tenant.id AND r.nom_role = v_template_role.nom_role;
      
      IF v_target_role_id IS NOT NULL THEN
        WITH inserted AS (
          INSERT INTO roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
          SELECT v_tenant.id, v_target_role_id, rp.permission_id, true, now(), now()
          FROM roles_permissions rp
          WHERE rp.role_id = v_template_role.id AND rp.accorde = true
          AND NOT EXISTS (
            SELECT 1 FROM roles_permissions existing
            WHERE existing.role_id = v_target_role_id 
            AND existing.permission_id = rp.permission_id
          )
          RETURNING 1
        )
        SELECT COUNT(*) INTO v_added_count FROM inserted;
        
        v_total_added := v_total_added + v_added_count;
      END IF;
    END LOOP;
    
    -- Retourner le résultat pour ce tenant
    tenant_id := v_tenant.id;
    tenant_name := v_tenant.name;
    permissions_added := v_added_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 3. Exécuter la synchronisation immédiatement pour tous les tenants existants
SELECT * FROM public.sync_tenant_permissions_from_template();

-- 4. Mettre à jour register_pharmacy_simple pour appeler l'initialisation RBAC
CREATE OR REPLACE FUNCTION public.register_pharmacy_simple(
  pharmacy_data JSONB,
  pharmacy_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_password_hash TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(pharmacy_data->>'email')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Une pharmacie avec cet email existe déjà');
  END IF;
  
  v_password_hash := extensions.crypt(pharmacy_password, extensions.gen_salt('bf'));
  
  INSERT INTO pharmacies (
    name, code, address, quartier, arrondissement, city, departement,
    region, pays, telephone_appel, telephone_whatsapp, email, type, status, password_hash
  )
  VALUES (
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'code', 'PH' || extract(epoch from now())::text),
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'region', 'République du Congo'),
    COALESCE(pharmacy_data->>'pays', 'République du Congo'),
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'email',
    COALESCE(pharmacy_data->>'type', 'standard'),
    'active',
    v_password_hash
  )
  RETURNING id INTO v_pharmacy_id;
  
  -- NOUVEAU : Initialiser les rôles et permissions depuis le template MAZAYU
  PERFORM public.initialize_tenant_roles_permissions(v_pharmacy_id);
  
  -- Générer le token de session
  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy_id, v_session_token, v_expires_at, true);
  
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_id', v_pharmacy_id,
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5. Créer le trigger de sécurité pour les futures pharmacies
CREATE OR REPLACE FUNCTION public.trigger_initialize_pharmacy_rbac()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Appeler l'initialisation RBAC pour la nouvelle pharmacie
  PERFORM public.initialize_tenant_roles_permissions(NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas bloquer la création
    RAISE WARNING 'RBAC initialization failed for pharmacy %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Supprimer le trigger existant s'il existe et le recréer
DROP TRIGGER IF EXISTS trg_init_pharmacy_rbac ON public.pharmacies;
CREATE TRIGGER trg_init_pharmacy_rbac
  AFTER INSERT ON public.pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_initialize_pharmacy_rbac();