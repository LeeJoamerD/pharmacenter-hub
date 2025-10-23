-- Création de la table rayons_produits
CREATE TABLE public.rayons_produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_rayon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création de la table dci (Dénominations Communes Internationales)
CREATE TABLE public.dci (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_dci TEXT NOT NULL,
  description TEXT,
  classe_therapeutique TEXT,
  contre_indications TEXT,
  effets_secondaires TEXT,
  posologie TEXT,
  produits_associes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création de la table reglementations
CREATE TABLE public.reglementations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_reglementation TEXT NOT NULL,
  type_reglementation TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Actif',
  description TEXT,
  date_application DATE NOT NULL,
  date_expiration DATE,
  autorite_competente TEXT NOT NULL,
  reference_legale TEXT NOT NULL,
  niveau_restriction TEXT NOT NULL DEFAULT 'Faible',
  produits_concernes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur toutes les tables
ALTER TABLE public.rayons_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglementations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rayons_produits
CREATE POLICY "Users can view rayons from their tenant" 
ON public.rayons_produits 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert rayons in their tenant" 
ON public.rayons_produits 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update rayons from their tenant" 
ON public.rayons_produits 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete rayons from their tenant" 
ON public.rayons_produits 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour dci
CREATE POLICY "Users can view dci from their tenant" 
ON public.dci 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert dci in their tenant" 
ON public.dci 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update dci from their tenant" 
ON public.dci 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete dci from their tenant" 
ON public.dci 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour reglementations
CREATE POLICY "Users can view regulations from their tenant" 
ON public.reglementations 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert regulations in their tenant" 
ON public.reglementations 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update regulations from their tenant" 
ON public.reglementations 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete regulations from their tenant" 
ON public.reglementations 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Triggers pour les timestamps
CREATE TRIGGER update_rayons_produits_updated_at
BEFORE UPDATE ON public.rayons_produits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dci_updated_at
BEFORE UPDATE ON public.dci
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reglementations_updated_at
BEFORE UPDATE ON public.reglementations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();