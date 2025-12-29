-- Fix: lots table has no l.is_active; use quantite_restante + statut instead

CREATE OR REPLACE FUNCTION public.init_inventaire_items(p_session_id UUID, p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_inserted_count INTEGER := 0;
  v_existing_count INTEGER;
BEGIN
  -- Récupérer les infos de la session
  SELECT * INTO v_session
  FROM public.inventaire_sessions
  WHERE id = p_session_id AND tenant_id = p_tenant_id;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  -- Vérifier si déjà initialisée
  SELECT COUNT(*) INTO v_existing_count
  FROM public.inventaire_items
  WHERE session_id = p_session_id;

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session déjà initialisée', 'count', v_existing_count);
  END IF;

  -- Inventaire COMPLET : tous les lots disponibles
  IF v_session.type_inventaire = 'complet' THEN
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, code_barre,
      produit_nom, lot_numero, quantite_theorique, emplacement_theorique, unite, statut
    )
    SELECT DISTINCT
      p_tenant_id,
      p_session_id,
      l.produit_id,
      l.id,
      COALESCE(p.code_cip, p.code_barre_externe, 'PROD-' || p.id::text),
      p.libelle,
      l.numero_lot,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, 'Stock principal'),
      'unités',
      'non_compte'
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible');

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- Inventaire PARTIEL : filtres multiples
  ELSIF v_session.type_inventaire = 'partiel' THEN
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, code_barre,
      produit_nom, lot_numero, quantite_theorique, emplacement_theorique, unite, statut
    )
    SELECT DISTINCT
      p_tenant_id,
      p_session_id,
      l.produit_id,
      l.id,
      COALESCE(p.code_cip, p.code_barre_externe, 'PROD-' || p.id::text),
      p.libelle,
      l.numero_lot,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, 'Stock principal'),
      'unités',
      'non_compte'
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND (v_session.filtres_rayon IS NULL OR array_length(v_session.filtres_rayon, 1) IS NULL OR p.rayon_id = ANY(v_session.filtres_rayon))
      AND (v_session.filtres_fournisseur IS NULL OR array_length(v_session.filtres_fournisseur, 1) IS NULL OR p.fournisseur_id = ANY(v_session.filtres_fournisseur))
      AND (v_session.filtres_emplacement IS NULL OR array_length(v_session.filtres_emplacement, 1) IS NULL OR l.emplacement = ANY(v_session.filtres_emplacement))
      AND (v_session.filtres_peremption_jours IS NULL OR l.date_peremption <= CURRENT_DATE + v_session.filtres_peremption_jours);

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- Inventaire CYCLIQUE : produits jamais/anciennement inventoriés
  ELSIF v_session.type_inventaire = 'cyclique' THEN
    INSERT INTO public.inventaire_items (
      tenant_id, session_id, produit_id, lot_id, code_barre,
      produit_nom, lot_numero, quantite_theorique, emplacement_theorique, unite, statut
    )
    SELECT DISTINCT
      p_tenant_id,
      p_session_id,
      l.produit_id,
      l.id,
      COALESCE(p.code_cip, p.code_barre_externe, 'PROD-' || p.id::text),
      p.libelle,
      l.numero_lot,
      COALESCE(l.quantite_restante, 0),
      COALESCE(l.emplacement, 'Stock principal'),
      'unités',
      'non_compte'
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND NOT EXISTS (
        SELECT 1 FROM public.inventaire_items ii
        WHERE ii.produit_id = l.produit_id
          AND ii.tenant_id = p_tenant_id
          AND ii.updated_at > CURRENT_DATE - COALESCE(v_session.cyclique_jours, 30)
      );

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END IF;

  -- Mettre à jour le compteur de la session
  UPDATE public.inventaire_sessions
  SET produits_total = v_inserted_count, updated_at = NOW()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'message', format('Session initialisée avec %s produits', v_inserted_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


CREATE OR REPLACE FUNCTION public.preview_inventaire_items_count(
  p_tenant_id UUID,
  p_type_inventaire TEXT,
  p_filtres_rayon UUID[] DEFAULT NULL,
  p_filtres_fournisseur UUID[] DEFAULT NULL,
  p_filtres_emplacement TEXT[] DEFAULT NULL,
  p_filtres_peremption_jours INTEGER DEFAULT NULL,
  p_cyclique_jours INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF p_type_inventaire = 'complet' THEN
    SELECT COUNT(DISTINCT l.id) INTO v_count
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible');

  ELSIF p_type_inventaire = 'partiel' THEN
    SELECT COUNT(DISTINCT l.id) INTO v_count
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND (p_filtres_rayon IS NULL OR array_length(p_filtres_rayon, 1) IS NULL OR p.rayon_id = ANY(p_filtres_rayon))
      AND (p_filtres_fournisseur IS NULL OR array_length(p_filtres_fournisseur, 1) IS NULL OR p.fournisseur_id = ANY(p_filtres_fournisseur))
      AND (p_filtres_emplacement IS NULL OR array_length(p_filtres_emplacement, 1) IS NULL OR l.emplacement = ANY(p_filtres_emplacement))
      AND (p_filtres_peremption_jours IS NULL OR l.date_peremption <= CURRENT_DATE + p_filtres_peremption_jours);

  ELSIF p_type_inventaire = 'cyclique' THEN
    SELECT COUNT(DISTINCT l.id) INTO v_count
    FROM public.lots l
    JOIN public.produits p ON p.id = l.produit_id
    WHERE l.tenant_id = p_tenant_id
      AND COALESCE(l.quantite_restante, 0) > 0
      AND (l.statut IS NULL OR l.statut = 'Disponible')
      AND NOT EXISTS (
        SELECT 1 FROM public.inventaire_items ii
        WHERE ii.produit_id = l.produit_id
          AND ii.tenant_id = p_tenant_id
          AND ii.updated_at > CURRENT_DATE - p_cyclique_jours
      );
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.init_inventaire_items(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_inventaire_items_count(UUID, TEXT, UUID[], UUID[], TEXT[], INTEGER, INTEGER) TO authenticated;
