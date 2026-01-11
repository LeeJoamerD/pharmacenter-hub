-- Amélioration de la recherche par codes-barres
-- Utilise les colonnes réelles: code_cip, code_barre_externe, ancien_code_cip

-- Supprimer les fonctions existantes pour permettre la recréation
DROP FUNCTION IF EXISTS public.get_pos_products(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.search_product_by_barcode(UUID, TEXT);

-- 1. Recréer get_pos_products avec recherche sur tous les codes-barres
CREATE OR REPLACE FUNCTION public.get_pos_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT '',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total_count INTEGER;
  v_search_pattern TEXT;
  v_result JSON;
BEGIN
  -- Calculer l'offset pour la pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Préparer le pattern de recherche
  v_search_pattern := '%' || LOWER(TRIM(COALESCE(p_search, ''))) || '%';

  -- Requête principale avec CTE pour optimiser les performances
  WITH produits_avec_stock AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.code_cip,
      p.code_barre_externe,
      p.ancien_code_cip,
      p.prix_vente_ttc,
      p.taux_tva,
      p.est_ordonnance_obligatoire,
      p.forme_pharmaceutique,
      p.dosage,
      p.conditionnement,
      p.est_actif,
      d.nom as dci_nom,
      COALESCE(
        (SELECT SUM(l.quantite_restante) 
         FROM lots l 
         WHERE l.produit_id = p.id 
           AND l.tenant_id = p_tenant_id
           AND l.quantite_restante > 0
           AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
        ), 0
      ) as stock_disponible
    FROM produits p
    LEFT JOIN dci d ON p.dci_id = d.id
    WHERE p.tenant_id = p_tenant_id
      AND p.est_actif = true
  ),
  filtered AS (
    SELECT *
    FROM produits_avec_stock pas
    WHERE (
      p_search = '' 
      OR LOWER(pas.libelle_produit) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.dci_nom, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.code_cip, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.code_barre_externe, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.ancien_code_cip, '')) LIKE v_search_pattern
    )
  ),
  counted AS (
    SELECT COUNT(*) as total FROM filtered
  ),
  paginated AS (
    SELECT 
      f.id,
      f.libelle_produit,
      f.code_cip,
      f.prix_vente_ttc,
      f.taux_tva,
      f.est_ordonnance_obligatoire,
      f.forme_pharmaceutique,
      f.dosage,
      f.conditionnement,
      f.dci_nom,
      f.stock_disponible
    FROM filtered f
    ORDER BY f.libelle_produit ASC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT json_build_object(
    'products', COALESCE((SELECT json_agg(row_to_json(p)) FROM paginated p), '[]'::json),
    'total_count', (SELECT total FROM counted),
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL((SELECT total FROM counted)::DECIMAL / p_page_size)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 2. Recréer search_product_by_barcode avec les colonnes réelles
CREATE OR REPLACE FUNCTION public.search_product_by_barcode(
  p_tenant_id UUID,
  p_barcode TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'product', row_to_json(product_data)
  )
  INTO v_result
  FROM (
    SELECT 
      p.id,
      p.libelle_produit,
      p.code_cip,
      p.code_barre_externe,
      p.ancien_code_cip,
      p.prix_vente_ttc,
      p.taux_tva,
      p.est_ordonnance_obligatoire,
      p.forme_pharmaceutique,
      p.dosage,
      p.conditionnement,
      d.nom as dci_nom,
      COALESCE(
        (SELECT SUM(l.quantite_restante) 
         FROM lots l 
         WHERE l.produit_id = p.id 
           AND l.tenant_id = p_tenant_id
           AND l.quantite_restante > 0
           AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
        ), 0
      ) as stock_disponible
    FROM produits p
    LEFT JOIN dci d ON p.dci_id = d.id
    WHERE p.tenant_id = p_tenant_id
      AND p.est_actif = true
      AND (
        p.code_cip = p_barcode
        OR p.code_barre_externe = p_barcode
        OR p.ancien_code_cip = p_barcode
      )
    LIMIT 1
  ) product_data;

  -- Retourner null si aucun produit trouvé
  IF v_result IS NULL THEN
    RETURN json_build_object('product', null);
  END IF;

  RETURN v_result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(UUID, TEXT) TO authenticated;