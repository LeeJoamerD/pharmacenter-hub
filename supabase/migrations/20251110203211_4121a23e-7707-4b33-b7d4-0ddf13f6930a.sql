-- Fix RPC function signatures for Stock Dashboard
-- Issue 1: get_top_critical_products returns 'id' but should return 'produit_id'
-- Issue 2: get_active_stock_alerts missing p_limit parameter

-- Drop existing functions with correct signatures
DROP FUNCTION IF EXISTS public.get_top_critical_products(uuid, integer);
DROP FUNCTION IF EXISTS public.get_active_stock_alerts(uuid);
DROP FUNCTION IF EXISTS public.get_active_stock_alerts(uuid, integer);

-- Recreate get_top_critical_products with correct alias
CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  produit_id uuid,
  libelle_produit text,
  stock_actuel numeric,
  stock_critique numeric,
  stock_faible numeric,
  pourcentage_critique numeric,
  jours_rupture_estimee integer
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
      COALESCE(SUM(l.quantite_restante), 0) as stock_total,
      COALESCE(p.stock_critique, 
        (SELECT (valeur_parametre::numeric) FROM parametres_systeme 
         WHERE tenant_id = p_tenant_id AND cle_parametre = 'stock_critique_defaut' LIMIT 1),
        10
      ) as seuil_critique,
      COALESCE(p.stock_faible,
        (SELECT (valeur_parametre::numeric) FROM parametres_systeme 
         WHERE tenant_id = p_tenant_id AND cle_parametre = 'stock_faible_defaut' LIMIT 1),
        20
      ) as seuil_faible,
      COALESCE(
        (SELECT AVG(quantite_vendue) 
         FROM lignes_vente lv 
         JOIN ventes v ON v.id = lv.vente_id 
         WHERE lv.produit_id = p.id 
           AND v.tenant_id = p_tenant_id
           AND v.created_at >= NOW() - INTERVAL '30 days'
        ), 0
      ) as ventes_moyennes_jour
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible
  )
  SELECT 
    sd.id AS produit_id,  -- ✅ FIX: Add AS produit_id alias
    sd.libelle_produit,
    sd.stock_total as stock_actuel,
    sd.seuil_critique as stock_critique,
    sd.seuil_faible as stock_faible,
    ROUND((sd.stock_total / NULLIF(sd.seuil_critique, 0) * 100)::numeric, 2) as pourcentage_critique,
    CASE 
      WHEN sd.ventes_moyennes_jour > 0 
      THEN FLOOR(sd.stock_total / sd.ventes_moyennes_jour)::integer
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

-- Recreate get_active_stock_alerts with p_limit parameter
CREATE OR REPLACE FUNCTION public.get_active_stock_alerts(
  p_tenant_id uuid,
  p_limit integer DEFAULT 5  -- ✅ FIX: Add missing p_limit parameter
)
RETURNS TABLE(
  alert_id uuid,
  alert_type text,
  alert_level text,
  produit_id uuid,
  produit_nom text,
  message text,
  stock_actuel numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_alerts AS (
    SELECT 
      gen_random_uuid() as id,
      'stock_critique' as type,
      'error' as level,
      p.id as prod_id,
      p.libelle_produit as nom,
      'Stock critique: ' || COALESCE(SUM(l.quantite_restante), 0)::text || ' unités restantes' as msg,
      COALESCE(SUM(l.quantite_restante), 0) as stock,
      NOW() as alert_created_at
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_critique,
      (SELECT (valeur_parametre::numeric) FROM parametres_systeme 
       WHERE tenant_id = p_tenant_id AND cle_parametre = 'stock_critique_defaut' LIMIT 1),
      10
    )
    AND COALESCE(SUM(l.quantite_restante), 0) > 0
    
    UNION ALL
    
    SELECT 
      gen_random_uuid() as id,
      'stock_faible' as type,
      'warning' as level,
      p.id as prod_id,
      p.libelle_produit as nom,
      'Stock faible: ' || COALESCE(SUM(l.quantite_restante), 0)::text || ' unités restantes' as msg,
      COALESCE(SUM(l.quantite_restante), 0) as stock,
      NOW() as alert_created_at
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.stock_critique, p.stock_faible
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_faible,
      (SELECT (valeur_parametre::numeric) FROM parametres_systeme 
       WHERE tenant_id = p_tenant_id AND cle_parametre = 'stock_faible_defaut' LIMIT 1),
      20
    )
    AND COALESCE(SUM(l.quantite_restante), 0) > COALESCE(p.stock_critique,
      (SELECT (valeur_parametre::numeric) FROM parametres_systeme 
       WHERE tenant_id = p_tenant_id AND cle_parametre = 'stock_critique_defaut' LIMIT 1),
      10
    )
    
    UNION ALL
    
    SELECT 
      gen_random_uuid() as id,
      'rupture' as type,
      'error' as level,
      p.id as prod_id,
      p.libelle_produit as nom,
      'Rupture de stock' as msg,
      0 as stock,
      NOW() as alert_created_at
    FROM produits p
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM lots l 
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id 
          AND l.quantite_restante > 0
      )
  )
  SELECT 
    sa.id as alert_id,
    sa.type as alert_type,
    sa.level as alert_level,
    sa.prod_id as produit_id,
    sa.nom as produit_nom,
    sa.msg as message,
    sa.stock as stock_actuel,
    sa.alert_created_at as created_at
  FROM stock_alerts sa
  ORDER BY 
    CASE sa.level 
      WHEN 'error' THEN 1 
      WHEN 'warning' THEN 2 
      ELSE 3 
    END,
    sa.stock ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_top_critical_products(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(uuid, integer) TO authenticated;