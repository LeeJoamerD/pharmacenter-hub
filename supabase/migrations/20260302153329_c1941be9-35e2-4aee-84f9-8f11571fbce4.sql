
-- RPC 1: search_cash_expenses_paginated
CREATE OR REPLACE FUNCTION public.search_cash_expenses_paginated(
  p_tenant_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_motif TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_session_status TEXT DEFAULT 'all',
  p_includes_cancelled BOOLEAN DEFAULT FALSE,
  p_search TEXT DEFAULT NULL,
  p_montant_min NUMERIC DEFAULT NULL,
  p_montant_max NUMERIC DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_agent_session_id UUID DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'date_mouvement',
  p_sort_direction TEXT DEFAULT 'desc',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 25
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total INTEGER;
  v_result JSONB;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Count
  SELECT COUNT(*) INTO v_total
  FROM mouvements_caisse mc
  JOIN sessions_caisse sc ON sc.id = mc.session_caisse_id
  WHERE mc.tenant_id = p_tenant_id
    AND mc.type_mouvement = 'Dépense'
    AND (p_includes_cancelled OR mc.est_annule IS NOT TRUE)
    AND (p_date_from IS NULL OR mc.date_mouvement >= p_date_from)
    AND (p_date_to IS NULL OR mc.date_mouvement <= p_date_to)
    AND (p_motif IS NULL OR mc.motif = p_motif)
    AND (p_agent_id IS NULL OR mc.agent_id = p_agent_id)
    AND (p_session_id IS NULL OR mc.session_caisse_id = p_session_id)
    AND (p_montant_min IS NULL OR mc.montant >= p_montant_min)
    AND (p_montant_max IS NULL OR mc.montant <= p_montant_max)
    AND (p_session_status = 'all'
         OR (p_session_status = 'open' AND sc.statut = 'Ouverte')
         OR (p_session_status = 'closed' AND sc.statut = 'Fermée'))
    AND (p_agent_session_id IS NULL OR sc.agent_id = p_agent_session_id)
    AND (p_search IS NULL OR p_search = ''
         OR mc.description ILIKE '%' || p_search || '%'
         OR mc.reference ILIKE '%' || p_search || '%'
         OR mc.motif ILIKE '%' || p_search || '%');

  -- Data
  SELECT jsonb_build_object(
    'expenses', COALESCE(jsonb_agg(row_to_json(sub.*) ORDER BY sub.rn), '[]'::jsonb),
    'count', v_total
  ) INTO v_result
  FROM (
    SELECT
      mc.id,
      mc.session_caisse_id,
      mc.type_mouvement,
      mc.montant,
      mc.motif,
      mc.description,
      mc.reference,
      mc.notes,
      mc.agent_id,
      mc.date_mouvement,
      mc.tenant_id,
      mc.est_annule,
      mc.annule_par,
      mc.date_annulation,
      mc.motif_annulation,
      sc.statut AS session_statut,
      sc.date_ouverture AS session_date_ouverture,
      sc.date_fermeture AS session_date_fermeture,
      sc.agent_id AS session_agent_id,
      sc.caisse_id AS session_caisse_id_fk,
      p_agent.noms AS agent_noms,
      p_agent.prenoms AS agent_prenoms,
      p_cancel.noms AS cancelled_by_noms,
      p_cancel.prenoms AS cancelled_by_prenoms,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN p_sort_field = 'date_mouvement' AND p_sort_direction = 'asc' THEN mc.date_mouvement END ASC,
          CASE WHEN p_sort_field = 'date_mouvement' AND p_sort_direction = 'desc' THEN mc.date_mouvement END DESC,
          CASE WHEN p_sort_field = 'montant' AND p_sort_direction = 'asc' THEN mc.montant END ASC,
          CASE WHEN p_sort_field = 'montant' AND p_sort_direction = 'desc' THEN mc.montant END DESC,
          mc.date_mouvement DESC
      ) AS rn
    FROM mouvements_caisse mc
    JOIN sessions_caisse sc ON sc.id = mc.session_caisse_id
    LEFT JOIN personnel p_agent ON p_agent.id = mc.agent_id
    LEFT JOIN personnel p_cancel ON p_cancel.id = mc.annule_par
    WHERE mc.tenant_id = p_tenant_id
      AND mc.type_mouvement = 'Dépense'
      AND (p_includes_cancelled OR mc.est_annule IS NOT TRUE)
      AND (p_date_from IS NULL OR mc.date_mouvement >= p_date_from)
      AND (p_date_to IS NULL OR mc.date_mouvement <= p_date_to)
      AND (p_motif IS NULL OR mc.motif = p_motif)
      AND (p_agent_id IS NULL OR mc.agent_id = p_agent_id)
      AND (p_session_id IS NULL OR mc.session_caisse_id = p_session_id)
      AND (p_montant_min IS NULL OR mc.montant >= p_montant_min)
      AND (p_montant_max IS NULL OR mc.montant <= p_montant_max)
      AND (p_session_status = 'all'
           OR (p_session_status = 'open' AND sc.statut = 'Ouverte')
           OR (p_session_status = 'closed' AND sc.statut = 'Fermée'))
      AND (p_agent_session_id IS NULL OR sc.agent_id = p_agent_session_id)
      AND (p_search IS NULL OR p_search = ''
           OR mc.description ILIKE '%' || p_search || '%'
           OR mc.reference ILIKE '%' || p_search || '%'
           OR mc.motif ILIKE '%' || p_search || '%')
    ORDER BY
      CASE WHEN p_sort_field = 'date_mouvement' AND p_sort_direction = 'asc' THEN mc.date_mouvement END ASC,
      CASE WHEN p_sort_field = 'date_mouvement' AND p_sort_direction = 'desc' THEN mc.date_mouvement END DESC,
      CASE WHEN p_sort_field = 'montant' AND p_sort_direction = 'asc' THEN mc.montant END ASC,
      CASE WHEN p_sort_field = 'montant' AND p_sort_direction = 'desc' THEN mc.montant END DESC,
      mc.date_mouvement DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$$;

-- RPC 2: fetch_all_cash_expenses_for_export
CREATE OR REPLACE FUNCTION public.fetch_all_cash_expenses_for_export(
  p_tenant_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_motif TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_session_status TEXT DEFAULT 'all',
  p_includes_cancelled BOOLEAN DEFAULT FALSE,
  p_search TEXT DEFAULT NULL,
  p_montant_min NUMERIC DEFAULT NULL,
  p_montant_max NUMERIC DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_agent_session_id UUID DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'date_mouvement',
  p_sort_direction TEXT DEFAULT 'desc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_size INTEGER := 1000;
  v_offset INTEGER := 0;
  v_batch JSONB;
  v_all JSONB := '[]'::jsonb;
  v_count INTEGER;
BEGIN
  LOOP
    SELECT COALESCE(jsonb_agg(row_to_json(sub.*)), '[]'::jsonb)
    INTO v_batch
    FROM (
      SELECT
        mc.id,
        mc.session_caisse_id,
        mc.montant,
        mc.motif,
        mc.description,
        mc.reference,
        mc.agent_id,
        mc.date_mouvement,
        mc.est_annule,
        mc.motif_annulation,
        sc.statut AS session_statut,
        sc.date_ouverture AS session_date_ouverture,
        sc.caisse_id AS session_caisse_id_fk,
        p_agent.noms AS agent_noms,
        p_agent.prenoms AS agent_prenoms
      FROM mouvements_caisse mc
      JOIN sessions_caisse sc ON sc.id = mc.session_caisse_id
      LEFT JOIN personnel p_agent ON p_agent.id = mc.agent_id
      WHERE mc.tenant_id = p_tenant_id
        AND mc.type_mouvement = 'Dépense'
        AND (p_includes_cancelled OR mc.est_annule IS NOT TRUE)
        AND (p_date_from IS NULL OR mc.date_mouvement >= p_date_from)
        AND (p_date_to IS NULL OR mc.date_mouvement <= p_date_to)
        AND (p_motif IS NULL OR mc.motif = p_motif)
        AND (p_agent_id IS NULL OR mc.agent_id = p_agent_id)
        AND (p_session_id IS NULL OR mc.session_caisse_id = p_session_id)
        AND (p_montant_min IS NULL OR mc.montant >= p_montant_min)
        AND (p_montant_max IS NULL OR mc.montant <= p_montant_max)
        AND (p_session_status = 'all'
             OR (p_session_status = 'open' AND sc.statut = 'Ouverte')
             OR (p_session_status = 'closed' AND sc.statut = 'Fermée'))
        AND (p_agent_session_id IS NULL OR sc.agent_id = p_agent_session_id)
        AND (p_search IS NULL OR p_search = ''
             OR mc.description ILIKE '%' || p_search || '%'
             OR mc.reference ILIKE '%' || p_search || '%'
             OR mc.motif ILIKE '%' || p_search || '%')
      ORDER BY
        CASE WHEN p_sort_field = 'date_mouvement' AND p_sort_direction = 'asc' THEN mc.date_mouvement END ASC,
        CASE WHEN p_sort_field = 'date_mouvement' AND p_sort_direction = 'desc' THEN mc.date_mouvement END DESC,
        CASE WHEN p_sort_field = 'montant' AND p_sort_direction = 'asc' THEN mc.montant END ASC,
        CASE WHEN p_sort_field = 'montant' AND p_sort_direction = 'desc' THEN mc.montant END DESC,
        mc.date_mouvement DESC
      LIMIT v_batch_size
      OFFSET v_offset
    ) sub;

    v_count := jsonb_array_length(v_batch);
    IF v_count = 0 THEN
      EXIT;
    END IF;

    v_all := v_all || v_batch;
    v_offset := v_offset + v_batch_size;

    IF v_count < v_batch_size THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_all;
END;
$$;
