-- Créer les tables manquantes pour le système de sécurité (sans user_sessions qui existe déjà)

-- Table pour les incidents de sécurité
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  incident_type TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  affected_systems TEXT[],
  impact_level TEXT DEFAULT 'low'
);

-- Table pour les commentaires d'incidents
CREATE TABLE public.incident_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.security_incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL
);

-- Mise à jour de la contrainte pour security_alerts
ALTER TABLE public.security_alerts 
DROP CONSTRAINT IF EXISTS security_alerts_severity_check;

ALTER TABLE public.security_alerts 
ADD CONSTRAINT security_alerts_severity_check 
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Index pour les performances
CREATE INDEX idx_security_incidents_tenant_id ON public.security_incidents(tenant_id);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_incident_comments_incident_id ON public.incident_comments(incident_id);

-- Activer RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour security_incidents
CREATE POLICY "Users can view incidents from their tenant" 
ON public.security_incidents FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage incidents in their tenant" 
ON public.security_incidents FOR ALL 
USING (tenant_id = get_current_user_tenant_id() AND 
       EXISTS (SELECT 1 FROM personnel 
               WHERE auth_user_id = auth.uid() 
               AND role IN ('Admin', 'Pharmacien')));

-- Politiques RLS pour incident_comments
CREATE POLICY "Users can view comments from their tenant" 
ON public.incident_comments FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert comments in their tenant" 
ON public.incident_comments FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger pour updated_at
CREATE TRIGGER update_security_incidents_updated_at
BEFORE UPDATE ON public.security_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();