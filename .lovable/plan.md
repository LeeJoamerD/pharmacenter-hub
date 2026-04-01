
# Fix: Remapper id_produit_source pour les produits détails clonés

## Problème
La fonction `clone_tenant_referential` copie les produits mais ne mappe pas les colonnes `id_produit_source` et `quantite_unites_details_source`. Résultat : les 51 produits détails (niveau_detail ≥ 2) du tenant Jeannelle ont `id_produit_source = NULL`, ce qui empêche le lien source/détail (pas de bouton "Mise en détail" sur le produit source, pas de fractionnement possible).

## Solution

### 1. Corriger la fonction `clone_tenant_referential`
Ajouter `id_produit_source` et `quantite_unites_details_source` dans l'INSERT des produits, avec remappage via `_map_produits` :

```sql
-- Dans l'INSERT produits, ajouter ces colonnes :
id_produit_source → (SELECT mp2.new_id FROM _map_produits mp2 WHERE mp2.old_id = s.id_produit_source)
quantite_unites_details_source → s.quantite_unites_details_source
```

### 2. Corriger les données existantes de Jeannelle
Exécuter un UPDATE pour remapper les `id_produit_source` des produits déjà clonés, en utilisant le `code_cip` du produit source comme clé de correspondance :

```sql
UPDATE produits target
SET 
  id_produit_source = target_source.id,
  quantite_unites_details_source = source_detail.quantite_unites_details_source
FROM produits source_detail
JOIN produits source_parent ON source_parent.id = source_detail.id_produit_source
JOIN produits target_source ON target_source.code_cip = source_parent.code_cip 
  AND target_source.tenant_id = 'aaf036e4-8316-4ed7-af49-8bec87035550'
WHERE source_detail.tenant_id = '102232f2-6a8c-4555-b288-4c1f118a81a0'
  AND source_detail.niveau_detail >= 2
  AND target.tenant_id = 'aaf036e4-8316-4ed7-af49-8bec87035550'
  AND target.code_cip = source_detail.code_cip
  AND target.id_produit_source IS NULL;
```

## Fichier modifié
- **Nouvelle migration SQL** : met à jour la fonction `clone_tenant_referential` (ajout des 2 colonnes) + corrige les données existantes de Jeannelle
