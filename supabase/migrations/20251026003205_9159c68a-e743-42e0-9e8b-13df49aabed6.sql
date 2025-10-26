-- ============================================================================
-- Migration: Restauration complète du système Rôles et Permissions
-- ============================================================================

-- Étape 1: Créer la table public.roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  nom_role TEXT NOT NULL,
  description TEXT,
  niveau_hierarchique INTEGER NOT NULL DEFAULT 99,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, nom_role)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(tenant_id, is_active) WHERE is_active = true;

COMMENT ON TABLE public.roles IS 'Rôles utilisateur multi-tenant avec hiérarchie';
COMMENT ON COLUMN public.roles.niveau_hierarchique IS 'Niveau hiérarchique: 1=Admin (le plus élevé), 99=Employé (le plus bas)';

-- Étape 2: Créer la table public.permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_permission TEXT NOT NULL UNIQUE,
  nom_permission TEXT NOT NULL,
  description TEXT,
  categorie TEXT NOT NULL DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(categorie);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code_permission);

COMMENT ON TABLE public.permissions IS 'Permissions système globales (non multi-tenant)';
COMMENT ON COLUMN public.permissions.code_permission IS 'Code unique de la permission (ex: users.read, sales.write)';

-- Étape 3: Créer la table public.roles_permissions
CREATE TABLE IF NOT EXISTS public.roles_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  accorde BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_permissions_tenant ON public.roles_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissions_role ON public.roles_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissions_permission ON public.roles_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissions_accorde ON public.roles_permissions(tenant_id, role_id) WHERE accorde = true;

COMMENT ON TABLE public.roles_permissions IS 'Association multi-tenant entre rôles et permissions';

-- Étape 4: Activer RLS sur les trois tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permissions ENABLE ROW LEVEL SECURITY;

-- Étape 5: Créer les RLS policies pour roles
DROP POLICY IF EXISTS "Admins can manage roles from their tenant" ON public.roles;
CREATE POLICY "Admins can manage roles from their tenant"
ON public.roles
FOR ALL
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can view roles from their tenant" ON public.roles;
CREATE POLICY "Users can view roles from their tenant"
ON public.roles
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Étape 5b: Créer les RLS policies pour permissions
DROP POLICY IF EXISTS "All authenticated users can view permissions" ON public.permissions;
CREATE POLICY "All authenticated users can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only system admins can modify permissions" ON public.permissions;
CREATE POLICY "Only system admins can modify permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (is_system_admin())
WITH CHECK (is_system_admin());

-- Étape 5c: Créer les RLS policies pour roles_permissions
DROP POLICY IF EXISTS "Users can view role permissions from their tenant" ON public.roles_permissions;
CREATE POLICY "Users can view role permissions from their tenant"
ON public.roles_permissions
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage role permissions from their tenant" ON public.roles_permissions;
CREATE POLICY "Admins can manage role permissions from their tenant"
ON public.roles_permissions
FOR ALL
TO authenticated
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Étape 6: Insérer les permissions système de base
INSERT INTO public.permissions (code_permission, nom_permission, description, categorie, is_system)
VALUES 
  -- Gestion des Utilisateurs
  ('users.view', 'Consulter les utilisateurs', 'Permet de consulter la liste des utilisateurs', 'users', true),
  ('users.create', 'Créer des utilisateurs', 'Permet de créer de nouveaux utilisateurs', 'users', true),
  ('users.edit', 'Modifier les utilisateurs', 'Permet de modifier les informations des utilisateurs', 'users', true),
  ('users.delete', 'Supprimer les utilisateurs', 'Permet de supprimer des utilisateurs', 'users', true),
  ('users.manage_roles', 'Gérer les rôles', 'Permet de gérer les rôles et permissions', 'users', true),
  
  -- Gestion de la Pharmacie
  ('pharmacy.view', 'Consulter la pharmacie', 'Permet de consulter les informations de la pharmacie', 'pharmacy', true),
  ('pharmacy.edit', 'Modifier la pharmacie', 'Permet de modifier les paramètres de la pharmacie', 'pharmacy', true),
  ('pharmacy.settings', 'Paramètres système', 'Accès aux paramètres système', 'pharmacy', true),
  
  -- Gestion des Ventes
  ('sales.view', 'Consulter les ventes', 'Permet de consulter les ventes', 'sales', true),
  ('sales.create', 'Créer des ventes', 'Permet de créer de nouvelles ventes', 'sales', true),
  ('sales.edit', 'Modifier les ventes', 'Permet de modifier les ventes', 'sales', true),
  ('sales.delete', 'Annuler les ventes', 'Permet de annuler des ventes', 'sales', true),
  ('sales.discount', 'Appliquer des remises', 'Permet de appliquer des remises sur les ventes', 'sales', true),
  
  -- Gestion du Stock
  ('stock.view', 'Consulter le stock', 'Permet de consulter le stock', 'stock', true),
  ('stock.add', 'Ajouter au stock', 'Permet de ajouter des produits au stock', 'stock', true),
  ('stock.edit', 'Modifier le stock', 'Permet de modifier les informations du stock', 'stock', true),
  ('stock.delete', 'Supprimer du stock', 'Permet de supprimer des produits du stock', 'stock', true),
  ('stock.transfer', 'Transférer le stock', 'Permet de transférer du stock entre emplacements', 'stock', true),
  ('stock.inventory', 'Faire inventaire', 'Permet de réaliser des inventaires', 'stock', true),
  
  -- Gestion des Fournisseurs
  ('suppliers.view', 'Consulter les fournisseurs', 'Permet de consulter les fournisseurs', 'suppliers', true),
  ('suppliers.create', 'Créer des fournisseurs', 'Permet de créer de nouveaux fournisseurs', 'suppliers', true),
  ('suppliers.edit', 'Modifier les fournisseurs', 'Permet de modifier les informations des fournisseurs', 'suppliers', true),
  ('suppliers.delete', 'Supprimer les fournisseurs', 'Permet de supprimer des fournisseurs', 'suppliers', true),
  ('suppliers.orders', 'Gérer les commandes', 'Permet de gérer les commandes fournisseurs', 'suppliers', true),
  
  -- Comptabilité
  ('accounting.view', 'Consulter la comptabilité', 'Permet de consulter les données comptables', 'accounting', true),
  ('accounting.entries', 'Gérer les écritures', 'Permet de créer et modifier les écritures comptables', 'accounting', true),
  ('accounting.reports', 'Rapports comptables', 'Permet de générer des rapports comptables', 'accounting', true),
  ('accounting.close', 'Clôturer exercice', 'Permet de clôturer un exercice comptable', 'accounting', true),
  
  -- Rapports
  ('reports.view', 'Consulter les rapports', 'Permet de consulter les rapports', 'reports', true),
  ('reports.export', 'Exporter les rapports', 'Permet de exporter les rapports', 'reports', true),
  ('reports.advanced', 'Rapports avancés', 'Accès aux rapports avancés et statistiques', 'reports', true),
  
  -- Réseau
  ('network.view', 'Consulter le réseau', 'Permet de consulter les informations réseau', 'network', true),
  ('network.chat', 'Utiliser le chat', 'Permet de utiliser la messagerie réseau', 'network', true),
  ('network.admin', 'Administrer le réseau', 'Permet de administrer le réseau', 'network', true),
  
  -- Sécurité
  ('security.view', 'Consulter la sécurité', 'Permet de consulter les logs de sécurité', 'security', true),
  ('security.audit', 'Auditer le système', 'Permet de auditer le système', 'security', true),
  ('security.backup', 'Gérer les sauvegardes', 'Permet de gérer les sauvegardes', 'security', true)
ON CONFLICT (code_permission) DO NOTHING;

-- Étape 7: Créer les rôles par défaut pour chaque tenant
WITH seeds(nom_role, description, niveau_hierarchique) AS (
  VALUES
    ('Admin', 'Administrateur du système avec accès complet', 1),
    ('Pharmacien', 'Responsable pharmaceutique', 2),
    ('Comptable', 'Gestion comptable et financière', 3),
    ('Gestionnaire de stock', 'Gestion des stocks et approvisionnements', 4),
    ('Caissier', 'Gestion de la caisse et des ventes', 5),
    ('Vendeur', 'Vente au comptoir', 6),
    ('Préparateur', 'Préparation des commandes', 7),
    ('Employé', 'Accès de base au système', 8)
)
INSERT INTO public.roles (tenant_id, nom_role, description, niveau_hierarchique, is_active, is_system)
SELECT p.id, s.nom_role, s.description, s.niveau_hierarchique, true, false
FROM public.pharmacies p
CROSS JOIN seeds s
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r
  WHERE r.tenant_id = p.id AND r.nom_role = s.nom_role
);

-- Étape 8: Accorder toutes les permissions au rôle Admin de chaque tenant
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
SELECT r.tenant_id, r.id, perm.id, true
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.roles_permissions rp
    WHERE rp.tenant_id = r.tenant_id
      AND rp.role_id = r.id
      AND rp.permission_id = perm.id
  );

-- Étape 9: Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_permissions_updated_at ON public.roles_permissions;
CREATE TRIGGER update_roles_permissions_updated_at
  BEFORE UPDATE ON public.roles_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Vérification finale
COMMENT ON TABLE public.roles IS 'Table restaurée: Rôles multi-tenant avec 8 rôles par défaut par tenant';
COMMENT ON TABLE public.permissions IS 'Table restaurée: 37 permissions système organisées en 9 catégories';
COMMENT ON TABLE public.roles_permissions IS 'Table restaurée: Associations rôles-permissions avec Admin ayant toutes les permissions';