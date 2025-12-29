-- Correction: Remplacer p.fournisseur_id par l.fournisseur_id dans les fonctions d'inventaire
-- Le champ fournisseur_id existe sur la table lots (l), pas sur produits (p)

-- Supprimer les anciennes versions des fonctions
DROP FUNCTION IF EXISTS public.init_inventaire_items(UUID, UUID);
DROP FUNCTION IF EXISTS public.preview_inventaire_items_count(UUID, TEXT, UUID[], UUID[], TEXT[], INTEGER, INTEGER);

-- Recréer la fonction init_inventaire_items avec la correction
CREATE OR REPLACE FUNCTION public.init_inventaire_items(
  p_session_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_session RECORD;
  v_items_count INTEGER := 0;
BEGIN
  -- Récupérer le tenant_id
  IF p_tenant_id IS NULL THEN
    SELECT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID INTO v_tenant_id;
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant ID non trouvé');
  END IF;

  -- Récupérer la session
  SELECT * INTO v_session
  FROM inventaire_sessions
  WHERE id = p_session_id AND tenant_id = v_tenant_id;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session non trouvée');
  END IF;

  -- Vérifier si des items existent déjà
  SELECT COUNT(*) INTO v_items_count
  FROM inventaire_items
  WHERE session_id = p_session_id;

  IF v_items_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Des items existent déjà pour cette session');
  END IF;

  -- Insérer les items basés sur le stock actuel
  INSERT INTO inventaire_items (
    session_id,
    tenant_id,
    produit_id,
    lot_id,
    designation,
    code_barre,
    numero_lot,
    date_peremption,
    emplacement,
    quantite_theorique,
    quantite_comptee,
    statut
  )
  SELECT DISTINCT ON (l.id)
    p_session_id,
    v_tenant_id,
    p.id,
    l.id,
    p.nom,
    COALESCE(l.code_barre, p.code_barre),
    l.numero_lot,
    l.date_peremption,
    COALESCE(l.emplacement, p.emplacement),
    COALESCE(l.quantite_actuelle, 0),
    NULL,
    'en_attente'
  FROM produits p
  INNER JOIN lots l ON l.produit_id = p.id AND l.tenant_id = v_tenant_id
  WHERE p.tenant_id = v_tenant_id
    AND p.est_actif = true
    AND l.quantite_actuelle > 0
    -- Appliquer les filtres de la session
    AND (v_session.filtres_categorie IS NULL OR p.categorie = ANY(v_session.filtres_categorie))
    AND (v_session.filtres_zone IS NULL OR p.zone_stockage = ANY(v_session.filtres_zone))
    AND (v_session.filtres_fournisseur IS NULL OR l.fournisseur_id = ANY(v_session.filtres_fournisseur));

  GET DIAGNOSTICS v_items_count = ROW_COUNT;

  -- Mettre à jour la session avec le nombre d'items
  UPDATE inventaire_sessions
  SET 
    total_items = v_items_count,
    items_comptes = 0,
    ecarts_trouves = 0,
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'items_count', v_items_count,
    'message', format('%s items initialisés', v_items_count)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Recréer la fonction preview_inventaire_items_count avec la correction
CREATE OR REPLACE FUNCTION public.preview_inventaire_items_count(
  p_tenant_id UUID,
  p_type_inventaire TEXT DEFAULT 'complet',
  p_filtres_categorie UUID[] DEFAULT NULL,
  p_filtres_fournisseur UUID[] DEFAULT NULL,
  p_filtres_zone TEXT[] DEFAULT NULL,
  p_seuil_stock_min INTEGER DEFAULT NULL,
  p_seuil_stock_max INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_total_value NUMERIC := 0;
BEGIN
  -- Compter les produits/lots selon les filtres
  SELECT 
    COUNT(DISTINCT l.id),
    COALESCE(SUM(l.quantite_actuelle * COALESCE(l.prix_achat, p.prix_achat, 0)), 0)
  INTO v_count, v_total_value
  FROM produits p
  INNER JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.est_actif = true
    AND l.quantite_actuelle > 0
    -- Appliquer les filtres selon le type
    AND (p_type_inventaire = 'complet' OR (
      (p_filtres_categorie IS NULL OR p.categorie = ANY(p_filtres_categorie))
      AND (p_filtres_fournisseur IS NULL OR l.fournisseur_id = ANY(p_filtres_fournisseur))
      AND (p_filtres_zone IS NULL OR p.zone_stockage = ANY(p_filtres_zone))
      AND (p_seuil_stock_min IS NULL OR l.quantite_actuelle >= p_seuil_stock_min)
      AND (p_seuil_stock_max IS NULL OR l.quantite_actuelle <= p_seuil_stock_max)
    ));

  RETURN jsonb_build_object(
    'success', true,
    'count', v_count,
    'total_value', v_total_value,
    'filters_applied', jsonb_build_object(
      'type', p_type_inventaire,
      'categories', p_filtres_categorie,
      'fournisseurs', p_filtres_fournisseur,
      'zones', p_filtres_zone,
      'stock_min', p_seuil_stock_min,
      'stock_max', p_seuil_stock_max
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'count', 0
  );
END;
$$;

-- Restaurer les permissions
GRANT EXECUTE ON FUNCTION public.init_inventaire_items(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_inventaire_items_count(UUID, TEXT, UUID[], UUID[], TEXT[], INTEGER, INTEGER) TO authenticated;