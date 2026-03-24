

# Modifications des commandes : boutons, doublons, import par période, quantité automatique et stock

## 4 points à corriger dans OrderForm et EditOrderTab

### 1. Boutons "Demandes" et "Stock Critique" → affichage simple (non cliquable)
**Fichiers** : `OrderForm.tsx` (lignes 520-548), `EditOrderTab.tsx` (lignes 644-653)

Remplacer les `<Button>` "Demandes" et "Stock Critique" par des `<Badge>` ou `<span>` non cliquables affichant seulement le compteur. Ces fonctionnalités restent accessibles uniquement via le panel "Suggestions Intelligentes".

Les boutons "Depuis Session" et "Suggestions" restent cliquables.

### 2. Dédoublonnage des produits dans les suggestions intelligentes
**Fichier** : `SmartOrderPanel.tsx`

Lors de l'agrégation dans chaque onglet (Demandes, Ruptures, Critiques, Faibles), s'assurer qu'un `produit_id` n'apparaît qu'une seule fois. Le hook `getProductsFromSession` agrège déjà par `produit_id` (ligne 258-285 de `useSmartOrderSuggestions.ts`), mais il faut aussi vérifier au niveau du panel que les suggestions combinées ne contiennent pas de doublons inter-onglets.

### 3. Import par période dans le modal "Depuis Session"
**Fichiers** : `SaleSelectionDialog.tsx`, `useSmartOrderSuggestions.ts`

- Ajouter un mode "Par période" avec deux champs Date Début / Date Fin dans le modal
- L'utilisateur bascule entre "Par session" (mode actuel) et "Par période" via des onglets ou un toggle
- En mode période : le système récupère automatiquement toutes les sessions dont `date_ouverture` est dans la plage `[dateDebut, dateFin+23:59:59]`
- Afficher un retour : "X sessions trouvées, Y produits (lignes)"
- Les produits de toutes les sessions sont agrégés par `produit_id` (quantités sommées)
- Les produits s'affichent dans le même écran de sélection (step 2) avec coches, "Tout sélectionner", et boutons Retour/Annuler/Importer

**Nouveau dans `useSmartOrderSuggestions.ts`** : ajouter une fonction `getProductsFromPeriod(dateStart, dateEnd)` :
1. Fetch sessions avec `date_ouverture >= dateStart AND date_ouverture <= dateEnd`
2. Fetch toutes les ventes de ces sessions
3. Fetch lignes_ventes, filtrer `niveau_detail = 1`, agréger par `produit_id`
4. Retourner `{ products, sessionCount, lineCount }`

### 4. Quantité à commander = seuil maximum − stock actuel
**Fichiers** : `OrderForm.tsx`, `EditOrderTab.tsx`

**4a. Quantité auto lors de l'ajout** :
- Dans `addOrderLine` (OrderForm) et `addOrderLine` (EditOrderTab), calculer :
  ```
  quantite = max(1, getStockThreshold('maximum', product.stock_limite, settings?.maximum_stock_threshold) - (product.stock_actuel ?? 0))
  ```
- Importer `getStockThreshold` depuis `@/lib/utils` et `useAlertSettings`
- Même logique dans `addProductsFromSuggestions` pour les deux composants

**4b. Vérification des doublons** :
- Dans `addOrderLine` (OrderForm), vérifier `existingProductIds.has(product.id)` avant d'ajouter. Si existant, afficher un toast et ne rien faire.
- Dans `addOrderLine` (EditOrderTab), vérifier `existingProductIdsArray.includes(product.id)` avant de créer la ligne.

**4c. Colonne "En Stock" affiche 0 dans OrderForm** :
- Le problème : `addOrderLine` stocke `product.stock_actuel` mais `useProductsForOrders` récupère bien `stock_actuel` depuis `produits_with_stock`. La valeur devrait être correcte.
- Vérifier que la vue `produits_with_stock` remonte bien `stock_actuel`. Si le champ est bien présent dans les données de recherche, le bug est probablement dans `addProductsFromSuggestions` qui utilise `(suggestion as any).stock_actuel ?? 0` — les suggestions n'ont pas toujours `stock_actuel`. Il faut faire un fetch batch pour récupérer le stock réel lors de l'ajout depuis suggestions.
- Ajouter un fetch batch `produits_with_stock` dans `addProductsFromSuggestions` de OrderForm pour remplir `stockActuel` correctement.

## Fichiers modifiés
- `src/components/dashboard/modules/stock/OrderForm.tsx`
- `src/components/dashboard/modules/stock/EditOrderTab.tsx`
- `src/components/dashboard/modules/stock/SaleSelectionDialog.tsx`
- `src/hooks/useSmartOrderSuggestions.ts`

