-- Créer une RPC pour récupérer uniquement les produits en stock critique/faible
-- Cette RPC évite de charger tous les produits et de filtrer côté client

CREATE OR REPLACE FUNCTION get_low_stock_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_category UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  prix_achat DECIMAL,
  prix_vente_ttc DECIMAL,
  stock_limite INTEGER,
  stock_alerte INTEGER,
  famille_id UUID,
  rayon_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  famille_libelle TEXT,
  rayon_libelle TEXT,
  stock_actuel INTEGER,
  valeur_stock DECIMAL,
  statut_stock TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stock_calcule AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.code_cip,
      p.prix_achat,
      p.prix_vente_ttc,
      p.stock_limite,
      p.stock_alerte,
      p.famille_id,
      p.rayon_id,
      p.created_at,
      p.updated_at,
      p.is_active,
      fp.libelle_famille,
      rp.libelle_rayon,
      COALESCE(SUM(l.quantite_restante), 0)::INTEGER AS stock_actuel,
      COALESCE(SUM(l.quantite_restante * l.prix_achat_unitaire), 0) AS valeur_stock,
      CASE 
        WHEN COALESCE(SUM(l.quantite_restante), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_restante), 0) <= 5 THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_restante), 0) > 5 AND COALESCE(SUM(l.quantite_restante), 0) <= GREATEST(p.stock_limite, 10) THEN 'faible'
        ELSE 'normal'
      END AS statut_stock
    FROM produits p
    LEFT JOIN famille_produit fp ON p.famille_id = fp.id
    LEFT JOIN rayons_produits rp ON p.rayon_id = rp.id
    LEFT JOIN lots l ON p.id = l.produit_id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (p_search IS NULL OR p.libelle_produit ILIKE '%' || p_search || '%' OR p.code_cip ILIKE '%' || p_search || '%')
      AND (p_category IS NULL OR p.famille_id = p_category)
    GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.prix_achat, p.prix_vente_ttc, 
             p.stock_limite, p.stock_alerte, p.famille_id, p.rayon_id, p.created_at, p.updated_at, 
             p.is_active, fp.libelle_famille, rp.libelle_rayon
  )
  SELECT 
    sc.id,
    sc.tenant_id,
    sc.libelle_produit,
    sc.code_cip,
    sc.prix_achat,
    sc.prix_vente_ttc,
    sc.stock_limite,
    sc.stock_alerte,
    sc.famille_id,
    sc.rayon_id,
    sc.created_at,
    sc.updated_at,
    sc.is_active,
    sc.libelle_famille,
    sc.libelle_rayon,
    sc.stock_actuel,
    sc.valeur_stock,
    sc.statut_stock
  FROM stock_calcule sc
  WHERE sc.statut_stock IN ('critique', 'faible')
    AND (p_status IS NULL OR sc.statut_stock = p_status)
  ORDER BY 
    CASE sc.statut_stock 
      WHEN 'critique' THEN 1 
      WHEN 'faible' THEN 2 
      ELSE 3 
    END,
    sc.libelle_produit
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Accorder les autorisations
GRANT EXECUTE ON FUNCTION get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION get_low_stock_products(UUID, TEXT, UUID, TEXT, INTEGER, INTEGER) IS 
'Récupère uniquement les produits en stock critique ou faible avec pagination serveur. 
Exclut automatiquement les produits en rupture (stock = 0) et les produits avec stock normal.
Critique : stock <= 5, Faible : stock > 5 ET <= stock_limite (défaut 10).';