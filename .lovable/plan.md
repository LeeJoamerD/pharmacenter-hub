

# Correction definitive du tri des lots

## Cause racine identifiee

Le probleme se situe dans la fonction SQL `search_lots_paginated` actuellement deployee en base de donnees. Voici le bug precis :

```text
Ligne 67:  json_agg(lot_data ORDER BY rn)     <-- trie par rn (numeros arbitraires)
Ligne 115: row_number() OVER () AS rn          <-- OVER() sans ORDER BY = numeros aleatoires!
Ligne 128: ORDER BY %s                         <-- tri correct, mais ignore par le rn
```

**Explication** : La requete selectionne correctement les 100 bons lots grace au `ORDER BY ... LIMIT ... OFFSET` dans la sous-requete. Mais ensuite, `row_number() OVER ()` attribue des numeros dans un ordre **arbitraire** (pas lie au ORDER BY). Puis `json_agg(lot_data ORDER BY rn)` reordonne les resultats selon ces numeros aleatoires, ce qui detruit l'ordre correct.

Ce probleme affecte tous les tris (date d'entree, date de peremption, stock, numero de lot).

## Correction

### Fichier : nouvelle migration SQL

Recreer la fonction `search_lots_paginated` avec une seule modification : retirer `ORDER BY rn` du `json_agg`. Puisque la sous-requete fournit deja les lignes dans le bon ordre via `ORDER BY %s`, le `json_agg(lot_data)` sans clause de tri preservera cet ordre. Le `row_number()` et son `ORDER BY rn` sont completement supprimes.

Changement concret dans le SQL :

```text
Avant:
  json_agg(lot_data ORDER BY rn)
  ...
  row_number() OVER () AS rn

Apres:
  json_agg(lot_data)
  ...
  (suppression de row_number() OVER () AS rn)
```

### Aucune modification frontend

Le hook `useLotsPaginated.ts` et le composant `LotTracker.tsx` restent inchanges. Le probleme est purement SQL.

## Impact

- Les lots du 23/02/2026 apparaitront en premier en tri decroissant sur "Date d'entree"
- Tous les tris (stock, date de peremption, numero de lot) fonctionneront correctement
- La pagination sera coherente entre toutes les pages

