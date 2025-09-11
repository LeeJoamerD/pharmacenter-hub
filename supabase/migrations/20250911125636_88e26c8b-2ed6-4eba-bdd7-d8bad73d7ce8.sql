-- Recréer la table classes_therapeutiques complète
CREATE TABLE public.classes_therapeutiques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_classe TEXT NOT NULL,
  systeme_anatomique TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contrainte d'unicité par tenant
ALTER TABLE public.classes_therapeutiques 
ADD CONSTRAINT unique_classe_therapeutique_per_tenant 
UNIQUE (tenant_id, libelle_classe);

-- Index pour les performances
CREATE INDEX idx_classes_therapeutiques_tenant_libelle 
ON public.classes_therapeutiques (tenant_id, libelle_classe);

CREATE INDEX idx_classes_therapeutiques_systeme 
ON public.classes_therapeutiques (tenant_id, systeme_anatomique);

-- Activer RLS
ALTER TABLE public.classes_therapeutiques ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view therapeutic classes from their tenant" 
ON public.classes_therapeutiques 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert therapeutic classes in their tenant" 
ON public.classes_therapeutiques 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update therapeutic classes from their tenant" 
ON public.classes_therapeutiques 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete therapeutic classes from their tenant" 
ON public.classes_therapeutiques 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Trigger pour updated_at automatique
CREATE TRIGGER update_classes_therapeutiques_updated_at
BEFORE UPDATE ON public.classes_therapeutiques
FOR EACH ROW
EXECUTE FUNCTION public.update_classes_therapeutiques_updated_at();

-- Ajouter la contrainte de clé étrangère pour les produits
ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_classe_therapeutique 
FOREIGN KEY (classe_therapeutique_id) 
REFERENCES public.classes_therapeutiques (id) 
ON DELETE SET NULL;

-- Index pour les performances sur les produits
CREATE INDEX idx_produits_classe_therapeutique 
ON public.produits (tenant_id, classe_therapeutique_id);

-- Fonction de validation tenant
CREATE OR REPLACE FUNCTION public.validate_product_class_same_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Si classe_therapeutique_id n'est pas null, valider le même tenant
  IF NEW.classe_therapeutique_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.classes_therapeutiques 
      WHERE id = NEW.classe_therapeutique_id 
      AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'La classe thérapeutique doit appartenir au même tenant que le produit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider la cohérence des tenants
CREATE TRIGGER trigger_validate_product_class_tenant
BEFORE INSERT OR UPDATE ON public.produits
FOR EACH ROW 
EXECUTE FUNCTION public.validate_product_class_same_tenant();