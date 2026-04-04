
## Diagnostic

L’erreur `42P10` ne vient pas des données cette fois-ci. Elle vient de la syntaxe SQL utilisée dans la fonction.

Dans le projet, l’unicité des produits n’est pas une contrainte simple sur `(tenant_id, code_cip)`. C’est un **index unique partiel** :

```sql
CREATE UNIQUE INDEX idx_produits_unique_code_cip
ON produits (tenant_id, code_cip)
WHERE code_cip IS NOT NULL
  AND code_cip != ''
  AND code_cip != '0'
  AND is_active = true;
```

Donc cette clause dans `clone_tenant_referential` est invalide :

```sql
ON CONFLICT (tenant_id, code_cip) DO NOTHING
```

Postgres refuse car elle ne correspond à **aucune contrainte/clé unique complète**.

## Correction à appliquer

Créer une nouvelle migration SQL qui remplace seulement la section `INSERT INTO produits` de `clone_tenant_referential`.

### Changement principal
Remplacer :

```sql
ON CONFLICT (tenant_id, code_cip) DO NOTHING
```

par :

```sql
ON CONFLICT DO NOTHING
```

## Pourquoi cette correction fonctionne

`ON CONFLICT DO NOTHING` sans cible :
- fonctionne aussi avec un **index unique partiel**
- évite l’erreur `42P10`
- garde l’objectif recherché : ne pas planter si un produit existe déjà

C’est cohérent avec le reste de la fonction, qui utilise déjà `ON CONFLICT DO NOTHING` sur les autres tables référentielles.

## Ce que je prévois dans la migration

1. `CREATE OR REPLACE FUNCTION public.clone_tenant_referential(...)`
2. conserver toutes les corrections déjà faites :
   - `classes_therapeutiques.systeme_anatomique`
   - vraies colonnes de `laboratoires`
   - section `produits` alignée sur le schéma réel
   - mapping résilient des `_map_*` avec `LIMIT 1`
   - reconstruction de `_map_produits`
   - remappage de `id_produit_source`
3. modifier uniquement la partie conflit de l’insert produits :
   - `ON CONFLICT (tenant_id, code_cip) DO NOTHING`
   - devient `ON CONFLICT DO NOTHING`

## Vérification après correction

Relancer dans le SQL Editor :

```sql
SELECT clone_tenant_referential(
  'aaf036e4-8316-4ed7-af49-8bec87035550',
  'a63f0388-4ef0-45cd-a416-f54cda0fc244'
);
```

Puis vérifier :
1. qu’il n’y a plus d’erreur `42P10`
2. que les produits sont bien clonés
3. que les produits détails ont bien leur `id_produit_source`
4. qu’un second lancement ne replante pas

## Détail technique

Le problème est lié à un **index unique partiel** sur `produits`, pas à une contrainte `UNIQUE (...)` classique.

```text
Index actuel :
(tenant_id, code_cip)
WHERE code_cip IS NOT NULL
  AND code_cip != ''
  AND code_cip != '0'
  AND is_active = true
```

Avec ce type d’index :
- `ON CONFLICT (tenant_id, code_cip)` ne matche pas automatiquement
- `ON CONFLICT DO NOTHING` est la forme la plus sûre ici

## Fichier concerné

- `supabase/migrations/20260404164636_b6db80c1-8fc1-497c-949e-4168bc810819.sql` sert de base logique
- nouvelle migration SQL à ajouter pour refaire `clone_tenant_referential`
