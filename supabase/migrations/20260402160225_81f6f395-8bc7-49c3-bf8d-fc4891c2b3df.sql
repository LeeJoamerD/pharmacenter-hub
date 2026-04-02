
CREATE OR REPLACE FUNCTION public.delete_reception_cascade(p_reception_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_commande_id UUID;
  v_lot_ids UUID[];
  v_lots_count INT;
BEGIN
  -- Get tenant and commande from the reception
  SELECT tenant_id, commande_id INTO v_tenant_id, v_commande_id
  FROM receptions_fournisseurs
  WHERE id = p_reception_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Réception non trouvée: %', p_reception_id;
  END IF;

  -- Verify caller belongs to same tenant
  IF v_tenant_id != get_current_user_tenant_id() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Collect lot IDs linked to this reception
  SELECT ARRAY_AGG(id) INTO v_lot_ids
  FROM lots
  WHERE reception_id = p_reception_id;

  v_lots_count := COALESCE(array_length(v_lot_ids, 1), 0);

  -- Step 1: Delete data linked to lots
  IF v_lots_count > 0 THEN
    DELETE FROM mouvements_lots WHERE lot_id = ANY(v_lot_ids);
    UPDATE stock_mouvements SET lot_id = NULL WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM alertes_peremption WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM inventaire_items WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM suggestions_vente WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM lignes_ventes WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM lot_optimization_suggestions WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM ai_stock_predictions WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM ai_quality_controls WHERE lot_id = ANY(v_lot_ids);
    DELETE FROM narcotics_registry WHERE lot_id = ANY(v_lot_ids);
    -- Delete the lots themselves
    DELETE FROM lots WHERE id = ANY(v_lot_ids);
  END IF;

  -- Step 2: Delete reception lines (CASCADE should handle but be explicit)
  DELETE FROM lignes_reception_fournisseur WHERE reception_id = p_reception_id;

  -- Step 3: Detach linked records
  UPDATE factures SET reception_id = NULL WHERE reception_id = p_reception_id;
  UPDATE paiements_fournisseurs SET reception_id = NULL WHERE reception_id = p_reception_id;
  UPDATE inventaire_sessions SET reception_id = NULL WHERE reception_id = p_reception_id;

  -- Step 4: Delete the reception
  DELETE FROM receptions_fournisseurs WHERE id = p_reception_id;

  -- Step 5: Delete linked order if exists
  IF v_commande_id IS NOT NULL THEN
    DELETE FROM lignes_commande_fournisseur WHERE commande_id = v_commande_id;
    DELETE FROM suivi_commandes WHERE commande_id = v_commande_id;
    DELETE FROM pharmaml_transmissions WHERE commande_id = v_commande_id;
    UPDATE evaluations_fournisseurs SET commande_id = NULL WHERE commande_id = v_commande_id;
    DELETE FROM commandes_fournisseurs WHERE id = v_commande_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'lots_supprimes', v_lots_count,
    'commande_supprimee', v_commande_id IS NOT NULL
  );
END;
$$;
