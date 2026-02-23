
# Optimisation de la recherche produit dans le modal Ajustement de Stock

## Probleme identifie

Dans `StockAdjustments.tsx`, le selecteur de produit utilise :
1. **`useProducts()`** qui fait un `select('*')` sur `produits_with_stock` sans filtre tenant ni limite -- retourne au maximum 1000 lignes (limite Supabase), donc les produits au-dela de 1000 sont invisibles
2. **Un composant `Select` basique** (Radix) sans champ de recherche -- il faut defiler manuellement parmi potentiellement des centaines de produits

Le composant `Combobox` utilise dans le catalogue (`ProductCatalogNew.tsx`) offre un champ de recherche, mais filtre uniquement cote client sur des donnees pre-chargees (meme limite de 1000).

## Solution

### 1. Creer un composant `ProductSearchCombobox` (nouveau fichier)

**Fichier** : `src/components/ui/product-search-combobox.tsx`

Un combobox specialise qui effectue la recherche **cote serveur** avec :
- Un champ de saisie avec debounce (400ms)
- Une requete Supabase paginee : `produits_with_stock` filtree par `tenant_id`, `is_active = true`, et `ilike` sur `libelle_produit` et `code_cip`
- Limite a 50 resultats par recherche (pas besoin de pagination infinie -- l'utilisateur affine sa recherche)
- Affichage du code CIP en description pour faciliter l'identification
- Gestion des etats : chargement, aucun resultat, erreur
- Meme apparence visuelle que le `Combobox` existant (Popover + Command)

### 2. Modifier `StockAdjustments.tsx`

- **Supprimer** l'import et l'utilisation de `useProducts()` (ligne 19 et 44)
- **Remplacer** le `Select` produit (lignes 220-226) par le nouveau `ProductSearchCombobox`
- Le composant recoit `value`, `onValueChange`, `tenantId` comme props

### 3. Aucune modification SQL necessaire

La requete utilise directement la vue `produits_with_stock` existante avec des filtres `ilike` -- pas de nouvelle RPC requise. La limite de 50 resultats par recherche evite tout probleme de performance.

## Details techniques

```text
Flux de recherche :
  Utilisateur tape "para" 
    --> debounce 400ms 
    --> SELECT id, libelle_produit, code_cip 
        FROM produits_with_stock 
        WHERE tenant_id = X 
          AND is_active = true 
          AND (libelle_produit ILIKE '%para%' OR code_cip ILIKE '%para%')
        ORDER BY libelle_produit 
        LIMIT 50
    --> Affiche les resultats dans le dropdown
```

Le composant charge aussi les 50 premiers produits a l'ouverture (recherche vide) pour que l'utilisateur puisse parcourir sans forcement taper.
