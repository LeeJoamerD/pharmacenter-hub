-- Fix SQL error in network_update_security_settings function
CREATE OR REPLACE FUNCTION public.network_update_security_settings(target_tenant_id uuid, settings jsonb)
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