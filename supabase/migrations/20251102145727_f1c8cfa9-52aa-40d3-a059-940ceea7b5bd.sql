-- Migration complète pour le module Caisses (Version Finale)
-- Corrige la structure des tables et crée les fonctions RPC manquantes

-- ============================================================================
-- PARTIE 1: Correction de la structure sessions_caisse
-- ============================================================================

-- Ajouter les colonnes manquantes
ALTER TABLE public.sessions_caisse 
  ADD COLUMN IF NOT EXISTS numero_session TEXT,
  ADD COLUMN IF NOT EXISTS montant_theorique_fermeture NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS montant_reel_fermeture NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS caissier_id UUID;

-- Copier les données existantes de fond_caisse_fermeture vers montant_reel_fermeture
UPDATE public.sessions_caisse
SET montant_reel_fermeture = fond_caisse_fermeture
WHERE montant_reel_fermeture IS NULL AND fond_caisse_fermeture IS NOT NULL;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_numero 
  ON public.sessions_caisse(tenant_id, numero_session);

CREATE INDEX IF NOT EXISTS idx_sessions_caisse_statut 
  ON public.sessions_caisse(tenant_id, statut) 
  WHERE statut = 'Ouverte';

-- Synchroniser caissier_id avec agent_id (pour compatibilité bidirectionnelle)
CREATE OR REPLACE FUNCTION public.sync_caissier_agent_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.caissier_id IS NOT NULL AND NEW.agent_id IS NULL THEN
    NEW.agent_id := NEW.caissier_id;
  ELSIF NEW.agent_id IS NOT NULL AND NEW.caissier_id IS NULL THEN
    NEW.caissier_id := NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_caissier_agent ON public.sessions_caisse;
CREATE TRIGGER trigger_sync_caissier_agent
  BEFORE INSERT OR UPDATE ON public.sessions_caisse
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_caissier_agent_id();

-- ============================================================================
-- PARTIE 2: Correction de la structure mouvements_caisse
-- ============================================================================

-- Ajouter les colonnes manquantes
ALTER TABLE public.mouvements_caisse 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS reference_id UUID,
  ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- Créer l'index pour les références
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_reference 
  ON public.mouvements_caisse(reference_id, reference_type) 
  WHERE reference_id IS NOT NULL;

-- Synchroniser description avec motif (pour compatibilité bidirectionnelle)
CREATE OR REPLACE FUNCTION public.sync_description_motif()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description IS NOT NULL AND NEW.motif IS NULL THEN
    NEW.motif := NEW.description;
  ELSIF NEW.motif IS NOT NULL AND NEW.description IS NULL THEN
    NEW.description := NEW.motif;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_description_motif ON public.mouvements_caisse;
CREATE TRIGGER trigger_sync_description_motif
  BEFORE INSERT OR UPDATE ON public.mouvements_caisse
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_description_motif();

-- ============================================================================
-- PARTIE 3: Créer les fonctions RPC manquantes
-- ============================================================================

-- Fonction 1: has_open_session()
CREATE OR REPLACE FUNCTION public.has_open_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_has_open BOOLEAN;
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.sessions_caisse 
    WHERE tenant_id = v_tenant_id 
      AND statut = 'Ouverte'
    LIMIT 1
  ) INTO v_has_open;
  
  RETURN v_has_open;
END;
$$;

COMMENT ON FUNCTION public.has_open_session() IS 
'Vérifie si le tenant courant a une session de caisse ouverte';

-- Fonction 2: generate_session_number()
CREATE OR REPLACE FUNCTION public.generate_session_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_count INTEGER;
  v_year TEXT;
  v_numero TEXT;
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
  END IF;
  
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.sessions_caisse
  WHERE tenant_id = v_tenant_id
    AND EXTRACT(YEAR FROM date_ouverture) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_numero := 'SESS-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_numero;
END;
$$;

COMMENT ON FUNCTION public.generate_session_number() IS 
'Génère un numéro de session unique pour le tenant courant au format SESS-YYYY-NNNN';

-- Fonction 3: calculate_expected_closing(p_session_id UUID)
CREATE OR REPLACE FUNCTION public.calculate_expected_closing(p_session_id UUID)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_fond_ouverture NUMERIC(15,2);
  v_total_mouvements NUMERIC(15,2);
  v_montant_theorique NUMERIC(15,2);
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
  END IF;
  
  SELECT fond_caisse_ouverture INTO v_fond_ouverture
  FROM public.sessions_caisse
  WHERE id = p_session_id 
    AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session de caisse non trouvée';
  END IF;
  
  SELECT COALESCE(SUM(montant), 0) INTO v_total_mouvements
  FROM public.mouvements_caisse
  WHERE session_caisse_id = p_session_id
    AND tenant_id = v_tenant_id
    AND type_mouvement != 'Fond_initial';
  
  v_montant_theorique := v_fond_ouverture + v_total_mouvements;
  
  RETURN v_montant_theorique;
END;
$$;

COMMENT ON FUNCTION public.calculate_expected_closing(UUID) IS 
'Calcule le montant théorique de fermeture pour une session de caisse donnée';

-- ============================================================================
-- PARTIE 4: Trigger pour auto-calculer le montant théorique
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_session_theorique_on_close()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'Fermée' AND OLD.statut = 'Ouverte' THEN
    NEW.montant_theorique_fermeture := public.calculate_expected_closing(NEW.id);
    NEW.ecart := COALESCE(NEW.montant_reel_fermeture, NEW.fond_caisse_fermeture, 0) - NEW.montant_theorique_fermeture;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_theorique_on_close ON public.sessions_caisse;
CREATE TRIGGER trigger_update_theorique_on_close
  BEFORE UPDATE ON public.sessions_caisse
  FOR EACH ROW
  WHEN (NEW.statut = 'Fermée' AND OLD.statut = 'Ouverte')
  EXECUTE FUNCTION public.update_session_theorique_on_close();

COMMENT ON TRIGGER trigger_update_theorique_on_close ON public.sessions_caisse IS
'Calcule automatiquement le montant théorique et l''écart lors de la fermeture d''une session';

-- ============================================================================
-- PARTIE 5: Optimisations et index supplémentaires
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_session_date 
  ON public.mouvements_caisse(session_caisse_id, date_mouvement DESC);

CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_type 
  ON public.mouvements_caisse(tenant_id, type_mouvement);

CREATE INDEX IF NOT EXISTS idx_sessions_caisse_dates 
  ON public.sessions_caisse(tenant_id, date_ouverture DESC, date_fermeture DESC);

-- Vue pour faciliter les rapports de caisse
CREATE OR REPLACE VIEW public.v_sessions_caisse_resumees AS
SELECT 
  s.id,
  s.tenant_id,
  s.numero_session,
  COALESCE(s.caissier_id, s.agent_id) as agent_id,
  s.date_ouverture,
  s.date_fermeture,
  s.fond_caisse_ouverture,
  s.montant_theorique_fermeture,
  COALESCE(s.montant_reel_fermeture, s.fond_caisse_fermeture) as montant_reel_fermeture,
  s.ecart,
  s.statut,
  s.notes,
  COUNT(DISTINCT m.id) as nombre_mouvements,
  SUM(CASE WHEN m.type_mouvement = 'Encaissement' THEN m.montant ELSE 0 END) as total_encaissements,
  SUM(CASE WHEN m.type_mouvement = 'Retrait' THEN ABS(m.montant) ELSE 0 END) as total_retraits
FROM public.sessions_caisse s
LEFT JOIN public.mouvements_caisse m ON m.session_caisse_id = s.id AND m.tenant_id = s.tenant_id
GROUP BY s.id;

COMMENT ON VIEW public.v_sessions_caisse_resumees IS
'Vue résumée des sessions de caisse avec statistiques des mouvements';

-- ============================================================================
-- PARTIE 6: Migration des données existantes
-- ============================================================================

-- Mettre à jour les sessions existantes sans numero_session
WITH numbered_sessions AS (
  SELECT 
    id,
    'SESS-' || EXTRACT(YEAR FROM date_ouverture) || '-' || 
    LPAD(ROW_NUMBER() OVER (PARTITION BY tenant_id, EXTRACT(YEAR FROM date_ouverture) ORDER BY date_ouverture)::TEXT, 4, '0') as new_numero
  FROM public.sessions_caisse
  WHERE numero_session IS NULL
)
UPDATE public.sessions_caisse s
SET numero_session = ns.new_numero
FROM numbered_sessions ns
WHERE s.id = ns.id;

-- Synchroniser caissier_id et agent_id pour les données existantes
UPDATE public.sessions_caisse
SET caissier_id = agent_id
WHERE caissier_id IS NULL AND agent_id IS NOT NULL;

-- Synchroniser description et motif pour les mouvements existants
UPDATE public.mouvements_caisse
SET description = motif
WHERE description IS NULL AND motif IS NOT NULL;