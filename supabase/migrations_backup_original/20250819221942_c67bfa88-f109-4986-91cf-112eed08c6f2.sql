-- SECURITY FIX: Complete security hardening - final attempt

-- 1. Make tenant_id nullable in audit_logs for system events
ALTER TABLE public.audit_logs ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Harden SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_tenant_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT tenant_id INTO user_tenant_id
  FROM public.personnel 
  WHERE auth_user_id = current_user_id
  AND is_active = true
  LIMIT 1;
  
  IF user_tenant_id IS NOT NULL THEN
    RETURN user_tenant_id;
  END IF;
  
  SELECT ph.id INTO user_tenant_id
  FROM public.pharmacies ph
  WHERE ph.email IN (
    SELECT email FROM auth.users WHERE id = current_user_id
  )
  AND ph.status = 'active'
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$function$;

-- 3. Secure RLS policies for sensitive tables
CREATE POLICY "Personnel can view their own 2FA settings"
ON public.two_factor_auth
FOR SELECT
TO authenticated
USING (
  personnel_id IN (
    SELECT id FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Personnel can update their own 2FA settings"  
ON public.two_factor_auth
FOR UPDATE
TO authenticated
USING (
  personnel_id IN (
    SELECT id FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  )
);

-- Enable RLS on password_history (no client policies = no access)
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- User sessions - own sessions only
CREATE POLICY "Personnel can view their own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND personnel_id IN (
    SELECT id FROM public.personnel 
    WHERE auth_user_id = auth.uid()
  )
);

-- Login attempts - admin view only
CREATE POLICY "Admins can view login attempts from their tenant"
ON public.login_attempts  
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Pharmacy sessions - fully private
ALTER TABLE public.pharmacy_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Setup cross-tenant security
SELECT public.setup_cross_tenant_security_triggers();

-- 5. Reduce session expiry to 48 hours
ALTER TABLE public.pharmacy_sessions 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '48 hours');

UPDATE public.pharmacy_sessions 
SET expires_at = created_at + INTERVAL '48 hours'
WHERE expires_at > created_at + INTERVAL '48 hours';

-- 6. Log security hardening completion
INSERT INTO public.audit_logs (
  action, table_name, new_values, status
) VALUES (
  'SECURITY_HARDENING_COMPLETE',
  'system',
  jsonb_build_object(
    'timestamp', now(),
    'changes', ARRAY[
      'hardened_security_definer_functions',
      'implemented_strict_rls_policies', 
      'activated_cross_tenant_triggers',
      'reduced_session_expiry_to_48h',
      'enabled_system_audit_logging'
    ]
  ),
  'success'
);