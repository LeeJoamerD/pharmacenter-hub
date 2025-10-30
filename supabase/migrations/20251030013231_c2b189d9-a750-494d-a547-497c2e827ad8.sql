-- =====================================================
-- AUDIT CORRECTION: Tables manquantes pour module Personnel
-- Date: 2025-01-29
-- Description: Création des tables planning_employes, conges_employes, formations_employes
-- Source: Analyse du frontend - Section Personnel
-- =====================================================

-- ============================================================
-- TABLE 1: planning_employes (Gestion des horaires)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planning_employes (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  type_shift TEXT NOT NULL CHECK (type_shift IN ('Matinée', 'Après-midi', 'Soirée', 'Nuit', 'Journée complète')),
  poste TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Planifié' CHECK (statut IN ('Planifié', 'Confirmé', 'En cours', 'Terminé', 'Annulé')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_planning_employes_tenant_id ON public.planning_employes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_planning_employes_employe_id ON public.planning_employes(employe_id);
CREATE INDEX IF NOT EXISTS idx_planning_employes_date ON public.planning_employes(date);
CREATE INDEX IF NOT EXISTS idx_planning_employes_statut ON public.planning_employes(statut);

-- Trigger pour updated_at
CREATE TRIGGER update_planning_employes_updated_at
  BEFORE UPDATE ON public.planning_employes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.planning_employes ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view schedules from their tenant"
  ON public.planning_employes FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert schedules in their tenant"
  ON public.planning_employes FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update schedules from their tenant"
  ON public.planning_employes FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete schedules from their tenant"
  ON public.planning_employes FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Commentaires
COMMENT ON TABLE public.planning_employes IS 'Gestion des plannings et horaires des employés';
COMMENT ON COLUMN public.planning_employes.type_shift IS 'Type de shift: Matinée, Après-midi, Soirée, Nuit, Journée complète';
COMMENT ON COLUMN public.planning_employes.statut IS 'Statut du planning: Planifié, Confirmé, En cours, Terminé, Annulé';

-- ============================================================
-- TABLE 2: conges_employes (Gestion des congés)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conges_employes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  type_conge TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  motif TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Approuvé', 'Rejeté')),
  approuve_par UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  date_approbation TIMESTAMP WITH TIME ZONE,
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_date_fin_apres_debut CHECK (date_fin >= date_debut)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conges_employes_tenant_id ON public.conges_employes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conges_employes_employe_id ON public.conges_employes(employe_id);
CREATE INDEX IF NOT EXISTS idx_conges_employes_statut ON public.conges_employes(statut);
CREATE INDEX IF NOT EXISTS idx_conges_employes_dates ON public.conges_employes(date_debut, date_fin);

-- Trigger pour updated_at
CREATE TRIGGER update_conges_employes_updated_at
  BEFORE UPDATE ON public.conges_employes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.conges_employes ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view leaves from their tenant"
  ON public.conges_employes FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert leaves in their tenant"
  ON public.conges_employes FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update leaves from their tenant"
  ON public.conges_employes FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete leaves from their tenant"
  ON public.conges_employes FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Commentaires
COMMENT ON TABLE public.conges_employes IS 'Gestion des demandes de congés et absences des employés';
COMMENT ON COLUMN public.conges_employes.statut IS 'Statut de la demande: En attente, Approuvé, Rejeté';

-- ============================================================
-- TABLE 3: formations_employes (Gestion des formations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.formations_employes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  organisme TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  duree INTEGER NOT NULL CHECK (duree > 0),
  lieu TEXT NOT NULL,
  cout NUMERIC(15,2),
  certificat_requis BOOLEAN NOT NULL DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'Planifié' CHECK (statut IN ('Planifié', 'En cours', 'Terminé', 'Annulé')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_date_fin_apres_debut_formation CHECK (date_fin >= date_debut)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_formations_employes_tenant_id ON public.formations_employes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_formations_employes_statut ON public.formations_employes(statut);
CREATE INDEX IF NOT EXISTS idx_formations_employes_dates ON public.formations_employes(date_debut, date_fin);

-- Trigger pour updated_at
CREATE TRIGGER update_formations_employes_updated_at
  BEFORE UPDATE ON public.formations_employes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.formations_employes ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view trainings from their tenant"
  ON public.formations_employes FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert trainings in their tenant"
  ON public.formations_employes FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update trainings from their tenant"
  ON public.formations_employes FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete trainings from their tenant"
  ON public.formations_employes FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Commentaires
COMMENT ON TABLE public.formations_employes IS 'Gestion des formations et développement professionnel des employés';
COMMENT ON COLUMN public.formations_employes.duree IS 'Durée de la formation en heures';
COMMENT ON COLUMN public.formations_employes.statut IS 'Statut de la formation: Planifié, En cours, Terminé, Annulé';

-- ============================================================
-- TABLE 4: participations_formation (Relation many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.participations_formation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations_employes(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  statut_participation TEXT NOT NULL DEFAULT 'Inscrit' CHECK (statut_participation IN ('Inscrit', 'En cours', 'Terminé', 'Abandonné')),
  note_finale NUMERIC(5,2),
  certificat_obtenu BOOLEAN DEFAULT false,
  date_inscription TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_completion TIMESTAMP WITH TIME ZONE,
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_participation UNIQUE (formation_id, employe_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_participations_formation_tenant_id ON public.participations_formation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_participations_formation_formation_id ON public.participations_formation(formation_id);
CREATE INDEX IF NOT EXISTS idx_participations_formation_employe_id ON public.participations_formation(employe_id);

-- Trigger pour updated_at
CREATE TRIGGER update_participations_formation_updated_at
  BEFORE UPDATE ON public.participations_formation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.participations_formation ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view participations from their tenant"
  ON public.participations_formation FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert participations in their tenant"
  ON public.participations_formation FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update participations from their tenant"
  ON public.participations_formation FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete participations from their tenant"
  ON public.participations_formation FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Commentaires
COMMENT ON TABLE public.participations_formation IS 'Suivi des participations des employés aux formations';

-- ============================================================
-- Vérification finale
-- ============================================================
DO $$
BEGIN
  -- Vérifier planning_employes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'planning_employes'
  ) THEN
    RAISE EXCEPTION 'La table planning_employes n''a pas été créée';
  END IF;
  
  -- Vérifier conges_employes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conges_employes'
  ) THEN
    RAISE EXCEPTION 'La table conges_employes n''a pas été créée';
  END IF;
  
  -- Vérifier formations_employes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'formations_employes'
  ) THEN
    RAISE EXCEPTION 'La table formations_employes n''a pas été créée';
  END IF;
  
  -- Vérifier participations_formation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'participations_formation'
  ) THEN
    RAISE EXCEPTION 'La table participations_formation n''a pas été créée';
  END IF;
  
  RAISE NOTICE '✅ Migration réussie: 4 tables créées pour le module Personnel';
  RAISE NOTICE '  - planning_employes (horaires)';
  RAISE NOTICE '  - conges_employes (congés)';
  RAISE NOTICE '  - formations_employes (formations)';
  RAISE NOTICE '  - participations_formation (suivi des participations)';
END $$;