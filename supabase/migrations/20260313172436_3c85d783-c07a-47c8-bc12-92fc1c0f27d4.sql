
-- One-time cleanup: detach retours from orphaned ventes, then delete orphaned ventes
-- This handles all existing broken data across all tenants

-- Step 1: Detach retours referencing orphaned ventes (no lignes_ventes, statut En cours)
UPDATE retours
SET vente_origine_id = NULL
WHERE vente_origine_id IN (
  SELECT v.id FROM ventes v
  WHERE v.statut = 'En cours'
    AND NOT EXISTS (SELECT 1 FROM lignes_ventes lv WHERE lv.vente_id = v.id)
);

-- Step 2: Delete mouvements_caisse referencing these orphaned ventes
DELETE FROM mouvements_caisse
WHERE reference_id IN (
  SELECT v.id FROM ventes v
  WHERE v.statut = 'En cours'
    AND NOT EXISTS (SELECT 1 FROM lignes_ventes lv WHERE lv.vente_id = v.id)
);

-- Step 3: Delete the orphaned ventes themselves
DELETE FROM ventes
WHERE statut = 'En cours'
  AND NOT EXISTS (SELECT 1 FROM lignes_ventes lv WHERE lv.vente_id = ventes.id);
