
# Plan d'Implémentation : Codes-Barres Automatiques par Lot

## ✅ STATUT : IMPLÉMENTÉ

**Phases complétées :**
- ✅ Phase 1 : Migration DB (colonne `code_barre`, table `lot_barcode_sequences`, RPC `generate_lot_barcode`, RPC `search_product_by_barcode` mise à jour)
- ✅ Phase 2 : Modification `useReceptions.ts` pour générer le code-barres à la création de lot
- ✅ Phase 3 : Mise à jour `usePOSData.ts` pour mapper `code_barre_lot` 
- ✅ Phase 4 : Module Étiquettes avec onglet Lots (`useLotLabelPrinting.ts`, `LabelPrintingTab.tsx`)
- ✅ Phase 5 : Types POS mis à jour (`LotInfo.code_barre`)
Générer automatiquement un code-barres unique pour chaque lot créé lors d'une réception, permettant une traçabilité FIFO optimale et une recherche directe du lot au Point de Vente.

### Format du Code-Barres Lot
```
LOT-{4 premières lettres du nom fournisseur}-{YYMMDD}-{séquence}
```
**Exemple:** `LOT-UBIP-260201-00001`

### Hiérarchie de Recherche au POS (Nouvelle)
```
1. Code-barres LOT (lots.code_barre)           ← PRIORITAIRE (nouveau)
2. Code CIP (produits.code_cip)
3. Code EAN (produits.code_ean)
4. Code Interne (produits.code_interne)
5. Code-barres externe (produits.code_barre_externe)
```

## Architecture de la Solution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUX DE GÉNÉRATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RÉCEPTION                                                                  │
│  ┌─────────────────────┐                                                    │
│  │ ReceptionExcelImport│                                                    │
│  │ ou ReceptionForm    │                                                    │
│  └──────────┬──────────┘                                                    │
│             │ Clic "Valider"                                                │
│             ▼                                                               │
│  ┌─────────────────────┐                                                    │
│  │  useReceptions.ts   │                                                    │
│  │  createReception()  │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│             ▼                                                               │
│  ┌─────────────────────────────────────────────────────────┐                │
│  │ Pour chaque lot à créer :                               │                │
│  │                                                         │                │
│  │  1. Récupérer nom fournisseur → préfixe 4 lettres       │                │
│  │  2. Appeler RPC generate_lot_barcode()                  │                │
│  │     - Format: LOT-UBIP-260201-00001                     │                │
│  │     - Séquence auto-incrémentée par tenant/date         │                │
│  │  3. Insérer lot avec code_barre                         │                │
│  └─────────────────────────────────────────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUX DE RECHERCHE POS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SCAN CODE-BARRES                                                           │
│  ┌─────────────────────┐                                                    │
│  │ POSBarcodeActions   │                                                    │
│  │ "LOT-UBIP-260201-01"│                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│             ▼                                                               │
│  ┌─────────────────────────────────────────────────────────┐                │
│  │ search_product_by_barcode(p_barcode)                    │                │
│  │                                                         │                │
│  │  1. Recherche dans lots.code_barre                      │ ← PRIORITAIRE  │
│  │     → Si trouvé: retourner produit + CE lot spécifique  │                │
│  │                                                         │                │
│  │  2. Sinon: Recherche dans produits                      │                │
│  │     (code_cip, code_ean, code_interne)                  │                │
│  │     → Retourner produit + lot FIFO                      │                │
│  └─────────────────────────────────────────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase 1 : Migration Base de Données

### 1.1 Ajouter la colonne `code_barre` à la table `lots`

```sql
-- Ajout de la colonne code_barre
ALTER TABLE public.lots 
ADD COLUMN code_barre TEXT;

-- Index unique pour garantir l'unicité des codes-barres lot
CREATE UNIQUE INDEX lots_code_barre_tenant_unique 
ON public.lots(tenant_id, code_barre) 
WHERE code_barre IS NOT NULL;

-- Index pour la recherche rapide par code-barres
CREATE INDEX lots_code_barre_idx 
ON public.lots(code_barre) 
WHERE code_barre IS NOT NULL AND quantite_restante > 0;

-- Commentaire documentation
COMMENT ON COLUMN public.lots.code_barre IS 'Code-barres unique du lot. Format: LOT-{4lettres fournisseur}-{YYMMDD}-{sequence}';
```

### 1.2 Créer la séquence de numérotation

```sql
-- Table pour gérer les séquences de codes-barres par tenant/date
CREATE TABLE public.lot_barcode_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,  -- Format YYMMDD
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, date_key)
);

-- RLS pour la table de séquences
ALTER TABLE public.lot_barcode_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_lot_barcode_sequences" ON public.lot_barcode_sequences
  FOR ALL TO authenticated
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());
```

### 1.3 Créer la fonction RPC de génération

```sql
CREATE OR REPLACE FUNCTION generate_lot_barcode(
  p_tenant_id UUID,
  p_fournisseur_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_supplier_name TEXT;
  v_supplier_prefix TEXT;
  v_date_key TEXT;
  v_sequence INTEGER;
  v_barcode TEXT;
BEGIN
  -- 1. Récupérer le nom du fournisseur
  SELECT nom INTO v_supplier_name
  FROM fournisseurs
  WHERE id = p_fournisseur_id;
  
  IF v_supplier_name IS NULL THEN
    v_supplier_prefix := 'XXXX';
  ELSE
    -- Nettoyer et prendre les 4 premières lettres (majuscules, sans accents)
    v_supplier_prefix := UPPER(
      LEFT(
        TRANSLATE(
          v_supplier_name,
          'àâäéèêëïîôùûüç ',
          'aaaeeeeiioouuc'
        ),
        4
      )
    );
    -- Compléter avec X si moins de 4 caractères
    v_supplier_prefix := RPAD(v_supplier_prefix, 4, 'X');
  END IF;
  
  -- 2. Format date: YYMMDD
  v_date_key := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  -- 3. Obtenir et incrémenter la séquence (atomique)
  INSERT INTO lot_barcode_sequences (tenant_id, date_key, last_sequence)
  VALUES (p_tenant_id, v_date_key, 1)
  ON CONFLICT (tenant_id, date_key)
  DO UPDATE SET 
    last_sequence = lot_barcode_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_sequence;
  
  -- 4. Construire le code-barres
  -- Format: LOT-UBIP-260201-00001
  v_barcode := 'LOT-' || v_supplier_prefix || '-' || v_date_key || '-' || LPAD(v_sequence::TEXT, 5, '0');
  
  RETURN v_barcode;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION generate_lot_barcode(UUID, UUID) TO authenticated;
```

## Phase 2 : Modifier la RPC search_product_by_barcode

### 2.1 Nouvelle logique de recherche avec priorité lot

```sql
CREATE OR REPLACE FUNCTION public.search_product_by_barcode(
  p_tenant_id UUID,
  p_barcode TEXT
)
RETURNS TABLE(
  id UUID,
  tenant_id UUID,
  name TEXT,
  libelle_produit TEXT,
  dci TEXT,
  code_cip TEXT,
  price NUMERIC,
  price_ht NUMERIC,
  taux_tva NUMERIC,
  tva_montant NUMERIC,
  taux_centime_additionnel NUMERIC,
  centime_additionnel_montant NUMERIC,
  stock BIGINT,
  category TEXT,
  requires_prescription BOOLEAN,
  lot_id UUID,
  numero_lot TEXT,
  date_peremption DATE,
  prix_achat_unitaire NUMERIC,
  code_barre_lot TEXT  -- NOUVEAU: pour afficher le code-barres du lot scanné
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_produit_id UUID;
  v_lot_record RECORD;
  v_found_via_lot BOOLEAN := FALSE;
BEGIN
  -- ============================================
  -- ÉTAPE 1: Recherche PRIORITAIRE par code-barres LOT
  -- ============================================
  SELECT 
    l.id AS lot_id,
    l.produit_id,
    l.numero_lot,
    l.code_barre,
    l.date_peremption,
    l.prix_achat_unitaire,
    COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
    COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
    COALESCE(l.taux_tva, 0) AS lot_taux_tva,
    COALESCE(l.montant_tva, 0) AS lot_montant_tva,
    COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
    COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
  INTO v_lot_record
  FROM lots l
  WHERE l.tenant_id = p_tenant_id
    AND l.code_barre = p_barcode
    AND l.quantite_restante > 0
  LIMIT 1;
  
  IF v_lot_record.lot_id IS NOT NULL THEN
    -- Lot trouvé directement par son code-barres
    v_produit_id := v_lot_record.produit_id;
    v_found_via_lot := TRUE;
  ELSE
    -- ============================================
    -- ÉTAPE 2: Recherche classique par code produit
    -- ============================================
    SELECT p.id INTO v_produit_id
    FROM produits p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = TRUE
      AND (
        p.code_cip = p_barcode
        OR p.code_ean = p_barcode
        OR p.code_interne = p_barcode
        OR p.code_barre_externe = p_barcode  -- Ajout du code externe
      )
    LIMIT 1;
    
    IF v_produit_id IS NULL THEN
      RETURN;
    END IF;
    
    -- Récupérer le lot FIFO avec stock
    SELECT 
      l.id AS lot_id,
      l.numero_lot,
      l.code_barre,
      l.date_peremption,
      l.prix_achat_unitaire,
      COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
      COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
      COALESCE(l.taux_tva, 0) AS lot_taux_tva,
      COALESCE(l.montant_tva, 0) AS lot_montant_tva,
      COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
      COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
    INTO v_lot_record
    FROM lots l
    WHERE l.produit_id = v_produit_id
      AND l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_achat_unitaire > 0
    ORDER BY l.date_reception ASC, l.date_peremption ASC NULLS LAST
    LIMIT 1;
  END IF;

  -- ============================================
  -- ÉTAPE 3: Retourner les données enrichies
  -- ============================================
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit AS name,
    p.libelle_produit,
    d.nom_dci AS dci,
    p.code_cip,
    -- Prix depuis lot ou fallback produit
    CASE 
      WHEN v_lot_record.lot_prix_vente_ttc > 0 THEN v_lot_record.lot_prix_vente_ttc
      ELSE COALESCE(p.prix_vente_ttc, 0)
    END AS price,
    CASE 
      WHEN v_lot_record.lot_prix_vente_ht > 0 THEN v_lot_record.lot_prix_vente_ht
      ELSE COALESCE(p.prix_vente_ht, 0)
    END AS price_ht,
    CASE 
      WHEN v_lot_record.lot_taux_tva > 0 THEN v_lot_record.lot_taux_tva
      ELSE COALESCE(p.taux_tva, 0)
    END AS taux_tva,
    CASE 
      WHEN v_lot_record.lot_montant_tva > 0 THEN v_lot_record.lot_montant_tva
      ELSE COALESCE(p.tva, 0)
    END AS tva_montant,
    CASE 
      WHEN v_lot_record.lot_taux_centime > 0 THEN v_lot_record.lot_taux_centime
      ELSE COALESCE(p.taux_centime_additionnel, 0)
    END AS taux_centime_additionnel,
    CASE 
      WHEN v_lot_record.lot_montant_centime > 0 THEN v_lot_record.lot_montant_centime
      ELSE COALESCE(p.centime_additionnel, 0)
    END AS centime_additionnel_montant,
    COALESCE((
      SELECT SUM(l.quantite_restante)::BIGINT 
      FROM lots l 
      WHERE l.produit_id = p.id 
      AND l.tenant_id = p.tenant_id 
      AND l.quantite_restante > 0
    ), 0) AS stock,
    f.libelle_famille AS category,
    COALESCE(p.prescription_requise, FALSE) AS requires_prescription,
    v_lot_record.lot_id,
    v_lot_record.numero_lot,
    v_lot_record.date_peremption,
    v_lot_record.prix_achat_unitaire,
    v_lot_record.code_barre  -- Code-barres du lot (nouveau)
  FROM produits p
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN dci d ON d.id = p.dci_id
  WHERE p.id = v_produit_id;
END;
$$;
```

## Phase 3 : Modification du Hook useReceptions.ts

### 3.1 Intégrer la génération de code-barres à la création des lots

| Ligne | Modification |
|-------|--------------|
| ~225-250 | Pré-charger le nom du fournisseur |
| ~359-395 | Appeler `generate_lot_barcode` avant l'insertion |
| ~410-420 | Inclure `code_barre` dans l'insert du lot |

**Changements clés :**

```typescript
// Avant la boucle de création des lots
// Récupérer le nom du fournisseur pour le préfixe
const { data: fournisseurData } = await supabase
  .from('fournisseurs')
  .select('nom')
  .eq('id', receptionData.fournisseur_id)
  .single();

// Dans la boucle de création de lots (lotsToInsert)
// Générer le code-barres via RPC
const { data: lotBarcode } = await supabase.rpc('generate_lot_barcode', {
  p_tenant_id: personnel.tenant_id,
  p_fournisseur_id: receptionData.fournisseur_id
});

// Ajouter au lotInsertData
lotInsertData.code_barre = lotBarcode;
```

## Phase 4 : Module Étiquettes - Impression des Codes Lot

### 4.1 Modifier useLabelPrinting.ts

Ajouter une nouvelle interface pour les étiquettes de lots :

```typescript
export interface LotForLabel {
  id: string;
  numero_lot: string;
  code_barre: string | null;  // Le code-barres généré
  date_peremption: string | null;
  quantite_restante: number;
  produit: {
    id: string;
    libelle_produit: string;
    code_cip: string | null;
    prix_vente_ttc: number;
    dci_nom: string | null;
    laboratoire_libelle: string | null;
  };
  fournisseur: {
    nom: string;
  };
}

// Nouvelle fonction pour récupérer les lots avec leurs codes-barres
const fetchLotsForLabels = useCallback(async (searchTerm?: string) => {
  // Requête avec jointures produits/fournisseurs
  // Filtrer sur lots avec code_barre non null et quantite_restante > 0
}, [tenantId]);
```

### 4.2 Modifier LabelPrintingTab.tsx

Ajouter un onglet ou mode "Étiquettes Lots" :

| Section | Changement |
|---------|------------|
| Header | Ajouter toggle "Produits / Lots" |
| Table | Afficher numero_lot, code_barre, date_peremption, quantite |
| Config | Garder les mêmes options de taille |

### 4.3 Modifier labelPrinterEnhanced.ts

Nouvelle interface et fonction pour les étiquettes lot :

```typescript
export interface LotLabelData {
  id: string;
  code_barre: string;  // Le code-barres généré pour le lot
  numero_lot: string;
  date_peremption: string | null;
  nom_produit: string;
  prix_vente: number;
  pharmacyName: string;
  supplierPrefix: string;
}

export async function printLotLabels(
  lots: LotLabelData[],
  config: LabelConfig
): Promise<string> {
  // Génération PDF similaire à printEnhancedLabels
  // Mais avec code_barre du lot (pas du produit)
}
```

## Phase 5 : Adaptation UI POS

### 5.1 Modifier usePOSData.ts

Ajouter `code_barre_lot` au type de retour :

```typescript
// Dans searchByBarcode
return {
  // ... champs existants
  lot_code_barre: product.code_barre_lot,  // NOUVEAU
  scanned_via_lot: product.code_barre_lot === barcode.trim()  // Pour UI
};
```

### 5.2 Modifier POSInterface.tsx (Optionnel)

Afficher une indication visuelle quand un lot spécifique est scanné :

```tsx
// Après ajout au panier via scan lot
{scannedViaLot && (
  <Badge variant="outline" className="text-xs">
    <ScanLine className="h-3 w-3 mr-1" />
    Lot scanné directement
  </Badge>
)}
```

## Résumé des Fichiers à Modifier

| Fichier | Type | Changement |
|---------|------|------------|
| **Migration SQL** | CRÉER | Colonne `code_barre`, table séquences, RPC `generate_lot_barcode`, modification `search_product_by_barcode` |
| `src/hooks/useReceptions.ts` | MODIFIER | Appel RPC génération code-barres lors création lot |
| `src/hooks/useLabelPrinting.ts` | MODIFIER | Ajouter mode "Lots" avec récupération des lots |
| `src/components/.../LabelPrintingTab.tsx` | MODIFIER | Onglet Produits/Lots, affichage code-barres lot |
| `src/utils/labelPrinterEnhanced.ts` | MODIFIER | Nouvelle fonction `printLotLabels` |
| `src/hooks/usePOSData.ts` | MODIFIER | Mapper `code_barre_lot` dans retour searchByBarcode |
| `src/types/pos.ts` | MODIFIER | Ajouter champs lot_code_barre |

## Gestion des Réceptions Multiples Même Jour/Fournisseur

La séquence est gérée par la table `lot_barcode_sequences` qui :
- Utilise une clé composite `(tenant_id, date_key)`
- Incrémente atomiquement via `ON CONFLICT DO UPDATE`
- Permet des milliers de lots par jour/tenant

**Exemple pour 3 réceptions le même jour de UBIPHARM :**
```
Réception 1 (matin):   LOT-UBIP-260201-00001 à LOT-UBIP-260201-00010
Réception 2 (midi):    LOT-UBIP-260201-00011 à LOT-UBIP-260201-00025
Réception 3 (soir):    LOT-UBIP-260201-00026 à LOT-UBIP-260201-00040
```

## Rétrocompatibilité

- Les lots existants sans `code_barre` continueront de fonctionner
- La recherche POS cherche d'abord par `code_barre` lot, puis fallback sur produit
- Les étiquettes produits existantes restent inchangées

## Tests Recommandés

1. Créer une réception avec plusieurs lignes → vérifier génération codes-barres uniques
2. Scanner un code-barres lot au POS → vérifier retour du lot exact
3. Scanner un code CIP classique → vérifier comportement FIFO inchangé
4. Imprimer étiquettes lots → vérifier codes-barres scannables
5. Plusieurs réceptions même fournisseur/jour → vérifier séquences distinctes
