-- Fix critical security vulnerability in personnel table
-- Remove overly permissive policy that allows all authenticated users to see sensitive data
DROP POLICY IF EXISTS "Authenticated users can view personnel from their tenant" ON public.personnel;

-- Create more secure, role-based policies for personnel data access

-- Policy 1: Admins and Pharmacists can view all personnel data in their tenant
CREATE POLICY "Secure admin personnel view access"
ON public.personnel
FOR SELECT
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel p
    WHERE p.auth_user_id = auth.uid()
    AND p.tenant_id = get_current_user_tenant_id()
    AND p.role IN ('Admin', 'Pharmacien')
  )
);

-- Policy 2: Users can view their own complete profile (this already exists, so skip)
-- CREATE POLICY "Users can view their own complete profile" already exists

-- Create a secure function for basic personnel info that excludes sensitive data
CREATE OR REPLACE FUNCTION public.get_personnel_basic_info(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  noms text,
  prenoms text,
  reference_agent text,
  fonction text,
  role text,
  is_active boolean,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_tenant_id uuid;
  user_role text;
BEGIN
  -- Get current user's tenant and role
  SELECT p.tenant_id, p.role 
  INTO user_tenant_id, user_role
  FROM public.personnel p 
  WHERE p.auth_user_id = auth.uid();
  
  -- Return basic info excluding sensitive data (salaries, birth dates, NIU, etc.)
  RETURN QUERY
  SELECT 
    per.id,
    per.tenant_id,
    per.noms,
    per.prenoms, 
    per.reference_agent,
    per.fonction,
    per.role,
    per.is_active,
    per.created_at
  FROM public.personnel per
  WHERE per.tenant_id = COALESCE(p_tenant_id, user_tenant_id)
  AND per.tenant_id = user_tenant_id -- Extra security check
  AND per.is_active = true; -- Only show active personnel
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_personnel_basic_info TO authenticated;

-- Add comment documenting the security model
COMMENT ON TABLE public.personnel IS 'Personnel table with role-based access: Admins/Pharmacists see all data, users see only their own complete profile. Use get_personnel_basic_info() for basic colleague information excluding sensitive data like salaries, birth dates, NIU numbers, etc.';