

# Ajouter le format d'etiquette WinDev (39.9 x 20.2 mm, 5 par ligne)

## Dimensions extraites de l'image

| Parametre | Valeur |
|-----------|--------|
| Papier | A4 Portrait (211 x 297 mm) |
| Marge papier haut | 5 mm |
| Marge papier bas | 5 mm |
| Marge papier gauche | 3 mm |
| Marge papier droite | 2.5 mm |
| Largeur etiquette | 39.9 mm |
| Hauteur etiquette | 20.2 mm |
| Espacement horizontal | 0.5 mm |
| Espacement vertical | 1.5 mm |
| Etiquettes par ligne | 5 |
| Retrait interne | 1 mm |

## Modifications prevues

### 1. `src/utils/labelPrinterEnhanced.ts`

**Ajouter la 4eme taille dans `LABEL_SIZES`** :
```typescript
export const LABEL_SIZES = [
  { label: '39.9 × 20.2 mm (5/ligne)', width: 39.9, height: 20.2 },
  { label: '40 × 30 mm', width: 40, height: 30 },
  { label: '50 × 30 mm', width: 50, height: 30 },
  { label: '60 × 40 mm', width: 60, height: 40 }
];
```

**Adapter la logique de mise en page PDF** dans `printEnhancedLabels` et `printLotLabels` :
- Detecter le format 39.9x20.2 et appliquer les marges specifiques (gauche 3mm, haut 5mm) et les espacements (0.5mm horizontal, 1.5mm vertical)
- Pour les autres tailles, conserver le comportement actuel (marges symetriques de 5mm, pas d'espacement)
- Ajuster le padding interne a 1mm pour ce format (au lieu de 1.5mm)

### 2. `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

Aucune modification necessaire : le composant utilise deja `LABEL_SIZES` de facon dynamique dans les 3 onglets (Produits, Lots, Par Reception). L'ajout dans le tableau sera automatiquement visible partout.

## Details techniques

La fonction de calcul de position sera mise a jour pour gerer les espacements :
```text
Position actuelle:  x = marginX + col * width
Nouvelle position:  x = marginX + col * (width + gapX)
                    y = marginY + row * (height + gapY)
```

Les valeurs specifiques au format 39.9x20.2 seront definies dans un objet de configuration associe a cette taille pour eviter d'impacter les 3 formats existants.

