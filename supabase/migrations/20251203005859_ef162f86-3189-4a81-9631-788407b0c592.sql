-- Fonction RPC pour rechercher un produit par code-barres (serveur-side)
CREATE OR REPLACE FUNCTION search_product_by_barcode(
  p_tenant_id UUID,
  p_barcode TEXT
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
  requires_prescription BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit AS name,
    p.libelle_produit,
    d.nom_dci AS dci,
    p.code_cip,
    COALESCE(p.prix_vente_ttc, 0)::NUMERIC AS price,
    COALESCE(p.prix_vente_ht, 0)::NUMERIC AS price_ht,
    COALESCE(p.tva, 0)::NUMERIC AS tva_rate,
    COALESCE(SUM(l.quantite_restante), 0)::BIGINT AS stock,
    COALESCE(f.libelle_famille, 'Autre')::TEXT AS category,
    FALSE AS requires_prescription
  FROM produits p
  LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN dci d ON d.id = p.dci_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (p.code_cip = p_barcode OR p.id::text = p_barcode)
  GROUP BY p.id, p.tenant_id, p.libelle_produit, d.nom_dci, p.code_cip, 
           p.prix_vente_ttc, p.prix_vente_ht, p.tva, f.libelle_famille
  LIMIT 1;
END;
$$;