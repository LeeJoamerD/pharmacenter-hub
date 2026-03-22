
-- Suppression des 763 produits Pharmacie HOPE dont le code_cip est absent du catalogue global
-- Tenant: 102232f2-6a8c-4555-b288-4c1f118a81a0

-- Étape 1: Supprimer lignes_retours
DELETE FROM lignes_retours
WHERE produit_id IN (
  SELECT id FROM produits
  WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND code_cip IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip)
);

-- Étape 2: Supprimer lignes_ventes
DELETE FROM lignes_ventes
WHERE produit_id IN (
  SELECT id FROM produits
  WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND code_cip IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip)
);

-- Étape 3: Supprimer lignes_reception_fournisseur
DELETE FROM lignes_reception_fournisseur
WHERE produit_id IN (
  SELECT id FROM produits
  WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND code_cip IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip)
);

-- Étape 4: Supprimer lignes_commande_fournisseur
DELETE FROM lignes_commande_fournisseur
WHERE produit_id IN (
  SELECT id FROM produits
  WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND code_cip IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip)
);

-- Étape 5: Supprimer mouvements_lots (via lots des produits cibles)
DELETE FROM mouvements_lots
WHERE lot_id IN (
  SELECT l.id FROM lots l
  INNER JOIN produits p ON l.produit_id = p.id
  WHERE p.tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND p.code_cip IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = p.code_cip)
);

-- Étape 6: Supprimer lots explicitement
DELETE FROM lots
WHERE produit_id IN (
  SELECT id FROM produits
  WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND code_cip IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip)
);

-- Étape 7: Supprimer les produits (CASCADE nettoie inventaire_items, produits_dci, etc.)
DELETE FROM produits
WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
AND code_cip IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip);
