-- Function to initialize inventory items for a session from current stock data
CREATE OR REPLACE FUNCTION public.init_inventaire_items(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_tenant_id UUID;
  current_tenant_id UUID;
  items_count INTEGER;
  inserted_count INTEGER := 0;
BEGIN
  -- Get current user's tenant
  current_tenant_id := public.get_current_user_tenant_id();
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Verify session belongs to current tenant
  SELECT tenant_id INTO session_tenant_id
  FROM public.inventaire_sessions
  WHERE id = p_session_id AND tenant_id = current_tenant_id;

  IF session_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  -- Check if session already has items
  SELECT COUNT(*) INTO items_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id AND tenant_id = current_tenant_id;

  IF items_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La session contient déjà des éléments');
  END IF;

  -- Insert inventory items from current stock
  INSERT INTO public.inventaire_items (
    tenant_id, session_id, produit_id, lot_id, code_barre, produit_nom, 
    lot_numero, quantite_theorique, emplacement_theorique, unite, statut
  )
  SELECT DISTINCT
    current_tenant_id,
    p_session_id,
    v.produit_id,
    v.lot_id,
    COALESCE(v.code_cip, 'PRODUIT-' || v.produit_id::text),
    v.libelle_produit,
    v.numero_lot,
    COALESCE(v.lot_quantite_restante, 0),
    COALESCE(v.emplacement_source, 'Stock principal'),
    'unités',
    'non_compte'
  FROM public.v_mouvements_lots_details v
  WHERE v.tenant_id = current_tenant_id 
    AND v.lot_quantite_restante > 0
    AND v.libelle_produit IS NOT NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Update session aggregates
  UPDATE public.inventaire_sessions
  SET 
    produits_total = inserted_count,
    produits_comptes = 0,
    ecarts = 0,
    progression = 0,
    updated_at = NOW()
  WHERE id = p_session_id AND tenant_id = current_tenant_id;

  RETURN jsonb_build_object(
    'success', true, 
    'inserted_count', inserted_count,
    'message', format('Session initialisée avec %s éléments', inserted_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;