
# Plan - Import du code-barres lot depuis Excel

## Résumé de la demande

L'utilisateur souhaite que le système prenne en charge une nouvelle colonne "Code barre Lot" dans les fichiers Excel d'import de réception. Si cette colonne est renseignée, le système doit l'utiliser au lieu de générer automatiquement un code-barres.

## Analyse du fichier Excel fourni

| Colonne | Contenu |
|---------|---------|
| V | **Code barre Lot** (nouvelle colonne) |
| Exemples | `8906064000067`, `8902396021428`, `8902031001126`, `8088566` |

---

## Modifications à effectuer

### 1. Ajouter le champ dans l'interface TypeScript

**Fichier** : `src/types/excelImport.ts`

Ajouter le nouveau champ dans `ExcelReceptionLine` :
```typescript
export interface ExcelReceptionLine {
  // ... champs existants ...
  codeBarreLot?: string;        // Colonne V (Code barre Lot) - optionnel
}
```

---

### 2. Parser la colonne V du fichier Excel

**Fichier** : `src/services/ExcelParserService.ts`

**A. Ajouter l'index de la colonne** (après ligne 50) :
```typescript
const colCodeBarreLot = getColIndex('code_barre_lot', 'V'); // Colonne V par défaut
```

**B. Lire la valeur lors du parsing** (ligne 93-107) :
```typescript
const line: ExcelReceptionLine = {
  // ... champs existants ...
  codeBarreLot: this.convertScientificToString(this.cleanString(row[colCodeBarreLot])) || undefined,
  // ...
};
```

---

### 3. Ajouter la colonne "Code barre" dans le tableau UI

**Fichier** : `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`

**A. Ajouter l'en-tête de colonne** (après ligne 1635 "Expiration") :
```tsx
<TableHead>Code barre</TableHead>
```

**B. Ajouter la cellule éditable** (après la cellule "Expiration", vers ligne 1749) :
```tsx
<TableCell>
  <Input
    type="text"
    className="w-36 h-8 font-mono text-xs"
    value={String(getLineValue(line, 'codeBarreLot') || '')}
    onChange={(e) => updateLineValue(line.rowNumber, 'codeBarreLot', e.target.value)}
    placeholder="Auto"
  />
</TableCell>
```

---

### 4. Transmettre le code-barres lors de la création

**Fichier** : `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`

Modifier la préparation des lignes (ligne 845-866) pour inclure le code-barres :
```typescript
return {
  // ... champs existants ...
  code_barre_lot: finalLine.codeBarreLot || null,  // NOUVEAU
};
```

---

### 5. Mettre à jour l'interface du hook useReceptions

**Fichier** : `src/hooks/useReceptions.ts`

**A. Ajouter le champ dans l'interface des lignes** (ligne 96-116) :
```typescript
lignes: Array<{
  // ... champs existants ...
  code_barre_lot?: string | null;  // Code-barres importé depuis Excel
}>;
```

**B. Conditionner la génération automatique** (ligne 418-435) :

Modifier la logique pour ne générer le code-barres que si `code_barre_lot` n'est pas fourni :
```typescript
// Vérifier si un code-barres est déjà fourni depuis l'import Excel
if (ligneInfo.code_barre_lot) {
  // Utiliser le code-barres importé
  lotData.code_barre = ligneInfo.code_barre_lot;
  console.log('✅ Code-barres importé depuis Excel:', lotData.code_barre);
} else {
  // Générer automatiquement le code-barres
  try {
    const { data: lotBarcode, error: barcodeError } = await supabase.rpc(
      'generate_lot_barcode',
      {
        p_tenant_id: personnel.tenant_id,
        p_fournisseur_id: receptionData.fournisseur_id
      }
    );
    
    if (!barcodeError && lotBarcode) {
      lotData.code_barre = lotBarcode;
    }
  } catch (err) {
    console.warn('⚠️ Erreur génération code-barres lot:', err);
  }
}
```

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/types/excelImport.ts` | Ajout champ `codeBarreLot` |
| `src/services/ExcelParserService.ts` | Lecture colonne V |
| `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx` | Colonne tableau + transmission |
| `src/hooks/useReceptions.ts` | Interface + logique conditionnelle |

---

## Flux de données

```text
┌─────────────────────────────┐
│  Fichier Excel              │
│  Colonne V: Code barre Lot  │
│  (ex: 8906064000067)        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  ExcelParserService         │
│  codeBarreLot = row[21]     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Tableau UI                 │
│  [Colonne Code barre]       │
│  Éditable - placeholder     │
│  "Auto" si vide             │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  useReceptions              │
│                             │
│  SI code_barre_lot fourni   │
│    → Utiliser               │
│  SINON                      │
│    → generate_lot_barcode() │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Table lots                 │
│  code_barre = valeur finale │
└─────────────────────────────┘
```

---

## Résultat attendu

1. **Parsing Excel** : La colonne V "Code barre Lot" est lue et stockée
2. **Affichage tableau** : Nouvelle colonne "Code barre" visible et éditable
3. **Placeholder** : Affiche "Auto" si le champ est vide
4. **Génération conditionnelle** : Le système génère un code-barres uniquement si la cellule est vide
5. **Sauvegarde** : Le code-barres (importé ou généré) est enregistré dans la table `lots`
