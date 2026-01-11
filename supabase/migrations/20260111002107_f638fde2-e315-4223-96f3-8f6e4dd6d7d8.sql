-- Fix: Replace incorrect column name est_ordonnance_obligatoire with prescription_requise
-- The produits table uses 'prescription_requise', not 'est_ordonnance_obligatoire'

-- Drop and recreate get_pos_products with corrected column name
DROP FUNCTION IF EXISTS public.get_pos_products(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_pos_products(
    p_tenant_id uuid,
    p_search text DEFAULT '',
    p_page_size integer DEFAULT 50,
    p_page integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset integer;
    v_search_pattern text;
    v_total_count integer;
    v_result json;
BEGIN
    v_offset := (p_page - 1) * p_page_size;
    v_search_pattern := '%' || LOWER(COALESCE(p_search, '')) || '%';
    
    -- Count total matching products
    SELECT COUNT(DISTINCT p.id) INTO v_total_count
    FROM produits p
    LEFT JOIN produit_alias_search pas ON pas.produit_id = p.id AND pas.tenant_id = p_tenant_id
    WHERE p.tenant_id = p_tenant_id
      AND p.est_actif = true
      AND (
          p_search = '' 
          OR LOWER(COALESCE(p.libelle_produit, '')) LIKE v_search_pattern
          OR LOWER(COALESCE(p.dci, '')) LIKE v_search_pattern
          OR LOWER(COALESCE(p.code_cip, '')) LIKE v_search_pattern
          OR LOWER(COALESCE(pas.code_barre_externe, '')) LIKE v_search_pattern
          OR LOWER(COALESCE(pas.ancien_code_cip, '')) LIKE v_search_pattern
      );
    
    -- Get paginated products with stock info
    SELECT json_build_object(
        'products', COALESCE(json_agg(product_data), '[]'::json),
        'total_count', v_total_count,
        'page', p_page,
        'page_size', p_page_size,
        'total_pages', CEIL(v_total_count::numeric / p_page_size)
    ) INTO v_result
    FROM (
        SELECT DISTINCT ON (p.id)
            p.id,
            p.tenant_id,
            p.libelle_produit,
            p.dci AS dci_nom,
            p.code_cip,
            p.prix_vente_ht,
            p.prix_vente_ttc,
            p.taux_tva,
            p.tva_montant,
            p.taux_centime_additionnel,
            p.centime_additionnel_montant,
            p.prescription_requise,
            p.categorie AS category,
            COALESCE(
                (SELECT SUM(l.quantite_restante) 
                 FROM lots l 
                 WHERE l.produit_id = p.id 
                   AND l.tenant_id = p_tenant_id 
                   AND l.quantite_restante > 0
                   AND l.date_peremption > CURRENT_DATE),
                0
            ) AS stock_disponible
        FROM produits p
        LEFT JOIN produit_alias_search pas ON pas.produit_id = p.id AND pas.tenant_id = p_tenant_id
        WHERE p.tenant_id = p_tenant_id
          AND p.est_actif = true
          AND (
              p_search = '' 
              OR LOWER(COALESCE(p.libelle_produit, '')) LIKE v_search_pattern
              OR LOWER(COALESCE(p.dci, '')) LIKE v_search_pattern
              OR LOWER(COALESCE(p.code_cip, '')) LIKE v_search_pattern
              OR LOWER(COALESCE(pas.code_barre_externe, '')) LIKE v_search_pattern
              OR LOWER(COALESCE(pas.ancien_code_cip, '')) LIKE v_search_pattern
          )
        ORDER BY p.id, p.libelle_produit
        LIMIT p_page_size
        OFFSET v_offset
    ) AS product_data;
    
    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO anon;