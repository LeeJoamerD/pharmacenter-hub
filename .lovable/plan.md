

# Plan de correction - Module Stock/Étiquettes/Lots

## Résumé des problèmes identifiés

| # | Problème | Localisation | Solution |
|---|----------|--------------|----------|
| 1 | **Quantité fixe** - Les étiquettes s'impriment avec `config.quantity` (1 par défaut) au lieu du stock réel | `labelPrinterEnhanced.ts` ligne 348 | Utiliser `lot.quantite_restante` pour déterminer le nombre d'étiquettes |
| 2 | **"DH" codé en dur** - Le symbole de devise Dirham Marocain apparaît au lieu de FCFA | `labelPrinterEnhanced.ts` lignes 267 et 457 + `LabelPrintingTab.tsx` lignes 357 et 535 | Utiliser `formatCurrencyAmount()` du utilitaire centralisé |
| 3 | **Options d'affichage manquantes** - L'onglet "Lots" n'a pas les checkboxes (DCI, lot, expiration) contrairement à "Produits" | `LabelPrintingTab.tsx` section lots (après ligne 402) | Ajouter les 3 checkboxes identiques à l'onglet Produits |
| 4 | **Options non respectées** - La fonction `drawLotLabel()` n'utilise pas les options du config | `labelPrinterEnhanced.ts` fonction `drawLotLabel()` ligne 382 | Passer le config et conditionner l'affichage |

---

## Fichiers à modifier

### 1. `src/utils/labelPrinterEnhanced.ts`

**A. Enrichir l'interface `LotLabelData`** (lignes 20-29)

Ajouter les champs nécessaires :
```typescript
export interface LotLabelData {
  id: string;
  code_barre: string;
  numero_lot: string;
  date_peremption: string | null;
  nom_produit: string;
  prix_vente: number;
  pharmacyName: string;
  supplierPrefix: string;
  // NOUVEAUX CHAMPS
  quantite_restante: number;     // Pour calculer le nombre d'étiquettes
  currencySymbol: string;        // Pour le formatage du prix
  dci?: string | null;           // Pour l'option "Inclure DCI"
}
```

**B. Modifier `printLotLabels()`** (lignes 310-377)

- Changer la logique de quantité pour utiliser `quantite_restante` au lieu de `config.quantity`
- Passer le `config` à `drawLotLabel()` pour respecter les options

```typescript
// Ligne 347-350 - Remplacer :
for (let q = 0; q < config.quantity; q++) {
  allLabels.push({ lot, barcodeImage });
}

// Par :
const labelCount = lot.quantite_restante || 1;
for (let q = 0; q < labelCount; q++) {
  allLabels.push({ lot, barcodeImage });
}
```

Et passer le config à drawLotLabel :
```typescript
// Ligne 368 - Ajouter config comme paramètre
drawLotLabel(pdf, lot, barcodeImage, x, y, width, height, config);
```

**C. Modifier `drawLotLabel()`** (lignes 382-465)

- Ajouter `config: LabelConfig` en paramètre
- Utiliser `formatCurrencyAmount()` pour le prix (remplacer ligne 457)
- Conditionner l'affichage du numéro de lot selon `config.includeLot`
- Conditionner l'affichage de la date d'expiration selon `config.includeExpiry`
- Ajouter l'affichage du DCI si `config.includeDci && lot.dci`

```typescript
import { formatCurrencyAmount } from '@/utils/currencyFormatter';

function drawLotLabel(
  pdf: jsPDF,
  lot: LotLabelData,
  barcodeImage: string | null,
  x: number, y: number,
  width: number, height: number,
  config: LabelConfig  // NOUVEAU PARAMÈTRE
): void {
  // ...
  
  // DCI (nouveau - après le nom produit)
  if (config.includeDci && lot.dci) {
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'italic');
    pdf.text(truncateText(lot.dci, 30), innerX + innerWidth / 2, currentY + 2, { align: 'center' });
    currentY += 3;
  }

  // Numéro de lot (conditionnel)
  if (config.includeLot) {
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Lot: ${lot.numero_lot}`, innerX + innerWidth / 2, currentY + 2, { align: 'center' });
    currentY += 3;
  }
  
  // ...
  
  // Prix avec formatage devise correct
  const price = formatCurrencyAmount(lot.prix_vente, lot.currencySymbol);
  pdf.text(price, innerX, currentY + 2.5);
  
  // Date expiration (conditionnel)
  if (config.includeExpiry && lot.date_peremption) {
    const expDate = formatExpiryDate(lot.date_peremption);
    pdf.text(`Exp: ${expDate}`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
  }
}
```

**D. Corriger aussi `drawLabel()` (produits)** (ligne 267)

Même problème de "DH" codé en dur - nécessite d'ajouter `currencySymbol` à `EnhancedLabelData` et utiliser `formatCurrencyAmount()`.

---

### 2. `src/hooks/useLotLabelPrinting.ts`

**A. Récupérer le DCI des produits** (lignes 49-64)

Ajouter le chargement des DCI :
```typescript
const [produitsResult, fournisseursResult, dciResult] = await Promise.all([
  supabase.from('produits').select('id, libelle_produit, dci_id').eq('tenant_id', tenantId),
  supabase.from('fournisseurs').select('id, nom').eq('tenant_id', tenantId),
  supabase.from('dci').select('id, nom_dci')  // NOUVEAU
]);

// Map DCI
const dciMap = new Map<string, string>();
if (dciResult.data) {
  dciResult.data.forEach(d => dciMap.set(d.id, d.nom_dci || ''));
}
```

**B. Enrichir `getLotsLabelsData()`** (lignes 130-146)

Ajouter les nouveaux champs dans le mapping :
```typescript
const getLotsLabelsData = useCallback((): LotLabelData[] => {
  const pharmacyInfo = getPharmacyInfo();
  const pharmacyName = pharmacyInfo?.name || 'PHARMACIE';
  const regionalSettings = getRegionalSettings();  // NOUVEAU
  const currencySymbol = regionalSettings?.currency?.symbol || 'FCFA';  // NOUVEAU

  return lots
    .filter(l => selectedLots.has(l.id) && l.code_barre)
    .map(lot => ({
      id: lot.id,
      code_barre: lot.code_barre!,
      numero_lot: lot.numero_lot,
      date_peremption: lot.date_peremption,
      nom_produit: lot.produit.libelle_produit,
      prix_vente: lot.prix_vente_ttc || 0,
      pharmacyName,
      supplierPrefix: lot.fournisseur?.nom?.substring(0, 3).toUpperCase() || '---',
      // NOUVEAUX CHAMPS
      quantite_restante: lot.quantite_restante,
      currencySymbol,
      dci: lot.produit.dci_nom || null
    }));
}, [lots, selectedLots, getPharmacyInfo, getRegionalSettings]);
```

**C. Mettre à jour l'interface `LotForLabel`** (lignes 14-28)

Ajouter `dci_nom` dans l'objet produit :
```typescript
export interface LotForLabel {
  id: string;
  numero_lot: string;
  code_barre: string | null;
  date_peremption: string | null;
  quantite_restante: number;
  prix_vente_ttc: number | null;
  produit: {
    id: string;
    libelle_produit: string;
    dci_nom?: string | null;  // NOUVEAU
  };
  fournisseur: {
    nom: string;
  } | null;
}
```

---

### 3. `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

**A. Ajouter les options d'affichage pour les Lots** (après ligne 414)

Insérer le même bloc que pour les Produits :
```tsx
{/* Options d'affichage - NOUVEAU */}
<div className="space-y-3">
  <label className="text-sm font-medium">Options d'affichage</label>
  
  <div className="flex items-center space-x-2">
    <Checkbox
      id="lotIncludeDci"
      checked={lotsConfig.includeDci}
      onCheckedChange={(v) => handleLotConfigChange('includeDci', !!v)}
    />
    <label htmlFor="lotIncludeDci" className="text-sm cursor-pointer">
      Inclure le DCI
    </label>
  </div>

  <div className="flex items-center space-x-2">
    <Checkbox
      id="lotIncludeLot"
      checked={lotsConfig.includeLot}
      onCheckedChange={(v) => handleLotConfigChange('includeLot', !!v)}
    />
    <label htmlFor="lotIncludeLot" className="text-sm cursor-pointer">
      Inclure le numéro de lot
    </label>
  </div>

  <div className="flex items-center space-x-2">
    <Checkbox
      id="lotIncludeExpiry"
      checked={lotsConfig.includeExpiry}
      onCheckedChange={(v) => handleLotConfigChange('includeExpiry', !!v)}
    />
    <label htmlFor="lotIncludeExpiry" className="text-sm cursor-pointer">
      Inclure la date d'expiration
    </label>
  </div>
</div>
```

**B. Corriger l'affichage du prix dans les tableaux** (lignes 357 et 535)

Utiliser le hook `useCurrencyFormatting` pour formater les prix dans les tableaux :
```tsx
// Import en haut du fichier
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

// Dans le composant
const { formatAmount } = useCurrencyFormatting();

// Ligne 357 (tableau produits)
<TableCell className="text-right font-medium">
  {formatAmount(product.prix_vente_ttc || 0)}
</TableCell>

// Ligne 535 (tableau lots)
<TableCell className="text-right font-medium">
  {formatAmount(lot.prix_vente_ttc || 0)}
</TableCell>
```

---

## Résumé des modifications

| Fichier | Modifications |
|---------|---------------|
| `labelPrinterEnhanced.ts` | Interface `LotLabelData` enrichie, `printLotLabels()` utilise `quantite_restante`, `drawLotLabel()` prend `config` + utilise `formatCurrencyAmount()` + options conditionnelles |
| `useLotLabelPrinting.ts` | Chargement DCI, mapping des nouveaux champs (`quantite_restante`, `currencySymbol`, `dci`) |
| `LabelPrintingTab.tsx` | Ajout checkboxes options d'affichage pour Lots + formatage prix avec `useCurrencyFormatting` |

---

## Résultat attendu

Après ces modifications :

1. **Quantité** : Chaque lot génère autant d'étiquettes qu'il a d'unités en stock (ex: stock = 25 → 25 étiquettes)
2. **Prix** : Affiché selon les paramètres de devise système (ex: "6 975 FCFA" au lieu de "6975.00 DH")
3. **Options** : L'utilisateur peut choisir d'inclure ou non :
   - ☑ Le DCI du produit
   - ☑ Le numéro de lot
   - ☑ La date d'expiration

