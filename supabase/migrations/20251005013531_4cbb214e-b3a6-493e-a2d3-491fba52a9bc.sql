-- Table pour gérer les produits de substitution
CREATE TABLE IF NOT EXISTS public.produits_substituts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_principal_id UUID NOT NULL,
  produit_substitut_id UUID NOT NULL,
  priorite INTEGER DEFAULT 1,
  raison_substitution TEXT,
  efficacite_validee BOOLEAN DEFAULT false,
  date_derniere_utilisation TIMESTAMP WITH TIME ZONE,
  nombre_utilisations INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, produit_principal_id, produit_substitut_id)
);

-- Table pour logger les alertes aux fournisseurs
CREATE TABLE IF NOT EXISTS public.alertes_fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_id UUID NOT NULL,
  produits_ids UUID[] NOT NULL,
  type_alerte TEXT NOT NULL CHECK (type_alerte IN ('rupture_stock', 'delai_livraison', 'qualite_produit', 'urgence')),
  message TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'envoyee' CHECK (statut IN ('envoyee', 'vue', 'repondue', 'resolue')),
  canal_envoi TEXT NOT NULL DEFAULT 'email' CHECK (canal_envoi IN ('email', 'sms', 'telephone', 'plateforme')),
  metadata JSONB DEFAULT '{}'::jsonb,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_reponse TIMESTAMP WITH TIME ZONE,
  reponse_fournisseur TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_produits_substituts_principal ON public.produits_substituts(tenant_id, produit_principal_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_produits_substituts_substitut ON public.produits_substituts(tenant_id, produit_substitut_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alertes_fournisseurs_fournisseur ON public.alertes_fournisseurs(tenant_id, fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_alertes_fournisseurs_statut ON public.alertes_fournisseurs(tenant_id, statut);
CREATE INDEX IF NOT EXISTS idx_alertes_fournisseurs_date ON public.alertes_fournisseurs(tenant_id, date_envoi DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_produits_substituts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produits_substituts_updated_at
  BEFORE UPDATE ON public.produits_substituts
  FOR EACH ROW
  EXECUTE FUNCTION update_produits_substituts_updated_at();

CREATE OR REPLACE FUNCTION update_alertes_fournisseurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alertes_fournisseurs_updated_at
  BEFORE UPDATE ON public.alertes_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION update_alertes_fournisseurs_updated_at();

-- Enable RLS
ALTER TABLE public.produits_substituts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_fournisseurs ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour produits_substituts
CREATE POLICY "Users can view substitutes from their tenant"
  ON public.produits_substituts FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert substitutes in their tenant"
  ON public.produits_substituts FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update substitutes from their tenant"
  ON public.produits_substituts FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete substitutes from their tenant"
  ON public.produits_substituts FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies pour alertes_fournisseurs
CREATE POLICY "Users can view supplier alerts from their tenant"
  ON public.alertes_fournisseurs FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier alerts in their tenant"
  ON public.alertes_fournisseurs FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier alerts from their tenant"
  ON public.alertes_fournisseurs FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier alerts from their tenant"
  ON public.alertes_fournisseurs FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());