-- Phase 4: Sécurité Multi-Tenant - Audit Trail et Protection Cross-Tenant

-- Table d'audit pour tracer tous les accès
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE, LOGIN, LOGOUT
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success', -- success, failed, blocked
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des alertes de sécurité
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- cross_tenant_attempt, invalid_permissions, suspicious_activity
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Données de test pour le système
INSERT INTO public.pharmacies (name, code, address, city, region, pays, email, telephone_appel) VALUES
('Pharmacie Centrale', 'PC001', '123 Avenue Principale', 'Yaoundé', 'Centre', 'Cameroun', 'contact@pharmaciecentrale.cm', '+237123456789'),
('Pharmacie du Marché', 'PM002', '456 Rue du Commerce', 'Douala', 'Littoral', 'Cameroun', 'info@pharmaciemarche.cm', '+237987654321'),
('Pharmacie Santé Plus', 'PSP003', '789 Boulevard de la Santé', 'Bafoussam', 'Ouest', 'Cameroun', 'contact@santepius.cm', '+237456789123');

-- Fonction pour log automatique des opérations
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id UUID;
    current_user_id UUID;
    current_personnel_id UUID;
BEGIN
    -- Récupérer l'utilisateur actuel
    current_user_id := auth.uid();
    
    -- Récupérer le tenant et personnel actuel
    IF current_user_id IS NOT NULL THEN
        SELECT tenant_id, id INTO current_tenant_id, current_personnel_id
        FROM public.personnel 
        WHERE auth_user_id = current_user_id;
    END IF;
    
    -- Logger l'opération
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            tenant_id, user_id, personnel_id, action, table_name, record_id, old_values
        ) VALUES (
            COALESCE(current_tenant_id, OLD.tenant_id), 
            current_user_id, 
            current_personnel_id,
            'DELETE', 
            TG_TABLE_NAME, 
            OLD.id::text, 
            to_jsonb(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            tenant_id, user_id, personnel_id, action, table_name, record_id, old_values, new_values
        ) VALUES (
            COALESCE(current_tenant_id, NEW.tenant_id), 
            current_user_id, 
            current_personnel_id,
            'UPDATE', 
            TG_TABLE_NAME, 
            NEW.id::text, 
            to_jsonb(OLD), 
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            tenant_id, user_id, personnel_id, action, table_name, record_id, new_values
        ) VALUES (
            COALESCE(current_tenant_id, NEW.tenant_id), 
            current_user_id, 
            current_personnel_id,
            'INSERT', 
            TG_TABLE_NAME, 
            NEW.id::text, 
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer l'audit sur les tables sensibles
CREATE TRIGGER audit_personnel AFTER INSERT OR UPDATE OR DELETE ON public.personnel FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();
CREATE TRIGGER audit_pharmacies AFTER INSERT OR UPDATE OR DELETE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- Fonction pour détecter tentatives cross-tenant
CREATE OR REPLACE FUNCTION public.detect_cross_tenant_attempt()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Récupérer le tenant de l'utilisateur
    SELECT tenant_id INTO user_tenant_id
    FROM public.personnel 
    WHERE auth_user_id = current_user_id;
    
    -- Vérifier tentative cross-tenant
    IF user_tenant_id IS NOT NULL AND NEW.tenant_id != user_tenant_id THEN
        -- Logger l'alerte
        INSERT INTO public.security_alerts (
            tenant_id, user_id, alert_type, severity, description, metadata
        ) VALUES (
            user_tenant_id,
            current_user_id,
            'cross_tenant_attempt',
            'high',
            'Tentative d''accès cross-tenant détectée',
            jsonb_build_object(
                'attempted_tenant', NEW.tenant_id,
                'user_tenant', user_tenant_id,
                'table', TG_TABLE_NAME,
                'operation', TG_OP
            )
        );
        
        -- Bloquer l'opération
        RAISE EXCEPTION 'Accès cross-tenant interdit. Incident de sécurité signalé.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer la protection cross-tenant
CREATE TRIGGER protect_personnel BEFORE INSERT OR UPDATE ON public.personnel FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();
CREATE TRIGGER protect_network_channels BEFORE INSERT OR UPDATE ON public.network_channels FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();
CREATE TRIGGER protect_network_messages BEFORE INSERT OR UPDATE ON public.network_messages FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Indexes pour performance
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_security_alerts_tenant_id ON public.security_alerts(tenant_id);
CREATE INDEX idx_security_alerts_resolved ON public.security_alerts(resolved);

-- RLS sur les nouvelles tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs from their tenant" ON public.audit_logs FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY "Users can view security alerts from their tenant" ON public.security_alerts FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());