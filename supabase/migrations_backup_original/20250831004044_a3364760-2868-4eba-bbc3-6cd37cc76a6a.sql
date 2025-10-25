-- Fix critical security vulnerability in personnel table
-- Remove overly permissive policy that allows all authenticated users to see sensitive data
DROP POLICY IF EXISTS "Authenticated users can view personnel from their tenant" ON public.personnel;

-- Create more secure, role-based policies for personnel data access

-- Policy 1: Admins and Pharmacists can view all personnel data in their tenant
CREATE POLICY "Admins can view all personnel data in their tenant"
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

-- Policy 2: Users can view their own complete profile
CREATE POLICY "Users can view their own complete profile"
ON public.personnel
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Policy 3: Regular users can only see basic public info of colleagues (no sensitive data)
-- This policy will be handled by a security definer function to control which columns are visible

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
  
  -- If user is admin/pharmacist, they use the direct table access policy above
  -- This function is for regular users to see basic colleague info only
  IF user_role NOT IN ('Admin', 'Pharmacien') THEN
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
    AND per.tenant_id = user_tenant_id; -- Extra security check
  END IF;
  
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_personnel_basic_info TO authenticated;

-- Add audit logging for sensitive personnel data access
CREATE OR REPLACE FUNCTION public.log_personnel_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  accessing_sensitive_data boolean := false;
BEGIN
  -- Check if this is accessing sensitive columns
  IF TG_OP = 'SELECT' THEN
    -- Log access to sensitive personnel data
    SELECT role INTO current_user_role
    FROM public.personnel 
    WHERE auth_user_id = auth.uid();
    
    -- Log when non-admin users access personnel data (this shouldn't happen with our new policies)
    IF current_user_role NOT IN ('Admin', 'Pharmacien') AND OLD.auth_user_id != auth.uid() THEN
      INSERT INTO public.audit_logs (
        tenant_id, user_id, action, table_name, record_id, 
        new_values, status
      ) VALUES (
        OLD.tenant_id, auth.uid(), 'SENSITIVE_PERSONNEL_ACCESS', 'personnel',
        OLD.id::text,
        jsonb_build_object(
          'accessed_user', OLD.id,
          'accessor_role', current_user_role,
          'timestamp', now()
        ),
        'logged'
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Note: We won't add the trigger for now as it could impact performance
-- CREATE TRIGGER personnel_access_audit AFTER SELECT ON public.personnel
-- FOR EACH ROW EXECUTE FUNCTION public.log_personnel_access();

-- Add comment documenting the security model
COMMENT ON TABLE public.personnel IS 'Personnel table with role-based access: Admins see all data, users see only their own complete profile, regular users can use get_personnel_basic_info() for basic colleague information excluding sensitive data like salaries, birth dates, NIU numbers, etc.';