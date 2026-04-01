CREATE OR REPLACE FUNCTION public.check_pharmacy_has_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM personnel
    WHERE tenant_id = p_tenant_id AND role = 'Admin' AND is_active = true
  );
$$;