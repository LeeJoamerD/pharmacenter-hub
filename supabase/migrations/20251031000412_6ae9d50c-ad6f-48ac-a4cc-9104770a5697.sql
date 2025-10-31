-- Fix RLS policies for document_categories table
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view document categories from their tenant" ON public.document_categories;
DROP POLICY IF EXISTS "Users can view document categories from their tenant or system" ON public.document_categories;
DROP POLICY IF EXISTS "Users can insert document categories in their tenant" ON public.document_categories;
DROP POLICY IF EXISTS "Users can update document categories from their tenant" ON public.document_categories;
DROP POLICY IF EXISTS "Users can delete document categories from their tenant" ON public.document_categories;

-- Create new policies with authenticated role
CREATE POLICY "Authenticated users can view document categories"
  ON public.document_categories
  FOR SELECT
  TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can insert document categories"
  ON public.document_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Authenticated users can update document categories"
  ON public.document_categories
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_user_tenant_id() AND is_system = false);

CREATE POLICY "Authenticated users can delete document categories"
  ON public.document_categories
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_user_tenant_id() AND is_system = false);