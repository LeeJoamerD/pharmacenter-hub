-- Nettoyer les comptes SYSCOHADA partiellement importés pour permettre une réimportation complète
-- Cela supprime les 211 comptes incomplets actuellement dans la base

DELETE FROM public.comptes_globaux
WHERE plan_comptable_id IN (
  SELECT id FROM public.plans_comptables_globaux 
  WHERE code = 'SYSCOHADA'
);