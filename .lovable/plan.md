

# Defaults pour la section Étiquettes du module Stock

## Changements dans `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

### 1. Onglet actif par défaut → "Par Réception"
- Ligne 24 : changer `useState<'products' | 'lots' | 'receptions'>('products')` → `('receptions')`

### 2. Taille d'étiquette par défaut → 38 × 21.2 mm
- Dans `src/utils/labelPrinterEnhanced.ts`, ligne 48-49 : changer `width: 50, height: 30` → `width: 38, height: 21.2`

### 3. Options d'affichage par défaut
- Dans `src/utils/labelPrinterEnhanced.ts`, ligne 53 : changer `includeExpiry: false` → `includeExpiry: true`
- `includeDci` est déjà `true` par défaut (ligne 51), rien à changer

## Fichiers modifiés
- `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx` (1 ligne)
- `src/utils/labelPrinterEnhanced.ts` (3 valeurs dans `DEFAULT_CONFIG`)

