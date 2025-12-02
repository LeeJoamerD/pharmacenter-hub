-- Create RPC function to get POS products with server-side search and pagination
CREATE OR REPLACE FUNCTION get_pos_products(
  p_tenant_id UUID,
  p_search_term TEXT DEFAULT '',
  p_page_size INT DEFAULT 50,
  p_page INT DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  prix_vente_ttc NUMERIC,
  prix_vente_ht NUMERIC,
  tva NUMERIC,
  stock_limite INT,
  famille_libelle TEXT,
  dci_nom TEXT,
  stock_disponible BIGINT,
  requires_prescription BOOLEAN,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH produits_avec_stock AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.code_cip,
      p.prix_vente_ttc,
      p.prix_vente_ht,
      p.tva,
      p.stock_limite,
      f.libelle_famille AS famille_libelle,
      d.nom_dci AS dci_nom,
      COALESCE(SUM(l.quantite_restante), 0)::BIGINT AS stock_disponible,
      p.exige_ordonnance AS requires_prescription
    FROM produits p
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    LEFT JOIN dci d ON d.id = p.dci_id
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
    GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, 
             p.prix_vente_ttc, p.prix_vente_ht, p.tva, p.stock_limite,
             f.libelle_famille, d.nom_dci, p.exige_ordonnance
    HAVING COALESCE(SUM(l.quantite_restante), 0) > 0
  ),
  filtered AS (
    SELECT *
    FROM produits_avec_stock
    WHERE (p_search_term = '' OR 
           libelle_produit ILIKE '%' || p_search_term || '%' OR
           code_cip ILIKE '%' || p_search_term || '%' OR
           dci_nom ILIKE '%' || p_search_term || '%')
  ),
  counted AS (
    SELECT COUNT(*) AS cnt FROM filtered
  )
  SELECT 
    f.id, f.tenant_id, f.libelle_produit, f.code_cip,
    f.prix_vente_ttc, f.prix_vente_ht, f.tva, f.stock_limite,
    f.famille_libelle, f.dci_nom, f.stock_disponible,
    f.requires_prescription,
    c.cnt AS total_count
  FROM filtered f, counted c
  ORDER BY f.libelle_produit ASC
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
END;
$$;

-- Create RPC function to get lots for a specific product (FIFO order)
CREATE OR REPLACE FUNCTION get_product_lots(
  p_tenant_id UUID,
  p_product_id UUID
)
RETURNS TABLE (
  id UUID,
  numero_lot TEXT,
  quantite_restante INT,
  date_peremption DATE,
  prix_achat_unitaire NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, 
    l.numero_lot, 
    l.quantite_restante, 
    l.date_peremption, 
    l.prix_achat_unitaire
  FROM lots l
  WHERE l.tenant_id = p_tenant_id
    AND l.produit_id = p_product_id
    AND l.quantite_restante > 0
  ORDER BY l.date_peremption ASC NULLS LAST;
END;
$$;