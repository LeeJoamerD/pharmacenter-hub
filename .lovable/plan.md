

# Fix: Doublons dans les tables référentielles causent la multiplication des produits

## Diagnostic

La table `laboratoires` du tenant source (Jeannelle) contient des doublons massifs sur `libelle` :
- "PLANETPHARMA DISTRI UE HORS FR" : **570 occurrences**
- "TEDIS" : 59 occurrences
- "ENERGIA PHARMA SERVICES NV" : 54 occurrences
- etc.

Quand la fonction `clone_tenant_referential` construit `_map_labos` par un JOIN sur `libelle`, un seul `old_id` correspond à **N** `new_id` (N doublons dans le cible fraîchement inséré). Ensuite, le LEFT JOIN dans l'INSERT des produits multiplie chaque produit par N, causant les doublons `code_cip` → erreur `23505`.

Le même problème existe potentiellement pour les autres tables référentielles avec doublons.

## Correction en deux parties

### 1. Nettoyer les doublons dans le source (Jeannelle)

Avant de re-cloner, dédupliquer les tables référentielles du source en ne gardant que l'enregistrement le plus ancien (`min(id)` ou `min(created_at)`) et en remappant les FK dans `produits`. Tables concernées :
- `laboratoires` (doublons confirmés)
- Potentiellement `formes_galeniques`, `famille_produit`, `rayons_produits`, etc.

Ce nettoyage se fait via un script SQL exécuté dans le SQL Editor.

### 2. Rendre la fonction résiliente aux doublons

Modifier la construction des tables de mapping `_map_*` dans `clone_tenant_referential` pour n'utiliser qu'**un seul** enregistrement par libellé (via `DISTINCT ON` ou en prenant `min(id)`). Cela empêche la multiplication des lignes même si des doublons existent.

Exemple pour `_map_labos` :
```sql
INSERT INTO _map_labos (old_id, new_id)
SELECT DISTINCT ON (s.id) s.id, t.id
FROM laboratoires s
JOIN laboratoires t ON t.libelle = s.libelle 
  AND t.tenant_id = p_target_tenant
WHERE s.tenant_id = p_source_tenant;
```

Et pour le côté cible, ne prendre qu'un seul match :
```sql
INSERT INTO _map_labos (old_id, new_id)
SELECT s.id, (SELECT t.id FROM laboratoires t 
              WHERE t.libelle = s.libelle 
              AND t.tenant_id = p_target_tenant LIMIT 1)
FROM laboratoires s
WHERE s.tenant_id = p_source_tenant;
```

Appliquer le même pattern à toutes les 7 tables de mapping.

### 3. Ajouter `ON CONFLICT (tenant_id, code_cip) DO NOTHING` sur l'INSERT produits

En sécurité supplémentaire, pour que la fonction ne plante jamais sur des doublons de produits.

## Étapes techniques

1. **Migration SQL** : `CREATE OR REPLACE FUNCTION clone_tenant_referential` avec :
   - Mapping `_map_*` utilisant une sous-requête `LIMIT 1` pour chaque correspondance cible
   - `ON CONFLICT DO NOTHING` sur l'INSERT produits (sur la contrainte unique partielle)
   
2. **Script SQL de nettoyage** (exécutable dans le SQL Editor) pour dédupliquer les laboratoires dans Jeannelle et La Victoire si nécessaire

3. **Supprimer les données partielles** dans La Victoire (les référentiels déjà insérés par les exécutions précédentes) ou laisser le `ON CONFLICT DO NOTHING` les gérer

## Fichier modifié
- Nouvelle migration SQL pour `CREATE OR REPLACE FUNCTION clone_tenant_referential`

