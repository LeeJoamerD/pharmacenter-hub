-- Fonction RPC pour recalculer les prix TTC des lots avec arrondi configurable
CREATE OR REPLACE FUNCTION recalculer_prix_lots_avec_arrondi(
  p_precision INTEGER DEFAULT 25,
  p_method TEXT DEFAULT 'ceil'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_tenant_id UUID;
BEGIN
  -- Récupérer le tenant_id de l'utilisateur courant
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant non trouvé');
  END IF;

  -- Arrondi au multiple supérieur (ceil)
  IF p_method = 'ceil' THEN
    UPDATE lots l
    SET 
      prix_vente_ttc = CEIL(
        (COALESCE(prix_vente_ht, 0) + COALESCE(montant_tva, 0) + COALESCE(montant_centime_additionnel, 0))::NUMERIC / p_precision
      ) * p_precision,
      prix_vente_suggere = CEIL(
        (COALESCE(prix_vente_ht, 0) + COALESCE(montant_tva, 0) + COALESCE(montant_centime_additionnel, 0))::NUMERIC / p_precision
      ) * p_precision,
      updated_at = NOW()
    WHERE l.tenant_id = v_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_vente_ht IS NOT NULL;
  -- Arrondi au multiple inférieur (floor)
  ELSIF p_method = 'floor' THEN
    UPDATE lots l
    SET 
      prix_vente_ttc = FLOOR(
        (COALESCE(prix_vente_ht, 0) + COALESCE(montant_tva, 0) + COALESCE(montant_centime_additionnel, 0))::NUMERIC / p_precision
      ) * p_precision,
      prix_vente_suggere = FLOOR(
        (COALESCE(prix_vente_ht, 0) + COALESCE(montant_tva, 0) + COALESCE(montant_centime_additionnel, 0))::NUMERIC / p_precision
      ) * p_precision,
      updated_at = NOW()
    WHERE l.tenant_id = v_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_vente_ht IS NOT NULL;
  -- Arrondi standard (round) ou none
  ELSE
    UPDATE lots l
    SET 
      prix_vente_ttc = ROUND(
        (COALESCE(prix_vente_ht, 0) + COALESCE(montant_tva, 0) + COALESCE(montant_centime_additionnel, 0))::NUMERIC / p_precision
      ) * p_precision,
      prix_vente_suggere = ROUND(
        (COALESCE(prix_vente_ht, 0) + COALESCE(montant_tva, 0) + COALESCE(montant_centime_additionnel, 0))::NUMERIC / p_precision
      ) * p_precision,
      updated_at = NOW()
    WHERE l.tenant_id = v_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_vente_ht IS NOT NULL;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'lots_updated', v_count,
    'precision', p_precision,
    'method', p_method,
    'tenant_id', v_tenant_id
  );
END;
$$;