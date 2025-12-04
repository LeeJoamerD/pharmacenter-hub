-- D'abord supprimer la fonction existante
DROP FUNCTION IF EXISTS get_pos_products(UUID, TEXT, INT, INT);

-- Recréer la fonction corrigée avec prescription_requise au lieu de exige_ordonnance
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
    LEFT JOIN familles f ON f.id = p.famille_id
    LEFT JOIN dcis d ON d.id = p.dci_id
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
    FROM produits_avec_stock
    WHERE (
      p_search = '' 
      OR LOWER(libelle_produit) LIKE v_search_pattern
      OR LOWER(COALESCE(dci_nom, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(code_cip, '')) LIKE v_search_pattern
    )
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM filtered
  )
  SELECT 
    f.id,
    f.tenant_id,
    f.libelle_produit AS name,
    f.libelle_produit,
    f.dci_nom AS dci,
    f.code_cip,
    COALESCE(f.prix_vente_ttc, 0) AS price,
    COALESCE(f.prix_vente_ht, 0) AS price_ht,
    COALESCE(f.tva, 0) AS tva_rate,
    f.stock_disponible AS stock,
    f.famille_libelle AS category,
    f.requires_prescription,
    c.total AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY f.libelle_produit
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_pos_products TO authenticated;