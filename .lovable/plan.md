

# Deux corrections : Layout modal Ajustement + Build error supplyChainAutomationService

## 1. Modal "Créer un Ajustement de Stock" — Réorganisation des champs

**Fichier** : `src/components/dashboard/modules/stock/StockAdjustments.tsx` (lignes 219-234)

**Problème** : Le champ "Produit" et le champ "Lot" sont côte à côte dans un `grid-cols-2`, ce qui rend le champ Produit trop court et tronque les libellés.

**Solution** : Sortir le champ "Lot" du premier `grid-cols-2` et le placer en dessous du champ "Produit" sur toute la largeur, comme le champ "Raison de l'écart".

Nouveau layout :
```text
┌──────────────────────────────────────────────┐
│ Produit *                                    │  ← pleine largeur
│ [Sélectionner un produit________________]    │
├──────────────────────────────────────────────┤
│ Lot *                                        │  ← pleine largeur, en dessous
│ [Sélectionner un lot____________________]    │
├──────────────────────┬───────────────────────┤
│ Stock Théorique *    │ Stock Réel *          │  ← grid-cols-2 (inchangé)
├──────────────────────┴───────────────────────┤
│ Raison de l'écart *                          │  ← pleine largeur (inchangé)
└──────────────────────────────────────────────┘
```

Concrètement, remplacer le `div.grid.grid-cols-2` (lignes 219-234) par deux `div.space-y-2` successifs pour Produit puis Lot, chacun en pleine largeur.

## 2. Build error `supplyChainAutomationService.ts`

Le code source montre déjà `p.libelle_produit` aux lignes référencées. Le build error semble provenir d'un cache. Ajouter un commentaire de version pour forcer la recompilation.

## Fichiers modifiés
- `src/components/dashboard/modules/stock/StockAdjustments.tsx`
- `src/services/supplyChainAutomationService.ts` (force rebuild)

