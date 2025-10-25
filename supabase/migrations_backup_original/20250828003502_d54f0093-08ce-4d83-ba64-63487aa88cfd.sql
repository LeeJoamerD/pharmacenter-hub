
-- Fix network_get_security_settings: ensure CASE branches return consistent types (jsonb)
create or replace function public.network_get_security_settings(target_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  result jsonb := '{}'::jsonb;
begin
  -- Authorization check (same as previous behavior)
  if not (public.is_system_admin() or target_tenant_id = public.get_current_user_tenant_id()) then
    raise exception 'Accès non autorisé à cette officine';
  end if;

  -- Aggregate security settings into a jsonb object
  select coalesce(
    jsonb_object_agg(
      nas.setting_key,
      case
        -- For boolean-like values, cast to boolean then to jsonb
        when nas.setting_value in ('true','false') then to_jsonb(nas.setting_value::boolean)
        -- Otherwise keep as text but encode as jsonb (preserves authorized_ips as JSON string)
        else to_jsonb(nas.setting_value)
      end
    ),
    '{}'::jsonb
  )
  into result
  from public.network_admin_settings nas
  where nas.tenant_id = target_tenant_id
    and nas.setting_category = 'security';

  -- Backward compatibility: map require_2fa -> force_2fa if needed
  if (result ? 'require_2fa') and not (result ? 'force_2fa') then
    result := result || jsonb_build_object('force_2fa', result->'require_2fa');
  end if;

  return result;
end;
$$;
