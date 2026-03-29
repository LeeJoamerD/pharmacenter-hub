

# Ajustement des marges pour le format 39.9 × 20.2 mm

## Modification

**Fichier :** `src/utils/labelPrinterEnhanced.ts` (ligne 69)

Changer les marges du preset WinDev :

| Paramètre | Avant | Après |
|-----------|-------|-------|
| `marginTop` | 6 | 10 |
| `marginLeft` | 3 | 10 |

Ligne 69 devient :
```typescript
marginLeft: 10, marginTop: 10,
```

