-- ============================================
-- ÉTAPE 1 : Création de la table caisses (Points de vente)
-- ============================================

CREATE TABLE IF NOT EXISTS public.caisses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nom_caisse TEXT NOT NULL,
  code_caisse TEXT NOT NULL,
  emplacement TEXT,
  description TEXT,
  type_caisse TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index et contraintes
CREATE INDEX IF NOT EXISTS idx_caisses_tenant ON public.caisses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_caisses_code ON public.caisses(code_caisse);
CREATE UNIQUE INDEX IF NOT EXISTS idx_caisses_tenant_code ON public.caisses(tenant_id, code_caisse);

-- RLS Policies
ALTER TABLE public.caisses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view caisses from their tenant" ON public.caisses;
CREATE POLICY "Users can view caisses from their tenant"
  ON public.caisses FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage caisses in their tenant" ON public.caisses;
CREATE POLICY "Users can manage caisses in their tenant"
  ON public.caisses FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_caisses_updated_at ON public.caisses;
CREATE TRIGGER update_caisses_updated_at
  BEFORE UPDATE ON public.caisses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ÉTAPE 2 : Modification de sessions_caisse
-- ============================================

-- Créer l'enum pour les types de sessions
DO $$ BEGIN
  CREATE TYPE public.type_session_enum AS ENUM ('Matin', 'Midi', 'Soir');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter les nouvelles colonnes à sessions_caisse
ALTER TABLE public.sessions_caisse 
  ADD COLUMN IF NOT EXISTS type_session public.type_session_enum DEFAULT 'Matin',
  ADD COLUMN IF NOT EXISTS date_session DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS caisse_id UUID REFERENCES public.caisses(id) ON DELETE SET NULL;

-- Rendre type_session et date_session NOT NULL après avoir ajouté les valeurs par défaut
ALTER TABLE public.sessions_caisse 
  ALTER COLUMN type_session SET NOT NULL,
  ALTER COLUMN date_session SET NOT NULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_sessions_date_type ON public.sessions_caisse(tenant_id, date_session, type_session);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse ON public.sessions_caisse(caisse_id);

-- Contrainte d'unicité : une seule session ouverte par type/jour/caisse
DROP INDEX IF EXISTS idx_sessions_unique_open;
CREATE UNIQUE INDEX idx_sessions_unique_open 
  ON public.sessions_caisse(tenant_id, caisse_id, type_session, date_session)
  WHERE statut = 'Ouverte';

-- ============================================
-- Modifier la fonction generate_session_number
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_session_number(
  p_type_session TEXT DEFAULT 'Matin',
  p_caisse_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date TEXT;
  v_prefix TEXT;
  v_caisse_code TEXT;
  v_numero TEXT;
  v_tenant_id UUID;
BEGIN
  -- Récupérer le tenant_id
  v_tenant_id := get_current_user_tenant_id();
  
  -- Format de la date
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Préfixe selon le type de session
  v_prefix := CASE p_type_session
    WHEN 'Matin' THEN 'MAT'
    WHEN 'Midi' THEN 'MID'
    WHEN 'Soir' THEN 'SOI'
    ELSE 'SES'
  END;
  
  -- Code de la caisse
  IF p_caisse_id IS NOT NULL THEN
    SELECT code_caisse INTO v_caisse_code
    FROM caisses
    WHERE id = p_caisse_id;
  END IF;
  
  -- Générer le numéro : SES-YYYYMMDD-MAT-C01-001
  v_numero := 'SES-' || v_date || '-' || v_prefix || '-' || 
              COALESCE(v_caisse_code, 'C00') || '-' ||
              LPAD((
                SELECT COALESCE(COUNT(*), 0) + 1
                FROM sessions_caisse
                WHERE tenant_id = v_tenant_id
                AND date_session = CURRENT_DATE
                AND type_session = p_type_session::type_session_enum
                AND (p_caisse_id IS NULL OR caisse_id = p_caisse_id OR caisse_id IS NULL)
              )::TEXT, 3, '0');
  
  RETURN v_numero;
END;
$$;

-- ============================================
-- ÉTAPE 3 : Modification de ventes et encaissements
-- ============================================

-- Ajouter les colonnes à la table ventes
ALTER TABLE public.ventes 
  ADD COLUMN IF NOT EXISTS caisse_id UUID REFERENCES public.caisses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_caisse_id UUID REFERENCES public.sessions_caisse(id) ON DELETE SET NULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_ventes_caisse ON public.ventes(tenant_id, caisse_id);
CREATE INDEX IF NOT EXISTS idx_ventes_session ON public.ventes(session_caisse_id);

-- Ajouter caisse_id à encaissements
ALTER TABLE public.encaissements
  ADD COLUMN IF NOT EXISTS caisse_id UUID REFERENCES public.caisses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_encaissements_caisse ON public.encaissements(caisse_id);

-- ============================================
-- Triggers pour synchroniser caisse_id
-- ============================================

-- Trigger pour ventes
CREATE OR REPLACE FUNCTION public.sync_vente_caisse_from_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_caisse_id IS NOT NULL THEN
    SELECT caisse_id INTO NEW.caisse_id
    FROM sessions_caisse
    WHERE id = NEW.session_caisse_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_vente_caisse ON public.ventes;
CREATE TRIGGER trigger_sync_vente_caisse
  BEFORE INSERT OR UPDATE ON public.ventes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vente_caisse_from_session();

-- Trigger pour encaissements
CREATE OR REPLACE FUNCTION public.sync_encaissement_caisse_from_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_caisse_id IS NOT NULL THEN
    SELECT caisse_id INTO NEW.caisse_id
    FROM sessions_caisse
    WHERE id = NEW.session_caisse_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_encaissement_caisse ON public.encaissements;
CREATE TRIGGER trigger_sync_encaissement_caisse
  BEFORE INSERT OR UPDATE ON public.encaissements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_encaissement_caisse_from_session();

-- ============================================
-- ÉTAPE 4 : Modifier has_open_session
-- ============================================

CREATE OR REPLACE FUNCTION public.has_open_session(
  p_type_session TEXT DEFAULT NULL,
  p_caisse_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_session BOOLEAN;
  v_tenant_id UUID;
BEGIN
  v_tenant_id := get_current_user_tenant_id();
  
  SELECT EXISTS (
    SELECT 1
    FROM sessions_caisse
    WHERE tenant_id = v_tenant_id
    AND statut = 'Ouverte'
    AND date_session = CURRENT_DATE
    AND (p_type_session IS NULL OR type_session = p_type_session::type_session_enum)
    AND (p_caisse_id IS NULL OR caisse_id = p_caisse_id)
  ) INTO v_has_session;
  
  RETURN v_has_session;
END;
$$;

-- ============================================
-- ÉTAPE 5 : Création des vues pour rapports
-- ============================================

-- Vue 1 : Rapport complet par session
CREATE OR REPLACE VIEW public.v_rapport_session_complet AS
SELECT 
  s.id as session_id,
  s.tenant_id,
  s.numero_session,
  s.type_session,
  s.date_session,
  s.statut,
  c.nom_caisse,
  c.code_caisse,
  c.emplacement as caisse_emplacement,
  
  -- Agent/Caissier
  p.noms || ' ' || p.prenoms as caissier_nom,
  
  -- Fond de caisse
  s.fond_caisse_ouverture,
  s.fond_caisse_fermeture,
  s.montant_theorique_fermeture,
  s.ecart,
  
  -- Horaires
  s.date_ouverture,
  s.date_fermeture,
  
  -- Statistiques des ventes
  COUNT(DISTINCT v.id) as nombre_ventes,
  COALESCE(SUM(v.montant_net), 0) as total_ventes,
  COALESCE(AVG(v.montant_net), 0) as montant_moyen_vente,
  
  -- Répartition par mode de paiement (seulement les valeurs valides de l'enum)
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Espèces' THEN v.montant_net ELSE 0 END), 0) as total_especes,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Carte Bancaire' THEN v.montant_net ELSE 0 END), 0) as total_carte,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Mobile Money' THEN v.montant_net ELSE 0 END), 0) as total_mobile,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Chèque' THEN v.montant_net ELSE 0 END), 0) as total_cheque,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Virement' THEN v.montant_net ELSE 0 END), 0) as total_virement,
  
  -- Mouvements de caisse
  COALESCE(SUM(CASE WHEN mc.type_mouvement = 'entree' THEN mc.montant ELSE 0 END), 0) as total_entrees,
  COALESCE(SUM(CASE WHEN mc.type_mouvement = 'sortie' THEN mc.montant ELSE 0 END), 0) as total_sorties,
  
  -- Nombre d'articles vendus
  COALESCE((SELECT SUM(quantite) FROM lignes_ventes WHERE vente_id = v.id), 0) as nombre_articles_vendus

FROM sessions_caisse s
LEFT JOIN caisses c ON c.id = s.caisse_id
LEFT JOIN personnel p ON p.id = s.caissier_id
LEFT JOIN ventes v ON v.session_caisse_id = s.id AND v.statut = 'Validée'
LEFT JOIN mouvements_caisse mc ON mc.session_caisse_id = s.id

GROUP BY 
  s.id, s.tenant_id, s.numero_session, s.type_session, s.date_session,
  s.statut, s.fond_caisse_ouverture, s.fond_caisse_fermeture,
  s.montant_theorique_fermeture, s.ecart, s.date_ouverture, s.date_fermeture,
  c.nom_caisse, c.code_caisse, c.emplacement,
  p.noms, p.prenoms, v.id;

-- Vue 2 : Rapport par caisse et type de session
CREATE OR REPLACE VIEW public.v_rapport_par_caisse_type AS
SELECT 
  c.id as caisse_id,
  c.tenant_id,
  c.nom_caisse,
  c.code_caisse,
  s.type_session,
  s.date_session,
  
  COUNT(DISTINCT s.id) as nombre_sessions,
  COALESCE(SUM(v.montant_net), 0) as total_ventes,
  COUNT(DISTINCT v.id) as nombre_ventes,
  COALESCE(AVG(v.montant_net), 0) as montant_moyen_vente

FROM caisses c
LEFT JOIN sessions_caisse s ON s.caisse_id = c.id
LEFT JOIN ventes v ON v.session_caisse_id = s.id AND v.statut = 'Validée'

GROUP BY 
  c.id, c.tenant_id, c.nom_caisse, c.code_caisse,
  s.type_session, s.date_session;

-- Vue 3 : Résumé journalier
CREATE OR REPLACE VIEW public.v_resume_journalier AS
SELECT 
  s.tenant_id,
  s.date_session,
  
  COUNT(DISTINCT s.id) as nombre_sessions_ouvertes,
  COUNT(DISTINCT c.id) as nombre_caisses_actives,
  
  COALESCE(SUM(v.montant_net), 0) as total_ventes_journee,
  COUNT(DISTINCT v.id) as nombre_ventes_journee,
  
  COALESCE(SUM(CASE WHEN s.type_session = 'Matin' THEN v.montant_net ELSE 0 END), 0) as total_matin,
  COALESCE(SUM(CASE WHEN s.type_session = 'Midi' THEN v.montant_net ELSE 0 END), 0) as total_midi,
  COALESCE(SUM(CASE WHEN s.type_session = 'Soir' THEN v.montant_net ELSE 0 END), 0) as total_soir

FROM sessions_caisse s
LEFT JOIN caisses c ON c.id = s.caisse_id
LEFT JOIN ventes v ON v.session_caisse_id = s.id AND v.statut = 'Validée'

GROUP BY 
  s.tenant_id, s.date_session;

-- ============================================
-- ÉTAPE 8 : Migration des données existantes
-- ============================================

-- 1. Créer une caisse par défaut pour chaque tenant
INSERT INTO public.caisses (tenant_id, nom_caisse, code_caisse, emplacement, is_active)
SELECT DISTINCT 
  tenant_id,
  'Caisse Principale' as nom_caisse,
  'C01' as code_caisse,
  'Principal' as emplacement,
  true as is_active
FROM sessions_caisse
WHERE NOT EXISTS (
  SELECT 1 FROM caisses WHERE caisses.tenant_id = sessions_caisse.tenant_id
);

-- 2. Attribuer un type de session aux sessions existantes selon l'heure d'ouverture
UPDATE public.sessions_caisse s
SET 
  date_session = COALESCE(DATE(date_ouverture), CURRENT_DATE),
  caisse_id = (
    SELECT id FROM caisses c 
    WHERE c.tenant_id = s.tenant_id 
    ORDER BY created_at ASC
    LIMIT 1
  )
WHERE caisse_id IS NULL;

-- 3. Mettre à jour les ventes avec session_caisse_id si manquant
UPDATE public.ventes v
SET session_caisse_id = (
  SELECT s.id
  FROM sessions_caisse s
  WHERE s.tenant_id = v.tenant_id
  AND DATE(v.date_vente) = s.date_session
  AND v.date_vente >= s.date_ouverture 
  AND (s.date_fermeture IS NULL OR v.date_vente <= s.date_fermeture)
  ORDER BY s.date_ouverture DESC
  LIMIT 1
)
WHERE session_caisse_id IS NULL
AND EXISTS (
  SELECT 1 FROM sessions_caisse s2
  WHERE s2.tenant_id = v.tenant_id
  AND DATE(v.date_vente) = s2.date_session
);

-- 4. Mettre à jour caisse_id sur les ventes (le trigger le fera automatiquement)
UPDATE public.ventes 
SET updated_at = NOW() 
WHERE session_caisse_id IS NOT NULL AND caisse_id IS NULL;

-- 5. Mettre à jour les encaissements
UPDATE public.encaissements e
SET 
  caisse_id = v.caisse_id
FROM ventes v
WHERE e.vente_id = v.id
AND e.caisse_id IS NULL
AND v.caisse_id IS NOT NULL;