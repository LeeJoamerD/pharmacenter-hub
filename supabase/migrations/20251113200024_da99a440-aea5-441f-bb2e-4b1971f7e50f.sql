-- Fix get_current_user_tenant_id function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public', 'auth'
AS $$
  SELECT tenant_id 
  FROM public.personnel 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_current_user_tenant_id() IS 'Returns the tenant_id for the currently authenticated user by looking up their personnel record';