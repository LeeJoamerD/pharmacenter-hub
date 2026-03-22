

# Suppression des produits Pharmacie HOPE absents du catalogue global (Code CIP)

## Périmètre
- **763 produits** du tenant `102232f2-6a8c-4555-b288-4c1f118a81a0` dont le `code_cip` est absent de `catalogue_global_produits`
- Suppression totale incluant **tous les lots** associés

## Ordre de suppression

| Étape | Table | Raison |
|---|---|---|
| 1 | `lignes_retours` | FK RESTRICT vers produits |
| 2 | `lignes_ventes` | FK RESTRICT vers produits |
| 3 | `lignes_reception_fournisseur` | FK RESTRICT vers produits |
| 4 | `lignes_commande_fournisseur` | FK RESTRICT vers produits |
| 5 | `mouvements_lots` | FK vers lots (doit être supprimé avant les lots) |
| 6 | `lots` | FK vers produits — supprimés **explicitement** avant les produits |
| 7 | `produits` | Les tables CASCADE (inventaire_items, produits_dci, etc.) se nettoient automatiquement |

## Script SQL

```sql
WITH produits_cibles AS (
  SELECT id FROM produits
  WHERE tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND code_cip IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM catalogue_global_produits g WHERE g.code_cip = produits.code_cip
  )
)
-- 1. lignes_retours
DELETE FROM lignes_retours WHERE produit_id IN (SELECT id FROM produits_cibles);
-- 2. lignes_ventes
DELETE FROM lignes_ventes WHERE produit_id IN (SELECT id FROM produits_cibles);
-- 3. lignes_reception_fournisseur
DELETE FROM lignes_reception_fournisseur WHERE produit_id IN (SELECT id FROM produits_cibles);
-- 4. lignes_commande_fournisseur
DELETE FROM lignes_commande_fournisseur WHERE produit_id IN (SELECT id FROM produits_cibles);
-- 5. mouvements_lots (via lot_id lié aux produits cibles)
DELETE FROM mouvements_lots WHERE lot_id IN (
  SELECT id FROM lots WHERE produit_id IN (SELECT id FROM produits_cibles)
);
-- 6. lots (explicitement)
DELETE FROM lots WHERE produit_id IN (SELECT id FROM produits_cibles);
-- 7. produits
DELETE FROM produits WHERE id IN (SELECT id FROM produits_cibles);
```

Chaque étape affichera le nombre de lignes supprimées. Filtrage strict par `tenant_id` Pharmacie HOPE.

