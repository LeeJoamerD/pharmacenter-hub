-- ============================================================================
-- RESTAURATION: security_incidents et incident_comments
-- Inspiré de la structure de security_alerts (migrations backup)
-- ============================================================================

-- Table security_incidents (structure similaire à security_alerts)
CREATE TABLE IF NOT EXISTS public.security_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'investigating', 'resolved', 'closed')),
    incident_type TEXT NOT NULL DEFAULT 'security_breach',
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_security_incidents_tenant_id ON public.security_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON public.security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON public.security_incidents(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER set_security_incidents_updated_at
    BEFORE UPDATE ON public.security_incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Table incident_comments
CREATE TABLE IF NOT EXISTS public.incident_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES public.security_incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON public.incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_tenant_id ON public.incident_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_created_at ON public.incident_comments(created_at ASC);

-- ============================================================================
-- RLS POLICIES (pattern identique à security_alerts)
-- ============================================================================

-- Activer RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- Policies pour security_incidents (pattern security_alerts)
CREATE POLICY "tenant_select_security_incidents"
ON public.security_incidents
FOR SELECT
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "tenant_insert_security_incidents"
ON public.security_incidents
FOR INSERT
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "admin_update_security_incidents"
ON public.security_incidents
FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant_id() 
    AND public.is_system_admin()
);

CREATE POLICY "admin_delete_security_incidents"
ON public.security_incidents
FOR DELETE
USING (
    tenant_id = public.get_current_user_tenant_id() 
    AND public.is_system_admin()
);

-- Policies pour incident_comments
CREATE POLICY "tenant_select_incident_comments"
ON public.incident_comments
FOR SELECT
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "tenant_insert_incident_comments"
ON public.incident_comments
FOR INSERT
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "user_update_own_comments"
ON public.incident_comments
FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant_id()
    AND user_id IN (
        SELECT id FROM public.personnel WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "admin_delete_comments"
ON public.incident_comments
FOR DELETE
USING (
    tenant_id = public.get_current_user_tenant_id()
    AND (
        user_id IN (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid())
        OR public.is_system_admin()
    )
);

-- ============================================================================
-- REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_incidents;
ALTER TABLE public.security_incidents REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_comments;
ALTER TABLE public.incident_comments REPLICA IDENTITY FULL;