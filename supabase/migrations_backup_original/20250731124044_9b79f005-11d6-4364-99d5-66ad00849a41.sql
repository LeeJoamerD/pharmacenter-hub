-- Création de la table produits pour le référentiel
CREATE TABLE IF NOT EXISTS public.produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  famille_id UUID,
  rayon_id UUID,
  dci_id UUID,
  categorie_tarification_id UUID,
  libelle_produit TEXT NOT NULL,
  description TEXT,
  code_produit TEXT,
  code_barre TEXT,
  prix_achat NUMERIC(10,2) DEFAULT 0.00,
  prix_vente NUMERIC(10,2) DEFAULT 0.00,
  stock_limite INTEGER DEFAULT 0,
  stock_actuel INTEGER DEFAULT 0,
  unite_mesure TEXT DEFAULT 'Unité',
  laboratoire TEXT,
  forme_pharmaceutique TEXT,
  dosage TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view products from their tenant" 
ON public.produits 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert products in their tenant" 
ON public.produits 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update products from their tenant" 
ON public.produits 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete products from their tenant" 
ON public.produits 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Create table for rayons if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rayons_produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_rayon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for rayons
ALTER TABLE public.rayons_produits ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_produits_tenant_id ON public.produits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produits_famille_id ON public.produits(famille_id);
CREATE INDEX IF NOT EXISTS idx_produits_rayon_id ON public.produits(rayon_id);
CREATE INDEX IF NOT EXISTS idx_produits_dci_id ON public.produits(dci_id);
CREATE INDEX IF NOT EXISTS idx_rayons_tenant_id ON public.rayons_produits(tenant_id);

-- Create trigger for updated_at
CREATE TRIGGER update_produits_updated_at
BEFORE UPDATE ON public.produits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rayons_updated_at
BEFORE UPDATE ON public.rayons_produits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();