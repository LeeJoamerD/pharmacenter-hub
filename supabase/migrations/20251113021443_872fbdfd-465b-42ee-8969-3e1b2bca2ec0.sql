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

-- Index pour calcul rotation (mouvements récents) - sans prédicat WHERE temporel
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_rotation 
ON public.stock_mouvements (tenant_id, produit_id, type_mouvement, date_mouvement DESC);

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
BEGIN
  -- Validation: Vérifier que le tenant_id correspond à l'utilisateur courant
  IF p_tenant_id != get_current_user_tenant_id() THEN
    RAISE EXCEPTION 'Access denied: tenant_id mismatch';
  END IF;

  -- Calculer l'offset pour la pagination
  v_offset := (p_page - 1) * p_page_size;

  -- Construire la requête principale avec CTE pour calcul des métriques
  WITH stock_base AS (
    SELECT 
      p.id,
      p.libelle_produit,
      p.code_cip,
      p.famille_id,
      p.rayon_id,
      p.stock_limite,
      p.stock_faible,
      p.prix_achat,
      p.prix_vente_ttc,
      -- Calcul stock actuel
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      -- Calcul valeur stock
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      -- Calcul rotation (somme quantités sorties sur 90 jours)
      COALESCE((
        SELECT SUM(ABS(sm.quantite))
        FROM stock_mouvements sm
        WHERE sm.produit_id = p.id 
          AND sm.tenant_id = p_tenant_id
          AND sm.type_mouvement = 'sortie'
          AND sm.date_mouvement >= CURRENT_DATE - INTERVAL '90 days'
      ), 0) as rotation_90j
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
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.famille_id, p.rayon_id, 
             p.stock_limite, p.stock_faible, p.prix_achat, p.prix_vente_ttc
  ),
  stock_with_status AS (
    SELECT 
      *,
      -- Calcul statut stock
      CASE 
        WHEN stock_actuel = 0 THEN 'rupture'
        WHEN stock_limite IS NOT NULL AND stock_actuel <= stock_limite THEN 'critique'
        WHEN stock_faible IS NOT NULL AND stock_actuel <= stock_faible THEN 'faible'
        ELSE 'disponible'
      END as statut_stock,
      -- Calcul rotation par jour
      CASE 
        WHEN stock_actuel > 0 THEN ROUND((rotation_90j / 90.0)::numeric, 2)
        ELSE 0
      END as rotation
    FROM stock_base
  ),
  filtered_stock AS (
    SELECT *
    FROM stock_with_status
    WHERE 
      -- Filtre par statut
      (p_status_filter IS NULL OR statut_stock = p_status_filter)
      -- Filtre par rotation
      AND (
        p_rotation_filter IS NULL 
        OR (p_rotation_filter = 'high' AND rotation > 5)
        OR (p_rotation_filter = 'medium' AND rotation > 1 AND rotation <= 5)
        OR (p_rotation_filter = 'low' AND rotation > 0 AND rotation <= 1)
        OR (p_rotation_filter = 'none' AND rotation = 0)
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
        'libelle_produit', libelle_produit,
        'code_cip', code_cip,
        'famille_id', famille_id,
        'rayon_id', rayon_id,
        'stock_actuel', stock_actuel,
        'valeur_stock', ROUND(valeur_stock::numeric, 2),
        'prix_achat', prix_achat,
        'prix_vente_ttc', prix_vente_ttc,
        'stock_limite', stock_limite,
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