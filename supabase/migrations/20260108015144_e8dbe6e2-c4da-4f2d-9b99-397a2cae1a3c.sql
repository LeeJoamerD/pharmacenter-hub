-- Fonction pour récupérer le pays du tenant courant
CREATE OR REPLACE FUNCTION public.get_current_user_country()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_country TEXT;
BEGIN
  SELECT p.pays INTO user_country
  FROM public.pharmacies p
  INNER JOIN public.personnel pers ON pers.tenant_id = p.id
  WHERE pers.auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_country;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_country() TO authenticated;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their tenant mappings" ON public.supplier_excel_mappings;
DROP POLICY IF EXISTS "Users can insert their tenant mappings" ON public.supplier_excel_mappings;
DROP POLICY IF EXISTS "Users can update their tenant mappings" ON public.supplier_excel_mappings;
DROP POLICY IF EXISTS "Users can delete their tenant mappings" ON public.supplier_excel_mappings;

-- SELECT : Visible par tous les tenants du même pays
CREATE POLICY "Users can view mappings from same country"
ON public.supplier_excel_mappings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pharmacies p
    WHERE p.id = supplier_excel_mappings.tenant_id
    AND p.pays = public.get_current_user_country()
  )
);

-- INSERT : Chaque tenant peut créer ses propres mappings
CREATE POLICY "Users can insert their tenant mappings"
ON public.supplier_excel_mappings
FOR INSERT
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
);

-- UPDATE : Seul le tenant créateur OU admin système peut modifier
CREATE POLICY "Owner or admin can update mappings"
ON public.supplier_excel_mappings
FOR UPDATE
USING (
  tenant_id = public.get_current_user_tenant_id()
  OR public.is_system_admin()
);

-- DELETE : Seul le tenant créateur OU admin système peut supprimer
CREATE POLICY "Owner or admin can delete mappings"
ON public.supplier_excel_mappings
FOR DELETE
USING (
  tenant_id = public.get_current_user_tenant_id()
  OR public.is_system_admin()
);

-- Ajouter un commentaire explicatif sur la table
COMMENT ON TABLE public.supplier_excel_mappings IS 'Mappings Excel des fournisseurs - partagés en lecture seule entre pharmacies du même pays';