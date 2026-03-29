

# Modification taille étiquettes 39.9 × 20.2 mm

## Fichier modifié
`src/utils/labelPrinterEnhanced.ts` — fonction `getLayoutConfig` (lignes 68-75)

## Changements

Dans le bloc `isWinDevFormat` :

| Paramètre | Avant | Après |
|-----------|-------|-------|
| `marginTop` | 5 | 6 (+1 mm) |
| `gapX` | 0.5 | 0 |
| `gapY` | 1.5 | 0 |

Ligne 69-71 devient :
```typescript
marginLeft: 3, marginTop: 6,
marginRight: 2.5, marginBottom: 5,
gapX: 0, gapY: 0,
```

