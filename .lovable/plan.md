
# Correction de la Fiche VIDAL - Aucune information trouvee

## Probleme identifie

La chaine d'erreur est la suivante :

1. Les produits du catalogue ont des codes CIP non-standards (ex: `3000000820841` pour ACTINAC LP 200MG) qui ne correspondent pas aux formats CIP13 (13 chiffres commencant par 3401) ou CIP7 standards
2. La recherche CIP utilise `/packages?code=CODE` qui fait une correspondance **large/partielle**, retournant des packages sans rapport (accessoires, cosmetiques)
3. `handleVidalLookup` prend aveuglement `packages[0].productId` qui vaut 258795 -- un produit factice "PRODUIT ACCESSOIRE EN ATTENTE"
4. La fiche s'ouvre avec ce productId fictif : tous les champs sont vides

De plus, certains produits (comme ACTINAC) ne sont tout simplement pas references dans la base VIDAL (recherche par nom = 0 resultat). Le systeme devrait detecter ce cas et afficher un message clair.

## Solution en 3 volets

### 1. Edge Function `vidal-search` : ajouter une recherche exacte par code

Ajouter un nouveau `searchMode: 'exact-code'` qui utilise l'endpoint officiel VIDAL documente dans le manuel :
```
/rest/api/search?q=&code=CODE&filter=package
```
Cet endpoint fait une correspondance **exacte** sur le code, contrairement a `/packages?code=` qui est trop large.

### 2. `handleVidalLookup` (ProductCatalogNew.tsx) : validation et fallback

Refactorer la logique de recherche :

```
Etape 1 : Verifier le cache DB (vidal_product_id dans catalogue_global_produits)
        --> Si trouve et != 258795, ouvrir la fiche

Etape 2 : Recherche CIP exacte via 'exact-code'
        --> Valider que le package retourne a un CIP13/CIP7 qui correspond
        --> Si match exact trouve, cacher et ouvrir la fiche

Etape 3 : Fallback par nom du produit
        --> Recherche via /packages?q=NOM_PRODUIT
        --> Prendre le premier resultat s'il existe

Etape 4 : Aucun resultat
        --> Afficher toast "Ce produit n'est pas reference dans la base VIDAL"
        --> Ne PAS cacher de productId invalide
```

### 3. `VidalProductSheet.tsx` : detection des produits factices

Ajouter une verification apres le chargement : si `data.name` contient "PRODUIT ACCESSOIRE EN ATTENTE" ou si tous les champs cliniques sont vides (0 indications, 0 contre-indications, DCI vide, laboratoire vide), afficher un message d'erreur au lieu des donnees vides.

## Details techniques

### Fichiers modifies

1. **`supabase/functions/vidal-search/index.ts`**
   - Dans l'action `search`, ajouter un cas `searchMode === 'exact-code'` :
     ```
     url = `${baseUrl}/search?q=&code=${encodeURIComponent(query)}&filter=package&${authParams}`
     ```
   - Parser la reponse avec `parsePackageEntries` (meme format Atom)

2. **`src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx`**
   - Modifier `handleVidalLookup` :
     - Recherche exacte d'abord (`searchMode: 'exact-code'`)
     - Valider les resultats : `package.cip13 === code_cip || package.cip7 === code_cip`
     - Fallback par nom : extraire le nom du medicament (premier mot du libelle) et chercher via `searchMode: 'name'`
     - Exclure le productId 258795 (produit factice VIDAL) des resultats valides
     - Ne pas cacher un productId invalide

3. **`src/components/shared/VidalProductSheet.tsx`**
   - Apres reception des donnees, verifier si le produit est un placeholder :
     ```typescript
     const isDummy = data.name === 'PRODUIT ACCESSOIRE EN ATTENTE' 
       || (!data.company && !data.activeSubstances && data.indications.length === 0);
     ```
   - Si oui, afficher un message d'erreur : "Ce produit n'est pas reference dans la base VIDAL ou le code CIP est incorrect"

### Aucune migration SQL necessaire

Les tables existantes sont suffisantes. La colonne `vidal_product_id` dans `catalogue_global_produits` est deja nullable.
