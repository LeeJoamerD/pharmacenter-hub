-- Fix critical security vulnerabilities in security-sensitive tables
-- Restrict access to security data to system administrators only

-- ==== AUDIT_LOGS TABLE ====
-- Remove overly permissive policy that allows all users to view audit logs
DROP POLICY IF EXISTS "Authenticated users can view audit logs from their tenant" ON public.audit_logs;

-- Create secure admin-only policy for audit logs
CREATE POLICY "System admins can view audit logs from their tenant"
ON public.audit_logs
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

-- ==== LOGIN_ATTEMPTS TABLE ====
-- Remove policy that allows regular users to view login attempts
DROP POLICY IF EXISTS "Users can view login attempts from their tenant" ON public.login_attempts;

-- Keep admin policy and insert policy, but make view more restrictive
CREATE POLICY "System admins can view all login attempts from their tenant"
ON public.login_attempts
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

-- Allow users to view only their own login attempts (for security monitoring)
CREATE POLICY "Users can view their own login attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id()
  AND lower(email) = lower((
    SELECT p.email FROM public.personnel p 
    WHERE p.auth_user_id = auth.uid() 
    AND p.tenant_id = get_current_user_tenant_id()
  ))
);

-- ==== SECURITY_ALERTS TABLE ====
-- Remove overly permissive policies for security alerts
DROP POLICY IF EXISTS "Users can view security alerts from their tenant" ON public.security_alerts;

-- Create secure admin-only view policy for security alerts
CREATE POLICY "System admins can view security alerts from their tenant"
ON public.security_alerts
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

-- ==== USER_SESSIONS TABLE ====
-- Remove broad session viewing policy
DROP POLICY IF EXISTS "Users can view sessions from their tenant" ON public.user_sessions;

-- Create more restrictive policies for user sessions
CREATE POLICY "System admins can view all sessions from their tenant"
ON public.user_sessions
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

-- Users can still view their own sessions (keep existing policy)
-- The "Personnel can view their own sessions" policy is already secure

-- Create function to check if user is system admin (for future use)
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT p.role INTO user_role
  FROM public.personnel p
  WHERE p.auth_user_id = auth.uid()
  AND p.tenant_id = get_current_user_tenant_id();
  
  RETURN user_role IN ('Admin', 'Pharmacien');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_system_admin TO authenticated;

-- Add security documentation
COMMENT ON TABLE public.audit_logs IS 'SECURITY SENSITIVE: Contains system activity logs. Access restricted to system administrators only.';
COMMENT ON TABLE public.login_attempts IS 'SECURITY SENSITIVE: Contains login failure tracking. Access restricted to system administrators and users viewing their own attempts.';
COMMENT ON TABLE public.security_alerts IS 'SECURITY SENSITIVE: Contains security incident data. Access restricted to system administrators only.';
COMMENT ON TABLE public.user_sessions IS 'SECURITY SENSITIVE: Contains session tracking data. Access restricted to system administrators and users viewing their own sessions.';