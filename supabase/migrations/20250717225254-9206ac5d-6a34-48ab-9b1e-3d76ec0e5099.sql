-- ========================================
-- CORRECTION DE LA MIGRATION ET IMPLEMENTATION COMPLETE
-- ========================================

-- 1. CREATION DES TABLES MANQUANTES POUR ROLES ET PERMISSIONS

-- Table des permissions (sans contrainte check pour categorie)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_permission TEXT NOT NULL UNIQUE,
    nom_permission TEXT NOT NULL,
    description TEXT,
    categorie TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des rôles  
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_role TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table de liaison roles-permissions
CREATE TABLE IF NOT EXISTS public.roles_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    accorde BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- Table des alertes de sécurité
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    alert_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des sessions utilisateurs
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    personnel_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des incidents de sécurité
CREATE TABLE IF NOT EXISTS public.security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
    assigned_to UUID REFERENCES public.personnel(id),
    reporter_id UUID REFERENCES public.personnel(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. INSERTION DES DONNÉES INITIALES

-- Permissions de base
INSERT INTO public.permissions (code_permission, nom_permission, description, categorie) VALUES
-- Utilisateurs
('users.view', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'users'),
('users.create', 'Créer des utilisateurs', 'Ajouter de nouveaux utilisateurs', 'users'), 
('users.edit', 'Modifier les utilisateurs', 'Modifier les informations des utilisateurs', 'users'),
('users.delete', 'Supprimer des utilisateurs', 'Supprimer des utilisateurs', 'users'),
-- Stock
('stock.view', 'Voir le stock', 'Consulter les informations de stock', 'stock'),
('stock.manage', 'Gérer le stock', 'Modifier les quantités et produits en stock', 'stock'),
-- Ventes
('sales.view', 'Voir les ventes', 'Consulter les transactions de vente', 'sales'),
('sales.create', 'Créer des ventes', 'Effectuer des ventes', 'sales'),
-- Administration
('admin.full', 'Administration complète', 'Accès complet à toutes les fonctionnalités', 'admin'),
('admin.config', 'Configuration système', 'Modifier les paramètres système', 'admin'),
-- Sécurité
('security.view', 'Voir la sécurité', 'Consulter les paramètres de sécurité', 'security'),
('security.manage', 'Gérer la sécurité', 'Modifier les paramètres de sécurité', 'security')
ON CONFLICT (code_permission) DO NOTHING;

-- Rôles de base
INSERT INTO public.roles (nom_role, description) VALUES
('Admin', 'Administrateur avec accès complet'),
('Pharmacien', 'Pharmacien principal avec accès étendu'),
('Gestionnaire de stock', 'Responsable de la gestion des stocks'),
('Vendeur', 'Personnel de vente'),
('Employé', 'Employé de base')
ON CONFLICT DO NOTHING;

-- 3. ACTIVATION DE RLS ET POLITIQUES DE SÉCURITÉ

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- Politiques pour permissions (lecture seule pour tous les utilisateurs authentifiés)
DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions;
CREATE POLICY "Users can view permissions" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politiques pour roles (lecture seule pour tous les utilisateurs authentifiés)
DROP POLICY IF EXISTS "Users can view roles" ON public.roles;
CREATE POLICY "Users can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politiques pour roles_permissions (lecture pour tous, écriture pour admins)
DROP POLICY IF EXISTS "Users can view role permissions" ON public.roles_permissions;
CREATE POLICY "Users can view role permissions" ON public.roles_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.roles_permissions;
CREATE POLICY "Admins can manage role permissions" ON public.roles_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.personnel 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('Admin', 'Pharmacien')
        )
    );

-- Politiques pour security_alerts
DROP POLICY IF EXISTS "Users can view security alerts from their tenant" ON public.security_alerts;
CREATE POLICY "Users can view security alerts from their tenant" ON public.security_alerts
    FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage security alerts in their tenant" ON public.security_alerts;
CREATE POLICY "Admins can manage security alerts in their tenant" ON public.security_alerts
    FOR ALL USING (
        tenant_id = public.get_current_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM public.personnel 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('Admin', 'Pharmacien')
        )
    );

-- Politiques pour user_sessions
DROP POLICY IF EXISTS "Users can view sessions from their tenant" ON public.user_sessions;
CREATE POLICY "Users can view sessions from their tenant" ON public.user_sessions
    FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (
        tenant_id = public.get_current_user_tenant_id() AND
        personnel_id = (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid())
    );

-- Politiques pour security_incidents
DROP POLICY IF EXISTS "Users can view security incidents from their tenant" ON public.security_incidents;
CREATE POLICY "Users can view security incidents from their tenant" ON public.security_incidents
    FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can create security incidents in their tenant" ON public.security_incidents;
CREATE POLICY "Users can create security incidents in their tenant" ON public.security_incidents
    FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage security incidents in their tenant" ON public.security_incidents;
CREATE POLICY "Admins can manage security incidents in their tenant" ON public.security_incidents
    FOR ALL USING (
        tenant_id = public.get_current_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM public.personnel 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('Admin', 'Pharmacien')
        )
    );

-- 4. TRIGGERS POUR UPDATED_AT
DROP TRIGGER IF EXISTS update_permissions_updated_at ON public.permissions;
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_permissions_updated_at ON public.roles_permissions;
CREATE TRIGGER update_roles_permissions_updated_at
    BEFORE UPDATE ON public.roles_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_security_alerts_updated_at ON public.security_alerts;
CREATE TRIGGER update_security_alerts_updated_at
    BEFORE UPDATE ON public.security_alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON public.user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_security_incidents_updated_at ON public.security_incidents;
CREATE TRIGGER update_security_incidents_updated_at
    BEFORE UPDATE ON public.security_incidents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();