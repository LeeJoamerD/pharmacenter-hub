

# Plan de correction - Erreur 404 get_pos_products

## Diagnostic confirmé

L'erreur 404 sur `get_pos_products` est causée par une migration SQL qui fait référence à une table inexistante. Les logs Postgres confirment l'erreur : `relation "categories" does not exist`.

### Erreurs dans la migration précédente

| Référence incorrecte | Correction nécessaire |
|---------------------|----------------------|
| `LEFT JOIN categories c ON c.id = p.categorie_id` | `LEFT JOIN famille_produit f ON f.id = p.famille_id` |
| `c.libelle_categorie` | `f.libelle_famille` |

## Solution

Recréer les fonctions RPC avec les bons noms de tables et colonnes.

### Fichier SQL à exécuter

Une nouvelle migration sera créée pour corriger les fonctions :

```sql
-- Corriger get_pos_products
DROP FUNCTION IF EXISTS public.get_pos_products(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_pos_products(...)
  ...
  -- Changement ligne 118 :
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  -- Changement ligne 73 :
  COALESCE(f.libelle_famille, 'Non catégorisé') AS category
  ...

-- Corriger search_product_by_barcode
DROP FUNCTION IF EXISTS public.search_product_by_barcode(uuid, text);

CREATE OR REPLACE FUNCTION public.search_product_by_barcode(...)
  ...
  -- Même corrections
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  COALESCE(f.libelle_famille, 'Non catégorisé') AS category
  ...
```

### Modifications apportées

1. `categories` remplacé par `famille_produit`
2. `p.categorie_id` remplacé par `p.famille_id`
3. `c.libelle_categorie` remplacé par `f.libelle_famille`
4. L'alias passe de `c` à `f` pour cohérence

## Changements techniques complets

### get_pos_products - Corrections

**Ligne 73 (colonne catégorie)** :
```sql
-- Avant
COALESCE(c.libelle_categorie, 'Non catégorisé') AS category

-- Après
COALESCE(f.libelle_famille, 'Non catégorisé') AS category
```

**Ligne 117-118 (jointures)** :
```sql
-- Avant
FROM produits p
LEFT JOIN dci d ON d.id = p.dci_id
LEFT JOIN categories c ON c.id = p.categorie_id

-- Après
FROM produits p
LEFT JOIN dci d ON d.id = p.dci_id
LEFT JOIN famille_produit f ON f.id = p.famille_id
```

### search_product_by_barcode - Corrections

Même pattern de correction pour la deuxième fonction.

## Résultat attendu

Après correction :
- Les fonctions RPC seront créées correctement
- Les produits s'afficheront à nouveau dans le POS
- La gestion des dates NULL restera en place comme prévu
- Les catégories afficheront le libellé de famille produit

## Fichiers concernés

| Type | Fichier |
|------|---------|
| Migration SQL | Nouvelle migration pour recréer les 2 fonctions RPC |

