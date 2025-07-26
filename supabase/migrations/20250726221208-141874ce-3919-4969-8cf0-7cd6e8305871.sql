-- Créer la table formations_employes
CREATE TABLE public.formations_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  organisme TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  duree INTEGER NOT NULL, -- en heures
  lieu TEXT NOT NULL,
  cout NUMERIC DEFAULT 0,
  certificat_requis BOOLEAN NOT NULL DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'Planifié' CHECK (statut IN ('Planifié', 'En cours', 'Terminé', 'Annulé')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table planning_employes
CREATE TABLE public.planning_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employe_id UUID NOT NULL,
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

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.formations_employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_employes ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour formations_employes
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

-- Créer les politiques RLS pour planning_employes
CREATE POLICY "Users can view schedules from their tenant" 
ON public.planning_employes 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert schedules in their tenant" 
ON public.planning_employes 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update schedules from their tenant" 
ON public.planning_employes 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete schedules from their tenant" 
ON public.planning_employes 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les triggers pour updated_at
CREATE TRIGGER update_formations_employes_updated_at
BEFORE UPDATE ON public.formations_employes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_employes_updated_at
BEFORE UPDATE ON public.planning_employes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter les triggers d'audit
CREATE TRIGGER audit_formations_employes
AFTER INSERT OR UPDATE OR DELETE ON public.formations_employes
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_planning_employes
AFTER INSERT OR UPDATE OR DELETE ON public.planning_employes
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_trail();

-- Ajouter les triggers de sécurité cross-tenant
CREATE TRIGGER trigger_cross_tenant_security_formations_employes
BEFORE INSERT OR UPDATE OR DELETE ON public.formations_employes
FOR EACH ROW EXECUTE FUNCTION public.log_cross_tenant_attempt();

CREATE TRIGGER trigger_cross_tenant_security_planning_employes
BEFORE INSERT OR UPDATE OR DELETE ON public.planning_employes
FOR EACH ROW EXECUTE FUNCTION public.log_cross_tenant_attempt();