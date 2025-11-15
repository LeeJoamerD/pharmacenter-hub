-- ============================================================================
-- Fix: Fonction pour obtenir les totaux globaux des sessions actives
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_sessions_totals(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_user_tenant_id UUID;
BEGIN
  -- Vérification de sécurité
  SELECT tenant_id INTO v_user_tenant_id
  FROM personnel
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_tenant_id IS NULL OR v_user_tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'Accès non autorisé au tenant %', p_tenant_id;
  END IF;

  -- Calculer les totaux de toutes les sessions actives
  SELECT jsonb_build_object(
    'totalCashAmount', COALESCE(SUM(
      sc.fond_caisse_ouverture + sc.montant_total_ventes
    ), 0),
    'activeSessions', COUNT(sc.id),
    'totalMovements', COALESCE((
      SELECT COUNT(*)
      FROM mouvements_caisse mc
      WHERE mc.session_caisse_id IN (
        SELECT id FROM sessions_caisse 
        WHERE statut = 'Ouverte' AND tenant_id = p_tenant_id
      )
    ), 0)
  )
  INTO v_result
  FROM sessions_caisse sc
  WHERE sc.statut = 'Ouverte'
    AND sc.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_active_sessions_totals(UUID) TO authenticated;

COMMENT ON FUNCTION get_active_sessions_totals IS 
'Retourne le solde total et le nombre de mouvements de toutes les sessions actives';

-- ============================================================================
-- Correction de get_cash_registers_status pour éviter les doublons
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cash_registers_status(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_user_tenant_id UUID;
BEGIN
  -- Vérification de sécurité
  SELECT tenant_id INTO v_user_tenant_id
  FROM personnel
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_tenant_id IS NULL OR v_user_tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'Accès non autorisé au tenant %', p_tenant_id;
  END IF;

  -- Une caisse peut avoir plusieurs sessions ouvertes (Matin, Midi, Soir)
  -- On retourne toutes les sessions actives avec leur caisse
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.nom_caisse,
      'code', c.code_caisse,
      'status', CASE 
        WHEN s.statut = 'Ouverte' THEN 'open'
        ELSE 'closed'
      END,
      'currentAmount', COALESCE(s.fond_caisse_ouverture + s.montant_total_ventes, 0),
      'openedAt', s.date_ouverture,
      'lastTransaction', (
        SELECT MAX(date_vente)
        FROM ventes v
        WHERE v.session_caisse_id = s.id
      ),
      'session_id', s.id,
      'session_number', s.numero_session,
      'session_type', s.type_session,
      'agent_name', CONCAT(p.noms, ' ', p.prenoms)
    )
    ORDER BY s.date_ouverture DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM sessions_caisse s
  LEFT JOIN caisses c ON c.id = s.caisse_id
  LEFT JOIN personnel p ON p.id = s.agent_id
  WHERE s.statut = 'Ouverte' 
    AND s.tenant_id = p_tenant_id
    AND c.is_active = true;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_cash_registers_status IS 
'Retourne toutes les sessions actives (peut inclure plusieurs sessions pour la même caisse)';