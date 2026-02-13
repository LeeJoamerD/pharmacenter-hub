
-- Ajouter la permission dashboard.view
INSERT INTO permissions (code_permission, nom_permission, description, categorie, is_system)
VALUES ('dashboard.view', 'Voir les tableaux de bord', 
        'Permet de voir les tableaux de bord principaux des modules', 
        'dashboard', true);

-- Attribuer cette permission à tous les rôles existants de chaque tenant (activée par défaut)
INSERT INTO roles_permissions (tenant_id, role_id, permission_id, accorde)
SELECT 
  r.tenant_id,
  r.id as role_id,
  p.id as permission_id,
  true as accorde
FROM roles r
CROSS JOIN permissions p
WHERE p.code_permission = 'dashboard.view'
ON CONFLICT DO NOTHING;
