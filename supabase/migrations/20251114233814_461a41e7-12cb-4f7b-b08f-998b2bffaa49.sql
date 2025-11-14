-- Correction des fonctions RPC du Dashboard Ventes
-- Fix 1: get_recent_sales_transactions utilise remise_globale au lieu de remise_totale
-- Fix 2: get_cash_registers_status calcule le montant actuel sans montant_total_retraits

-- Correction de get_recent_sales_transactions
CREATE OR REPLACE FUNCTION get_recent_sales_transactions(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_caisse_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL
)
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

  WITH filtered_ventes AS (
    SELECT 
      v.id,
      v.numero_vente,
      COALESCE(c.nom_complet, 'Client Ordinaire') as customer_name,
      v.montant_total_ttc,
      v.date_vente,
      v.mode_paiement,
      CONCAT(p.noms, ' ', p.prenoms) as agent_name,
      v.statut,
      ca.nom_caisse,
      v.remise_globale
    FROM ventes v
    LEFT JOIN clients c ON c.id = v.client_id
    LEFT JOIN personnel p ON p.id = v.agent_id
    LEFT JOIN caisses ca ON ca.id = v.caisse_id
    WHERE v.tenant_id = p_tenant_id 
      AND v.statut = 'Validée'
      AND (p_search IS NULL OR 
           v.numero_vente ILIKE '%' || p_search || '%' OR
           COALESCE(c.nom_complet, 'Client Ordinaire') ILIKE '%' || p_search || '%')
      AND (p_caisse_id IS NULL OR v.caisse_id = p_caisse_id)
      AND (p_agent_id IS NULL OR v.agent_id = p_agent_id)
      AND (p_date_debut IS NULL OR DATE(v.date_vente) >= p_date_debut)
      AND (p_date_fin IS NULL OR DATE(v.date_vente) <= p_date_fin)
  ),
  total_count AS (
    SELECT COUNT(*)::INTEGER as total
    FROM filtered_ventes
  ),
  paginated_data AS (
    SELECT *
    FROM filtered_ventes
    ORDER BY date_vente DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'data', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'invoice_number', numero_vente,
          'customer_name', customer_name,
          'amount', montant_total_ttc,
          'timestamp', date_vente,
          'payment_type', mode_paiement,
          'agent_name', agent_name,
          'status', statut,
          'cash_register', nom_caisse,
          'discount', remise_globale
        )
      )
      FROM paginated_data
    ), '[]'::jsonb),
    'total', (SELECT total FROM total_count),
    'page', (p_offset / NULLIF(p_limit, 1)) + 1,
    'limit', p_limit
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Correction de get_cash_registers_status
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
        WHERE v.caisse_id = c.id AND v.tenant_id = p_tenant_id
      ),
      'session_id', s.id,
      'agent_name', CONCAT(p.noms, ' ', p.prenoms)
    )
    ORDER BY c.nom_caisse
  ), '[]'::jsonb)
  INTO v_result
  FROM caisses c
  LEFT JOIN sessions_caisse s ON s.caisse_id = c.id 
    AND s.statut = 'Ouverte' 
    AND s.tenant_id = p_tenant_id
  LEFT JOIN personnel p ON p.id = s.agent_id
  WHERE c.tenant_id = p_tenant_id AND c.is_active = true;

  RETURN v_result;
END;
$$;

-- Garder les permissions
GRANT EXECUTE ON FUNCTION get_recent_sales_transactions(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cash_registers_status(UUID) TO authenticated;