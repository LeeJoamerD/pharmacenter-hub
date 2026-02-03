
# Plan - Nouvel onglet "Par Réception" pour l'impression d'étiquettes

## Objectif

Ajouter un troisième onglet dans le module Stock > Étiquettes permettant de rechercher une réception par numéro de bon de livraison ou date, puis d'imprimer les étiquettes des lots associés.

---

## Architecture proposée

### Nouveau Hook : `useReceptionLabelPrinting.ts`

Ce hook gérera :
- La recherche des réceptions (par `numero_reception`, `reference_facture`, `date_reception`)
- Le chargement des lots associés à la réception sélectionnée (via `reception_id`)
- La sélection des lots pour impression
- La génération des étiquettes PDF

### Structure des données

```text
┌─────────────────────────────┐
│  Recherche réceptions       │
│  - Numéro réception         │
│  - Référence facture (BL)   │
│  - Date réception           │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Liste des réceptions       │
│  trouvées                   │
│  (cliquer pour sélectionner)│
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Lots de la réception       │
│  (avec checkbox)            │
│  - Numéro BL visible        │
│  - Code-barres              │
│  - Produit, quantité, etc.  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Impression                 │
│  (même logique que "Lots")  │
└─────────────────────────────┘
```

---

## Fichiers à créer/modifier

### 1. Nouveau fichier : `src/hooks/useReceptionLabelPrinting.ts`

```typescript
// Hook dédié à l'impression d'étiquettes par réception
interface ReceptionForLabels {
  id: string;
  numero_reception: string;
  reference_facture: string | null;
  date_reception: string;
  fournisseur_nom: string;
  statut: string;
}

interface LotFromReception {
  id: string;
  numero_lot: string;
  code_barre: string | null;
  date_peremption: string | null;
  quantite_restante: number;
  prix_vente_ttc: number | null;
  produit: {
    id: string;
    libelle_produit: string;
    dci_nom?: string | null;
  };
  reception: {
    numero_reception: string;
    reference_facture: string | null;
  };
  fournisseur: {
    nom: string;
  } | null;
}

// Fonctions principales :
// - fetchReceptions(searchTerm) : recherche réceptions
// - selectReception(receptionId) : charge les lots associés
// - toggleLot, selectAll, deselectAll
// - printReceptionLotLabels() : génère le PDF
```

### 2. Modifier : `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

**Ajouts :**

A. Import du nouveau hook :
```typescript
import { useReceptionLabelPrinting } from '@/hooks/useReceptionLabelPrinting';
```

B. Nouvel état pour l'onglet :
```typescript
const [activeTab, setActiveTab] = useState<'products' | 'lots' | 'receptions'>('products');
const [receptionSearchTerm, setReceptionSearchTerm] = useState('');
```

C. Appel du hook :
```typescript
const {
  receptions,
  selectedReception,
  lotsFromReception,
  loading: receptionsLoading,
  generating: receptionsGenerating,
  selectedLots: selectedReceptionLots,
  config: receptionsConfig,
  setConfig: setReceptionsConfig,
  fetchReceptions,
  selectReception,
  printReceptionLotLabels,
  toggleLot: toggleReceptionLot,
  selectAllLots: selectAllReceptionLots,
  deselectAllLots: deselectAllReceptionLots
} = useReceptionLabelPrinting();
```

D. Nouveau TabsTrigger :
```tsx
<TabsTrigger value="receptions" className="flex items-center gap-2">
  <FileText className="h-4 w-4" />
  Par Réception
</TabsTrigger>
```

E. Nouveau TabsContent pour les réceptions (structure similaire à l'onglet Lots) :
- Carte de configuration (gauche)
- Liste des réceptions + lots (droite)

---

## Interface utilisateur de l'onglet "Par Réception"

### Section gauche : Configuration

| Élément | Description |
|---------|-------------|
| **Taille d'étiquette** | Select avec 40×30, 50×30, 60×40 mm |
| **Type de code-barres** | Code 128 (recommandé) / EAN-13 |
| **Quantité par lot** | Input number (défaut: quantité restante du lot) |
| **Options** | Checkboxes : DCI, Numéro de lot, Date expiration |
| **Bouton** | "Imprimer étiquettes" |

### Section droite : Sélection

**Zone 1 - Recherche réceptions :**
- Input de recherche (numéro réception, référence facture BL)
- Filtre par date optionnel

**Zone 2 - Liste des réceptions trouvées :**
```text
┌────────────────────────────────────────────────────────────┐
│ REC-2026-0022 │ BL: 00-016165-00 │ S.E.P │ 02/02/2026 │ ▶ │
│ REC-2026-0021 │ BL: 00-016164-00 │ S.E.P │ 02/02/2026 │ ▶ │
└────────────────────────────────────────────────────────────┘
```

**Zone 3 - Lots de la réception sélectionnée :**
Tableau avec colonnes :
- Checkbox
- Produit
- DCI
- N° Lot
- Code-barres
- **N° BL** (nouveau)
- Expiration
- Stock
- Prix

---

## Détail des modifications

### `src/hooks/useReceptionLabelPrinting.ts` (nouveau fichier)

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { 
  LabelConfig, 
  DEFAULT_LABEL_CONFIG,
  printLotLabels,
  LotLabelData,
  openPrintDialog
} from '@/utils/labelPrinterEnhanced';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useRegionalSettings } from '@/hooks/useRegionalSettings';

// Interfaces pour les réceptions et lots
export interface ReceptionForLabels { ... }
export interface LotFromReception { ... }

export function useReceptionLabelPrinting() {
  // États : receptions, selectedReception, lotsFromReception, selectedLots, config
  
  // fetchReceptions(searchTerm) - recherche par numero_reception ou reference_facture
  // selectReception(receptionId) - charge les lots via reception_id
  // getLotsLabelsData() - convertit en LotLabelData[]
  // printReceptionLotLabels() - génère le PDF
  // toggleLot, selectAllLots, deselectAllLots
}
```

### `LabelPrintingTab.tsx` - Modifications

**Ligne 10** - Ajouter import :
```typescript
import { FileText } from 'lucide-react';
```

**Ligne 22** - Modifier le type activeTab :
```typescript
const [activeTab, setActiveTab] = useState<'products' | 'lots' | 'receptions'>('products');
```

**Après ligne 53** - Ajouter appel hook réceptions

**Ligne 124-133** - Modifier TabsList pour 3 colonnes :
```tsx
<TabsList className="grid w-full max-w-lg grid-cols-3">
```

**Après ligne 600** - Ajouter TabsContent "receptions" complet

---

## Quantité par défaut

La quantité d'étiquettes par lot sera par défaut égale à `quantite_restante` du lot, conformément à la logique existante dans `printLotLabels()` (ligne 354-356 de labelPrinterEnhanced.ts).

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/hooks/useReceptionLabelPrinting.ts` | **Créer** - Hook de recherche et impression par réception |
| `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx` | **Modifier** - Ajouter onglet "Par Réception" |

---

## Résumé fonctionnel

1. **Recherche** : L'utilisateur tape un numéro de BL ou de réception
2. **Sélection réception** : Clic sur une réception pour charger ses lots
3. **Sélection lots** : Checkboxes pour choisir les lots à imprimer
4. **Configuration** : Mêmes options que les autres onglets (taille, DCI, lot, expiration)
5. **Impression** : Génère le PDF avec le nombre d'étiquettes = quantité restante du lot

---

## Requêtes SQL utilisées

**Recherche réceptions :**
```sql
SELECT rf.*, f.nom as fournisseur_nom
FROM receptions_fournisseurs rf
LEFT JOIN fournisseurs f ON rf.fournisseur_id = f.id
WHERE rf.tenant_id = ? 
  AND rf.statut = 'Validé'
  AND (rf.numero_reception ILIKE '%term%' 
       OR rf.reference_facture ILIKE '%term%')
ORDER BY rf.date_reception DESC
LIMIT 50
```

**Lots par réception :**
```sql
SELECT l.*, p.libelle_produit, d.nom_dci, f.nom as fournisseur_nom
FROM lots l
LEFT JOIN produits p ON l.produit_id = p.id
LEFT JOIN dci d ON p.dci_id = d.id
LEFT JOIN fournisseurs f ON l.fournisseur_id = f.id
WHERE l.reception_id = ?
  AND l.code_barre IS NOT NULL
  AND l.quantite_restante > 0
ORDER BY p.libelle_produit
```
