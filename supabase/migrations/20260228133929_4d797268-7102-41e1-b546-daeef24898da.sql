
-- RPC pour rechercher les sessions de caisse avec pagination
CREATE OR REPLACE FUNCTION public.search_cash_sessions_paginated(
  p_tenant_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_statut TEXT DEFAULT NULL,
  p_caissier_id UUID DEFAULT NULL,
  p_caisse_id UUID DEFAULT NULL,
  p_montant_min NUMERIC DEFAULT NULL,
  p_montant_max NUMERIC DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 25
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_total_count BIGINT;
  v_result JSONB;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Count total
  SELECT COUNT(*) INTO v_total_count
  FROM sessions_caisse sc
  WHERE sc.tenant_id = p_tenant_id
    AND (p_date_from IS NULL OR sc.date_ouverture >= p_date_from)
    AND (p_date_to IS NULL OR sc.date_ouverture <= p_date_to)
    AND (p_statut IS NULL OR sc.statut = p_statut)
    AND (p_caissier_id IS NULL OR sc.caissier_id = p_caissier_id)
    AND (p_caisse_id IS NULL OR sc.caisse_id = p_caisse_id)
    AND (p_montant_min IS NULL OR sc.fond_caisse_ouverture >= p_montant_min)
    AND (p_montant_max IS NULL OR sc.fond_caisse_ouverture <= p_montant_max);

  -- Build result
  SELECT jsonb_build_object(
    'sessions', COALESCE(jsonb_agg(row_data ORDER BY date_ouverture DESC), '[]'::jsonb),
    'count', v_total_count
  ) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', sc.id,
      'tenant_id', sc.tenant_id,
      'numero_session', sc.numero_session,
      'caissier_id', sc.caissier_id,
      'caisse_id', sc.caisse_id,
      'date_ouverture', sc.date_ouverture,
      'date_fermeture', sc.date_fermeture,
      'fond_caisse_ouverture', sc.fond_caisse_ouverture,
      'montant_theorique_fermeture', sc.montant_theorique_fermeture,
      'montant_reel_fermeture', sc.montant_reel_fermeture,
      'ecart', sc.ecart,
      'statut', sc.statut,
      'type_session', sc.type_session,
      'date_session', sc.date_session,
      'caissier_noms', p.noms,
      'caissier_prenoms', p.prenoms,
      'caisse_nom', c.nom_caisse
    ) AS row_data,
    sc.date_ouverture
    FROM sessions_caisse sc
    LEFT JOIN personnel p ON p.id = sc.caissier_id
    LEFT JOIN caisses c ON c.id = sc.caisse_id
    WHERE sc.tenant_id = p_tenant_id
      AND (p_date_from IS NULL OR sc.date_ouverture >= p_date_from)
      AND (p_date_to IS NULL OR sc.date_ouverture <= p_date_to)
      AND (p_statut IS NULL OR sc.statut = p_statut)
      AND (p_caissier_id IS NULL OR sc.caissier_id = p_caissier_id)
      AND (p_caisse_id IS NULL OR sc.caisse_id = p_caisse_id)
      AND (p_montant_min IS NULL OR sc.fond_caisse_ouverture >= p_montant_min)
      AND (p_montant_max IS NULL OR sc.fond_caisse_ouverture <= p_montant_max)
    ORDER BY sc.date_ouverture DESC
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN COALESCE(v_result, jsonb_build_object('sessions', '[]'::jsonb, 'count', 0));
END;
$$;

-- RPC pour exporter toutes les sessions filtrées (sans pagination, contourne la limite 1000)
CREATE OR REPLACE FUNCTION public.fetch_all_cash_sessions_for_export(
  p_tenant_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_statut TEXT DEFAULT NULL,
  p_caissier_id UUID DEFAULT NULL,
  p_caisse_id UUID DEFAULT NULL,
  p_montant_min NUMERIC DEFAULT NULL,
  p_montant_max NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_size INT := 1000;
  v_offset INT := 0;
  v_batch JSONB;
  v_all_sessions JSONB := '[]'::jsonb;
  v_batch_count INT;
BEGIN
  LOOP
    SELECT COALESCE(jsonb_agg(row_data ORDER BY date_ouverture DESC), '[]'::jsonb)
    INTO v_batch
    FROM (
      SELECT jsonb_build_object(
        'id', sc.id,
        'numero_session', sc.numero_session,
        'caissier_id', sc.caissier_id,
        'caisse_id', sc.caisse_id,
        'date_ouverture', sc.date_ouverture,
        'date_fermeture', sc.date_fermeture,
        'fond_caisse_ouverture', sc.fond_caisse_ouverture,
        'montant_theorique_fermeture', sc.montant_theorique_fermeture,
        'montant_reel_fermeture', sc.montant_reel_fermeture,
        'ecart', sc.ecart,
        'statut', sc.statut,
        'type_session', sc.type_session,
        'caissier_noms', p.noms,
        'caissier_prenoms', p.prenoms,
        'caisse_nom', c.nom_caisse
      ) AS row_data,
      sc.date_ouverture
      FROM sessions_caisse sc
      LEFT JOIN personnel p ON p.id = sc.caissier_id
      LEFT JOIN caisses c ON c.id = sc.caisse_id
      WHERE sc.tenant_id = p_tenant_id
        AND (p_date_from IS NULL OR sc.date_ouverture >= p_date_from)
        AND (p_date_to IS NULL OR sc.date_ouverture <= p_date_to)
        AND (p_statut IS NULL OR sc.statut = p_statut)
        AND (p_caissier_id IS NULL OR sc.caissier_id = p_caissier_id)
        AND (p_caisse_id IS NULL OR sc.caisse_id = p_caisse_id)
        AND (p_montant_min IS NULL OR sc.fond_caisse_ouverture >= p_montant_min)
        AND (p_montant_max IS NULL OR sc.fond_caisse_ouverture <= p_montant_max)
      ORDER BY sc.date_ouverture DESC
      LIMIT v_batch_size OFFSET v_offset
    ) sub;

    v_batch_count := jsonb_array_length(v_batch);
    v_all_sessions := v_all_sessions || v_batch;
    v_offset := v_offset + v_batch_size;

    EXIT WHEN v_batch_count < v_batch_size;
  END LOOP;

  RETURN v_all_sessions;
END;
$$;
