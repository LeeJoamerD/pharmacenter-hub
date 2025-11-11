-- ============================================================================
-- CORRECTION FINALE : Type mismatch INTEGER->NUMERIC dans get_top_critical_products
-- ============================================================================
-- Problème : get_stock_threshold_cascade() retourne INTEGER
--           mais RETURNS TABLE déclare stock_critique/stock_faible en NUMERIC
-- Solution : Cast explicite ::NUMERIC + ajout colonnes manquantes (famille_libelle, stock_limite)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_top_critical_products(UUID, INT) CASCADE;

CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  produit_id UUID,
  libelle_produit TEXT,
  stock_actuel NUMERIC,
  stock_critique NUMERIC,
  stock_faible NUMERIC,
  stock_limite NUMERIC,
  famille_libelle TEXT,
  pourcentage_critique NUMERIC,
  jours_rupture_estimee INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as stock_total,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_maximum,
      COALESCE(fp.libelle_famille, 'Non classé') as famille_libelle,
      COALESCE(
        (SELECT AVG(lv.quantite) 
         FROM lignes_ventes lv 
         JOIN ventes v ON v.id = lv.vente_id 
         WHERE lv.produit_id = p.id 
           AND v.tenant_id = p_tenant_id
           AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
        ), 0::NUMERIC
      ) as ventes_moyennes_jour
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    LEFT JOIN public.famille_produit fp ON p.famille_id = fp.id
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible, p.stock_limite, fp.libelle_famille
  )
  SELECT 
    sd.id AS produit_id,
    sd.libelle_produit,
    sd.stock_total as stock_actuel,
    sd.seuil_critique as stock_critique,
    sd.seuil_faible as stock_faible,
    sd.seuil_maximum as stock_limite,
    sd.famille_libelle,
    ROUND((sd.stock_total / NULLIF(sd.seuil_critique, 0) * 100)::NUMERIC, 2) as pourcentage_critique,
    CASE 
      WHEN sd.ventes_moyennes_jour > 0 
      THEN FLOOR(sd.stock_total / sd.ventes_moyennes_jour)::INTEGER
      ELSE NULL
    END as jours_rupture_estimee
  FROM stock_data sd
  WHERE sd.stock_total > 0 
    AND sd.stock_total <= sd.seuil_critique
  ORDER BY 
    (sd.stock_total / NULLIF(sd.seuil_critique, 0)) ASC,
    sd.stock_total ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_critical_products(UUID, INT) TO authenticated;

COMMENT ON FUNCTION public.get_top_critical_products IS 
'Retourne les produits en stock critique avec CASCADE COMPLÈTE à 3 niveaux.
Utilise get_stock_threshold_cascade avec cast explicite ::NUMERIC pour éviter type mismatch.
Inclut famille_libelle et stock_limite pour compatibilité TypeScript.';

-- ============================================================================
-- VÉRIFICATION : get_active_stock_alerts doit aussi avoir les casts NUMERIC
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_active_stock_alerts(UUID, INT) CASCADE;

CREATE OR REPLACE FUNCTION public.get_active_stock_alerts(
  p_tenant_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  alert_id UUID,
  alert_type TEXT,
  alert_level TEXT,
  produit_id UUID,
  produit_nom TEXT,
  message TEXT,
  stock_actuel NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0)::NUMERIC as current_stock,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::NUMERIC as seuil_faible
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible, p.stock_limite
  ),
  all_alerts AS (
    -- Alertes critiques (stock > 0 ET stock <= seuil_critique)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_critique'::TEXT as alert_type,
      'error'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock critique: %s unités restantes', s.current_stock) as message,
      s.current_stock as stock_actuel,
      NOW() as created_at,
      1 as priority
    FROM stock_data s
    WHERE s.current_stock > 0 
      AND s.current_stock <= s.seuil_critique
    
    UNION ALL
    
    -- Alertes faibles (stock > seuil_critique ET stock <= seuil_faible)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_faible'::TEXT as alert_type,
      'warning'::TEXT as alert_level,
      s.id as produit_id,
      s.libelle_produit as produit_nom,
      format('Stock faible: %s unités', s.current_stock) as message,
      s.current_stock as stock_actuel,
      NOW() as created_at,
      2 as priority
    FROM stock_data s
    WHERE s.current_stock > s.seuil_critique
      AND s.current_stock <= s.seuil_faible
  )
  SELECT 
    a.alert_id,
    a.alert_type,
    a.alert_level,
    a.produit_id,
    a.produit_nom,
    a.message,
    a.stock_actuel,
    a.created_at
  FROM all_alerts a
  ORDER BY a.priority ASC, a.stock_actuel ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(UUID, INT) TO authenticated;

COMMENT ON FUNCTION public.get_active_stock_alerts IS 
'Retourne les alertes actives (stock critique et faible uniquement).
Utilise la cascade à 3 niveaux via get_stock_threshold_cascade avec cast ::NUMERIC.';

-- ============================================================================
-- RÉSUMÉ DES CORRECTIONS
-- ============================================================================
-- ✅ get_top_critical_products : 
--    - Cast ::NUMERIC sur tous les appels get_stock_threshold_cascade
--    - Cast 0::NUMERIC dans COALESCE de ventes_moyennes_jour
--    - Ajout stock_limite (seuil_maximum) et famille_libelle au RETURNS TABLE
--    - JOIN avec famille_produit pour obtenir famille_libelle
-- ✅ get_active_stock_alerts :
--    - Cast ::NUMERIC sur tous les appels get_stock_threshold_cascade
--    - Cohérence totale des types INTEGER->NUMERIC
-- ============================================================================