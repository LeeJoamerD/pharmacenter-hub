-- Fix SQL error in network_get_pharmacy_permissions function
CREATE OR REPLACE FUNCTION public.network_get_pharmacy_permissions(target_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  permissions_result jsonb := '[]'::jsonb;
  permission_record record;
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