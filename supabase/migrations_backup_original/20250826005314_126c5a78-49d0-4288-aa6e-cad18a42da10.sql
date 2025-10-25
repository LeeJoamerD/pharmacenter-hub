-- Fix RLS policies for backup functionality

-- Ensure RLS policies exist for network_backup_runs table
DROP POLICY IF EXISTS "Users can view backup runs from their tenant" ON public.network_backup_runs;
DROP POLICY IF EXISTS "Users can insert backup runs in their tenant" ON public.network_backup_runs;
DROP POLICY IF EXISTS "Users can update backup runs from their tenant" ON public.network_backup_runs;

-- Create comprehensive RLS policies for network_backup_runs
CREATE POLICY "Users can view backup runs from their tenant" 
ON public.network_backup_runs 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert backup runs in their tenant" 
ON public.network_backup_runs 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update backup runs from their tenant" 
ON public.network_backup_runs 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Ensure RLS policies exist for parametres_systeme table
DROP POLICY IF EXISTS "Users can view system parameters from their tenant" ON public.parametres_systeme;
DROP POLICY IF EXISTS "Users can insert system parameters in their tenant" ON public.parametres_systeme;
DROP POLICY IF EXISTS "Users can update system parameters from their tenant" ON public.parametres_systeme;
DROP POLICY IF EXISTS "Users can upsert system parameters in their tenant" ON public.parametres_systeme;

-- Create comprehensive RLS policies for parametres_systeme
CREATE POLICY "Users can view system parameters from their tenant" 
ON public.parametres_systeme 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert system parameters in their tenant" 
ON public.parametres_systeme 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update system parameters in their tenant" 
ON public.parametres_systeme 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Ensure RLS is enabled on both tables
ALTER TABLE public.network_backup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_systeme ENABLE ROW LEVEL SECURITY;