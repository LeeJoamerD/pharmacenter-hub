
-- Update search_cash_sessions_paginated to include total_solde stats
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
  v_total_solde NUMERIC;
  v_result JSONB;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Count total + sum solde across ALL filtered results
  SELECT COUNT(*),
         COALESCE(SUM(
           CASE 
             WHEN sc.statut = 'Fermée' THEN COALESCE(sc.montant_reel_fermeture, 0)
             ELSE COALESCE(sc.fond_caisse_ouverture, 0)
           END
         ), 0)
  INTO v_total_count, v_total_solde
  FROM sessions_caisse sc
  WHERE sc.tenant_id = p_tenant_id
    AND (p_date_from IS NULL OR sc.date_ouverture >= p_date_from)
    AND (p_date_to IS NULL OR sc.date_ouverture <= p_date_to)
    AND (p_statut IS NULL OR sc.statut = p_statut)
    AND (p_caissier_id IS NULL OR sc.caissier_id = p_caissier_id)
    AND (p_caisse_id IS NULL OR sc.caisse_id = p_caisse_id)
    AND (p_montant_min IS NULL OR sc.fond_caisse_ouverture >= p_montant_min)
    AND (p_montant_max IS NULL OR sc.fond_caisse_ouverture <= p_montant_max);

  -- Build result with stats
  SELECT jsonb_build_object(
    'sessions', COALESCE(jsonb_agg(row_data ORDER BY date_ouverture DESC), '[]'::jsonb),
    'count', v_total_count,
    'stats', jsonb_build_object('total_solde', v_total_solde)
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

  RETURN COALESCE(v_result, jsonb_build_object('sessions', '[]'::jsonb, 'count', 0, 'stats', jsonb_build_object('total_solde', 0)));
END;
$$;
