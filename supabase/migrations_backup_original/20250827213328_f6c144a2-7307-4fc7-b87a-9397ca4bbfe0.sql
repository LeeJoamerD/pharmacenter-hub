-- RPC functions for secure pharmacy user and permission management

-- 1. Get pharmacy overview (users, admins, permissions)
CREATE OR REPLACE FUNCTION public.network_get_pharmacy_overview(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER := 0;
  admin_count INTEGER := 0;
  last_access TIMESTAMP WITH TIME ZONE;
  pharmacy_status TEXT;
  permissions_list TEXT[] := ARRAY[]::TEXT[];
  setting_record RECORD;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Get user counts
  SELECT 
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*) FILTER (WHERE is_active = true AND role IN ('Admin', 'Pharmacien'))
  INTO user_count, admin_count
  FROM public.personnel 
  WHERE tenant_id = target_tenant_id;
  
  -- Get last access from user sessions or pharmacy updated_at
  SELECT COALESCE(
    (SELECT MAX(last_activity) FROM public.user_sessions us 
     JOIN public.personnel p ON us.personnel_id = p.id 
     WHERE p.tenant_id = target_tenant_id),
    (SELECT updated_at FROM public.pharmacies WHERE id = target_tenant_id)
  ) INTO last_access;
  
  -- Get pharmacy status
  SELECT status INTO pharmacy_status FROM public.pharmacies WHERE id = target_tenant_id;
  
  -- Get active permissions from network_admin_settings
  FOR setting_record IN
    SELECT setting_key 
    FROM public.network_admin_settings 
    WHERE tenant_id = target_tenant_id 
      AND setting_category = 'permissions' 
      AND setting_value = 'true'
  LOOP
    permissions_list := array_append(permissions_list, setting_record.setting_key);
  END LOOP;
  
  -- If no network settings, fallback to roles_permissions
  IF array_length(permissions_list, 1) IS NULL THEN
    SELECT array_agg(DISTINCT p.code_permission)
    INTO permissions_list
    FROM public.permissions p
    JOIN public.roles_permissions rp ON p.id = rp.permission_id
    JOIN public.roles r ON rp.role_id = r.id
    WHERE r.tenant_id = target_tenant_id 
      AND r.nom_role = 'Admin' 
      AND rp.accorde = true;
  END IF;
  
  RETURN jsonb_build_object(
    'user_count', COALESCE(user_count, 0),
    'admin_count', COALESCE(admin_count, 0),
    'last_access', COALESCE(last_access, NOW()),
    'status', COALESCE(pharmacy_status, 'active'),
    'permissions', COALESCE(permissions_list, ARRAY[]::TEXT[])
  );
END;
$$;

-- 2. List pharmacy users
CREATE OR REPLACE FUNCTION public.network_list_pharmacy_users(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  users_data jsonb;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', CONCAT(p.prenoms, ' ', p.noms),
      'email', p.email,
      'phone', p.telephone_appel,
      'role', p.role,
      'is_active', p.is_active,
      'last_login', COALESCE(
        (SELECT MAX(last_activity) FROM public.user_sessions WHERE personnel_id = p.id),
        p.updated_at
      ),
      'created_at', p.created_at
    )
  )
  INTO users_data
  FROM public.personnel p
  WHERE p.tenant_id = target_tenant_id;
  
  RETURN COALESCE(users_data, '[]'::jsonb);
END;
$$;

-- 3. Update pharmacy user
CREATE OR REPLACE FUNCTION public.network_update_pharmacy_user(
  target_tenant_id uuid, 
  personnel_id uuid, 
  payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_user RECORD;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Verify user belongs to target tenant
  IF NOT EXISTS (SELECT 1 FROM public.personnel WHERE id = personnel_id AND tenant_id = target_tenant_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé dans cette officine';
  END IF;
  
  -- Update allowed fields only
  UPDATE public.personnel
  SET 
    role = COALESCE(payload->>'role', role),
    is_active = COALESCE((payload->>'is_active')::boolean, is_active),
    telephone_appel = COALESCE(payload->>'phone', telephone_appel),
    email = COALESCE(payload->>'email', email),
    updated_at = NOW()
  WHERE id = personnel_id AND tenant_id = target_tenant_id
  RETURNING * INTO updated_user;
  
  -- Log the action
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, record_id, new_values
  ) VALUES (
    target_tenant_id,
    auth.uid(),
    'NETWORK_UPDATE_USER',
    'personnel',
    personnel_id::text,
    payload
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user', to_jsonb(updated_user)
  );
END;
$$;

-- 4. Get pharmacy permissions
CREATE OR REPLACE FUNCTION public.network_get_pharmacy_permissions(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permissions_data jsonb;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Get all system permissions with their status for this tenant
  WITH tenant_settings AS (
    SELECT setting_key, setting_value::boolean as enabled
    FROM public.network_admin_settings
    WHERE tenant_id = target_tenant_id 
      AND setting_category = 'permissions'
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'code', p.code_permission,
      'name', p.nom_permission,
      'description', p.description,
      'category', p.categorie,
      'enabled', COALESCE(ts.enabled, false)
    )
  )
  INTO permissions_data
  FROM public.permissions p
  LEFT JOIN tenant_settings ts ON ts.setting_key = p.code_permission
  WHERE p.is_system = true
  ORDER BY p.categorie, p.nom_permission;
  
  RETURN COALESCE(permissions_data, '[]'::jsonb);
END;
$$;

-- 5. Toggle pharmacy permission
CREATE OR REPLACE FUNCTION public.network_toggle_pharmacy_permission(
  target_tenant_id uuid,
  permission_code text,
  enabled boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permission_exists boolean;
  role_record RECORD;
  permission_record RECORD;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Verify permission exists
  SELECT EXISTS (SELECT 1 FROM public.permissions WHERE code_permission = permission_code) 
  INTO permission_exists;
  
  IF NOT permission_exists THEN
    RAISE EXCEPTION 'Permission invalide: %', permission_code;
  END IF;
  
  -- Update network_admin_settings
  INSERT INTO public.network_admin_settings (
    tenant_id, setting_category, setting_key, setting_value, setting_type
  ) VALUES (
    target_tenant_id, 'permissions', permission_code, enabled::text, 'boolean'
  )
  ON CONFLICT (tenant_id, setting_category, setting_key)
  DO UPDATE SET 
    setting_value = enabled::text,
    updated_at = NOW();
  
  -- Sync with roles_permissions if roles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
    -- Get or create Admin role for this tenant
    SELECT * INTO role_record
    FROM public.roles 
    WHERE tenant_id = target_tenant_id AND nom_role = 'Admin'
    LIMIT 1;
    
    IF NOT FOUND THEN
      INSERT INTO public.roles (tenant_id, nom_role, description)
      VALUES (target_tenant_id, 'Admin', 'Administrateur')
      RETURNING * INTO role_record;
    END IF;
    
    -- Get permission record
    SELECT * INTO permission_record
    FROM public.permissions 
    WHERE code_permission = permission_code;
    
    -- Update roles_permissions
    INSERT INTO public.roles_permissions (
      tenant_id, role_id, permission_id, accorde
    ) VALUES (
      target_tenant_id, role_record.id, permission_record.id, enabled
    )
    ON CONFLICT (tenant_id, role_id, permission_id)
    DO UPDATE SET 
      accorde = enabled,
      updated_at = NOW();
  END IF;
  
  -- Log the action
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, new_values
  ) VALUES (
    target_tenant_id,
    auth.uid(),
    'NETWORK_TOGGLE_PERMISSION',
    'permissions',
    jsonb_build_object(
      'permission_code', permission_code,
      'enabled', enabled,
      'target_tenant', target_tenant_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'permission_code', permission_code,
    'enabled', enabled
  );
END;
$$;

-- 6. Update security settings
CREATE OR REPLACE FUNCTION public.network_update_security_settings(
  target_tenant_id uuid,
  settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_key text;
  setting_value text;
BEGIN
  -- Authorization check
  IF NOT (public.is_system_admin() OR target_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;
  
  -- Update each security setting
  FOR setting_key IN SELECT jsonb_object_keys(settings)
  LOOP
    setting_value := settings->>setting_key;
    
    INSERT INTO public.network_admin_settings (
      tenant_id, setting_category, setting_key, setting_value, setting_type
    ) VALUES (
      target_tenant_id, 'security', setting_key, setting_value, 
      CASE 
        WHEN setting_key IN ('force_2fa', 'auto_lock', 'detailed_logs', 'geo_restriction') THEN 'boolean'
        WHEN setting_key IN ('authorized_ips', 'allowed_countries') THEN 'json'
        ELSE 'string'
      END
    )
    ON CONFLICT (tenant_id, setting_category, setting_key)
    DO UPDATE SET 
      setting_value = setting_value,
      updated_at = NOW();
  END LOOP;
  
  -- Log the action
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, new_values
  ) VALUES (
    target_tenant_id,
    auth.uid(),
    'NETWORK_UPDATE_SECURITY',
    'network_admin_settings',
    settings
  );
  
  RETURN jsonb_build_object('success', true, 'updated_settings', settings);
END;
$$;

-- Ensure basic network permissions exist with correct categories
INSERT INTO public.permissions (code_permission, nom_permission, description, categorie, is_system)
VALUES 
  ('network.read', 'Lecture réseau', 'Permet de lire les données du réseau', 'network', true),
  ('network.write', 'Écriture réseau', 'Permet de modifier les données du réseau', 'network', true),
  ('network.delete', 'Suppression réseau', 'Permet de supprimer les données du réseau', 'network', true),
  ('network.admin', 'Administration réseau', 'Accès complet aux fonctionnalités réseau', 'network', true),
  ('network.backup', 'Sauvegardes réseau', 'Permet de créer et gérer les sauvegardes', 'network', true),
  ('network.reports', 'Rapports réseau', 'Permet de générer et consulter les rapports', 'network', true)
ON CONFLICT (code_permission) DO NOTHING;