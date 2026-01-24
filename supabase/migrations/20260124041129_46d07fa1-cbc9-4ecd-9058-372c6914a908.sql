-- RPC: Génération de code interne unique pour les produits sans code CIP
-- Format: PHR-00001, PHR-00002, etc. (unique par tenant)

CREATE OR REPLACE FUNCTION public.generate_internal_product_code(p_product_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_existing_code TEXT;
  v_new_code TEXT;
  v_sequence INT;
BEGIN
  -- Récupérer le tenant_id du produit et vérifier s'il existe déjà un code
  SELECT tenant_id, code_barre_externe INTO v_tenant_id, v_existing_code
  FROM public.produits
  WHERE id = p_product_id;
  
  -- Vérifier que le produit existe
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Produit non trouvé: %', p_product_id;
  END IF;
  
  -- Si un code existe déjà, le retourner sans modification
  IF v_existing_code IS NOT NULL AND v_existing_code != '' THEN
    RETURN v_existing_code;
  END IF;
  
  -- Trouver le prochain numéro de séquence pour ce tenant
  -- En cherchant le max des codes existants au format PHR-XXXXX
  SELECT COALESCE(MAX(
    CASE 
      WHEN code_barre_externe ~ '^PHR-[0-9]+$' 
      THEN CAST(SUBSTRING(code_barre_externe FROM 5) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1 INTO v_sequence
  FROM public.produits
  WHERE tenant_id = v_tenant_id;
  
  -- Générer le nouveau code (format: PHR-00001)
  v_new_code := 'PHR-' || LPAD(v_sequence::TEXT, 5, '0');
  
  -- Mettre à jour le produit avec le nouveau code
  UPDATE public.produits
  SET code_barre_externe = v_new_code,
      updated_at = NOW()
  WHERE id = p_product_id;
  
  RETURN v_new_code;
END;
$$;

-- Accorder les permissions aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.generate_internal_product_code(UUID) TO authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.generate_internal_product_code IS 'Génère un code-barres interne unique (PHR-XXXXX) pour les produits sans code CIP. Utilisé pour l''impression d''étiquettes avec codes-barres scannables.';