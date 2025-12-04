-- Correction de la fonction get_pos_products : utiliser les bons noms de tables
-- familles → famille_produit
-- dcis → dci

DROP FUNCTION IF EXISTS get_pos_products(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION get_pos_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT '',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  name TEXT,
  libelle_produit TEXT,
  dci TEXT,
  code_cip TEXT,
  price NUMERIC,
  price_ht NUMERIC,
  tva_rate NUMERIC,
  stock BIGINT,
  category TEXT,
  requires_prescription BOOLEAN,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_offset INT;
  v_search_pattern TEXT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search_pattern := '%' || LOWER(COALESCE(p_search, '')) || '%';
  
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
      COALESCE(p.prescription_requise, FALSE) AS requires_prescription
    FROM produits p
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    LEFT JOIN dci d ON d.id = p.dci_id
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = TRUE
    GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, 
             p.prix_vente_ttc, p.prix_vente_ht, p.tva, p.stock_limite,
             f.libelle_famille, d.nom_dci, p.prescription_requise
    HAVING COALESCE(SUM(l.quantite_restante), 0) > 0
  ),
  filtered AS (
    SELECT *
    FROM produits_avec_stock pas
    WHERE (
      p_search = '' 
      OR LOWER(pas.libelle_produit) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.dci_nom, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.code_cip, '')) LIKE v_search_pattern
    )
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM filtered
  )
  SELECT 
    filtered.id,
    filtered.tenant_id,
    filtered.libelle_produit AS name,
    filtered.libelle_produit,
    filtered.dci_nom AS dci,
    filtered.code_cip,
    COALESCE(filtered.prix_vente_ttc, 0) AS price,
    COALESCE(filtered.prix_vente_ht, 0) AS price_ht,
    COALESCE(filtered.tva, 0) AS tva_rate,
    filtered.stock_disponible AS stock,
    filtered.famille_libelle AS category,
    filtered.requires_prescription,
    counted.total AS total_count
  FROM filtered
  CROSS JOIN counted
  ORDER BY filtered.libelle_produit
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_pos_products(uuid, text, integer, integer) TO authenticated;