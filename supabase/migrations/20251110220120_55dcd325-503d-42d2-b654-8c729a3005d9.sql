-- Migration corrective: Corriger le nom de table famille_produit dans get_top_critical_products

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
      COALESCE(SUM(l.quantite_restante), 0) as stock_total,
      COALESCE(f.libelle_famille, 'Non classé') as famille,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_limite, 10) * 0.1 THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= COALESCE(p.stock_alerte, p.stock_limite, 10) THEN 'alerte'
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
    GROUP BY p.id, p.libelle_produit, p.code_cip, p.prix_achat, p.stock_limite, p.stock_alerte, f.libelle_famille
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