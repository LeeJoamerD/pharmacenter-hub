-- Migration: Mettre à jour les rôles avec les 13 rôles unifiés et permissions par défaut

-- 1. Mettre à jour "Pharmacien" → "Pharmacien Titulaire"
UPDATE public.roles 
SET nom_role = 'Pharmacien Titulaire', 
    description = 'Pharmacien titulaire responsable de l''officine',
    niveau_hierarchique = 2,
    updated_at = now()
WHERE nom_role = 'Pharmacien';

-- 2. Supprimer les références de permissions pour "Employé" avant suppression
DELETE FROM public.roles_permissions 
WHERE role_id IN (SELECT id FROM public.roles WHERE nom_role = 'Employé');

-- 3. Supprimer le rôle "Employé" (obsolète)
DELETE FROM public.roles WHERE nom_role = 'Employé';

-- 4. Mettre à jour les niveaux hiérarchiques des rôles existants
UPDATE public.roles SET niveau_hierarchique = 1, updated_at = now() WHERE nom_role = 'Admin';
UPDATE public.roles SET niveau_hierarchique = 4, updated_at = now() WHERE nom_role = 'Préparateur';
UPDATE public.roles SET niveau_hierarchique = 6, updated_at = now() WHERE nom_role = 'Caissier';
UPDATE public.roles SET niveau_hierarchique = 7, updated_at = now() WHERE nom_role = 'Vendeur';
UPDATE public.roles SET niveau_hierarchique = 8, description = 'Responsable de la gestion des stocks', updated_at = now() WHERE nom_role = 'Gestionnaire de stock';
UPDATE public.roles SET niveau_hierarchique = 9, updated_at = now() WHERE nom_role = 'Comptable';

-- 5. Ajouter les nouveaux rôles pour chaque tenant existant
INSERT INTO public.roles (tenant_id, nom_role, description, niveau_hierarchique, is_active, is_system, created_at, updated_at)
SELECT p.id, role_data.nom, role_data.description, role_data.niveau, true, false, now(), now()
FROM public.pharmacies p
CROSS JOIN (VALUES
  ('Pharmacien Adjoint', 'Pharmacien adjoint assistant le titulaire', 3),
  ('Technicien', 'Technicien de pharmacie', 5),
  ('Secrétaire', 'Secrétaire administrative', 10),
  ('Livreur', 'Livreur de commandes', 11),
  ('Stagiaire', 'Stagiaire en formation', 12),
  ('Invité', 'Accès invité restreint', 13)
) AS role_data(nom, description, niveau)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.tenant_id = p.id AND r.nom_role = role_data.nom
);

-- 6. Supprimer toutes les permissions existantes pour recréer proprement
DELETE FROM public.roles_permissions;

-- 7. Insérer les permissions par défaut pour chaque rôle

-- Admin: TOUTES les permissions
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Admin';

-- Pharmacien Titulaire: Toutes sauf admin système
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Pharmacien Titulaire'
  AND perm.code_permission NOT IN ('admin', 'backup', 'security_config');

-- Pharmacien Adjoint: users.view, pharmacy.view, sales.*, stock.*, suppliers.view/orders, reports.view/export, network.chat
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Pharmacien Adjoint'
  AND perm.code_permission IN (
    'users.view', 'pharmacy.view', 'pharmacy.edit',
    'sales.create', 'sales.view', 'sales.edit', 'sales.delete', 'sales.discount',
    'stock.view', 'stock.add', 'stock.edit', 'stock.delete', 'stock.inventory', 'stock.transfer',
    'suppliers.view', 'suppliers.orders',
    'reports.view', 'reports.export',
    'network.view', 'network.chat',
    'read', 'write'
  );

-- Préparateur: stock.view/add/edit, suppliers.view/orders, sales.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Préparateur'
  AND perm.code_permission IN (
    'stock.view', 'stock.add', 'stock.edit', 'stock.inventory',
    'suppliers.view', 'suppliers.orders',
    'sales.view',
    'read'
  );

-- Technicien: stock.view/add/edit, pharmacy.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Technicien'
  AND perm.code_permission IN (
    'stock.view', 'stock.add', 'stock.edit',
    'pharmacy.view',
    'read'
  );

-- Caissier: sales.create/view/discount, stock.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Caissier'
  AND perm.code_permission IN (
    'sales.create', 'sales.view', 'sales.discount',
    'stock.view',
    'read'
  );

-- Vendeur: sales.create/view, stock.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Vendeur'
  AND perm.code_permission IN (
    'sales.create', 'sales.view',
    'stock.view',
    'read'
  );

-- Gestionnaire de stock: stock.*, suppliers.view/orders, reports.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Gestionnaire de stock'
  AND perm.code_permission IN (
    'stock.view', 'stock.add', 'stock.edit', 'stock.delete', 'stock.inventory', 'stock.transfer',
    'suppliers.view', 'suppliers.orders',
    'reports.view',
    'read', 'write'
  );

-- Comptable: accounting.*, reports.*, sales.view, suppliers.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Comptable'
  AND perm.code_permission IN (
    'accounting.view', 'accounting.entries', 'accounting.reports', 'accounting.close',
    'reports.view', 'reports.export', 'reports.advanced',
    'sales.view',
    'suppliers.view',
    'read'
  );

-- Secrétaire: users.view, pharmacy.view, reports.view, suppliers.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Secrétaire'
  AND perm.code_permission IN (
    'users.view',
    'pharmacy.view',
    'reports.view',
    'suppliers.view',
    'read'
  );

-- Livreur: stock.view, suppliers.view
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Livreur'
  AND perm.code_permission IN (
    'stock.view',
    'suppliers.view',
    'read'
  );

-- Stagiaire: stock.view, sales.view, pharmacy.view (lecture seule)
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Stagiaire'
  AND perm.code_permission IN (
    'stock.view',
    'sales.view',
    'pharmacy.view',
    'read'
  );

-- Invité: Lecture minimale uniquement
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id, perm.id, true, now(), now()
FROM public.roles r
CROSS JOIN public.permissions perm
WHERE r.nom_role = 'Invité'
  AND perm.code_permission = 'read';