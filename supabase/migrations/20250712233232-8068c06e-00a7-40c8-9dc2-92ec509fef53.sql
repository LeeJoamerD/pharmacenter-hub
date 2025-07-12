-- Étape 6 : Tables paramètres et configuration (corrigée)
-- Gestion des paramètres système et permissions

-- Table des paramètres système
CREATE TABLE public.parametres_systeme (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    cle_parametre TEXT NOT NULL,
    valeur_parametre TEXT,
    type_parametre TEXT NOT NULL CHECK (type_parametre IN ('string', 'number', 'boolean', 'json')),
    categorie TEXT NOT NULL CHECK (categorie IN ('general', 'security', 'interface', 'business', 'backup', 'print', 'maintenance')),
    description TEXT,
    valeur_defaut TEXT,
    is_modifiable BOOLEAN NOT NULL DEFAULT true,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_parametre_per_tenant UNIQUE (tenant_id, cle_parametre)
);

-- Table des permissions disponibles (globale, sans tenant_id)
CREATE TABLE public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code_permission TEXT NOT NULL UNIQUE,
    nom_permission TEXT NOT NULL,
    description TEXT,
    categorie TEXT NOT NULL CHECK (categorie IN ('users', 'pharmacy', 'stock', 'sales', 'accounting', 'reports', 'settings', 'network')),
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des rôles
CREATE TABLE public.roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nom_role TEXT NOT NULL,
    description TEXT,
    niveau_hierarchique INTEGER NOT NULL DEFAULT 1,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_role_per_tenant UNIQUE (tenant_id, nom_role),
    CONSTRAINT positive_niveau CHECK (niveau_hierarchique > 0)
);

-- Table de liaison rôles-permissions
CREATE TABLE public.roles_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    accorde BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_role_permission_per_tenant UNIQUE (tenant_id, role_id, permission_id)
);

-- Table des préférences utilisateur
CREATE TABLE public.preferences_utilisateur (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    cle_preference TEXT NOT NULL,
    valeur_preference TEXT,
    type_preference TEXT NOT NULL CHECK (type_preference IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_preference_per_user UNIQUE (tenant_id, personnel_id, cle_preference)
);

-- Table des journaux de configuration
CREATE TABLE public.journaux_configuration (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    personnel_id UUID REFERENCES public.personnel(id),
    type_changement TEXT NOT NULL CHECK (type_changement IN ('parametre', 'permission', 'role', 'preference')),
    table_affectee TEXT NOT NULL,
    enregistrement_id UUID NOT NULL,
    ancienne_valeur JSONB,
    nouvelle_valeur JSONB,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_parametres_systeme_tenant_id ON public.parametres_systeme(tenant_id);
CREATE INDEX idx_parametres_systeme_categorie ON public.parametres_systeme(tenant_id, categorie);
CREATE INDEX idx_parametres_systeme_cle ON public.parametres_systeme(tenant_id, cle_parametre);

CREATE INDEX idx_permissions_categorie ON public.permissions(categorie);
CREATE INDEX idx_permissions_code ON public.permissions(code_permission);

CREATE INDEX idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX idx_roles_niveau ON public.roles(tenant_id, niveau_hierarchique);
CREATE INDEX idx_roles_active ON public.roles(tenant_id, is_active);

CREATE INDEX idx_roles_permissions_tenant_id ON public.roles_permissions(tenant_id);
CREATE INDEX idx_roles_permissions_role ON public.roles_permissions(role_id);
CREATE INDEX idx_roles_permissions_permission ON public.roles_permissions(permission_id);

CREATE INDEX idx_preferences_utilisateur_tenant_id ON public.preferences_utilisateur(tenant_id);
CREATE INDEX idx_preferences_utilisateur_personnel ON public.preferences_utilisateur(personnel_id);
CREATE INDEX idx_preferences_utilisateur_cle ON public.preferences_utilisateur(tenant_id, personnel_id, cle_preference);

CREATE INDEX idx_journaux_configuration_tenant_id ON public.journaux_configuration(tenant_id);
CREATE INDEX idx_journaux_configuration_type ON public.journaux_configuration(tenant_id, type_changement);
CREATE INDEX idx_journaux_configuration_date ON public.journaux_configuration(tenant_id, created_at);

-- Triggers pour updated_at
CREATE TRIGGER update_parametres_systeme_updated_at
    BEFORE UPDATE ON public.parametres_systeme
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_permissions_updated_at
    BEFORE UPDATE ON public.roles_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_utilisateur_updated_at
    BEFORE UPDATE ON public.preferences_utilisateur
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers d'audit (seulement pour les tables avec tenant_id)
CREATE TRIGGER parametres_systeme_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.parametres_systeme
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER roles_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.roles_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER preferences_utilisateur_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.preferences_utilisateur
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

-- Triggers de sécurité cross-tenant (seulement pour les tables avec tenant_id)
CREATE TRIGGER parametres_systeme_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.parametres_systeme
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER roles_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER roles_permissions_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.roles_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER preferences_utilisateur_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.preferences_utilisateur
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER journaux_configuration_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.journaux_configuration
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Activation du RLS
ALTER TABLE public.parametres_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences_utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journaux_configuration ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour parametres_systeme
CREATE POLICY "Users can view system parameters from their tenant" 
ON public.parametres_systeme 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can insert system parameters in their tenant" 
ON public.parametres_systeme 
FOR INSERT 
WITH CHECK (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

CREATE POLICY "Admins can update modifiable system parameters from their tenant" 
ON public.parametres_systeme 
FOR UPDATE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    is_modifiable = true AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

CREATE POLICY "Admins can delete system parameters from their tenant" 
ON public.parametres_systeme 
FOR DELETE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- Politiques RLS pour permissions (globales, visibles par tous)
CREATE POLICY "Anyone can view permissions" 
ON public.permissions 
FOR SELECT 
USING (true);

-- Politiques RLS pour roles
CREATE POLICY "Users can view roles from their tenant" 
ON public.roles 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can insert roles in their tenant" 
ON public.roles 
FOR INSERT 
WITH CHECK (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

CREATE POLICY "Admins can update roles from their tenant" 
ON public.roles 
FOR UPDATE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

CREATE POLICY "Admins can delete custom roles from their tenant" 
ON public.roles 
FOR DELETE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    is_system = false AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- Politiques RLS pour roles_permissions
CREATE POLICY "Users can view role permissions from their tenant" 
ON public.roles_permissions 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can insert role permissions in their tenant" 
ON public.roles_permissions 
FOR INSERT 
WITH CHECK (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

CREATE POLICY "Admins can update role permissions from their tenant" 
ON public.roles_permissions 
FOR UPDATE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

CREATE POLICY "Admins can delete role permissions from their tenant" 
ON public.roles_permissions 
FOR DELETE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- Politiques RLS pour preferences_utilisateur
CREATE POLICY "Users can view their own preferences" 
ON public.preferences_utilisateur 
FOR SELECT 
USING (
    tenant_id = get_current_user_tenant_id() AND
    personnel_id IN (
        SELECT id FROM public.personnel 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own preferences" 
ON public.preferences_utilisateur 
FOR INSERT 
WITH CHECK (
    tenant_id = get_current_user_tenant_id() AND
    personnel_id IN (
        SELECT id FROM public.personnel 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own preferences" 
ON public.preferences_utilisateur 
FOR UPDATE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    personnel_id IN (
        SELECT id FROM public.personnel 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own preferences" 
ON public.preferences_utilisateur 
FOR DELETE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    personnel_id IN (
        SELECT id FROM public.personnel 
        WHERE auth_user_id = auth.uid()
    )
);

-- Politiques RLS pour journaux_configuration
CREATE POLICY "Admins can view configuration logs from their tenant" 
ON public.journaux_configuration 
FOR SELECT 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Insertion des permissions par défaut
INSERT INTO public.permissions (code_permission, nom_permission, description, categorie, is_system) VALUES
-- Permissions utilisateurs
('USERS_VIEW', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'users', true),
('USERS_CREATE', 'Créer des utilisateurs', 'Ajouter de nouveaux utilisateurs', 'users', true),
('USERS_EDIT', 'Modifier les utilisateurs', 'Modifier les informations des utilisateurs', 'users', true),
('USERS_DELETE', 'Supprimer les utilisateurs', 'Supprimer des utilisateurs', 'users', true),
('USERS_MANAGE_ROLES', 'Gérer les rôles', 'Attribuer et modifier les rôles', 'users', true),

-- Permissions pharmacie
('PHARMACY_VIEW', 'Voir les informations pharmacie', 'Consulter les informations de la pharmacie', 'pharmacy', true),
('PHARMACY_EDIT', 'Modifier les informations pharmacie', 'Modifier les paramètres de la pharmacie', 'pharmacy', true),
('PHARMACY_SETTINGS', 'Gérer les paramètres', 'Accéder aux paramètres avancés', 'pharmacy', true),

-- Permissions stock
('STOCK_VIEW', 'Voir le stock', 'Consulter les niveaux de stock', 'stock', true),
('STOCK_MANAGE', 'Gérer le stock', 'Ajouter, modifier le stock', 'stock', true),
('STOCK_ORDERS', 'Gérer les commandes', 'Créer et gérer les commandes fournisseurs', 'stock', true),
('STOCK_INVENTORY', 'Faire des inventaires', 'Effectuer des inventaires de stock', 'stock', true),
('STOCK_ADJUSTMENTS', 'Ajustements de stock', 'Effectuer des ajustements de stock', 'stock', true),

-- Permissions ventes
('SALES_VIEW', 'Voir les ventes', 'Consulter l''historique des ventes', 'sales', true),
('SALES_CREATE', 'Créer des ventes', 'Effectuer des ventes', 'sales', true),
('SALES_CANCEL', 'Annuler des ventes', 'Annuler des transactions de vente', 'sales', true),
('SALES_DISCOUNT', 'Appliquer des remises', 'Appliquer des remises manuelles', 'sales', true),
('SALES_REFUND', 'Effectuer des remboursements', 'Gérer les retours et remboursements', 'sales', true),

-- Permissions caisse
('CASH_REGISTER_OPEN', 'Ouvrir la caisse', 'Ouvrir une session de caisse', 'sales', true),
('CASH_REGISTER_CLOSE', 'Fermer la caisse', 'Fermer une session de caisse', 'sales', true),
('CASH_MOVEMENTS', 'Mouvements de caisse', 'Gérer les entrées/sorties de caisse', 'sales', true),

-- Permissions comptabilité
('ACCOUNTING_VIEW', 'Voir la comptabilité', 'Consulter les données comptables', 'accounting', true),
('ACCOUNTING_MANAGE', 'Gérer la comptabilité', 'Gérer les écritures comptables', 'accounting', true),
('ACCOUNTING_REPORTS', 'Rapports comptables', 'Générer des rapports comptables', 'accounting', true),

-- Permissions rapports
('REPORTS_VIEW', 'Voir les rapports', 'Consulter les rapports', 'reports', true),
('REPORTS_EXPORT', 'Exporter les rapports', 'Exporter des rapports', 'reports', true),
('REPORTS_ADVANCED', 'Rapports avancés', 'Accéder aux rapports avancés', 'reports', true),

-- Permissions paramètres
('SETTINGS_VIEW', 'Voir les paramètres', 'Consulter les paramètres système', 'settings', true),
('SETTINGS_EDIT', 'Modifier les paramètres', 'Modifier les paramètres système', 'settings', true),
('SETTINGS_BACKUP', 'Gérer les sauvegardes', 'Configurer et gérer les sauvegardes', 'settings', true),
('SETTINGS_SECURITY', 'Paramètres de sécurité', 'Gérer les paramètres de sécurité', 'settings', true),

-- Permissions réseau
('NETWORK_VIEW', 'Voir le réseau', 'Consulter les informations réseau', 'network', true),
('NETWORK_MANAGE', 'Gérer le réseau', 'Gérer les connexions réseau', 'network', true),
('NETWORK_ADMIN', 'Administration réseau', 'Administration avancée du réseau', 'network', true);