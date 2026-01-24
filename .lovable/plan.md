

# Plan d'amélioration du système d'impression d'étiquettes

## Objectifs

1. Générer de vrais codes-barres scannables (Code 128 ou EAN-13) sur les étiquettes
2. Ajouter une interface accessible depuis le module Stock pour imprimer des étiquettes par lot
3. Auto-générer des codes internes pour les produits sans code CIP
4. Inclure le nom de la pharmacie et les 3 premières lettres du fournisseur sur les étiquettes

---

## Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Module Stock                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Nouveau Tab: "Étiquettes"                               │   │
│  │  ├── Sélection de produits (recherche, filtres)         │   │
│  │  ├── Configuration étiquettes (taille, contenu)         │   │
│  │  ├── Prévisualisation                                    │   │
│  │  └── Impression par lot                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Utilitaire: labelPrinterEnhanced.ts                │
│  ├── generateBarcodeImage() - Code 128 / EAN-13 via bwip-js    │
│  ├── generateInternalCode() - Auto-génération PHR-XXXXX        │
│  ├── printEnhancedLabel() - PDF avec vrai code-barres          │
│  └── printBatchLabels() - Impression par lot                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Base de données                                │
│  └── RPC: generate_internal_product_code()                      │
│      - Génère un code unique PHR-XXXXX pour le tenant           │
│      - Enregistre dans code_barre_externe si vide               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fichiers à créer

### 1. Nouveau composant: Interface d'impression d'étiquettes
**Fichier:** `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

Fonctionnalités:
- Tableau de produits avec recherche et filtres (famille, rayon, laboratoire)
- Sélection multiple de produits
- Configuration des étiquettes:
  - Taille (40x30mm, 50x30mm, 60x40mm)
  - Type de code-barres (Code 128 ou EAN-13)
  - Quantité par produit
- Bouton "Générer code interne" pour les produits sans code
- Prévisualisation de l'étiquette
- Export PDF avec impression

### 2. Utilitaire amélioré de génération d'étiquettes
**Fichier:** `src/utils/labelPrinterEnhanced.ts`

Interface de données d'étiquette enrichie:
```typescript
interface EnhancedLabelData {
  nom: string;
  code_cip?: string;
  code_barre_externe?: string;
  prix_vente: number;
  dci?: string;
  date_peremption?: string;
  numero_lot?: string;
  pharmacyName: string;           // Nom de la pharmacie
  supplierPrefix: string;         // 3 premières lettres du laboratoire
}
```

Fonctions principales:
- `generateBarcodeImage(code, type)` - Génère image PNG Code 128 ou EAN-13
- `generateInternalCode(tenantId)` - Appelle la RPC pour créer un code unique
- `printEnhancedLabel(product, config)` - Impression unitaire avec vrai code-barres
- `printBatchLabels(products, config)` - Impression par lot sur A4

### 3. Hook personnalisé pour la gestion des étiquettes
**Fichier:** `src/hooks/useLabelPrinting.ts`

Fonctionnalités:
- Récupération des produits avec relations (laboratoire)
- Génération de codes internes
- Gestion de la configuration utilisateur
- Historique des impressions

---

## Fichiers à modifier

### 1. Module Stock - Ajout du nouveau tab
**Fichier:** `src/components/dashboard/modules/StockModule.tsx`

Ajouter:
```typescript
case 'etiquettes':
  return <LabelPrintingTab />;
```

### 2. Navigation latérale
**Fichier à identifier:** Configuration des sous-modules du stock

Ajouter l'entrée "Étiquettes" dans la liste des sous-modules.

---

## Migration SQL

### RPC: Génération de code interne unique
```sql
CREATE OR REPLACE FUNCTION public.generate_internal_product_code(p_product_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_existing_code TEXT;
  v_new_code TEXT;
  v_sequence INT;
BEGIN
  -- Récupérer le tenant_id du produit
  SELECT tenant_id, code_barre_externe INTO v_tenant_id, v_existing_code
  FROM public.produits
  WHERE id = p_product_id;
  
  -- Si un code existe déjà, le retourner
  IF v_existing_code IS NOT NULL AND v_existing_code != '' THEN
    RETURN v_existing_code;
  END IF;
  
  -- Trouver le prochain numéro de séquence pour ce tenant
  SELECT COALESCE(MAX(
    CASE 
      WHEN code_barre_externe ~ '^PHR-[0-9]+$' 
      THEN CAST(SUBSTRING(code_barre_externe FROM 5) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1 INTO v_sequence
  FROM public.produits
  WHERE tenant_id = v_tenant_id;
  
  -- Générer le nouveau code (format: PHR-00001)
  v_new_code := 'PHR-' || LPAD(v_sequence::TEXT, 5, '0');
  
  -- Mettre à jour le produit
  UPDATE public.produits
  SET code_barre_externe = v_new_code,
      updated_at = NOW()
  WHERE id = p_product_id;
  
  RETURN v_new_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_internal_product_code TO authenticated;
```

---

## Design de l'étiquette

```text
┌────────────────────────────────────────────┐
│  PHARMACIE MAZAYU              [LAB]       │  <- Nom pharmacie + 3 lettres labo
├────────────────────────────────────────────┤
│                                            │
│         DOLIPRANE 1000MG CPR               │  <- Nom produit (gras)
│              Paracétamol                   │  <- DCI (italique)
│                                            │
│           ████████████████                 │  <- Code-barres scannable
│            3400930000123                   │  <- Code texte
│                                            │
│   Prix: 45.00 DH      Lot: A12345         │  <- Prix + Lot
│   Exp: 12/2025                             │  <- Date péremption
└────────────────────────────────────────────┘
```

---

## Détails techniques

### Génération du code-barres avec bwip-js

Réutilisation du pattern existant dans `salesTicketPrinter.ts`:

```typescript
import bwipjs from 'bwip-js';

async function generateBarcodeImage(
  code: string, 
  type: 'code128' | 'ean13' = 'code128'
): Promise<string> {
  const canvas = document.createElement('canvas');
  await bwipjs.toCanvas(canvas, {
    bcid: type,
    text: code,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  });
  return canvas.toDataURL('image/png');
}
```

### Récupération des données du laboratoire

La relation produit → laboratoire existe via `laboratoires_id`. Le champ `libelle` contient le nom:

```typescript
const { data } = await supabase
  .from('produits')
  .select(`
    *,
    laboratoires(libelle)
  `)
  .eq('id', productId);

const supplierPrefix = data.laboratoires?.libelle?.substring(0, 3).toUpperCase() || '---';
```

### Accès au nom de la pharmacie

Via le hook existant `useGlobalSystemSettings`:

```typescript
const { getPharmacyInfo } = useGlobalSystemSettings();
const pharmacyName = getPharmacyInfo()?.name || 'PHARMACIE';
```

---

## Interface utilisateur proposée

### Tab "Étiquettes" dans le module Stock

**Section 1: Sélection des produits**
- Barre de recherche avec filtres (famille, rayon, laboratoire)
- Tableau avec colonnes: Sélection, Produit, Code CIP, Code Interne, Laboratoire, Prix
- Bouton "Sélectionner tout" / "Désélectionner tout"

**Section 2: Configuration**
- Taille d'étiquette: 40x30mm | 50x30mm | 60x40mm
- Type code-barres: Code 128 (recommandé) | EAN-13
- Quantité par produit: input numérique
- Options: [ ] Inclure DCI | [ ] Inclure Lot | [ ] Inclure Date exp.

**Section 3: Actions**
- Bouton "Générer codes internes" (pour produits sans code)
- Bouton "Prévisualiser"
- Bouton "Imprimer" (génère PDF et ouvre dialogue impression)

---

## Résumé des livrables

| Fichier | Type | Description |
|---------|------|-------------|
| `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx` | Créer | Interface principale d'impression |
| `src/utils/labelPrinterEnhanced.ts` | Créer | Utilitaire de génération d'étiquettes |
| `src/hooks/useLabelPrinting.ts` | Créer | Hook de gestion des étiquettes |
| `supabase/migrations/[timestamp]_add_internal_code_generator.sql` | Créer | RPC génération codes |
| `src/components/dashboard/modules/StockModule.tsx` | Modifier | Ajouter case 'etiquettes' |
| Navigation latérale | Modifier | Ajouter entrée "Étiquettes" |

