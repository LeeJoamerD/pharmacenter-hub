-- Créer la table des formations employés
CREATE TABLE public.formations_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  organisme TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  duree INTEGER NOT NULL DEFAULT 1,
  lieu TEXT NOT NULL,
  cout NUMERIC(10,2),
  certificat_requis BOOLEAN NOT NULL DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'Planifié',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.formations_employes ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view trainings from their tenant" 
ON public.formations_employes 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert trainings in their tenant" 
ON public.formations_employes 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update trainings from their tenant" 
ON public.formations_employes 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete trainings from their tenant" 
ON public.formations_employes 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer le trigger pour updated_at
CREATE TRIGGER update_formations_employes_updated_at
BEFORE UPDATE ON public.formations_employes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();