-- Create function to get security settings for a pharmacy
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
  
  -- Get all security settings for the tenant
  SELECT jsonb_object_agg(
    nas.setting_key, 
    CASE 
      WHEN nas.setting_value IN ('true', 'false') THEN nas.setting_value::boolean
      ELSE nas.setting_value::text
    END
  )
  INTO result
  FROM public.network_admin_settings nas
  WHERE nas.tenant_id = target_tenant_id 
    AND nas.setting_category = 'security';
  
  -- Return empty object if no settings found
  IF result IS NULL THEN
    result := '{}'::jsonb;
  END IF;
  
  RETURN result;
END;
$function$;