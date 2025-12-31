-- Créer le compte 4458 (Centime Additionnel) dans plan_comptable pour tous les tenants
INSERT INTO plan_comptable (tenant_id, numero_compte, libelle_compte, type_compte, classe, is_active)
SELECT DISTINCT 
  pc.tenant_id, 
  '4458', 
  'Centime additionnel', 
  'detail', 
  4,
  true
FROM plan_comptable pc
WHERE NOT EXISTS (
  SELECT 1 FROM plan_comptable pc2 
  WHERE pc2.tenant_id = pc.tenant_id 
  AND pc2.numero_compte = '4458'
)
GROUP BY pc.tenant_id;