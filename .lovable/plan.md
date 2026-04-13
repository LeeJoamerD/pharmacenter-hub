

# Fix: Code-barres lot non trouvé au POS (plan mis à jour)

## Problème supplémentaire identifié

Le lecteur de code-barres physique envoie `LOT°UBIP°260411°00114` (avec `°`) mais la base de données stocke `LOT-UBIP-260411-00114` (avec `-`). La correspondance exacte échoue à cause de cette différence de séparateur. Il faut **normaliser** les séparateurs avant la recherche.

## Corrections (3 points)

### 1. `src/utils/barcodeScanner.ts` — `maxLength: 50`

Passer de 20 à 50 pour accepter les codes longs.

### 2. `src/utils/barcodeScanner.ts` ou `usePOSProductsPaginated.ts` — Normaliser `°` en `-`

Avant d'envoyer le code-barres à la recherche, remplacer tous les `°` par `-` :

```typescript
const normalizedBarcode = barcode.replace(/°/g, '-');
```

Ceci garantit que `LOT°UBIP°260411°00114` devient `LOT-UBIP-260411-00114`, qui correspond au `code_barre` en base.

### 3. Migration SQL — `search_product_by_barcode` élargi

Modifier la RPC pour :
- Chercher dans `code_barre` ET `numero_lot`
- Supporter la correspondance par préfixe (LIKE)
- Normaliser aussi côté SQL (`REPLACE(p_barcode, '°', '-')`) en sécurité supplémentaire

```sql
-- Normaliser le code-barres entrant
v_barcode := REPLACE(p_barcode, '°', '-');

WHERE (
  l.code_barre = v_barcode
  OR l.numero_lot = v_barcode
  OR v_barcode LIKE l.code_barre || '%'
  OR l.code_barre LIKE v_barcode || '%'
  OR v_barcode LIKE l.numero_lot || '%'
  OR l.numero_lot LIKE v_barcode || '%'
)
```

## Résumé des fichiers

| Fichier | Modification |
|---------|-------------|
| `src/utils/barcodeScanner.ts` | `maxLength: 50` |
| `src/hooks/usePOSProductsPaginated.ts` | Normaliser `°` → `-` avant recherche |
| Migration SQL | RPC `search_product_by_barcode` : normalisation `°` → `-`, recherche dans `numero_lot`, correspondance préfixe |

## Flux corrigé

1. Scanner lit l'étiquette → envoie `LOT°UBIP°260411°00114`
2. Le frontend normalise en `LOT-UBIP-260411-00114`
3. La RPC cherche dans `code_barre` → correspondance exacte trouvée
4. Le produit PROGYNANCE 200MG OVULES B/30 est affiché

