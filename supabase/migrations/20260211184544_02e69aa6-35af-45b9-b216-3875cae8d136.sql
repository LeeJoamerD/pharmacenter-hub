
CREATE OR REPLACE FUNCTION public.search_movements_paginated(
  p_tenant_id uuid,
  p_search text DEFAULT '',
  p_type_mouvement text DEFAULT NULL,
  p_date_debut timestamptz DEFAULT NULL,
  p_date_fin timestamptz DEFAULT NULL,
  p_sort_by text DEFAULT 'date_mouvement',
  p_sort_order text DEFAULT 'desc',
  p_page_size int DEFAULT 50,
  p_page int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_movements jsonb;
  v_total_count bigint;
  v_stats jsonb;
  v_search_pattern text;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search_pattern := '%' || LOWER(COALESCE(p_search, '')) || '%';

  SELECT 
    COUNT(*),
    jsonb_build_object(
      'total', COUNT(*),
      'entrees', COUNT(*) FILTER (WHERE m.type_mouvement = 'entree'),
      'sorties', COUNT(*) FILTER (WHERE m.type_mouvement = 'sortie'),
      'ajustements', COUNT(*) FILTER (WHERE m.type_mouvement = 'ajustement'),
      'transferts', COUNT(*) FILTER (WHERE m.type_mouvement = 'transfert'),
      'retours', COUNT(*) FILTER (WHERE m.type_mouvement = 'retour'),
      'destructions', COUNT(*) FILTER (WHERE m.type_mouvement = 'destruction')
    )
  INTO v_total_count, v_stats
  FROM mouvements_lots m
  LEFT JOIN produits p ON p.id = m.produit_id
  LEFT JOIN lots l ON l.id = m.lot_id
  WHERE m.tenant_id = p_tenant_id
    AND (p_type_mouvement IS NULL OR m.type_mouvement = p_type_mouvement)
    AND (p_date_debut IS NULL OR m.date_mouvement >= p_date_debut)
    AND (p_date_fin IS NULL OR m.date_mouvement <= p_date_fin)
    AND (
      p_search IS NULL OR p_search = '' OR (
        LOWER(COALESCE(p.libelle_produit, '')) LIKE v_search_pattern OR
        LOWER(COALESCE(l.numero_lot, '')) LIKE v_search_pattern OR
        LOWER(COALESCE(m.motif, '')) LIKE v_search_pattern OR
        LOWER(COALESCE(m.reference_document, '')) LIKE v_search_pattern
      )
    );

  SELECT COALESCE(jsonb_agg(row_data ORDER BY 
    CASE WHEN p_sort_order = 'asc' THEN
      CASE p_sort_by
        WHEN 'date_mouvement' THEN date_mouvement::text
        WHEN 'type_mouvement' THEN type_mouvement
        WHEN 'quantite_mouvement' THEN LPAD(ABS(quantite_mouvement)::text, 20, '0')
        ELSE date_mouvement::text
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_order != 'asc' THEN
      CASE p_sort_by
        WHEN 'date_mouvement' THEN date_mouvement::text
        WHEN 'type_mouvement' THEN type_mouvement
        WHEN 'quantite_mouvement' THEN LPAD(ABS(quantite_mouvement)::text, 20, '0')
        ELSE date_mouvement::text
      END
    END DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_movements
  FROM (
    SELECT jsonb_build_object(
      'id', m.id,
      'tenant_id', m.tenant_id,
      'lot_id', m.lot_id,
      'produit_id', m.produit_id,
      'type_mouvement', m.type_mouvement,
      'quantite_avant', m.quantite_avant,
      'quantite_mouvement', m.quantite_mouvement,
      'quantite_apres', m.quantite_apres,
      'prix_unitaire', m.prix_unitaire,
      'valeur_mouvement', m.valeur_mouvement,
      'motif', m.motif,
      'reference_document', m.reference_document,
      'reference_id', m.reference_id,
      'reference_type', m.reference_type,
      'agent_id', m.agent_id,
      'lot_destination_id', m.lot_destination_id,
      'emplacement_source', m.emplacement_source,
      'emplacement_destination', m.emplacement_destination,
      'date_mouvement', m.date_mouvement,
      'metadata', m.metadata,
      'created_at', m.created_at,
      'lot', CASE WHEN l.id IS NOT NULL THEN jsonb_build_object(
        'id', l.id,
        'numero_lot', l.numero_lot,
        'produit_id', l.produit_id,
        'quantite_restante', l.quantite_restante
      ) ELSE NULL END,
      'lot_destination', CASE WHEN ld.id IS NOT NULL THEN jsonb_build_object(
        'id', ld.id,
        'numero_lot', ld.numero_lot,
        'produit_id', ld.produit_id,
        'quantite_restante', ld.quantite_restante
      ) ELSE NULL END,
      'produit', CASE WHEN p.id IS NOT NULL THEN jsonb_build_object(
        'id', p.id,
        'libelle_produit', p.libelle_produit,
        'code_cip', p.code_cip
      ) ELSE NULL END
    ) AS row_data,
    m.date_mouvement,
    m.type_mouvement,
    m.quantite_mouvement
    FROM mouvements_lots m
    LEFT JOIN produits p ON p.id = m.produit_id
    LEFT JOIN lots l ON l.id = m.lot_id
    LEFT JOIN lots ld ON ld.id = m.lot_destination_id
    WHERE m.tenant_id = p_tenant_id
      AND (p_type_mouvement IS NULL OR m.type_mouvement = p_type_mouvement)
      AND (p_date_debut IS NULL OR m.date_mouvement >= p_date_debut)
      AND (p_date_fin IS NULL OR m.date_mouvement <= p_date_fin)
      AND (
        p_search IS NULL OR p_search = '' OR (
          LOWER(COALESCE(p.libelle_produit, '')) LIKE v_search_pattern OR
          LOWER(COALESCE(l.numero_lot, '')) LIKE v_search_pattern OR
          LOWER(COALESCE(m.motif, '')) LIKE v_search_pattern OR
          LOWER(COALESCE(m.reference_document, '')) LIKE v_search_pattern
        )
      )
    ORDER BY
      CASE WHEN p_sort_order = 'asc' THEN
        CASE p_sort_by
          WHEN 'date_mouvement' THEN m.date_mouvement::text
          WHEN 'type_mouvement' THEN m.type_mouvement
          ELSE m.date_mouvement::text
        END
      END ASC NULLS LAST,
      CASE WHEN p_sort_order != 'asc' THEN
        CASE p_sort_by
          WHEN 'date_mouvement' THEN m.date_mouvement::text
          WHEN 'type_mouvement' THEN m.type_mouvement
          ELSE m.date_mouvement::text
        END
      END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object(
    'movements', v_movements,
    'count', v_total_count,
    'stats', v_stats
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
