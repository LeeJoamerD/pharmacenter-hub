

# Fallback prix d'achat depuis le Catalogue Global

## Problème
Quand le fichier Excel importé ne contient pas de prix (colonne prix = 0), les lignes s'affichent avec un prix à 0 dans le tableau.

## Solution
Après le parsing et la validation du fichier Excel standard, ajouter une étape qui :
1. Lit la colonne A de chaque ligne pour déterminer la région (BZV, PNR, ou vide)
2. Pour chaque ligne dont `prixAchatReel === 0`, recherche le produit dans `catalogue_global_produits` via `code_cip` ou `ancien_code_cip`
3. Applique le prix selon la règle :
   - Colonne A = "PNR" → `prix_achat_reference_pnr`
   - Colonne A = "BZV" ou vide → `prix_achat_reference`

## Fichiers modifiés

### 1. `src/types/excelImport.ts`
- Ajouter un champ optionnel `regionCode?: string` à `ExcelReceptionLine` pour stocker la valeur de la colonne A

### 2. `src/services/ExcelParserService.ts`
- Dans `parseExcelFile`, lire la colonne A (index 0) et la stocker dans `line.regionCode`

### 3. `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`
- Après `parseFile` et `validateData`, ajouter une fonction `enrichPricesFromGlobalCatalog` qui :
  - Filtre les lignes avec `prixAchatReel === 0`
  - Récupère leurs références (code_cip)
  - Fait une requête chunked vers `catalogue_global_produits` pour récupérer `prix_achat_reference` et `prix_achat_reference_pnr`
  - Met à jour `prixAchatReel` selon le `regionCode` de chaque ligne
- Appeler cette fonction à la fin de `validateData`

