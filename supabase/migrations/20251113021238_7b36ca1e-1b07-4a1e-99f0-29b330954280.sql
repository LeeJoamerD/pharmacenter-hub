-- =====================================================
-- MIGRATION: Optimisation Valorisation Stock avec RPC
-- Description: Fonction RPC pour calcul serveur-side de la valorisation
-- =====================================================

-- =====================================================
-- ÉTAPE 1: Création des index d'optimisation
-- =====================================================

-- Index pour filtre tenant + produits actifs
CREATE INDEX IF NOT EXISTS idx_produits_tenant_active 
ON public.produits (tenant_id, is_active) 
WHERE is_active = true;

-- Index pour jointure lots optimisée
CREATE INDEX IF NOT EXISTS idx_lots_tenant_produit_quantite 
ON public.lots (tenant_id, produit_id, quantite_restante) 
WHERE quantite_restante > 0;

-- Index pour calcul rotation (mouvements récents)
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_rotation 
ON public.mouvements_lots (tenant_id, produit_id, type_mouvement, date_mouvement DESC);

-- Index pour recherche textuelle
CREATE INDEX IF NOT EXISTS idx_produits_search 
ON public.produits USING gin(to_tsvector('french', coalesce(libelle_produit, '') || ' ' || coalesce(code_cip, '')));

-- Index pour filtre par famille
CREATE INDEX IF NOT EXISTS idx_produits_famille 
ON public.produits (tenant_id, famille_id) 
WHERE famille_id IS NOT NULL;

-- Index pour filtre par rayon
CREATE INDEX IF NOT EXISTS idx_produits_rayon 
ON public.produits (tenant_id, rayon_id) 
WHERE rayon_id IS NOT NULL;

-- =====================================================
-- ÉTAPE 2: Fonction RPC de calcul de valorisation paginée
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_stock_valuation_paginated(
  p_tenant_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_status_filter TEXT DEFAULT NULL,
  p_rotation_filter TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_famille_filter UUID DEFAULT NULL,
  p_rayon_filter UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INTEGER;
  v_result JSONB;
  v_total_count INTEGER;
  v_total_value NUMERIC;
  v_items JSONB;
BEGIN
  -- Validation: Vérifier que le tenant_id correspond à l'utilisateur courant
  IF p_tenant_id != get_current_user_tenant_id() THEN
    RAISE EXCEPTION 'Access denied: tenant_id mismatch';
  END IF;

  -- Calculer l'offset pour la pagination
  v_offset := (p_page - 1) * p_page_size;

  -- Log pour debugging
  RAISE NOTICE 'calculate_stock_valuation_paginated: tenant=%, page=%, size=%, status=%, rotation=%', 
    p_tenant_id, p_page, p_page_size, p_status_filter, p_rotation_filter;

  -- Construire la requête principale avec CTE pour calcul des métriques
  WITH stock_base AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.code_cip,
      p.famille_id,
      p.rayon_id,
      p.stock_limite,
      p.stock_critique,
      p.stock_faible,
      p.prix_achat,
      p.prix_vente_ttc,
      -- Calcul stock actuel
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      -- Calcul valeur stock
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      -- Calcul rotation (somme quantités sorties sur 30 jours)
      COALESCE((
        SELECT SUM(ABS(ml.quantite_mouvement))
        FROM mouvements_lots ml
        WHERE ml.produit_id = p.id 
          AND ml.tenant_id = p_tenant_id
          AND ml.type_mouvement = 'sortie'
          AND ml.date_mouvement >= CURRENT_DATE - INTERVAL '30 days'
      ), 0) as rotation_30j
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
      -- Filtre par famille
      AND (p_famille_filter IS NULL OR p.famille_id = p_famille_filter)
      -- Filtre par rayon
      AND (p_rayon_filter IS NULL OR p.rayon_id = p_rayon_filter)
      -- Filtre par recherche textuelle
      AND (
        p_search_term IS NULL 
        OR p_search_term = '' 
        OR to_tsvector('french', coalesce(p.libelle_produit, '') || ' ' || coalesce(p.code_cip, '')) @@ plainto_tsquery('french', p_search_term)
      )
    GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.famille_id, p.rayon_id, 
             p.stock_limite, p.stock_critique, p.stock_faible, p.prix_achat, p.prix_vente_ttc
  ),
  stock_with_status AS (
    SELECT 
      *,
      -- Calcul statut stock (même logique que le hook client)
      CASE 
        WHEN stock_actuel = 0 THEN 'rupture'
        WHEN stock_critique IS NOT NULL AND stock_actuel <= stock_critique THEN 'critique'
        WHEN stock_faible IS NOT NULL AND stock_actuel <= stock_faible THEN 'faible'
        ELSE 'disponible'
      END as statut_stock,
      -- Calcul rotation catégorique (même logique que le hook client)
      CASE 
        WHEN rotation_30j >= 100 THEN 'rapide'
        WHEN rotation_30j >= 30 THEN 'normale'
        ELSE 'lente'
      END as rotation
    FROM stock_base
  ),
  filtered_stock AS (
    SELECT *
    FROM stock_with_status
    WHERE 
      -- Filtre par statut (logique spéciale pour 'disponible')
      (p_status_filter IS NULL OR 
       (p_status_filter = 'disponible' AND stock_actuel > 0) OR
       (p_status_filter != 'disponible' AND statut_stock = p_status_filter))
      -- Filtre par rotation
      AND (
        p_rotation_filter IS NULL 
        OR p_rotation_filter = 'all'
        OR rotation = p_rotation_filter
      )
  ),
  total_metrics AS (
    SELECT 
      COUNT(*)::INTEGER as total_count,
      COALESCE(SUM(valeur_stock), 0)::NUMERIC as total_value
    FROM filtered_stock
  ),
  paginated_items AS (
    SELECT 
      jsonb_build_object(
        'id', id,
        'tenant_id', tenant_id,
        'libelle_produit', libelle_produit,
        'code_cip', code_cip,
        'famille_id', famille_id,
        'rayon_id', rayon_id,
        'stock_actuel', stock_actuel,
        'valeur_stock', ROUND(valeur_stock::numeric, 2),
        'prix_achat', prix_achat,
        'prix_vente_ttc', prix_vente_ttc,
        'stock_limite', stock_limite,
        'stock_critique', stock_critique,
        'stock_faible', stock_faible,
        'statut_stock', statut_stock,
        'rotation', rotation
      ) as item
    FROM filtered_stock
    ORDER BY valeur_stock DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT 
    jsonb_build_object(
      'items', COALESCE(jsonb_agg(item), '[]'::jsonb),
      'totalCount', (SELECT total_count FROM total_metrics),
      'totalValue', (SELECT total_value FROM total_metrics),
      'page', p_page,
      'pageSize', p_page_size
    ) INTO v_result
  FROM paginated_items;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in calculate_stock_valuation_paginated: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'items', '[]'::jsonb,
      'totalCount', 0,
      'totalValue', 0
    );
END;
$$;

-- =====================================================
-- ÉTAPE 3: Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.calculate_stock_valuation_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_stock_valuation_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, UUID, UUID) TO anon;

-- =====================================================
-- ÉTAPE 4: Commentaires
-- =====================================================

COMMENT ON FUNCTION public.calculate_stock_valuation_paginated IS 
'Calcule la valorisation du stock avec pagination côté serveur. 
Paramètres: tenant_id, page, page_size, status_filter, rotation_filter, search_term, famille_filter, rayon_filter.
Retourne: JSONB avec items paginés, totalCount et totalValue.';