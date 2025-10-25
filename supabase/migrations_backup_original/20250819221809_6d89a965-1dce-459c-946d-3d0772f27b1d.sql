-- SECURITY FIX: Comprehensive security hardening (Fixed version)

-- 1. First, temporarily allow NULL tenant_id for system audit logs
ALTER TABLE public.audit_logs ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Harden SECURITY DEFINER functions by adding SET search_path
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
  
  IF user_tenant_id IS NOT NULL THEN
    RETURN user_tenant_id;
  END IF;
  
  SELECT ps.pharmacy_id INTO user_tenant_id
  FROM public.pharmacy_sessions ps
  WHERE ps.user_id = current_user_id
  AND ps.is_active = true
  AND ps.expires_at > now()
  ORDER BY ps.last_activity DESC
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_tenant_access(target_tenant_id uuid, operation_type text DEFAULT 'read'::text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_tenant_id UUID;
  user_role TEXT;
  is_super_admin BOOLEAN := false;
BEGIN
  SELECT p.tenant_id, p.role INTO user_tenant_id, user_role
  FROM public.personnel p
  WHERE p.auth_user_id = auth.uid();
  
  IF user_tenant_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.parametres_systeme 
    WHERE tenant_id = user_tenant_id 
    AND cle_parametre = 'allow_super_admin_access'
    AND valeur_parametre = 'true'
  ) INTO is_super_admin;
  
  IF is_super_admin AND operation_type = 'read' AND user_role = 'Admin' THEN
    INSERT INTO public.audit_logs (
      tenant_id, user_id, action, table_name, new_values, status
    ) VALUES (
      user_tenant_id,
      auth.uid(),
      'SUPER_ADMIN_ACCESS',
      'cross_tenant_read',
      jsonb_build_object(
        'target_tenant', target_tenant_id,
        'user_tenant', user_tenant_id,
        'operation', operation_type
      ),
      'logged'
    );
    RETURN true;
  END IF;
  
  RETURN user_tenant_id = target_tenant_id;
END;
$function$;

-- 3. Create comprehensive RLS policies for sensitive tables

-- Two-Factor Authentication Table - Strict RLS
DROP POLICY IF EXISTS "Users can view their 2FA settings" ON public.two_factor_auth;
DROP POLICY IF EXISTS "Users can manage their 2FA settings" ON public.two_factor_auth;

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

-- Password History - Read-only, no client access
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- User Sessions - Tenant scoped, limited access
DROP POLICY IF EXISTS "Users can view sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON public.user_sessions;

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

-- Login Attempts - Tenant scoped, read-only for users
DROP POLICY IF EXISTS "Users can view login attempts" ON public.login_attempts;

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

-- Pharmacy Sessions - Keep fully private (RLS enabled but no policies for client access)
ALTER TABLE public.pharmacy_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Create secure audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  action_type text,
  table_name text,
  record_id text DEFAULT NULL,
  old_data jsonb DEFAULT NULL,
  new_data jsonb DEFAULT NULL,
  additional_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_tenant_id UUID;
  current_personnel_id UUID;
BEGIN
  -- Get current user's tenant and personnel info
  SELECT tenant_id, id INTO current_tenant_id, current_personnel_id
  FROM public.personnel 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- If no personnel found, try to get tenant from pharmacy
  IF current_tenant_id IS NULL THEN
    SELECT id INTO current_tenant_id
    FROM public.pharmacies
    WHERE email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    LIMIT 1;
  END IF;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    personnel_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    status
  ) VALUES (
    current_tenant_id,
    auth.uid(),
    current_personnel_id,
    action_type,
    log_audit_event.table_name,
    log_audit_event.record_id,
    old_data,
    COALESCE(new_data, additional_metadata),
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    'success'
  );
END;
$function$;

-- 5. Setup cross-tenant security triggers for all tenant tables
SELECT public.setup_cross_tenant_security_triggers();

-- 6. Update pharmacy sessions to have shorter expiry (48 hours max)
ALTER TABLE public.pharmacy_sessions 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '48 hours');

-- Update existing long-lived sessions
UPDATE public.pharmacy_sessions 
SET expires_at = created_at + INTERVAL '48 hours'
WHERE expires_at > created_at + INTERVAL '48 hours';

-- 7. Create security monitoring function
CREATE OR REPLACE FUNCTION public.monitor_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Detect and alert on suspicious patterns
  PERFORM public.detect_suspicious_patterns();
  
  -- Clean up old security data
  PERFORM public.cleanup_security_data();
  
  -- Log monitoring execution (use a dummy tenant_id to avoid NULL constraint)
  INSERT INTO public.audit_logs (
    tenant_id, action, table_name, new_values, status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'SECURITY_MONITORING',
    'system',
    jsonb_build_object('timestamp', now()),
    'success'
  );
END;
$function$;

-- 8. Log this security hardening action (use dummy tenant for system events)
INSERT INTO public.audit_logs (
  tenant_id, action, table_name, new_values, status
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_HARDENING_COMPLETE',
  'system',
  jsonb_build_object(
    'timestamp', now(),
    'changes', ARRAY[
      'hardened_security_definer_functions',
      'implemented_rls_for_sensitive_tables', 
      'activated_cross_tenant_triggers',
      'reduced_session_expiry',
      'created_audit_logging_function'
    ]
  ),
  'success'
);