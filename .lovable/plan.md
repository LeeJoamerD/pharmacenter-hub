

# Correction : Produits incorrects affichés à la réception

## Problème identifié

Trois bugs liés au hook `useOrderLines` causent l'affichage de mauvais produits :

### Bug 1 : Boucle de re-rendu dans ReceptionForm (cause principale)

Le `useEffect` (ligne 243) dépend de `loadOrderDetails` qui est un `useCallback` dépendant de `orderLines`. Quand les données arrivent :

```text
orderLines change
  -> loadOrderDetails change de référence
    -> useEffect se re-déclenche
      -> reset receptionLines à []
        -> timeout 100ms
          -> recharge les données
```

Si entre temps un autre état asynchrone change (stockSettings, priceCategories), le cycle recommence avec potentiellement des données périmées ou vides.

### Bug 2 : useOrderLines() sans argument (charge TOUT)

- `StockApprovisionnementTab.tsx` ligne 32 : `useOrderLines()` -- charge les 10 000+ lignes, résultat jamais utilisé
- `OrderList.tsx` ligne 84 : `useOrderLines()` -- charge tout pour calculer des totaux par commande coté client

### Bug 3 : Commande CAMEPS dans la base

La commande CAMEPS sélectionnée (id: c678288a) contient 3 lignes en base (ASU DENK, SETRONAX x2), mais l'écran affiche des produits complètement différents (AZITHROMYCINE, ROSUTOR, PANADEX, PEPTEX), confirmant que les données chargées ne correspondent pas à la commande sélectionnée.

## Corrections

### Fichier 1 : `src/components/dashboard/modules/stock/ReceptionForm.tsx`

Remplacer le mécanisme de chargement pour éliminer la boucle :

- Supprimer le `useCallback` `loadOrderDetails` et le `useEffect` avec timeout
- Utiliser un `useEffect` simple qui réagit à `orderLines` et `orderLinesLoading` directement
- Ne réinitialiser les lignes que quand `selectedOrder` change (pas quand les données changent)
- Utiliser un `useRef` pour tracker l'ID de commande en cours et éviter les chargements parasites

Logique simplifiée :
```text
selectedOrder change ?
  -> reset receptionLines à []
  -> le hook useOrderLines(selectedOrder) lance la requête

orderLines mis à jour ET !loading ET selectedOrder correspond ?
  -> mapper orderLines vers receptionLines (une seule fois)
```

### Fichier 2 : `src/components/dashboard/modules/stock/tabs/StockApprovisionnementTab.tsx`

- Supprimer la ligne `const orderLines = useOrderLines();` (ligne 32) et l'import inutilisé
- Ce hook charge 10 000+ lignes pour rien

### Fichier 3 : `src/components/dashboard/modules/stock/OrderList.tsx`

- Supprimer `const { orderLines } = useOrderLines();` (ligne 84)
- Les totaux par commande sont déjà disponibles via `order.montant_ht`, `order.montant_ttc` etc. (lignes 116-120), rendant le chargement de toutes les lignes inutile
- Nettoyer le code qui filtre les lignes coté client

## Résultat attendu

- Sélectionner la commande CAMEPS affichera exactement 3 produits (ASU DENK, SETRONAX x2)
- Aucun flash ou rechargement parasite
- Performance améliorée : 3 lignes chargées au lieu de 10 000+

