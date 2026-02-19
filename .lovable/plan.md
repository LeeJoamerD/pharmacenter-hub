

# Ajouter le tri alphabetique par nom de produit pour les inventaires "Session de Vente"

## Objectif

Quand l'inventaire selectionne est de type "vente" (Inventaire Session de Vente), ajouter un bouton/option de tri permettant de classer la liste des produits par ordre alphabetique (A-Z ou Z-A).

## Modifications

### Fichier : `src/components/dashboard/modules/stock/InventoryEntry.tsx`

**A) Ajouter un etat pour le tri** (apres ligne 73, dans les declarations de state) :
- Nouveau state : `sortOrder` de type `'default' | 'az' | 'za'`, initialise a `'default'`

**B) Modifier le `filteredItems` memo** (lignes 114-135) : Apres le filtrage par statut et recherche, si `isVente` est vrai et `sortOrder` n'est pas `'default'`, trier le tableau par `item.produit` en ordre alphabetique (ascendant pour 'az', descendant pour 'za').

**C) Ajouter un controle de tri dans la section "Filtres et Recherche"** (lignes 527-556) : Ajouter un troisieme element dans la grille (passer a `md:grid-cols-3`) visible uniquement quand `isVente` est vrai. Ce controle sera un `Select` avec 3 options :
- "Ordre par defaut" (valeur `default`)
- "Nom du produit (A-Z)" (valeur `az`)
- "Nom du produit (Z-A)" (valeur `za`)

**D) Reset de la page** : Ajouter `sortOrder` dans le `useEffect` qui remet `currentPage` a 1 (ligne 146-148) pour eviter d'etre sur une page inexistante apres tri.

## Ce qui ne change pas

- Les autres types d'inventaire (complet, partiel, cyclique, reception) ne sont pas affectes
- Le filtrage par statut et la recherche restent identiques
- La pagination reste identique
