

# Import du référentiel de Pharmacie HOPE vers Pharmacie Jeannelle

## Contexte

| Table | HOPE | Jeannelle |
|-------|------|-----------|
| formes_galeniques | 47 | 0 |
| famille_produit | 44 | 0 |
| rayons_produits | 25 | 0 |
| categorie_tarification | 9 | 0 |
| dci | 625 | 0 |
| classes_therapeutiques | 44 | 0 |
| laboratoires | 806 | 0 |
| produits | 2847 | 0 |
| produits_dci | 854 | 0 |

- **Source** : `102232f2-6a8c-4555-b288-4c1f118a81a0` (Pharmacie HOPE)
- **Cible** : `aaf036e4-8316-4ed7-af49-8bec87035550` (Pharmacie Jeannelle)

## Approche

Créer une **RPC `SECURITY DEFINER`** qui copie toutes les tables référentielles en une seule transaction, en remappant les IDs (les FK dans `produits` pointent vers les anciennes IDs HOPE, il faut les remapper vers les nouvelles IDs Jeannelle).

### Ordre d'insertion (respect des FK)
1. `classes_therapeutiques` (pas de FK sortante)
2. `formes_galeniques` (pas de FK sortante)
3. `famille_produit` (pas de FK sortante)
4. `rayons_produits` (pas de FK sortante)
5. `categorie_tarification` (pas de FK sortante)
6. `laboratoires` (pas de FK sortante)
7. `dci` (FK → `classes_therapeutiques`)
8. `produits` (FK → famille, rayon, forme, dci, classe, categorie, laboratoires)
9. `produits_dci` (FK → produits, dci)

### Logique de la RPC

```sql
CREATE OR REPLACE FUNCTION public.clone_tenant_referential(
  p_source_tenant uuid,
  p_target_tenant uuid
) RETURNS jsonb ...
```

Pour chaque table :
1. Insérer les lignes avec `tenant_id = p_target_tenant` et de nouveaux UUIDs
2. Stocker le mapping `ancien_id → nouveau_id` dans des tables temporaires
3. Utiliser ces mappings pour remapper les FK dans les tables suivantes

### Sécurité
- `SECURITY DEFINER` + `SET LOCAL row_security = off` (bypass RLS)
- Vérifie que le tenant cible n'a pas déjà de données (évite les doublons)

## Fichier modifié
- **Nouvelle migration SQL** : RPC `clone_tenant_referential`

## Résultat attendu
Pharmacie Jeannelle aura une copie complète et indépendante du référentiel de Pharmacie HOPE, avec toutes les relations FK correctement remappées.

