-- Fonction RPC pour récupérer un mapping Excel fournisseur
-- Contourne le RLS sur fournisseurs tout en appliquant des contrôles stricts
CREATE OR REPLACE FUNCTION public.get_supplier_excel_mapping(
  p_fournisseur_id UUID,
  p_fournisseur_nom TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  fournisseur_id UUID,
  mapping_config JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_country TEXT;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Récupérer le tenant et le pays de l'utilisateur courant
  v_tenant_id := get_current_user_tenant_id();
  v_country := get_current_user_country();

  IF v_tenant_id IS NULL OR v_country IS NULL THEN
    RETURN;
  END IF;

  -- 1. D'abord chercher un mapping propre au tenant courant (par ID exact)
  RETURN QUERY
  SELECT 
    sem.id,
    sem.tenant_id,
    sem.fournisseur_id,
    sem.mapping_config,
    sem.is_active,
    sem.created_at,
    sem.updated_at,
    TRUE as is_owner
  FROM supplier_excel_mappings sem
  WHERE sem.tenant_id = v_tenant_id
    AND sem.fournisseur_id = p_fournisseur_id
    AND sem.is_active = true
  LIMIT 1;

  -- Si on a trouvé un mapping propre, on s'arrête là
  IF FOUND THEN
    RETURN;
  END IF;

  -- 2. Si pas de mapping propre et qu'on a un nom, chercher par NOM de fournisseur
  IF p_fournisseur_nom IS NOT NULL AND trim(p_fournisseur_nom) <> '' THEN
    RETURN QUERY
    SELECT 
      sem.id,
      sem.tenant_id,
      sem.fournisseur_id,
      sem.mapping_config,
      sem.is_active,
      sem.created_at,
      sem.updated_at,
      FALSE as is_owner
    FROM supplier_excel_mappings sem
    INNER JOIN fournisseurs f ON f.id = sem.fournisseur_id
    INNER JOIN pharmacies p ON p.id = sem.tenant_id
    WHERE upper(trim(f.nom)) = upper(trim(p_fournisseur_nom))
      AND p.pays = v_country
      AND sem.is_active = true
      AND sem.tenant_id <> v_tenant_id
    ORDER BY sem.created_at DESC
    LIMIT 1;
  END IF;

  RETURN;
END;
$$;

-- Accorder les permissions aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_supplier_excel_mapping(UUID, TEXT) TO authenticated;