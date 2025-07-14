-- Migration finale corrigée avec la bonne structure des tables

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

-- 3. Insérer les rôles avec un tenant_id d'une pharmacie existante
DO $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Récupérer un tenant_id existant (premier trouvé) pour les rôles système
    SELECT id INTO current_tenant_id FROM public.pharmacies LIMIT 1;
    
    -- Si aucune pharmacie n'existe, créer un tenant temporaire
    IF current_tenant_id IS NULL THEN
        INSERT INTO public.pharmacies (name, code) 
        VALUES ('Système Temporaire', 'SYS_TEMP') 
        RETURNING id INTO current_tenant_id;
    END IF;

    -- 4. Insérer les rôles avec le tenant_id
    INSERT INTO public.roles (tenant_id, nom_role, description, niveau_hierarchique, is_system) VALUES
    (current_tenant_id, 'Admin', 'Administrateur principal avec tous les droits', 1, true),
    (current_tenant_id, 'Pharmacien', 'Pharmacien avec droits étendus', 2, true),
    (current_tenant_id, 'Préparateur', 'Préparateur en pharmacie', 3, true),
    (current_tenant_id, 'Caissier', 'Caissier avec droits de vente', 4, true),
    (current_tenant_id, 'Vendeur', 'Vendeur avec droits de vente limités', 5, true),
    (current_tenant_id, 'Comptable', 'Comptable avec accès à la comptabilité', 3, true),
    (current_tenant_id, 'Gestionnaire de stock', 'Gestionnaire du stock et des approvisionnements', 4, true),
    (current_tenant_id, 'Employé', 'Employé de base avec droits limités', 6, true);
END $$;

-- 5. Admin a toutes les permissions
DO $$
DECLARE
    admin_role_id UUID;
    permission_record RECORD;
    current_tenant_id UUID;
BEGIN
    SELECT id INTO current_tenant_id FROM public.pharmacies LIMIT 1;
    SELECT id INTO admin_role_id FROM public.roles WHERE nom_role = 'Admin';
    
    FOR permission_record IN SELECT id FROM public.permissions LOOP
        INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
        VALUES (current_tenant_id, admin_role_id, permission_record.id, true);
    END LOOP;
END $$;

-- 6. Permissions pour Pharmacien
DO $$
DECLARE
    current_tenant_id UUID;
BEGIN
    SELECT id INTO current_tenant_id FROM public.pharmacies LIMIT 1;
    
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Pharmacien'
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
END $$;

-- 7-12. Permissions pour les autres rôles avec la même logique
DO $$
DECLARE
    current_tenant_id UUID;
BEGIN
    SELECT id INTO current_tenant_id FROM public.pharmacies LIMIT 1;
    
    -- Préparateur
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Préparateur'
    AND p.code_permission IN ('sales.view', 'sales.create', 'stock.view', 'stock.manage', 'stock.inventory', 'stock.clients', 'reports.view', 'settings.personnel');
    
    -- Caissier
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Caissier'
    AND p.code_permission IN ('sales.view', 'sales.create', 'sales.edit', 'sales.discount', 'sales.cash', 'stock.view', 'stock.clients', 'reports.view');
    
    -- Vendeur
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Vendeur'
    AND p.code_permission IN ('sales.view', 'sales.create', 'stock.view', 'stock.clients');
    
    -- Comptable
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Comptable'
    AND p.code_permission IN ('accounting.view', 'accounting.manage', 'reports.view', 'reports.create', 'sales.view', 'stock.view');
    
    -- Gestionnaire de stock
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Gestionnaire de stock'
    AND p.code_permission IN ('stock.view', 'stock.manage', 'stock.inventory', 'stock.orders', 'stock.partners', 'reports.view');
    
    -- Employé
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde)
    SELECT current_tenant_id, r.id, p.id, true
    FROM public.roles r, public.permissions p
    WHERE r.nom_role = 'Employé'
    AND p.code_permission IN ('sales.view', 'stock.view', 'stock.clients');
END $$;