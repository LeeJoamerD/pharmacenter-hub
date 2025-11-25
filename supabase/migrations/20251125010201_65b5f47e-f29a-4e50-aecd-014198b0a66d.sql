-- Modifier la fonction init_inventaire_items pour supporter le filtrage par type d'inventaire
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
  session_type TEXT;
  session_secteurs TEXT[];
BEGIN
  -- Désactiver RLS pour cette fonction
  SET LOCAL row_security = off;
  
  -- Get current user's tenant
  current_tenant_id := public.get_current_user_tenant_id();
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Verify session belongs to current tenant and get type/secteurs
  SELECT tenant_id, type, secteurs INTO session_tenant_id, session_type, session_secteurs
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

  -- Insert inventory items with filtering based on session type
  IF session_type = 'complet' THEN
    -- Inventaire complet: tous les lots avec stock > 0
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
      
  ELSIF session_type = 'partiel' AND session_secteurs IS NOT NULL AND array_length(session_secteurs, 1) > 0 THEN
    -- Inventaire partiel: filtrer par rayons/secteurs
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
    INNER JOIN public.produits p ON p.id = v.produit_id
    INNER JOIN public.rayon_produit r ON r.id = p.rayon_produit_id
    WHERE v.tenant_id = current_tenant_id 
      AND v.lot_quantite_restante > 0
      AND v.libelle_produit IS NOT NULL
      AND r.libelle_rayon = ANY(session_secteurs);
      
  ELSIF session_type = 'cyclique' THEN
    -- Inventaire cyclique: produits non inventoriés récemment (30 jours)
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
    LEFT JOIN LATERAL (
      SELECT MAX(ii.date_comptage) as derniere_date
      FROM public.inventaire_items ii
      WHERE ii.produit_id = v.produit_id
        AND ii.tenant_id = current_tenant_id
        AND ii.statut = 'compte'
    ) last_inv ON true
    WHERE v.tenant_id = current_tenant_id 
      AND v.lot_quantite_restante > 0
      AND v.libelle_produit IS NOT NULL
      AND (last_inv.derniere_date IS NULL OR last_inv.derniere_date < NOW() - INTERVAL '30 days');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type d''inventaire non valide ou secteurs manquants pour inventaire partiel');
  END IF;

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
    'message', format('Session initialisée avec %s éléments (type: %s)', inserted_count, session_type)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;