-- Migration corrective DÉFINITIVE pour le dashboard Stock
-- Corrige les problèmes de structure et de colonnes dans les fonctions RPC

-- ============================================================================
-- 1. CORRECTION DE get_active_stock_alerts
-- ============================================================================
-- Problèmes identifiés:
-- - Lit dans alertes_peremption au lieu de générer des alertes de stock
-- - Les alias ne correspondent pas au TypeScript (alerte_id vs alert_id, etc.)
-- - Manque la colonne stock_actuel
-- - Mauvaises valeurs pour alert_level

DROP FUNCTION IF EXISTS public.get_active_stock_alerts(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_active_stock_alerts(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 5
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
  WITH stock_calculations AS (
    SELECT 
      p.id as produit_id,
      p.libelle_produit,
      COALESCE(SUM(l.quantite_restante), 0) as stock_total,
      COALESCE(p.stock_critique, 5) as seuil_critique,
      COALESCE(p.stock_faible, 10) as seuil_faible
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible
  ),
  stock_alerts AS (
    -- Alertes de RUPTURE (stock = 0)
    SELECT 
      gen_random_uuid() as alert_id,
      'rupture'::TEXT as alert_type,
      'error'::TEXT as alert_level,
      sc.produit_id,
      sc.libelle_produit as produit_nom,
      'Stock épuisé - Réapprovisionnement urgent requis'::TEXT as message,
      sc.stock_total as stock_actuel,
      CURRENT_TIMESTAMP as created_at,
      1 as priority
    FROM stock_calculations sc
    WHERE sc.stock_total = 0
    
    UNION ALL
    
    -- Alertes CRITIQUES (stock > 0 mais <= seuil_critique)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_critique'::TEXT as alert_type,
      'error'::TEXT as alert_level,
      sc.produit_id,
      sc.libelle_produit as produit_nom,
      'Stock critique - Quantité: ' || sc.stock_total::TEXT || ' (seuil: ' || sc.seuil_critique::TEXT || ')'::TEXT as message,
      sc.stock_total as stock_actuel,
      CURRENT_TIMESTAMP as created_at,
      2 as priority
    FROM stock_calculations sc
    WHERE sc.stock_total > 0 
      AND sc.stock_total <= sc.seuil_critique
    
    UNION ALL
    
    -- Alertes STOCK FAIBLE (stock > seuil_critique mais <= seuil_faible)
    SELECT 
      gen_random_uuid() as alert_id,
      'stock_faible'::TEXT as alert_type,
      'warning'::TEXT as alert_level,
      sc.produit_id,
      sc.libelle_produit as produit_nom,
      'Stock faible - Quantité: ' || sc.stock_total::TEXT || ' (seuil: ' || sc.seuil_faible::TEXT || ')'::TEXT as message,
      sc.stock_total as stock_actuel,
      CURRENT_TIMESTAMP as created_at,
      3 as priority
    FROM stock_calculations sc
    WHERE sc.stock_total > sc.seuil_critique 
      AND sc.stock_total <= sc.seuil_faible
  )
  SELECT 
    sa.alert_id,
    sa.alert_type,
    sa.alert_level,
    sa.produit_id,
    sa.produit_nom,
    sa.message,
    sa.stock_actuel,
    sa.created_at
  FROM stock_alerts sa
  ORDER BY sa.priority ASC, sa.stock_actuel ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- 2. CORRECTION DE get_top_critical_products
-- ============================================================================
-- Problèmes identifiés:
-- - Référence à familles_produits (pluriel) au lieu de famille_produit
-- - Référence à f.libelle au lieu de f.libelle_famille
-- - Pas de référence à stock_alerte qui n'existe pas

DROP FUNCTION IF EXISTS public.get_top_critical_products(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  produit_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  stock_actuel NUMERIC,
  stock_limite NUMERIC,
  statut_stock TEXT,
  famille_libelle TEXT,
  valeur_stock NUMERIC,
  rotation TEXT
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
      p.code_cip,
      p.prix_achat,
      COALESCE(p.stock_limite, 10) as limite_stock,
      COALESCE(p.stock_critique, 5) as seuil_critique,
      COALESCE(p.stock_faible, 10) as seuil_faible,
      COALESCE(SUM(l.quantite_restante), 0) as stock_total,
      COALESCE(f.libelle_famille, 'Non classé') as famille,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_critique, 5) THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_faible, 10) THEN 'faible'
        WHEN COALESCE(SUM(l.quantite_restante), 0) >= COALESCE(p.stock_limite, 10) * 2 THEN 'surstock'
        ELSE 'normal'
      END as statut,
      COALESCE(
        (SELECT SUM(lv.quantite)
         FROM lignes_ventes lv
         INNER JOIN ventes v ON lv.vente_id = v.id
         WHERE lv.produit_id = p.id 
           AND v.tenant_id = p_tenant_id
           AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'),
        0
      ) as ventes_30j,
      CASE 
        WHEN COALESCE(
          (SELECT SUM(lv.quantite)
           FROM lignes_ventes lv
           INNER JOIN ventes v ON lv.vente_id = v.id
           WHERE lv.produit_id = p.id 
             AND v.tenant_id = p_tenant_id
             AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'),
          0
        ) > 50 THEN 'Rapide'
        WHEN COALESCE(
          (SELECT SUM(lv.quantite)
           FROM lignes_ventes lv
           INNER JOIN ventes v ON lv.vente_id = v.id
           WHERE lv.produit_id = p.id 
             AND v.tenant_id = p_tenant_id
             AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'),
          0
        ) > 20 THEN 'Normale'
        ELSE 'Lente'
      END as rotation_calc
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    LEFT JOIN famille_produit f ON p.famille_id = f.id
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.prix_achat, p.stock_limite, p.stock_critique, p.stock_faible, f.libelle_famille
  )
  SELECT 
    sd.id AS produit_id,
    sd.libelle_produit,
    sd.code_cip,
    sd.stock_total AS stock_actuel,
    sd.limite_stock AS stock_limite,
    sd.statut AS statut_stock,
    sd.famille AS famille_libelle,
    (sd.stock_total * COALESCE(sd.prix_achat, 0)) AS valeur_stock,
    sd.rotation_calc AS rotation
  FROM stock_data sd
  WHERE sd.statut IN ('critique', 'rupture')
  ORDER BY 
    CASE sd.statut 
      WHEN 'rupture' THEN 1 
      WHEN 'critique' THEN 2 
      ELSE 3 
    END,
    sd.ventes_30j DESC,
    sd.stock_total ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_critical_products(UUID, INTEGER) TO authenticated;