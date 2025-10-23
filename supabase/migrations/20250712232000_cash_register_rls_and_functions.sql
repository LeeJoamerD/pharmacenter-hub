-- Migration: Implémentation RLS et fonctions sécurisées pour la Section Caisse
-- Date: 2025-01-09
-- Description: Création des policies RLS et fonctions PostgreSQL pour le module caisse

-- =====================================================
-- 1. RLS POLICIES POUR SESSIONS_CAISSE
-- =====================================================

-- Policy pour la lecture des sessions de caisse
CREATE POLICY "Users can view their tenant's cash sessions"
ON sessions_caisse FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

-- Policy pour la création des sessions de caisse
CREATE POLICY "Users can create cash sessions for their tenant"
ON sessions_caisse FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policy pour la mise à jour des sessions de caisse
CREATE POLICY "Users can update their tenant's cash sessions"
ON sessions_caisse FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

-- Policy pour la suppression des sessions de caisse (si nécessaire)
CREATE POLICY "Users can delete their tenant's cash sessions"
ON sessions_caisse FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- 2. RLS POLICIES POUR MOUVEMENTS_CAISSE
-- =====================================================

-- Policy pour la lecture des mouvements de caisse
CREATE POLICY "Users can view their tenant's cash movements"
ON mouvements_caisse FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

-- Policy pour la création des mouvements de caisse
CREATE POLICY "Users can create cash movements for their tenant"
ON mouvements_caisse FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policy pour la mise à jour des mouvements de caisse
CREATE POLICY "Users can update their tenant's cash movements"
ON mouvements_caisse FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

-- Policy pour la suppression des mouvements de caisse (si nécessaire)
CREATE POLICY "Users can delete their tenant's cash movements"
ON mouvements_caisse FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- 3. ACTIVATION DES RLS SUR LES TABLES
-- =====================================================

-- Activer RLS sur sessions_caisse si pas déjà fait
ALTER TABLE sessions_caisse ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur mouvements_caisse si pas déjà fait
ALTER TABLE mouvements_caisse ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. FONCTIONS SÉCURISÉES POUR LA CAISSE
-- =====================================================

-- Fonction pour générer un numéro de session unique (SÉCURISÉE)
CREATE OR REPLACE FUNCTION generate_session_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count INTEGER;
  session_number TEXT;
  current_tenant_id UUID;
BEGIN
  -- Récupérer le tenant de l'utilisateur authentifié
  SELECT get_current_user_tenant_id() INTO current_tenant_id;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Compter les sessions du jour pour ce tenant
  SELECT COUNT(*) INTO session_count
  FROM sessions_caisse
  WHERE tenant_id = current_tenant_id
  AND DATE(date_ouverture) = CURRENT_DATE;

  -- Générer le numéro de session
  session_number := 'SES-' || 
                   TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                   LPAD((session_count + 1)::TEXT, 4, '0');

  RETURN session_number;
END;
$$;

-- Fonction pour calculer le montant théorique de fermeture (SÉCURISÉE)
CREATE OR REPLACE FUNCTION calculate_expected_closing(p_session_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  opening_amount NUMERIC;
  total_movements NUMERIC;
  current_tenant_id UUID;
  session_tenant_id UUID;
BEGIN
  -- Récupérer le tenant de l'utilisateur authentifié
  SELECT get_current_user_tenant_id() INTO current_tenant_id;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Vérifier que la session appartient au tenant de l'utilisateur
  SELECT tenant_id, fond_caisse_ouverture 
  INTO session_tenant_id, opening_amount
  FROM sessions_caisse
  WHERE id = p_session_id;

  IF session_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Session non trouvée';
  END IF;

  IF session_tenant_id != current_tenant_id THEN
    RAISE EXCEPTION 'Accès non autorisé à cette session';
  END IF;

  -- Calculer le total des mouvements
  SELECT COALESCE(SUM(montant), 0) INTO total_movements
  FROM mouvements_caisse
  WHERE session_caisse_id = p_session_id
  AND tenant_id = current_tenant_id;

  RETURN opening_amount + total_movements;
END;
$$;

-- Fonction pour vérifier s'il existe une session ouverte (SÉCURISÉE)
CREATE OR REPLACE FUNCTION has_open_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count INTEGER;
  current_tenant_id UUID;
BEGIN
  -- Récupérer le tenant de l'utilisateur authentifié
  SELECT get_current_user_tenant_id() INTO current_tenant_id;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Compter les sessions ouvertes pour ce tenant
  SELECT COUNT(*) INTO session_count
  FROM sessions_caisse
  WHERE tenant_id = current_tenant_id
  AND statut = 'Ouverte';

  RETURN session_count > 0;
END;
$$;

-- Fonction pour obtenir la session active (SÉCURISÉE)
CREATE OR REPLACE FUNCTION get_active_session()
RETURNS TABLE(
  id UUID,
  numero_session TEXT,
  date_ouverture TIMESTAMP WITH TIME ZONE,
  fond_caisse_ouverture NUMERIC,
  caissier_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  -- Récupérer le tenant de l'utilisateur authentifié
  SELECT get_current_user_tenant_id() INTO current_tenant_id;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Retourner la session active
  RETURN QUERY
  SELECT s.id, s.numero_session, s.date_ouverture, s.fond_caisse_ouverture, s.caissier_id
  FROM sessions_caisse s
  WHERE s.tenant_id = current_tenant_id
  AND s.statut = 'Ouverte'
  ORDER BY s.date_ouverture DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- 5. INDEX POUR PERFORMANCE
-- =====================================================

-- Index pour sessions_caisse
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_tenant_id ON sessions_caisse(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_statut ON sessions_caisse(statut);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_date ON sessions_caisse(date_ouverture);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_tenant_statut ON sessions_caisse(tenant_id, statut);

-- Index pour mouvements_caisse
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_session ON mouvements_caisse(session_caisse_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_tenant ON mouvements_caisse(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_tenant_session ON mouvements_caisse(tenant_id, session_caisse_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_date ON mouvements_caisse(date_mouvement);

-- =====================================================
-- 6. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION generate_session_number() IS 'Génère un numéro de session unique pour le tenant authentifié';
COMMENT ON FUNCTION calculate_expected_closing(UUID) IS 'Calcule le montant théorique de fermeture pour une session donnée';
COMMENT ON FUNCTION has_open_session() IS 'Vérifie si le tenant a une session ouverte';
COMMENT ON FUNCTION get_active_session() IS 'Retourne les informations de la session active du tenant';