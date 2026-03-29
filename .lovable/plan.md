
# Mise à jour du format d'étiquettes : 38 × 21.2 mm

## Changements

**Fichier :** `src/utils/labelPrinterEnhanced.ts`

### 1. Modifier le preset dans `LABEL_SIZES` (ligne 58)
- Ancien : `{ label: '39.9 × 20.2 mm (5/ligne)', width: 39.9, height: 20.2 }`
- Nouveau : `{ label: '38 × 21.2 mm (5/ligne)', width: 38, height: 21.2 }`

### 2. Modifier la détection du format (lignes 66, 246, 457)
- Remplacer toutes les comparaisons `Math.abs(width - 39.9) < 0.1 && Math.abs(height - 20.2) < 0.1` par `Math.abs(width - 38) < 0.1 && Math.abs(height - 21.2) < 0.1`

### 3. Modifier le layout config (lignes 69-79)
- `marginLeft: 10`, `marginTop: 10` (inchangé)
- `gapX: 0.2`, `gapY: 0.2` (au lieu de 0)
- `pitchX: 38.2` (38 + 0.2), `pitchY: 21.4` (21.2 + 0.2)
- `originX: 10`, `originY: 10` (inchangé)
- Recalculer `forcedLabelsPerCol` : avec originY=10, pitchY=21.4, sur A4 (297mm), environ 13 lignes → garder 13
- Recalculer `forcedLabelsPerRow` : avec originX=10, pitchX=38.2, sur A4 (210mm), (210-10)/38.2 = 5.2 → garder 5

### 4. Vérification des dimensions
- 5 colonnes : 10 + 5×38 + 4×0.2 = 10 + 190 + 0.8 = 200.8 mm (sur 210 A4) ✓
- 13 lignes : 10 + 13×21.2 + 12×0.2 = 10 + 275.6 + 2.4 = 288 mm (sur 297 A4) ✓

## Fichier modifié
- `src/utils/labelPrinterEnhanced.ts`
