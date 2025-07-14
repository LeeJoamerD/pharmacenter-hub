-- Créer les tables manquantes pour le système de sécurité

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

-- Table pour les sessions utilisateurs
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les alertes de sécurité (mise à jour pour correspondre aux types)
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
CREATE INDEX idx_user_sessions_personnel_id ON public.user_sessions(personnel_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;

-- Activer RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

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

-- Politiques RLS pour user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions FOR SELECT 
USING (tenant_id = get_current_user_tenant_id() AND 
       personnel_id = (SELECT id FROM personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their own sessions" 
ON public.user_sessions FOR ALL 
USING (tenant_id = get_current_user_tenant_id() AND 
       personnel_id = (SELECT id FROM personnel WHERE auth_user_id = auth.uid()));

-- Triggers pour updated_at
CREATE TRIGGER update_security_incidents_updated_at
BEFORE UPDATE ON public.security_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();