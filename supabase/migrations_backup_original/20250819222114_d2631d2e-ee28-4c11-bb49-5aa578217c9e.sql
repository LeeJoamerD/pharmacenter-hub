-- SECURITY FIX PHASE 2: Address critical linter warnings

-- 1. Fix remaining SECURITY DEFINER functions without SET search_path
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id IS NULL 
    AND role = 'Super Admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_permission(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  user_tenant_id UUID;
BEGIN
  IF public.is_system_admin() THEN
    RETURN true;
  END IF;
  
  SELECT role, tenant_id INTO user_role, user_tenant_id
  FROM public.personnel 
  WHERE auth_user_id = auth.uid();
  
  IF user_tenant_id IS NULL AND user_role != 'Super Admin' THEN
    RETURN false;
  END IF;
  
  RETURN user_role = ANY(required_roles);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_cross_tenant_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_tenant_id UUID;
  attempted_tenant_id UUID;
  user_role TEXT;
  table_name TEXT := TG_TABLE_NAME;
BEGIN
  SELECT p.tenant_id, p.role INTO user_tenant_id, user_role
  FROM public.personnel p
  WHERE p.auth_user_id = auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    attempted_tenant_id := OLD.tenant_id;
  ELSE
    attempted_tenant_id := NEW.tenant_id;
  END IF;
  
  IF user_tenant_id IS NOT NULL AND 
     attempted_tenant_id IS NOT NULL AND 
     user_tenant_id != attempted_tenant_id THEN
    
    INSERT INTO public.security_alerts (
      tenant_id,
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      user_tenant_id,
      auth.uid(),
      'cross_tenant_violation',
      'critical',
      'Tentative d''accès cross-tenant bloquée sur ' || table_name,
      jsonb_build_object(
        'user_tenant', user_tenant_id,
        'attempted_tenant', attempted_tenant_id,
        'table', table_name,
        'operation', TG_OP,
        'user_role', user_role,
        'timestamp', NOW(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    );
    
    RAISE EXCEPTION 'SÉCURITÉ: Accès cross-tenant interdit. Incident signalé. [Code: CT-%]', 
      EXTRACT(EPOCH FROM NOW())::bigint;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 2. Tighten RLS policies to restrict anonymous access (most critical tables)

-- Drop and recreate policies with "TO authenticated" restriction
DROP POLICY IF EXISTS "Users can view personnel from their tenant" ON public.personnel;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.personnel;
DROP POLICY IF EXISTS "Admins can update personnel in their tenant" ON public.personnel;

CREATE POLICY "Authenticated users can view personnel from their tenant"
ON public.personnel
FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update their own profile"
ON public.personnel  
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Authenticated admins can update personnel in their tenant"
ON public.personnel
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Fix audit_logs policy
DROP POLICY IF EXISTS "Users can view audit logs from their tenant" ON public.audit_logs;
CREATE POLICY "Authenticated users can view audit logs from their tenant"
ON public.audit_logs
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

-- Fix pharmacies policies (these were problematic in the original security issue)
DROP POLICY IF EXISTS "Allow pharmacy authentication" ON public.pharmacies;
DROP POLICY IF EXISTS "Users can view pharmacies from their tenant" ON public.pharmacies;

CREATE POLICY "Authenticated users can view network pharmacy directory"
ON public.pharmacies
FOR SELECT
TO authenticated
USING (status = 'active');

CREATE POLICY "Authenticated users can view their own pharmacy"
ON public.pharmacies
FOR SELECT
TO authenticated  
USING (id = public.get_current_user_tenant_id());

-- Fix critical data tables
DROP POLICY IF EXISTS "Users can view products from their tenant" ON public.produits;
CREATE POLICY "Authenticated users can view products from their tenant"
ON public.produits
FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can view lots from their tenant" ON public.lots;
CREATE POLICY "Authenticated users can view lots from their tenant"
ON public.lots
FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can view clients from their tenant" ON public.clients;
CREATE POLICY "Authenticated users can view clients from their tenant"
ON public.clients
FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

-- 3. Log security hardening phase 2 completion
INSERT INTO public.audit_logs (
  action, table_name, new_values, status
) VALUES (
  'SECURITY_HARDENING_PHASE_2_COMPLETE',
  'system',
  jsonb_build_object(
    'timestamp', now(),
    'fixed_issues', ARRAY[
      'added_set_search_path_to_critical_functions',
      'restricted_rls_policies_to_authenticated_users',
      'secured_pharmacy_data_access',
      'tightened_audit_log_access',
      'secured_critical_business_data_tables'
    ],
    'remaining_tasks', ARRAY[
      'enable_leaked_password_protection_in_supabase_auth_settings',
      'review_remaining_anonymous_access_policies'
    ]
  ),
  'success'
);