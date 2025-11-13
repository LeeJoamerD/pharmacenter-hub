-- Fix RLS policies for lot_optimization_metrics table
-- Drop all existing policies first, then create new ones with explicit WITH CHECK clauses

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view metrics from their tenant" ON public.lot_optimization_metrics;
DROP POLICY IF EXISTS "Users can manage metrics from their tenant" ON public.lot_optimization_metrics;
DROP POLICY IF EXISTS "Users can insert metrics in their tenant" ON public.lot_optimization_metrics;
DROP POLICY IF EXISTS "Users can update metrics in their tenant" ON public.lot_optimization_metrics;
DROP POLICY IF EXISTS "Users can delete metrics in their tenant" ON public.lot_optimization_metrics;

-- Create separate policies with explicit WITH CHECK clauses

-- Policy for SELECT (view metrics)
CREATE POLICY "Users can view metrics from their tenant"
  ON public.lot_optimization_metrics FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Policy for INSERT with explicit WITH CHECK
CREATE POLICY "Users can insert metrics in their tenant"
  ON public.lot_optimization_metrics FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policy for UPDATE with both USING and WITH CHECK
CREATE POLICY "Users can update metrics in their tenant"
  ON public.lot_optimization_metrics FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policy for DELETE
CREATE POLICY "Users can delete metrics in their tenant"
  ON public.lot_optimization_metrics FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());