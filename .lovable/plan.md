
# Fix: Bouton "Fiche VIDAL" affiche toujours "Non disponible"

## Diagnostic

Le probleme est identifie : la fonction `handleVidalLookup` cherche le `vidal_product_id` dans la table `catalogue_global_produits`, mais sur 10 300 produits du catalogue global, **un seul** a un `vidal_product_id` renseigne. Tous les produits locaux correspondent a des enregistrements globaux dont le champ est `NULL`, d'ou le message "Non disponible" systematique.

## Solution

Modifier `handleVidalLookup` dans `ProductCatalogNew.tsx` pour ajouter un **fallback vers l'API VIDAL en temps reel** quand aucun `vidal_product_id` n'est trouve dans le catalogue global :

1. Tentative actuelle : chercher `vidal_product_id` dans `catalogue_global_produits` par `code_cip`
2. **Nouveau fallback** : si pas de `vidal_product_id`, appeler l'Edge Function `vidal-search` avec `action: 'search'`, `searchMode: 'cip'`, `query: code_cip`
3. Si un package est retourne, extraire son `productId` et ouvrir la fiche VIDAL
4. Optionnellement, mettre a jour le `vidal_product_id` dans `catalogue_global_produits` pour les futures consultations (cache)

## Fichier modifie

- `src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx` : modifier la fonction `handleVidalLookup` (lignes 502-529)

## Section technique

### Logique modifiee de `handleVidalLookup`

```text
1. Verifier que le produit a un code_cip
2. Chercher vidal_product_id dans catalogue_global_produits (existant)
3. SI trouve -> ouvrir VidalProductSheet (existant)
4. SINON -> appeler vidal-search edge function:
   POST /vidal-search
   { action: "search", searchMode: "cip", query: code_cip }
5. SI packages retournes avec un productId:
   a. Ouvrir VidalProductSheet avec ce productId
   b. Mettre a jour catalogue_global_produits.vidal_product_id (UPDATE WHERE code_cip = ...)
6. SINON -> afficher toast "Non disponible"
```

### Appel Edge Function (fallback)

L'Edge Function `vidal-search` supporte deja `searchMode: 'cip'` qui appelle `/packages?code={cip}`. Les packages retournes contiennent un champ `productId` utilisable pour ouvrir la fiche produit.

Aucune migration SQL ni modification de l'Edge Function n'est necessaire.
