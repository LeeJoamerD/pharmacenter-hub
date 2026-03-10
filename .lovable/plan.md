

# Fix: Crash Pharmacie HOPE — Matching O(n²) avec allocation massive de strings temporaires

## Diagnostic

J'ai analysé les données de chaque tenant en base :

| Tenant | Produits | Résultat |
|--------|----------|----------|
| DJL | 655 | OK |
| MAZAYU | 1818 | OK |
| SIRACIDE 38 | 2031 | OK |
| **Pharmacie HOPE** | **2349** | **CRASH** |

Le code de matching (lignes 474-492 de `ExcelParserService.ts`) utilise un algorithme **O(n × m)** : pour chaque référence (1243), il filtre TOUS les produits trouvés en créant 3 strings temporaires par produit à chaque itération :

```text
1243 refs × 2349 produits × 3 strings = ~8,7 millions de strings temporaires
vs DJL : 1243 × 655 × 3 = ~2,4 millions
```

C'est cette allocation massive qui fait dépasser le seuil mémoire de Chrome pour Pharmacie HOPE. Le seuil est marginal — 2031 produits (SIRACIDE) passe, 2349 (HOPE) ne passe pas.

## Solution

Remplacer le matching O(n²) par un **index Map O(1)** : construire 3 Maps de lookup (code_cip → produit, ancien_code_cip → produit, code_barre_externe → produit) une seule fois, puis chercher chaque référence en O(1).

Résultat : ~2349 strings créées une fois au lieu de ~8,7 millions.

## Fichier modifié

**`src/services/ExcelParserService.ts`** — lignes 470-492

Remplacer :
```typescript
const produits = [...produitsMap.values()];
// ... boucle O(n²) avec .filter()
```

Par :
```typescript
// Build O(1) lookup maps (one-time cost)
const cipMap = new Map<string, any>();
const ancienCipMap = new Map<string, any>();
const barcodeMap = new Map<string, any>();

for (const p of produitsMap.values()) {
  const cip = String(p.code_cip || '').trim();
  const ancien = String(p.ancien_code_cip || '').trim();
  const barcode = String(p.code_barre_externe || '').trim();
  if (cip) cipMap.set(cip, p);
  if (ancien) ancienCipMap.set(ancien, p);
  if (barcode) barcodeMap.set(barcode, p);
}

// O(1) lookup per reference
for (const ref of references) {
  const normalizedRef = String(ref).trim();
  const match = cipMap.get(normalizedRef)
    || ancienCipMap.get(normalizedRef)
    || barcodeMap.get(normalizedRef);
  
  if (match) {
    matched.set(ref, match.id);
    productCategories.set(ref, match.categorie_tarification_id || null);
  } else {
    notFound.push(ref);
  }
}
```

Aucun autre fichier modifié. Aucun changement de logique métier.

