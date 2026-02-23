
# Optimisation de la recherche "Importer depuis le catalogue global" + choix des prix

## Probleme actuel

Dans le modal "Ajouter un produit" (`ProductCatalogNew.tsx`), le bloc "Importer depuis le catalogue global" :
1. **Recherche uniquement par code CIP** via `searchGlobalCatalog()` qui fait un `ilike` sur `code_cip` puis `ancien_code_cip` de maniere sequentielle
2. **Pas de recherche par libelle** -- l'utilisateur doit connaitre le code CIP exact
3. **Pas de choix de prix** -- les prix BZV (Brazzaville) sont toujours importes par defaut, sans option pour choisir PNR (Pointe-Noire)

## Solution

### 1. Creer un composant `GlobalCatalogSearchCombobox`

**Fichier** : `src/components/ui/global-catalog-search-combobox.tsx`

Un combobox serveur-side (meme pattern que `ProductSearchCombobox`) qui :
- Recherche avec debounce 400ms sur `catalogue_global_produits`
- Filtre par `libelle_produit ILIKE`, `code_cip ILIKE` et `ancien_code_cip ILIKE` (via `.or()`)
- Limite a 50 resultats par requete (pas de probleme de limite 1000)
- Affiche chaque resultat avec libelle + code CIP pour faciliter l'identification
- Utilise `shouldFilter={false}` sur le Command pour desactiver le filtre client
- Retourne l'objet `GlobalCatalogProduct` complet au parent via callback `onSelect`

### 2. Ajouter le choix de prix (BZV / PNR)

Dans le bloc bleu "Importer depuis le catalogue global" de `ProductCatalogNew.tsx` :
- Ajouter un `RadioGroup` avec deux options :
  - **Prix BZV** (defaut) : utilise `prix_achat_reference` / `prix_vente_reference`
  - **Prix PNR** : utilise `prix_achat_reference_pnr` / `prix_vente_reference_pnr`
- Passer la region selectionnee a `mapToLocalReferences(globalProduct, priceRegion)`

### 3. Modifier `ProductCatalogNew.tsx`

- Remplacer le champ `Input` + bouton "Rechercher" par le nouveau `GlobalCatalogSearchCombobox`
- Ajouter un state `priceRegion` de type `PriceRegion` (defaut `'brazzaville'`)
- Ajouter le RadioGroup pour le choix des prix
- Dans le callback `onSelect` du combobox, appeler `mapToLocalReferences(product, priceRegion)` puis remplir les champs du formulaire (meme logique que `handleGlobalCatalogSearch` actuel)
- Supprimer les states `globalSearchInput` et `isSearchingGlobal` devenus inutiles (geres par le combobox)

## Details techniques

```text
Flux de recherche :
  Utilisateur tape "PARA" dans le combobox
    --> debounce 400ms
    --> SELECT id, code_cip, ancien_code_cip, libelle_produit, ...
        FROM catalogue_global_produits
        WHERE libelle_produit ILIKE '%PARA%'
           OR code_cip ILIKE '%PARA%'
           OR ancien_code_cip ILIKE '%PARA%'
        ORDER BY libelle_produit
        LIMIT 50
    --> Affiche les resultats dans le dropdown
    --> L'utilisateur selectionne un produit
    --> mapToLocalReferences(selectedProduct, priceRegion)
    --> Formulaire rempli automatiquement

RadioGroup prix :
  ( ) Prix BZV (Brazzaville) -- prix_achat_reference / prix_vente_reference
  ( ) Prix PNR (Pointe-Noire) -- prix_achat_reference_pnr / prix_vente_reference_pnr
```

### Fichiers modifies

| Fichier | Action |
|---|---|
| `src/components/ui/global-catalog-search-combobox.tsx` | Nouveau -- combobox avec recherche serveur |
| `src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx` | Modifier -- remplacer Input par combobox, ajouter RadioGroup prix |

### Aucune modification SQL necessaire

La table `catalogue_global_produits` contient deja les colonnes `code_cip`, `ancien_code_cip`, `libelle_produit`, `prix_achat_reference`, `prix_vente_reference`, `prix_achat_reference_pnr`, `prix_vente_reference_pnr`. La recherche se fait directement via `.or()` + `.ilike()` avec limite 50.
