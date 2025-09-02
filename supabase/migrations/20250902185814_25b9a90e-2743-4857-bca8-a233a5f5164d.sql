-- Fix infinite recursion in get_current_user_tenant_id function
-- Use CREATE OR REPLACE to update the function without breaking dependencies

-- Recreate the function to use plpgsql and bypass RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result UUID;
BEGIN
  -- Query personnel table directly bypassing RLS since this is a security definer function
  SELECT tenant_id INTO result 
  FROM public.personnel 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Update is_system_admin function to be more robust
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_tenant_id uuid;
BEGIN
  -- Get both tenant_id and role in one query to avoid multiple calls
  SELECT tenant_id, role INTO user_tenant_id, user_role
  FROM public.personnel
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- Return true if user is admin/pharmacien and has a tenant
  RETURN (user_tenant_id IS NOT NULL AND user_role IN ('Admin', 'Pharmacien'));
END;
$$;

-- Add helper function to check if user exists in personnel table
CREATE OR REPLACE FUNCTION public.user_has_personnel_record()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_personnel_record TO authenticated;

-- Add debug function to help troubleshoot connection issues
CREATE OR REPLACE FUNCTION public.debug_user_connection_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  user_id uuid;
  personnel_record record;
  pharmacy_record record;
BEGIN
  user_id := auth.uid();
  
  -- Get personnel info
  SELECT * INTO personnel_record
  FROM public.personnel
  WHERE auth_user_id = user_id
  LIMIT 1;
  
  -- Get pharmacy info if personnel exists
  IF personnel_record.tenant_id IS NOT NULL THEN
    SELECT * INTO pharmacy_record
    FROM public.pharmacies
    WHERE id = personnel_record.tenant_id
    LIMIT 1;
  END IF;
  
  result := jsonb_build_object(
    'user_id', user_id,
    'has_personnel', (personnel_record.id IS NOT NULL),
    'personnel_tenant_id', personnel_record.tenant_id,
    'personnel_role', personnel_record.role,
    'has_pharmacy', (pharmacy_record.id IS NOT NULL),
    'pharmacy_name', pharmacy_record.name,
    'pharmacy_status', pharmacy_record.status
  );
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_user_connection_state TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_current_user_tenant_id() IS 'SECURITY DEFINER: Returns tenant_id for current authenticated user. Uses plpgsql to bypass RLS and avoid infinite recursion.';
COMMENT ON FUNCTION public.is_system_admin() IS 'SECURITY DEFINER: Checks if current user is system admin (Admin/Pharmacien role).';
COMMENT ON FUNCTION public.user_has_personnel_record() IS 'SECURITY DEFINER: Checks if current user has a personnel record.';
COMMENT ON FUNCTION public.debug_user_connection_state() IS 'SECURITY DEFINER: Debug helper to check user connection state.';