
# Correction des dimensions d'etiquettes 39.9 x 20.2 mm (Premier plan)

## Fichier unique a modifier : `src/utils/labelPrinterEnhanced.ts`

### Modification 1 : `getLayoutConfig` (lignes 65-79)

Ajouter `marginRight`, `marginBottom`, `forcedLabelsPerRow` et `forcedLabelsPerCol` :

```typescript
function getLayoutConfig(width: number, height: number) {
  const isWinDevFormat = width === 39.9 && height === 20.2;
  if (isWinDevFormat) {
    return {
      marginLeft: 3, marginTop: 5,
      marginRight: 2.5, marginBottom: 5,
      gapX: 0.5, gapY: 1.5,
      padding: 1,
      forcedLabelsPerRow: 5 as number | null,
      forcedLabelsPerCol: 13 as number | null
    };
  }
  return {
    marginLeft: 5, marginTop: 5,
    marginRight: 5, marginBottom: 5,
    gapX: 0, gapY: 0,
    padding: 1.5,
    forcedLabelsPerRow: null as number | null,
    forcedLabelsPerCol: null as number | null
  };
}
```

### Modification 2 : Calcul dans `printEnhancedLabels` (lignes 150-151)

Remplacer la formule incorrecte par :

```typescript
const usableWidth = pageWidth - layout.marginLeft - layout.marginRight;
const usableHeight = pageHeight - layout.marginTop - layout.marginBottom;
const labelsPerRow = layout.forcedLabelsPerRow
  ?? Math.floor((usableWidth + layout.gapX) / (width + layout.gapX));
const labelsPerCol = layout.forcedLabelsPerCol
  ?? Math.floor((usableHeight + layout.gapY) / (height + layout.gapY));
```

### Modification 3 : Meme calcul dans `printLotLabels` (lignes 344-345)

Appliquer exactement la meme correction que ci-dessus.

### Resultat attendu

- 5 etiquettes par ligne, 13 lignes par page = **65 etiquettes par page A4**
- Marges papier : haut 5mm, bas 5mm, gauche 3mm, droite 2.5mm
- Espacement : 0.5mm horizontal, 1.5mm vertical
- Padding interne : 1mm
- Contenu des etiquettes inchange
