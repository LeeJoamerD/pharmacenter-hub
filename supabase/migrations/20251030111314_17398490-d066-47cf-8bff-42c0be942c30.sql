-- ============================================================================
-- MIGRATION: Restauration des tables manquantes pour la section Approvisionnement
-- Tables: transporteurs, suivi_commandes, evaluations_fournisseurs
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer la table transporteurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transporteurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  contact_principal TEXT,
  zone_couverture TEXT[],
  tarif_base NUMERIC(10,2),
  tarif_par_km NUMERIC(10,2),
  delai_livraison_standard INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transporteurs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view transporters from their tenant" 
ON public.transporteurs FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert transporters in their tenant" 
ON public.transporteurs FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update transporters from their tenant" 
ON public.transporteurs FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete transporters from their tenant" 
ON public.transporteurs FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transporteurs_tenant_id ON public.transporteurs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transporteurs_zone_couverture ON public.transporteurs USING GIN(zone_couverture);

-- Trigger
CREATE TRIGGER update_transporteurs_updated_at
  BEFORE UPDATE ON public.transporteurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ÉTAPE 2: Créer la table suivi_commandes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suivi_commandes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  commande_id UUID NOT NULL REFERENCES public.commandes_fournisseurs(id) ON DELETE CASCADE,
  statut TEXT NOT NULL CHECK (statut IN ('En cours', 'Confirmé', 'Expédié', 'En transit', 'Livré', 'Annulé')),
  date_changement TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  commentaire TEXT,
  agent_id UUID,
  transporteur_id UUID REFERENCES public.transporteurs(id),
  numero_suivi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suivi_commandes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view order tracking from their tenant" 
ON public.suivi_commandes FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert order tracking in their tenant" 
ON public.suivi_commandes FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update order tracking from their tenant" 
ON public.suivi_commandes FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete order tracking from their tenant" 
ON public.suivi_commandes FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suivi_commandes_tenant_id ON public.suivi_commandes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suivi_commandes_commande_id ON public.suivi_commandes(commande_id);

-- Trigger
CREATE TRIGGER update_suivi_commandes_updated_at
  BEFORE UPDATE ON public.suivi_commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ÉTAPE 3: Créer la table evaluations_fournisseurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evaluations_fournisseurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
  commande_id UUID REFERENCES public.commandes_fournisseurs(id),
  evaluateur_id UUID,
  note_qualite INTEGER CHECK (note_qualite >= 1 AND note_qualite <= 5),
  note_delai INTEGER CHECK (note_delai >= 1 AND note_delai <= 5),
  note_service INTEGER CHECK (note_service >= 1 AND note_service <= 5),
  note_prix INTEGER CHECK (note_prix >= 1 AND note_prix <= 5),
  note_globale NUMERIC(3,2) GENERATED ALWAYS AS (
    (note_qualite + note_delai + note_service + note_prix)::NUMERIC / 4
  ) STORED,
  commentaires TEXT,
  recommande BOOLEAN DEFAULT true,
  date_evaluation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluations_fournisseurs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view supplier evaluations from their tenant" 
ON public.evaluations_fournisseurs FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier evaluations in their tenant" 
ON public.evaluations_fournisseurs FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier evaluations from their tenant" 
ON public.evaluations_fournisseurs FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier evaluations from their tenant" 
ON public.evaluations_fournisseurs FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_fournisseurs_tenant_id ON public.evaluations_fournisseurs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_fournisseurs_fournisseur_id ON public.evaluations_fournisseurs(fournisseur_id);

-- Trigger
CREATE TRIGGER update_evaluations_fournisseurs_updated_at
  BEFORE UPDATE ON public.evaluations_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();