CREATE OR REPLACE FUNCTION search_catalogue_global(search_term text, max_results int DEFAULT 5)
RETURNS SETOF catalogue_global_produits AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM catalogue_global_produits
  WHERE to_tsvector('french', libelle_produit) @@ plainto_tsquery('french', search_term)
     OR libelle_produit ILIKE '%' || search_term || '%'
  ORDER BY
    CASE
      WHEN libelle_produit ILIKE search_term THEN 0
      WHEN libelle_produit ILIKE search_term || '%' THEN 1
      ELSE 2
    END,
    length(libelle_produit)
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;