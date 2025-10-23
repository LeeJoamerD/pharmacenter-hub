-- Migration corrigée pour peupler les tables de rôles et permissions

-- 1. Nettoyer les tables existantes
DELETE FROM public.roles_permissions;
DELETE FROM public.roles;
DELETE FROM public.permissions;

-- 2. Insérer les permissions avec les bonnes catégories
INSERT INTO public.permissions (code_permission, nom_permission, description, categorie, is_system) VALUES
-- Utilisateurs
('users.view', 'Voir les utilisateurs', 'Permet de consulter la liste des utilisateurs', 'users', true),
('users.create', 'Créer des utilisateurs', 'Permet de créer de nouveaux utilisateurs', 'users', true),
('users.edit', 'Modifier les utilisateurs', 'Permet de modifier les informations des utilisateurs', 'users', true),
('users.delete', 'Supprimer les utilisateurs', 'Permet de supprimer des utilisateurs', 'users', true),

-- Pharmacie
('pharmacy.manage', 'Gérer la pharmacie', 'Permet de gérer les informations de la pharmacie', 'pharmacy', true),

-- Ventes
('sales.view', 'Voir les ventes', 'Permet de consulter les ventes', 'sales', true),
('sales.create', 'Créer des ventes', 'Permet de créer de nouvelles ventes', 'sales', true),
('sales.edit', 'Modifier les ventes', 'Permet de modifier les ventes', 'sales', true),
('sales.delete', 'Supprimer les ventes', 'Permet de supprimer des ventes', 'sales', true),
('sales.discount', 'Appliquer des remises', 'Permet d''appliquer des remises sur les ventes', 'sales', true),
('sales.cash', 'Gérer la caisse', 'Permet de gérer les sessions de caisse et encaissements', 'sales', true),

-- Stock
('stock.view', 'Voir le stock', 'Permet de consulter le stock', 'stock', true),
('stock.manage', 'Gérer le stock', 'Permet de gérer le stock et les mouvements', 'stock', true),
('stock.inventory', 'Faire des inventaires', 'Permet de réaliser des inventaires', 'stock', true),
('stock.orders', 'Gérer les commandes', 'Permet de gérer les commandes fournisseurs', 'stock', true),
('stock.clients', 'Gérer les clients', 'Permet de créer, modifier et supprimer des clients', 'stock', true),
('stock.partners', 'Gérer les partenaires', 'Permet de gérer les partenaires (fournisseurs, laboratoires, etc.)', 'stock', true),

-- Comptabilité
('accounting.view', 'Voir la comptabilité', 'Permet de consulter les données comptables', 'accounting', true),
('accounting.manage', 'Gérer la comptabilité', 'Permet de gérer la comptabilité', 'accounting', true),

-- Rapports
('reports.view', 'Voir les rapports', 'Permet de consulter les rapports', 'reports', true),
('reports.create', 'Créer des rapports', 'Permet de créer des rapports personnalisés', 'reports', true),

-- Paramètres
('settings.view', 'Voir les paramètres', 'Permet de consulter les paramètres', 'settings', true),
('settings.manage', 'Gérer les paramètres', 'Permet de modifier les paramètres système', 'settings', true),
('settings.personnel', 'Gérer le personnel', 'Permet de gérer les employés (plannings, formations, etc.)', 'settings', true),

-- Réseau/Chat
('network.view', 'Voir le réseau', 'Permet de consulter le réseau de pharmacies', 'network', true),
('network.manage', 'Gérer le réseau', 'Permet de gérer les canaux et communications réseau', 'network', true),
('network.ai', 'Utiliser l''IA', 'Permet d''utiliser les fonctionnalités d''intelligence artificielle', 'network', true);

-- 3. Insérer les rôles
INSERT INTO public.roles (code_role, nom_role, description, niveau_hierarchique, is_system) VALUES
('admin', 'Admin', 'Administrateur principal avec tous les droits', 1, true),
('pharmacien', 'Pharmacien', 'Pharmacien avec droits étendus', 2, true),
('preparateur', 'Préparateur', 'Préparateur en pharmacie', 3, true),
('caissier', 'Caissier', 'Caissier avec droits de vente', 4, true),
('vendeur', 'Vendeur', 'Vendeur avec droits de vente limités', 5, true),
('comptable', 'Comptable', 'Comptable avec accès à la comptabilité', 3, true),
('gestionnaire_stock', 'Gestionnaire de stock', 'Gestionnaire du stock et des approvisionnements', 4, true),
('employe', 'Employé', 'Employé de base avec droits limités', 6, true);

-- 4. Admin a toutes les permissions
DO $$
DECLARE
    admin_role_id UUID;
    permission_record RECORD;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE code_role = 'admin';
    
    FOR permission_record IN SELECT id FROM public.permissions LOOP
        INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
        VALUES (admin_role_id, permission_record.id, true);
    END LOOP;
END $$;

-- 5. Permissions pour Pharmacien
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'pharmacien'
AND p.code_permission IN (
    'users.view', 'users.create', 'users.edit',
    'pharmacy.manage',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.discount', 'sales.cash',
    'stock.view', 'stock.manage', 'stock.inventory', 'stock.orders', 'stock.clients', 'stock.partners',
    'accounting.view', 'accounting.manage',
    'reports.view', 'reports.create',
    'settings.view', 'settings.manage', 'settings.personnel',
    'network.view', 'network.manage', 'network.ai'
);

-- 6. Permissions pour Préparateur
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'preparateur'
AND p.code_permission IN (
    'sales.view', 'sales.create',
    'stock.view', 'stock.manage', 'stock.inventory',
    'stock.clients',
    'reports.view',
    'settings.personnel'
);

-- 7. Permissions pour Caissier
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'caissier'
AND p.code_permission IN (
    'sales.view', 'sales.create', 'sales.edit', 'sales.discount', 'sales.cash',
    'stock.view',
    'stock.clients',
    'reports.view'
);

-- 8. Permissions pour Vendeur
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'vendeur'
AND p.code_permission IN (
    'sales.view', 'sales.create',
    'stock.view',
    'stock.clients'
);

-- 9. Permissions pour Comptable
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'comptable'
AND p.code_permission IN (
    'accounting.view', 'accounting.manage',
    'reports.view', 'reports.create',
    'sales.view',
    'stock.view'
);

-- 10. Permissions pour Gestionnaire de stock
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'gestionnaire_stock'
AND p.code_permission IN (
    'stock.view', 'stock.manage', 'stock.inventory', 'stock.orders', 'stock.partners',
    'reports.view'
);

-- 11. Permissions pour Employé
INSERT INTO public.roles_permissions (role_id, permission_id, is_active)
SELECT r.id, p.id, true
FROM public.roles r, public.permissions p
WHERE r.code_role = 'employe'
AND p.code_permission IN (
    'sales.view',
    'stock.view',
    'stock.clients'
);

-- 12. Mettre à jour le personnel existant
UPDATE public.personnel SET role = 'admin' WHERE role = 'Admin';
UPDATE public.personnel SET role = 'pharmacien' WHERE role = 'Pharmacien';
UPDATE public.personnel SET role = 'preparateur' WHERE role = 'Préparateur';
UPDATE public.personnel SET role = 'caissier' WHERE role = 'Caissier';
UPDATE public.personnel SET role = 'vendeur' WHERE role = 'Vendeur';
UPDATE public.personnel SET role = 'comptable' WHERE role = 'Comptable';
UPDATE public.personnel SET role = 'gestionnaire_stock' WHERE role = 'Gestionnaire de stock';
UPDATE public.personnel SET role = 'employe' WHERE role = 'Employé';