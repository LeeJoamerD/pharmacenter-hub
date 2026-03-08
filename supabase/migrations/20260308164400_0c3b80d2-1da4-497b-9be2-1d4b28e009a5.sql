CREATE OR REPLACE FUNCTION public.get_drug_database_with_details(
  p_tenant_id UUID,
  p_search TEXT DEFAULT '',
  p_category TEXT DEFAULT 'all',
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
  v_total INTEGER;
  v_drugs JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  SELECT COUNT(*)
  INTO v_total
  FROM produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      p_search = '' 
      OR p.libelle_produit ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
      OR EXISTS (SELECT 1 FROM dci d WHERE d.id = p.dci_id AND d.nom_dci ILIKE '%' || p_search || '%')
    )
    AND (
      p_category = 'all'
      OR (p_category = 'prescription' AND p.prescription_requise = true)
      OR (p_category = 'otc' AND COALESCE(p.prescription_requise, false) = false)
      OR (p_category = 'generic' AND p.est_generique = true)
    );
  
  SELECT json_agg(drug_data)
  INTO v_drugs
  FROM (
    SELECT 
      p.id,
      p.libelle_produit AS name,
      COALESCE(d.nom_dci, 'N/A') AS dci,
      COALESCE(ct.libelle_classe, fp.libelle_famille, 'Non classe') AS therapeutic_class,
      COALESCE(fg.libelle_forme, p.forme_galenique, 'N/A') AS form,
      COALESCE(p.dosage, 'N/A') AS dosage,
      COALESCE(l.nom_laboratoire, 'N/A') AS manufacturer,
      COALESCE(p.code_atc, 'N/A') AS atc_code,
      COALESCE(p.code_cip, 'N/A') AS cip_code,
      COALESCE(p.prix_vente_ttc, 0) AS price,
      COALESCE(p.taux_remboursement, 0) AS reimbursement_rate,
      COALESCE(p.prescription_requise, false) AS prescription_required,
      CASE WHEN d.contre_indications IS NOT NULL THEN ARRAY[d.contre_indications] ELSE ARRAY[]::TEXT[] END AS contraindications,
      ARRAY[]::TEXT[] AS interactions,
      ARRAY[]::TEXT[] AS side_effects,
      COALESCE(p.conditions_stockage, 'Conditions normales') AS storage_conditions,
      true AS expiry_monitoring,
      p.est_generique AS is_generic,
      COALESCE(pws.stock_actuel, 0) AS stock_quantity
    FROM produits p
    LEFT JOIN dci d ON d.id = p.dci_id
    LEFT JOIN classes_therapeutiques ct ON ct.id = d.classe_therapeutique_id
    LEFT JOIN famille_produit fp ON fp.id = p.famille_id
    LEFT JOIN formes_galeniques fg ON fg.id = p.forme_galenique_id
    LEFT JOIN laboratoires l ON l.id = p.laboratoire_id
    LEFT JOIN produits_with_stock pws ON pws.id = p.id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (
        p_search = '' 
        OR p.libelle_produit ILIKE '%' || p_search || '%'
        OR p.code_cip ILIKE '%' || p_search || '%'
        OR d.nom_dci ILIKE '%' || p_search || '%'
      )
      AND (
        p_category = 'all'
        OR (p_category = 'prescription' AND p.prescription_requise = true)
        OR (p_category = 'otc' AND COALESCE(p.prescription_requise, false) = false)
        OR (p_category = 'generic' AND p.est_generique = true)
      )
    ORDER BY p.libelle_produit
    LIMIT p_page_size
    OFFSET v_offset
  ) drug_data;
  
  RETURN json_build_object(
    'drugs', COALESCE(v_drugs, '[]'::json),
    'total', v_total,
    'page', p_page,
    'pageSize', p_page_size,
    'totalPages', CEIL(v_total::NUMERIC / p_page_size)
  );
END;
$$;