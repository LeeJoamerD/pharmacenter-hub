
# Correction du badge "Detaillable" et du bouton "Detailler" pour les produits de niveau 2

## Probleme

Dans `LotTracker.tsx`, la condition `isDetailable` (ligne 431) verifie `lot.produit?.niveau_detail === 1`. Cela exclut les produits de niveau 2 qui ont eux-memes un produit detail de niveau 3.

Le produit "LEUKOPLAST S 5MX18CM PERF (D) 1M" (CIP 2257654-2) est de niveau 2. Il possede un produit detail configure (niveau 3), mais il n'affiche ni le badge "Detaillable" ni le bouton actif.

## Correction

**Fichier** : `src/components/dashboard/modules/stock/LotTracker.tsx`

**Modification** : Remplacer la condition stricte `niveau_detail === 1` par `(niveau_detail ?? 1) < 3`.

Avant :
```
const isDetailable = lot.produit?.niveau_detail === 1 && ...
```

Apres :
```
const isDetailable = (lot.produit?.niveau_detail ?? 1) < 3 && ...
```

Cela permet aux produits de niveau 1 et 2 d'afficher le badge et le bouton, a condition qu'ils aient un produit detail configure (`produit_detail` non vide avec `quantite_unites_details_source > 0`). Les produits de niveau 3 restent exclus (pas de niveau 4).

Aucune autre modification necessaire : la requete de donnees (RPC `search_lots_paginated`) charge deja `produit_detail` pour tous les niveaux.
