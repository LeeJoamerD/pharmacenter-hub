

# Ajout de la colonne "En Stock" dans les composants Commandes et Excel

## Contexte
- **OrderForm** (Nouvelle Commande) et **EditOrderTab** (Modification) affichent des tableaux de lignes de commande avec colonnes Produit, Référence, Cat. Tarification, Quantité, Prix Unitaire, Remise, Total, Actions.
- Le hook `useProductsForOrders` utilise la vue `produits_with_stock` qui contient déjà `stock_actuel`.
- **OrderExcelService** génère un fichier Excel depuis OrderList mais n'inclut pas le stock.

## Modifications

### 1. `OrderForm.tsx` — Ajouter "En Stock" dans le tableau
- Ajouter `stockActuel` à l'interface `OrderLine`
- Dans `addOrderLine`, stocker `product.stock_actuel` dans la nouvelle propriété
- Dans `addProductsFromSuggestions`, stocker aussi le stock (via lookup dans searchResults ou valeur par défaut 0)
- Ajouter `<TableHead>En Stock</TableHead>` entre Total et Actions (ligne 665-666)
- Ajouter `<TableCell>{line.stockActuel ?? 0}</TableCell>` entre le total et le bouton supprimer

### 2. `EditOrderTab.tsx` — Ajouter "En Stock" dans le tableau
- Les lignes viennent de `useOrderLines` qui fetch depuis `lignes_commande_fournisseur` avec le produit. Le stock n'est pas inclus.
- Approche : faire un fetch batch des stocks des produits des lignes de commande via `produits_with_stock` pour récupérer `stock_actuel` par `produit_id`, stocké dans un Map `productStocks`.
- Ajouter `<TableHead>En Stock</TableHead>` entre Total et Actions (ligne 726-727)
- Ajouter `<TableCell>{productStocks.get(line.produit_id) ?? 0}</TableCell>`

### 3. `OrderExcelService.ts` — Ajouter colonne "En Stock" dans l'Excel
- Ajouter `stock_actuel?: number` à l'interface `OrderExcelLine`
- Ajouter `'En Stock': line.stock_actuel ?? 0` dans `lignesData` (après 'Total Ligne HT')
- Ajouter la largeur de colonne correspondante

### 4. `OrderList.tsx` — Passer le stock dans les données Excel
- Dans `handleDownloadExcel`, le fetch des lignes ne ramène pas le stock. Ajouter un fetch batch depuis `produits_with_stock` pour les `produit_id` des lignes, puis mapper `stock_actuel` dans chaque ligne passée à `OrderExcelService`.

### Fichiers modifiés
- `src/components/dashboard/modules/stock/OrderForm.tsx`
- `src/components/dashboard/modules/stock/EditOrderTab.tsx`
- `src/services/OrderExcelService.ts`
- `src/components/dashboard/modules/stock/OrderList.tsx`

