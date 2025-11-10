-- ============================================
-- CORRECTION RPC FUNCTIONS DASHBOARD STOCK
-- Fix get_top_critical_products + get_active_stock_alerts
-- ============================================

-- Recréer get_top_critical_products avec TOUS les champs requis incluant rotation
DROP FUNCTION IF EXISTS public.get_top_critical_products(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_top_critical_products(
  p_tenant_id UUID, 
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
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
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.libelle_produit,
      COALESCE(p.code_cip, '') as code_cip,
      COALESCE(SUM(l.quantite_restante), 0) as stock_total,
      COALESCE(p.stock_limite, p.stock_critique, 10) as limite_stock,
      COALESCE(p.prix_achat, 0) as prix_achat,
      COALESCE(f.libelle_famille, 'Non classé') as famille,
      -- Calcul du statut
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_critique, 10) THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_faible, 20) THEN 'faible'
        ELSE 'normal'
      END as statut,
      -- Calcul de la rotation (basé sur les ventes des 30 derniers jours)
      CASE 
        WHEN COALESCE(
          (SELECT SUM(lv.quantite) 
           FROM lignes_ventes lv 
           JOIN ventes v ON v.id = lv.vente_id
           WHERE lv.produit_id = p.id 
             AND v.tenant_id = p_tenant_id
             AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
             AND v.statut = 'Validée'
          ), 0) > 50 THEN 'rapide'
        WHEN COALESCE(
          (SELECT SUM(lv.quantite) 
           FROM lignes_ventes lv 
           JOIN ventes v ON v.id = lv.vente_id
           WHERE lv.produit_id = p.id 
             AND v.tenant_id = p_tenant_id
             AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
             AND v.statut = 'Validée'
          ), 0) > 20 THEN 'normale'
        ELSE 'lente'
      END as rotation_calc
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.stock_critique, 
             p.stock_faible, p.stock_limite, p.prix_achat, f.libelle_famille
    HAVING COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_critique, 10)
  )
  SELECT 
    sd.id,
    sd.libelle_produit,
    sd.code_cip,
    sd.stock_total,
    sd.limite_stock,
    sd.statut,
    sd.famille,
    (sd.stock_total * sd.prix_achat),
    sd.rotation_calc
  FROM stock_data sd
  WHERE sd.statut IN ('critique', 'rupture')
  ORDER BY 
    CASE sd.statut 
      WHEN 'rupture' THEN 1 
      WHEN 'critique' THEN 2 
      ELSE 3 
    END,
    sd.stock_total ASC
  LIMIT p_limit;
END;
$$;

-- Recréer get_active_stock_alerts avec la bonne référence à lignes_ventes
DROP FUNCTION IF EXISTS public.get_active_stock_alerts(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_active_stock_alerts(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
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
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Alertes de rupture de stock
  SELECT 
    gen_random_uuid() as alert_id,
    'rupture_stock'::TEXT as alert_type,
    'error'::TEXT as alert_level,
    p.id as produit_id,
    p.libelle_produit as produit_nom,
    ('Rupture de stock: ' || p.libelle_produit)::TEXT as message,
    COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
    NOW() as created_at
  FROM produits p
  LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
  GROUP BY p.id, p.libelle_produit
  HAVING COALESCE(SUM(l.quantite_restante), 0) = 0

  UNION ALL

  -- Alertes de stock critique
  SELECT 
    gen_random_uuid() as alert_id,
    'stock_critique'::TEXT as alert_type,
    'warning'::TEXT as alert_level,
    p.id as produit_id,
    p.libelle_produit as produit_nom,
    ('Stock critique: ' || p.libelle_produit)::TEXT as message,
    COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
    NOW() as created_at
  FROM produits p
  LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
  GROUP BY p.id, p.libelle_produit, p.stock_critique
  HAVING COALESCE(SUM(l.quantite_restante), 0) > 0 
    AND COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_critique, 10)

  UNION ALL

  -- Alertes de produits à rotation lente (utilise lignes_ventes avec 's')
  SELECT 
    gen_random_uuid() as alert_id,
    'rotation_lente'::TEXT as alert_type,
    'info'::TEXT as alert_level,
    p.id as produit_id,
    p.libelle_produit as produit_nom,
    ('Rotation lente: ' || p.libelle_produit)::TEXT as message,
    COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
    NOW() as created_at
  FROM produits p
  LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND COALESCE(
      (SELECT SUM(lv.quantite)
       FROM lignes_ventes lv
       JOIN ventes v ON v.id = lv.vente_id
       WHERE lv.produit_id = p.id
         AND v.tenant_id = p_tenant_id
         AND v.date_vente >= CURRENT_DATE - INTERVAL '60 days'
         AND v.statut = 'Validée'
      ), 0) < 5
  GROUP BY p.id, p.libelle_produit
  HAVING COALESCE(SUM(l.quantite_restante), 0) > 20

  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_top_critical_products(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(uuid, integer) TO authenticated;

-- Commentaires
COMMENT ON FUNCTION public.get_top_critical_products IS 
'Retourne les produits critiques avec rotation, statut, famille, et valeur pour le dashboard (9 champs)';

COMMENT ON FUNCTION public.get_active_stock_alerts IS 
'Retourne les alertes actives de stock - Utilise lignes_ventes (avec s) pour les calculs de rotation';