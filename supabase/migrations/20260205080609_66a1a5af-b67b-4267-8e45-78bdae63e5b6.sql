-- =====================================================
-- MIGRATION: Section Réglementaire - Tables Complètes
-- =====================================================

-- 1. Ajouter les champs stupéfiants sur la table produits
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS is_stupefiant BOOLEAN DEFAULT false;

ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS is_controlled_substance BOOLEAN DEFAULT false;

-- Index pour recherche rapide des stupéfiants
CREATE INDEX IF NOT EXISTS idx_produits_stupefiant 
ON public.produits(tenant_id, is_stupefiant) 
WHERE is_stupefiant = true;

-- 2. Table Pharmacovigilance - Déclarations d'effets indésirables
CREATE TABLE IF NOT EXISTS public.pharmacovigilance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  patient_age INTEGER,
  patient_gender TEXT CHECK (patient_gender IN ('M', 'F', 'Autre')),
  effet_indesirable TEXT NOT NULL,
  gravite TEXT NOT NULL CHECK (gravite IN ('mineure', 'moderee', 'grave', 'fatale')),
  date_survenue DATE NOT NULL,
  date_declaration DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'declare_ansm', 'clos', 'suivi')),
  suivi_requis BOOLEAN DEFAULT false,
  notes TEXT,
  declared_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  ansm_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour pharmacovigilance
CREATE INDEX IF NOT EXISTS idx_pharmacovigilance_tenant ON public.pharmacovigilance_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmacovigilance_date ON public.pharmacovigilance_reports(tenant_id, date_declaration DESC);
CREATE INDEX IF NOT EXISTS idx_pharmacovigilance_statut ON public.pharmacovigilance_reports(tenant_id, statut);

-- RLS pour pharmacovigilance
ALTER TABLE public.pharmacovigilance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation pharmacovigilance" ON public.pharmacovigilance_reports;
CREATE POLICY "Tenant isolation pharmacovigilance"
ON public.pharmacovigilance_reports FOR ALL
USING (tenant_id IN (
  SELECT p.tenant_id FROM personnel p WHERE p.auth_user_id = auth.uid()
));

-- 3. Table Registre Stupéfiants (Mouvements)
CREATE TABLE IF NOT EXISTS public.narcotics_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement', 'destruction')),
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  stock_avant INTEGER NOT NULL DEFAULT 0,
  stock_apres INTEGER NOT NULL DEFAULT 0,
  ordonnance_reference TEXT,
  prescripteur TEXT,
  patient_reference TEXT,
  agent_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  verification_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour narcotics registry
CREATE INDEX IF NOT EXISTS idx_narcotics_registry_tenant ON public.narcotics_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_narcotics_registry_produit ON public.narcotics_registry(tenant_id, produit_id);
CREATE INDEX IF NOT EXISTS idx_narcotics_registry_date ON public.narcotics_registry(tenant_id, created_at DESC);

-- RLS pour narcotics registry
ALTER TABLE public.narcotics_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation narcotics" ON public.narcotics_registry;
CREATE POLICY "Tenant isolation narcotics"
ON public.narcotics_registry FOR ALL
USING (tenant_id IN (
  SELECT p.tenant_id FROM personnel p WHERE p.auth_user_id = auth.uid()
));

-- 4. Table Rapports Obligatoires
CREATE TABLE IF NOT EXISTS public.mandatory_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type_rapport TEXT NOT NULL,
  frequence TEXT NOT NULL CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel', 'trimestriel', 'annuel', 'immediat')),
  autorite_destinataire TEXT NOT NULL,
  prochaine_echeance DATE NOT NULL,
  derniere_soumission DATE,
  statut TEXT NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'urgent', 'complete', 'en_retard')),
  responsable_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
  contenu JSONB DEFAULT '{}',
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour mandatory reports
CREATE INDEX IF NOT EXISTS idx_mandatory_reports_tenant ON public.mandatory_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mandatory_reports_echeance ON public.mandatory_reports(tenant_id, prochaine_echeance);
CREATE INDEX IF NOT EXISTS idx_mandatory_reports_statut ON public.mandatory_reports(tenant_id, statut);

-- RLS pour mandatory reports
ALTER TABLE public.mandatory_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation mandatory_reports" ON public.mandatory_reports;
CREATE POLICY "Tenant isolation mandatory_reports"
ON public.mandatory_reports FOR ALL
USING (tenant_id IN (
  SELECT p.tenant_id FROM personnel p WHERE p.auth_user_id = auth.uid()
));

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_regulatory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pharmacovigilance_updated_at ON public.pharmacovigilance_reports;
CREATE TRIGGER update_pharmacovigilance_updated_at
  BEFORE UPDATE ON public.pharmacovigilance_reports
  FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at();

DROP TRIGGER IF EXISTS update_mandatory_reports_updated_at ON public.mandatory_reports;
CREATE TRIGGER update_mandatory_reports_updated_at
  BEFORE UPDATE ON public.mandatory_reports
  FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at();