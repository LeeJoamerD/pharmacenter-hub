
# Plan de Correction : Catégories de Tarification depuis le Catalogue Global

## Diagnostic

Le système importe tous les produits avec la catégorie "MEDICAMENTS" car la fonction `mapToLocalReferences` utilise le champ booléen `tva` au lieu du champ `libelle_categorie_tarification` du catalogue global.

### Code Actuel (Problématique)

```typescript
// useGlobalCatalogLookup.ts - ligne 485
findPricingCategory(globalProduct.tva)  // Utilise tva: boolean
```

Cette fonction `findPricingCategory` ne connaît que 2 catégories :
- `tva = true` → "PARAPHARMACIES AVEC TVA"
- `tva = false` → "MEDICAMENTS"

### Données Réelles Disponibles

Le catalogue global contient un champ `libelle_categorie_tarification` avec 6+ catégories :
- MEDICAMENTS
- PARAPHARMACIES AVEC TVA
- PARAPHARMACIES SANS TVA
- MEDICAMENTS AVEC TVA
- LAITS ET FARINES
- PETIT MATERIEL

## Solution

Modifier la fonction `mapToLocalReferences` pour utiliser `findOrCreatePricingCategoryByLabel` avec le champ `libelle_categorie_tarification` au lieu de `findPricingCategory` avec le booléen `tva`.

## Modification Requise

### Fichier : `src/hooks/useGlobalCatalogLookup.ts`

#### Changement dans `mapToLocalReferences` (lignes 478-486)

**Avant :**
```typescript
const [
  famille_id,
  rayon_id,
  forme_id,
  dci_ids,
  classe_therapeutique_id,
  laboratoires_id,
  categorie_tarification_id
] = await Promise.all([
  findOrCreateFamily(globalProduct.libelle_famille),
  findOrCreateRayon(globalProduct.libelle_rayon),
  findOrCreateForme(globalProduct.libelle_forme),
  findOrCreateMultipleDCIs(globalProduct.libelle_dci),
  findOrCreateClasseTherapeutique(globalProduct.libelle_classe_therapeutique),
  findOrCreateLaboratoire(globalProduct.libelle_laboratoire),
  findPricingCategory(globalProduct.tva)  // ← PROBLÈME ICI
]);
```

**Après :**
```typescript
const [
  famille_id,
  rayon_id,
  forme_id,
  dci_ids,
  classe_therapeutique_id,
  laboratoires_id,
  categorie_tarification_id
] = await Promise.all([
  findOrCreateFamily(globalProduct.libelle_famille),
  findOrCreateRayon(globalProduct.libelle_rayon),
  findOrCreateForme(globalProduct.libelle_forme),
  findOrCreateMultipleDCIs(globalProduct.libelle_dci),
  findOrCreateClasseTherapeutique(globalProduct.libelle_classe_therapeutique),
  findOrCreateLaboratoire(globalProduct.libelle_laboratoire),
  findOrCreatePricingCategoryByLabel(globalProduct.libelle_categorie_tarification)  // ← CORRECTION
]);
```

## Avantages de Cette Correction

| Aspect | Avant | Après |
|--------|-------|-------|
| Catégories supportées | 2 (MEDICAMENTS, PARAPHARMACIES AVEC TVA) | 6+ (toutes les catégories du catalogue global) |
| Source de données | Booléen `tva` | Champ `libelle_categorie_tarification` |
| Création automatique | Non | Oui (via findOrCreate pattern) |

## Comportement Attendu

1. Le système lit le code CIP du fichier Excel
2. Il recherche le produit dans `catalogue_global_produits`
3. Il récupère `libelle_categorie_tarification` (ex: "LAITS ET FARINES")
4. Il utilise `findOrCreatePricingCategoryByLabel` pour :
   - Rechercher la catégorie dans `categorie_tarification` du tenant
   - La créer si elle n'existe pas
   - Retourner son ID
5. Le produit est créé avec la bonne catégorie

## Impact Minimal

Cette modification n'affecte qu'une seule ligne de code et utilise une fonction déjà existante et testée (`findOrCreatePricingCategoryByLabel`).

## Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useGlobalCatalogLookup.ts` | Remplacer `findPricingCategory(globalProduct.tva)` par `findOrCreatePricingCategoryByLabel(globalProduct.libelle_categorie_tarification)` dans la fonction `mapToLocalReferences` |
