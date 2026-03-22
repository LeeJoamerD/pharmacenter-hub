

# Correction colonne "Produits" (articles) dans les listes Commandes et Réceptions

## Problème
1. **OrderList** : la colonne "Produits" affiche toujours "0 articles" car `order.nb_produits` n'existe pas dans les données retournées par `useSupplierOrders`. Le hook ne fetch que `*, fournisseur(nom, email)` — pas de comptage des lignes de commande.
2. **ReceptionHistory** : aucune colonne "Produits" n'existe dans le tableau.

## Solution

### 1. `useSupplierOrders.ts` — Ajouter un sous-select count des lignes
Modifier la requête Supabase pour inclure le comptage des lignes de commande via une relation imbriquée :
```
lignes_commande_fournisseur(count)
```
Puis exposer le count dans chaque order retourné.

### 2. `OrderList.tsx` — Utiliser le count réel
Remplacer `order.nb_produits || 0` par le count issu de la relation `lignes_commande_fournisseur`. Le mapping dans `ordersWithTotals` extraira le count depuis `order.lignes_commande_fournisseur[0].count`.

### 3. `useReceptions.ts` — Ajouter un sous-select count des lignes de réception
Même approche : ajouter `lignes_reception_fournisseur(count)` dans le select.

### 4. `ReceptionHistory.tsx` — Ajouter la colonne "Produits"
- Ajouter un `<TableHead>` "Produits" dans le header (entre Référence et Statut)
- Ajouter un `<TableCell>` affichant `{reception.lignes_reception_fournisseur?.[0]?.count || 0} articles`
- Mettre à jour le `colSpan` de la ligne vide

### Fichiers modifiés
- `src/hooks/useSupplierOrders.ts`
- `src/components/dashboard/modules/stock/OrderList.tsx`
- `src/hooks/useReceptions.ts`
- `src/components/dashboard/modules/stock/ReceptionHistory.tsx`

