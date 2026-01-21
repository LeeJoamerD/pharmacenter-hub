
-- Migration A: Créer le compte 4461 (Centime additionnel sur CA) pour MAZAYU
-- type_compte en minuscule selon la contrainte existante

INSERT INTO public.plan_comptable (
  tenant_id, 
  numero_compte, 
  libelle_compte, 
  type_compte, 
  classe, 
  nature_compte, 
  is_active, 
  niveau
)
SELECT 
  'aa8717d1-d450-48dd-a484-66402e435797', 
  '4461', 
  'Centime additionnel sur chiffre d''affaires', 
  'detail', 
  4, 
  'Passif', 
  true, 
  3
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_comptable 
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797' 
  AND numero_compte = '4461'
);
