-- ============================================================================
-- RESTAURATION DES FONCTIONS RPC - ADMINISTRATION RÉSEAU AVANCÉE
-- ============================================================================
-- Ce fichier restaure les 7 fonctions RPC critiques pour l'administration réseau
-- Source: Migrations backup du dossier supabase/migrations_backup
-- ============================================================================

-- ============================================================================
-- FONCTION 1: network_get_pharmacy_overview
-- Rôle: Obtenir une vue d'ensemble d'une pharmacie (utilisateurs, admins, dernière activité)
-- Source: 20250827213229_c7a789b9-99ca-4b93-bd88-82dd23740382.sql (lignes 4-73)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_get_pharmacy_overview(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  overview_result jsonb := '{}'::jsonb;
  user_count INTEGER;
  admin_count INTEGER;
  last_access TIMESTAMP WITH TIME ZONE;
  pharmacy_status TEXT;
  active_permissions TEXT[];
BEGIN
  -- Authorization check: only system admin or the tenant itself can access
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Get pharmacy status
  SELECT status INTO pharmacy_status
  FROM public.pharmacies
  WHERE id = target_tenant_id
  LIMIT 1;
  
  IF pharmacy_status IS NULL THEN
    RAISE EXCEPTION 'Pharmacie non trouvée';
  END IF;
  
  -- Count total users
  SELECT COUNT(*) INTO user_count
  FROM public.personnel
  WHERE tenant_id = target_tenant_id;
  
  -- Count admins
  SELECT COUNT(*) INTO admin_count
  FROM public.personnel
  WHERE tenant_id = target_tenant_id
    AND role IN ('Admin', 'Pharmacien');
  
  -- Get last access time from audit logs or sessions
  SELECT MAX(created_at) INTO last_access
  FROM public.audit_logs
  WHERE tenant_id = target_tenant_id;
  
  -- Get active permissions for this pharmacy
  SELECT array_agg(DISTINCT setting_key) INTO active_permissions
  FROM public.network_admin_settings
  WHERE tenant_id = target_tenant_id
    AND setting_category = 'permissions'
    AND setting_value = 'true';
  
  -- Build result object
  overview_result := jsonb_build_object(
    'user_count', COALESCE(user_count, 0),
    'admin_count', COALESCE(admin_count, 0),
    'last_access', last_access,
    'status', pharmacy_status,
    'active_permissions', COALESCE(active_permissions, ARRAY[]::TEXT[])
  );
  
  RETURN overview_result;
END;
$function$;

COMMENT ON FUNCTION public.network_get_pharmacy_overview(uuid) IS 'Obtient une vue d''ensemble d''une pharmacie avec compteurs utilisateurs, dernière activité et permissions actives';

-- ============================================================================
-- FONCTION 2: network_list_pharmacy_users
-- Rôle: Lister tous les utilisateurs d'une pharmacie avec leurs détails
-- Source: 20250827213229_c7a789b9-99ca-4b93-bd88-82dd23740382.sql (lignes 76-111)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_list_pharmacy_users(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  users_result jsonb := '[]'::jsonb;
  user_record RECORD;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Get all users for this pharmacy
  FOR user_record IN
    SELECT 
      p.id,
      p.prenoms || ' ' || p.noms as name,
      p.email,
      p.telephone_appel as phone,
      p.role,
      p.is_active,
      (
        SELECT MAX(created_at)
        FROM public.audit_logs al
        WHERE al.user_id = p.auth_user_id
          AND al.tenant_id = target_tenant_id
      ) as last_login,
      p.created_at
    FROM public.personnel p
    WHERE p.tenant_id = target_tenant_id
    ORDER BY p.created_at DESC
  LOOP
    users_result := users_result || jsonb_build_object(
      'id', user_record.id,
      'name', user_record.name,
      'email', user_record.email,
      'phone', user_record.phone,
      'role', user_record.role,
      'is_active', user_record.is_active,
      'last_login', user_record.last_login,
      'created_at', user_record.created_at
    );
  END LOOP;
  
  RETURN users_result;
END;
$function$;

COMMENT ON FUNCTION public.network_list_pharmacy_users(uuid) IS 'Liste tous les utilisateurs d''une pharmacie avec leurs informations détaillées';

-- ============================================================================
-- FONCTION 3: network_update_pharmacy_user
-- Rôle: Mettre à jour les informations d'un utilisateur (rôle, statut, coordonnées)
-- Source: 20250827213229_c7a789b9-99ca-4b93-bd88-82dd23740382.sql (lignes 114-165)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_update_pharmacy_user(
  target_tenant_id uuid,
  personnel_id uuid,
  payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{"success": true}'::jsonb;
  updated_user RECORD;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Check if user exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.personnel
    WHERE id = personnel_id AND tenant_id = target_tenant_id
  ) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé dans cette pharmacie';
  END IF;
  
  -- Update user information
  UPDATE public.personnel
  SET
    role = COALESCE(payload->>'role', role),
    is_active = COALESCE((payload->>'is_active')::boolean, is_active),
    telephone_appel = COALESCE(payload->>'phone', telephone_appel),
    email = COALESCE(payload->>'email', email),
    updated_at = now()
  WHERE id = personnel_id
  RETURNING * INTO updated_user;
  
  -- Log the update
  INSERT INTO public.audit_logs (
    tenant_id, user_id, personnel_id, action, table_name, record_id, new_values, status
  ) VALUES (
    target_tenant_id,
    auth.uid(),
    personnel_id,
    'NETWORK_USER_UPDATE',
    'personnel',
    personnel_id,
    payload,
    'success'
  );
  
  -- Build result with updated user info
  result := result || jsonb_build_object(
    'user', jsonb_build_object(
      'id', updated_user.id,
      'name', updated_user.prenoms || ' ' || updated_user.noms,
      'email', updated_user.email,
      'phone', updated_user.telephone_appel,
      'role', updated_user.role,
      'is_active', updated_user.is_active
    )
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

COMMENT ON FUNCTION public.network_update_pharmacy_user(uuid, uuid, jsonb) IS 'Met à jour les informations d''un utilisateur d''une pharmacie (rôle, statut, coordonnées)';

-- ============================================================================
-- FONCTION 4: network_get_pharmacy_permissions
-- Rôle: Obtenir toutes les permissions système avec leur statut pour une pharmacie
-- Source: 20250827220845_35a8c62e-13e9-4164-b12d-b193b4cb68bd.sql (fix SQL)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_get_pharmacy_permissions(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  permissions_result jsonb := '[]'::jsonb;
  permission_record RECORD;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Get all network permissions with their status for this pharmacy
  FOR permission_record IN
    SELECT 
      p.id,
      p.code_permission as code,
      p.nom_permission as name,
      p.description,
      p.categorie as category,
      COALESCE(nas.setting_value = 'true', false) as enabled
    FROM public.permissions p
    LEFT JOIN public.network_admin_settings nas ON (
      nas.tenant_id = target_tenant_id 
      AND nas.setting_category = 'permissions' 
      AND nas.setting_key = p.code_permission
    )
    WHERE p.categorie IN ('Network', 'Administration', 'System')
    ORDER BY p.categorie, p.nom_permission
  LOOP
    permissions_result := permissions_result || jsonb_build_object(
      'id', permission_record.id,
      'code', permission_record.code,
      'name', permission_record.name,
      'description', permission_record.description,
      'category', permission_record.category,
      'enabled', permission_record.enabled
    );
  END LOOP;
  
  RETURN permissions_result;
END;
$function$;

COMMENT ON FUNCTION public.network_get_pharmacy_permissions(uuid) IS 'Retourne toutes les permissions système avec leur statut activé/désactivé pour une pharmacie';

-- ============================================================================
-- FONCTION 5: network_toggle_pharmacy_permission
-- Rôle: Activer/désactiver une permission spécifique pour une pharmacie
-- Source: 20250827213229_c7a789b9-99ca-4b93-bd88-82dd23740382.sql (lignes 209-300)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_toggle_pharmacy_permission(
  target_tenant_id uuid,
  permission_code text,
  enabled boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{"success": true}'::jsonb;
  permission_exists BOOLEAN;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Check if permission exists
  SELECT EXISTS(
    SELECT 1 FROM public.permissions
    WHERE code_permission = permission_code
  ) INTO permission_exists;
  
  IF NOT permission_exists THEN
    RAISE EXCEPTION 'Permission non trouvée: %', permission_code;
  END IF;
  
  -- Update or insert permission setting
  INSERT INTO public.network_admin_settings (
    tenant_id, setting_category, setting_key, setting_value
  ) VALUES (
    target_tenant_id, 'permissions', permission_code, enabled::text
  ) ON CONFLICT (tenant_id, setting_category, setting_key)
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  -- Sync with roles_permissions if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roles_permissions'
  ) THEN
    -- Update all roles for this tenant
    UPDATE public.roles_permissions rp
    SET has_permission = enabled
    FROM public.roles r
    WHERE rp.role_id = r.id
      AND r.tenant_id = target_tenant_id
      AND rp.permission_code = permission_code;
  END IF;
  
  -- Log the permission toggle
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, new_values, status
  ) VALUES (
    target_tenant_id,
    auth.uid(),
    'NETWORK_PERMISSION_TOGGLE',
    'network_admin_settings',
    jsonb_build_object(
      'permission_code', permission_code,
      'enabled', enabled
    ),
    'success'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

COMMENT ON FUNCTION public.network_toggle_pharmacy_permission(uuid, text, boolean) IS 'Active ou désactive une permission spécifique pour une pharmacie';

-- ============================================================================
-- FONCTION 6: network_get_security_settings
-- Rôle: Récupérer tous les paramètres de sécurité d'une pharmacie
-- Source: 20250828003502_d54f0093-08ce-4d83-ba64-63487aa88cfd.sql (fix JSONB)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_get_security_settings(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;

  -- Aggregate security settings into a jsonb object
  SELECT COALESCE(
    jsonb_object_agg(
      nas.setting_key,
      CASE
        -- For boolean-like values, cast to boolean then to jsonb
        WHEN nas.setting_value IN ('true','false') THEN to_jsonb(nas.setting_value::boolean)
        -- Otherwise keep as text but encode as jsonb (preserves authorized_ips as JSON string)
        ELSE to_jsonb(nas.setting_value)
      END
    ),
    '{}'::jsonb
  )
  INTO result
  FROM public.network_admin_settings nas
  WHERE nas.tenant_id = target_tenant_id
    AND nas.setting_category = 'security';

  -- Backward compatibility: map require_2fa -> force_2fa if needed
  IF (result ? 'require_2fa') AND NOT (result ? 'force_2fa') THEN
    result := result || jsonb_build_object('force_2fa', result->'require_2fa');
  END IF;

  RETURN result;
END;
$function$;

COMMENT ON FUNCTION public.network_get_security_settings(uuid) IS 'Retourne tous les paramètres de sécurité d''une pharmacie (2FA, auto-lock, IPs autorisées, etc.)';

-- ============================================================================
-- FONCTION 7: network_update_security_settings
-- Rôle: Mettre à jour les paramètres de sécurité d'une pharmacie
-- Source: 20250827231821_6144b435-ebdc-4bee-aa7c-cfdc92b454ba.sql (fix SQL)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.network_update_security_settings(
  target_tenant_id uuid,
  settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  setting_key text;
  setting_value text;
  result jsonb := '{"success": true}'::jsonb;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Update each security setting
  FOR setting_key, setting_value IN SELECT * FROM jsonb_each_text(settings)
  LOOP
    -- Insert or update the setting
    INSERT INTO public.network_admin_settings (
      tenant_id, setting_category, setting_key, setting_value
    ) VALUES (
      target_tenant_id, 'security', setting_key, setting_value
    ) ON CONFLICT (tenant_id, setting_category, setting_key)
    DO UPDATE SET 
      setting_value = EXCLUDED.setting_value,
      updated_at = now();
  END LOOP;
  
  -- Log the security settings update
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, new_values, status
  ) VALUES (
    target_tenant_id,
    auth.uid(),
    'NETWORK_SECURITY_UPDATE',
    'network_admin_settings',
    settings,
    'success'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

COMMENT ON FUNCTION public.network_update_security_settings(uuid, jsonb) IS 'Met à jour les paramètres de sécurité d''une pharmacie (2FA, auto-lock, restrictions IP, etc.)';

-- ============================================================================
-- INSERTION DES PERMISSIONS DE BASE
-- Ces permissions sont nécessaires pour le fonctionnement du module réseau
-- ============================================================================

-- Vérifier si la table permissions existe avant l'insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'permissions'
  ) THEN
    -- Insérer les permissions système de base
    INSERT INTO public.permissions (code_permission, nom_permission, description, categorie, is_system)
    VALUES
      ('read', 'Lecture des données', 'Permet de lire les données du système', 'System', true),
      ('write', 'Modification des données', 'Permet de modifier les données du système', 'System', true),
      ('delete', 'Suppression des données', 'Permet de supprimer les données du système', 'System', true),
      ('admin', 'Administration système', 'Accès complet à l''administration du système', 'Administration', true),
      ('backup', 'Gestion des sauvegardes', 'Permet de gérer les sauvegardes système', 'Administration', true),
      ('reports', 'Génération de rapports', 'Permet de générer et exporter des rapports', 'Network', true),
      ('network_admin', 'Administration réseau', 'Permet d''administrer les pharmacies du réseau', 'Network', true),
      ('security_config', 'Configuration sécurité', 'Permet de configurer les paramètres de sécurité', 'Administration', true)
    ON CONFLICT (code_permission) DO NOTHING;
    
    RAISE NOTICE 'Permissions de base insérées avec succès';
  ELSE
    RAISE NOTICE 'Table permissions non trouvée - insertion ignorée';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================

-- Vérifier que toutes les fonctions ont été créées
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name LIKE 'network_%'
    AND routine_type = 'FUNCTION';
  
  RAISE NOTICE '✅ % fonctions RPC réseau créées', function_count;
END $$;