

## Plan: Refonte du module Unites Gratuites

### Etat actuel
- `FreeUnitsTab.tsx` : formulaire de saisie UG avec reception obligatoire, recherche produit locale (via `useProducts` qui charge tout), pas d'historique, pas de pagination.
- `ProductSearchCombobox` existe deja pour la recherche serveur-side avec debounce 400ms et limite 50.

### Modifications

#### 1. Restructurer `FreeUnitsTab.tsx` en conteneur avec bascule

Ajouter un toggle (boutons ou tabs) entre **"Saisie des UG"** et **"Historique des UG"**. Le conteneur gere l'etat actif et rend le sous-composant correspondant.

#### 2. Nouveau composant `FreeUnitsEntryForm.tsx`

Reprend la logique actuelle avec ces changements :

- **Reception non obligatoire** : le champ Select reste mais n'est plus requis pour sauvegarder. Retirer la validation `if (!selectedReceptionId)` et la condition `{selectedReceptionId && ...}` qui masque la recherche produit.
- **Champ Source UG** : ajouter un Select avec les options : `Reception`, `Don ou legue`, `Stock Orphelin`, `Autre`. Affiché avant le champ reception. Si source = "Reception", montrer le select de reception. Sinon le masquer.
- **Recherche produit via `ProductSearchCombobox`** : remplacer la recherche locale (`useProducts` + filtre memoire) par le composant existant `ProductSearchCombobox` qui cherche dans la table `produits` cote serveur. Adapter le callback `onValueChange` pour fetcher les details complets du produit selectionne (prix_achat, categorie_tarification_id) puis appeler `addProduct`.
- **Prix du catalogue** : quand un produit est selectionne, pre-remplir `prixAchat` avec `product.prix_achat` du catalogue au lieu de 0. Les calculs (HT, TVA, centime, TTC) se declenchent immediatement via `calculatePricing`.
- Retirer `useProducts` (plus necessaire).

#### 3. Nouveau composant `FreeUnitsHistory.tsx`

- Afficher l'historique des receptions UG (filtrer par `notes ILIKE '%UG%'` ou un marqueur).
- Recherche serveur-side avec debounce 400ms.
- Pagination : utiliser `useState` pour page/pageSize, requete avec `.range()` et `count: 'exact'` pour afficher le total. Composant `Pagination` existant.
- Colonnes : date, numero reception, fournisseur, source, nombre de lignes, agent, statut.
- Possibilite d'expandre pour voir les lignes detaillees.
- Tri par colonnes (date, numero).

#### 4. Adaptation `ProductSearchCombobox`

Creer une variante ou ajouter un prop `onSelectFull` qui retourne l'objet produit complet (avec prix_achat, categorie_tarification_id) au lieu du simple id. Cela evite un second fetch apres selection. Modifier la requete pour inclure `prix_achat, categorie_tarification_id` dans le select.

### Fichiers a creer
- `src/components/dashboard/modules/stock/free-units/FreeUnitsEntryForm.tsx`
- `src/components/dashboard/modules/stock/free-units/FreeUnitsHistory.tsx`

### Fichiers a modifier
- `src/components/dashboard/modules/stock/FreeUnitsTab.tsx` — conteneur avec bascule
- `src/components/ui/product-search-combobox.tsx` — ajouter props pour retourner l'objet complet et inclure prix_achat/categorie_tarification_id dans la requete

