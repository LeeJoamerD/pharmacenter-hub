-- Phase 1: Création des tables fiscales

-- 1. Table taux_tva - Configuration des taux de TVA
CREATE TABLE IF NOT EXISTS public.taux_tva (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_taux TEXT NOT NULL,
  taux_pourcentage NUMERIC(5,2) NOT NULL,
  type_taux TEXT NOT NULL CHECK (type_taux IN ('Standard', 'Réduit', 'Exonéré', 'Spécial')),
  description TEXT,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  est_par_defaut BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_taux_per_tenant UNIQUE (tenant_id, nom_taux)
);

-- 2. Table obligations_fiscales - Calendrier des obligations
CREATE TABLE IF NOT EXISTS public.obligations_fiscales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  type_obligation TEXT NOT NULL,
  frequence TEXT NOT NULL CHECK (frequence IN ('Mensuel', 'Trimestriel', 'Annuel')),
  prochaine_echeance DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Planifié', 'Traité', 'En retard')),
  rappel_email BOOLEAN NOT NULL DEFAULT false,
  rappel_jours_avant INTEGER DEFAULT 7,
  description TEXT,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Table conformite_fiscale - Points de contrôle de conformité
CREATE TABLE IF NOT EXISTS public.conformite_fiscale (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  element_controle TEXT NOT NULL,
  statut_conformite TEXT NOT NULL DEFAULT 'En cours' CHECK (statut_conformite IN ('Conforme', 'En cours', 'À améliorer', 'Non conforme')),
  score_conformite INTEGER DEFAULT 0 CHECK (score_conformite BETWEEN 0 AND 100),
  derniere_verification DATE,
  prochaine_verification DATE,
  description TEXT,
  recommandations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Table parametres_fiscaux - Configuration fiscale globale
CREATE TABLE IF NOT EXISTS public.parametres_fiscaux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  regime_tva TEXT NOT NULL DEFAULT 'Normal' CHECK (regime_tva IN ('Normal', 'Simplifié', 'Franchise')),
  frequence_declaration TEXT NOT NULL DEFAULT 'Mensuelle' CHECK (frequence_declaration IN ('Mensuelle', 'Trimestrielle', 'Annuelle')),
  numero_tva TEXT,
  email_alertes TEXT,
  alerte_echeances BOOLEAN NOT NULL DEFAULT true,
  alerte_seuil_tva BOOLEAN NOT NULL DEFAULT false,
  alerte_reglementations BOOLEAN NOT NULL DEFAULT false,
  rapport_mensuel_auto BOOLEAN NOT NULL DEFAULT false,
  jours_alerte_avant_echeance INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_parametres_per_tenant UNIQUE (tenant_id)
);

-- 5. Table archives_fiscales - Archivage des documents
CREATE TABLE IF NOT EXISTS public.archives_fiscales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  type_document TEXT NOT NULL CHECK (type_document IN ('Déclaration TVA', 'Facture', 'Pièce justificative', 'Rapport')),
  reference_document TEXT NOT NULL,
  periode DATE NOT NULL,
  fichier_url TEXT,
  taille_fichier_ko INTEGER DEFAULT 0,
  statut_archivage TEXT NOT NULL DEFAULT 'Archivé' CHECK (statut_archivage IN ('Archivé', 'En cours', 'Expiré')),
  date_archivage DATE NOT NULL DEFAULT CURRENT_DATE,
  date_expiration DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_taux_tva_tenant ON public.taux_tva (tenant_id);
CREATE INDEX IF NOT EXISTS idx_taux_tva_actif ON public.taux_tva (tenant_id, est_actif);

CREATE INDEX IF NOT EXISTS idx_obligations_tenant ON public.obligations_fiscales (tenant_id);
CREATE INDEX IF NOT EXISTS idx_obligations_echeance ON public.obligations_fiscales (tenant_id, prochaine_echeance);
CREATE INDEX IF NOT EXISTS idx_obligations_statut ON public.obligations_fiscales (tenant_id, statut);

CREATE INDEX IF NOT EXISTS idx_conformite_tenant ON public.conformite_fiscale (tenant_id);
CREATE INDEX IF NOT EXISTS idx_conformite_statut ON public.conformite_fiscale (tenant_id, statut_conformite);

CREATE INDEX IF NOT EXISTS idx_archives_tenant ON public.archives_fiscales (tenant_id);
CREATE INDEX IF NOT EXISTS idx_archives_periode ON public.archives_fiscales (tenant_id, periode);
CREATE INDEX IF NOT EXISTS idx_archives_type ON public.archives_fiscales (tenant_id, type_document);

-- Enable RLS
ALTER TABLE public.taux_tva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligations_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conformite_fiscale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_fiscaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archives_fiscales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage taux_tva in their tenant"
  ON public.taux_tva FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage obligations in their tenant"
  ON public.obligations_fiscales FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage conformite in their tenant"
  ON public.conformite_fiscale FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage parametres in their tenant"
  ON public.parametres_fiscaux FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage archives in their tenant"
  ON public.archives_fiscales FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Triggers pour updated_at
CREATE TRIGGER update_taux_tva_updated_at
  BEFORE UPDATE ON public.taux_tva
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON public.obligations_fiscales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conformite_updated_at
  BEFORE UPDATE ON public.conformite_fiscale
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at
  BEFORE UPDATE ON public.parametres_fiscaux
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_archives_updated_at
  BEFORE UPDATE ON public.archives_fiscales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();