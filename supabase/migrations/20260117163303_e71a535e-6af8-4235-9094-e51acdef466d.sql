-- Migration pour remplir les ancien_code_cip manquants dans la table produits
-- en utilisant les données de référence des autres produits existants

-- Mettre à jour les produits qui n'ont pas d'ancien_code_cip
-- en utilisant les données d'autres produits ayant le même code_cip
WITH reference_data AS (
  SELECT DISTINCT code_cip, ancien_code_cip
  FROM public.produits
  WHERE ancien_code_cip IS NOT NULL
    AND ancien_code_cip != ''
)
UPDATE public.produits p
SET ancien_code_cip = rd.ancien_code_cip
FROM reference_data rd
WHERE p.code_cip = rd.code_cip
  AND (p.ancien_code_cip IS NULL OR p.ancien_code_cip = '');