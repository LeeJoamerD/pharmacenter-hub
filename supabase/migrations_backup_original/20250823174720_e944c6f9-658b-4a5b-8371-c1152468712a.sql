
-- 1) Semence (idempotente) des rôles par défaut pour chaque tenant (pharmacie)
-- La table public.roles est multi-tenant (colonne tenant_id) d'après vos policies existantes.
WITH seeds(nom_role, description, niveau_hierarchique) AS (
  VALUES
    ('Admin','Administrateur du système',1),
    ('Pharmacien','Responsable pharmaceutique',2),
    ('Comptable','Gestion comptable',3),
    ('Gestionnaire de stock','Gestion des stocks',4),
    ('Caissier','Gestion de la caisse',5),
    ('Vendeur','Vente au comptoir',6),
    ('Préparateur','Préparation des commandes',7),
    ('Employé','Accès de base',8)
)
INSERT INTO public.roles (tenant_id, nom_role, description, niveau_hierarchique, is_active, is_system, created_at, updated_at)
SELECT p.id AS tenant_id, s.nom_role, s.description, s.niveau_hierarchique, true, false, now(), now()
FROM public.pharmacies p
CROSS JOIN seeds s
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r
  WHERE r.tenant_id = p.id AND r.nom_role = s.nom_role
);

-- 2) Initialiser les permissions du rôle "Admin" pour chaque tenant:
--    accorder toutes les permissions existantes, sans dupliquer ce qui existe déjà.
INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
SELECT r.tenant_id, r.id AS role_id, perm.id AS permission_id, true, now(), now()
FROM public.roles r
JOIN public.permissions perm ON true
WHERE r.nom_role = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.roles_permissions rp
    WHERE rp.tenant_id = r.tenant_id
      AND rp.role_id = r.id
      AND rp.permission_id = perm.id
  );

-- 3) (Optionnel, sécurité) S'assurer que seuls les rôles actifs apparaissent (le composant filtre déjà is_active=true)
-- Rien à faire ici si vous utilisez déjà is_active=true dans la requête côté app.

-- Remarques:
-- - Ces inserts sont idempotents (utilisent WHERE NOT EXISTS) et fonctionneront pour tous les tenants existants.
-- - Ils respectent le modèle multi-tenant (tenant_id pris depuis pharmacies).
-- - Les policies RLS existantes sur roles et roles_permissions resteront inchangées.
