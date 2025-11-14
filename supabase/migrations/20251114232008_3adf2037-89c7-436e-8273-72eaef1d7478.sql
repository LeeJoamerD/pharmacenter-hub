-- Phase 1: Créer la table objectifs_ventes pour gérer les objectifs mensuels
CREATE TABLE IF NOT EXISTS objectifs_ventes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  montant_cible NUMERIC NOT NULL DEFAULT 0 CHECK (montant_cible >= 0),
  type_objectif TEXT NOT NULL DEFAULT 'mensuel' CHECK (type_objectif IN ('mensuel', 'trimestriel', 'annuel')),
  created_by_id UUID REFERENCES personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, annee, mois)
);

-- Index pour optimiser les recherches d'objectifs
CREATE INDEX IF NOT EXISTS idx_objectifs_ventes_lookup
  ON objectifs_ventes(tenant_id, annee, mois);

-- RLS pour objectifs_ventes
ALTER TABLE objectifs_ventes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_objectifs" ON objectifs_ventes
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid() LIMIT 1));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER set_objectifs_ventes_updated_at
  BEFORE UPDATE ON objectifs_ventes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC 1: get_sales_dashboard_metrics - Métriques agrégées (pas de pagination)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_sales_dashboard_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_user_tenant_id UUID;
BEGIN
  -- Vérification de sécurité: l'utilisateur appartient au tenant
  SELECT tenant_id INTO v_user_tenant_id
  FROM personnel
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_tenant_id IS NULL OR v_user_tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'Accès non autorisé au tenant %', p_tenant_id;
  END IF;

  -- Calcul des métriques en une seule requête optimisée
  WITH daily_metrics AS (
    SELECT
      COALESCE(SUM(CASE WHEN DATE(date_vente) = CURRENT_DATE THEN montant_total_ttc ELSE 0 END), 0) as daily_revenue,
      COALESCE(SUM(CASE WHEN DATE(date_vente) = CURRENT_DATE - INTERVAL '1 day' THEN montant_total_ttc ELSE 0 END), 0) as yesterday_revenue,
      COUNT(CASE WHEN DATE(date_vente) = CURRENT_DATE THEN 1 END)::INTEGER as daily_transactions,
      COALESCE(SUM(CASE WHEN DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE) THEN montant_total_ttc ELSE 0 END), 0) as monthly_revenue
    FROM ventes
    WHERE tenant_id = p_tenant_id 
      AND statut = 'Validée'
      AND date_vente >= CURRENT_DATE - INTERVAL '31 days'
  ),
  monthly_target AS (
    SELECT COALESCE(montant_cible, 1000000) as target
    FROM objectifs_ventes
    WHERE tenant_id = p_tenant_id
      AND annee = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      AND mois = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
    LIMIT 1
  ),
  pending_count AS (
    SELECT COUNT(*)::INTEGER as pending
    FROM ventes
    WHERE tenant_id = p_tenant_id AND statut = 'En cours'
  )
  SELECT jsonb_build_object(
    'dailyRevenue', dm.daily_revenue,
    'yesterdayRevenue', dm.yesterday_revenue,
    'dailyTransactions', dm.daily_transactions,
    'averageBasket', CASE 
      WHEN dm.daily_transactions > 0 THEN ROUND(dm.daily_revenue / dm.daily_transactions, 2)
      ELSE 0 
    END,
    'monthlyRevenue', dm.monthly_revenue,
    'monthlyTarget', COALESCE(mt.target, 1000000),
    'monthlyProgress', CASE 
      WHEN COALESCE(mt.target, 1000000) > 0 THEN ROUND((dm.monthly_revenue / COALESCE(mt.target, 1000000)) * 100, 2)
      ELSE 0 
    END,
    'pendingInvoices', pc.pending
  )
  INTO v_result
  FROM daily_metrics dm
  CROSS JOIN monthly_target mt
  CROSS JOIN pending_count pc;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_dashboard_metrics(UUID) TO authenticated;

COMMENT ON FUNCTION get_sales_dashboard_metrics IS 
'Retourne les métriques agrégées du dashboard ventes (CA journalier, transactions, panier moyen, objectif mensuel)';

-- ============================================================================
-- RPC 2: get_cash_registers_status - Liste des caisses (pas de pagination)
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

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.nom_caisse,
      'code', c.code_caisse,
      'status', CASE 
        WHEN s.statut = 'Ouverte' THEN 'open'
        ELSE 'closed'
      END,
      'currentAmount', COALESCE(s.fond_caisse_ouverture + s.montant_total_ventes - s.montant_total_retraits, 0),
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

GRANT EXECUTE ON FUNCTION get_cash_registers_status(UUID) TO authenticated;

COMMENT ON FUNCTION get_cash_registers_status IS 
'Retourne l''état de toutes les caisses avec leurs sessions actives';

-- ============================================================================
-- RPC 3: get_recent_sales_transactions - Transactions avec PAGINATION
-- ============================================================================
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
      v.remise_totale
    FROM ventes v
    LEFT JOIN clients c ON c.id = v.client_id
    LEFT JOIN personnel p ON p.id = v.agent_id
    LEFT JOIN caisses ca ON ca.id = v.caisse_id
    WHERE v.tenant_id = p_tenant_id 
      AND v.statut = 'Validée'
      -- Filtres optionnels
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
          'discount', remise_totale
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

GRANT EXECUTE ON FUNCTION get_recent_sales_transactions(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, DATE, DATE) TO authenticated;

COMMENT ON FUNCTION get_recent_sales_transactions IS 
'Retourne les transactions de vente récentes avec pagination. Support de la recherche et des filtres.';

-- ============================================================================
-- Index de Performance pour optimiser les requêtes du dashboard
-- ============================================================================

-- Index pour les requêtes par date et statut
CREATE INDEX IF NOT EXISTS idx_ventes_tenant_date_status 
  ON ventes(tenant_id, date_vente DESC, statut) 
  WHERE statut = 'Validée';

-- Index pour la recherche par numéro de vente
CREATE INDEX IF NOT EXISTS idx_ventes_search
  ON ventes(tenant_id, numero_vente, statut)
  WHERE statut = 'Validée';

-- Index pour les sessions de caisse ouvertes
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_tenant_status 
  ON sessions_caisse(tenant_id, statut, date_ouverture DESC) 
  WHERE statut = 'Ouverte';

-- Index pour les ventes par caisse
CREATE INDEX IF NOT EXISTS idx_ventes_caisse_date 
  ON ventes(caisse_id, date_vente DESC, tenant_id) 
  WHERE statut = 'Validée';

-- Index pour les ventes par agent
CREATE INDEX IF NOT EXISTS idx_ventes_agent_date
  ON ventes(agent_id, date_vente DESC, tenant_id)
  WHERE statut = 'Validée';