
# Plan : Sélection des Prix à Importer (Brazzaville / Pointe-Noire)

## Résumé

Ajouter une option de sélection des prix dans le modal d'import Excel du catalogue produit. L'utilisateur pourra choisir entre les prix de **Brazzaville** (prix référence) ou **Pointe-Noire** (prix référence PNR) avant de sélectionner le fichier Excel.

## Architecture Actuelle

### Table `catalogue_global_produits`
| Colonne | Description |
|---------|-------------|
| `prix_achat_reference` | Prix d'achat Brazzaville |
| `prix_vente_reference` | Prix de vente Brazzaville |
| `prix_achat_reference_pnr` | Prix d'achat Pointe-Noire |
| `prix_vente_reference_pnr` | Prix de vente Pointe-Noire |

### Flux Actuel
1. L'utilisateur sélectionne un fichier Excel
2. Le système recherche les produits dans le catalogue global
3. La fonction `mapToLocalReferences` utilise **uniquement** `prix_achat_reference` et `prix_vente_reference` (lignes 512-533 de `useGlobalCatalogLookup.ts`)

## Modifications à Apporter

### 1. Interface `GlobalCatalogProduct` (useGlobalCatalogLookup.ts)

Ajouter les colonnes PNR à l'interface TypeScript :

```typescript
interface GlobalCatalogProduct {
  // ... existing fields
  prix_achat_reference_pnr: number | null;
  prix_vente_reference_pnr: number | null;
}
```

### 2. Type pour l'option de prix

Créer un type pour distinguer les deux options de tarification :

```typescript
export type PriceRegion = 'brazzaville' | 'pointe-noire';
```

### 3. Modifier `mapToLocalReferences` (useGlobalCatalogLookup.ts)

Ajouter un paramètre optionnel `priceRegion` :

```typescript
const mapToLocalReferences = async (
  globalProduct: GlobalCatalogProduct,
  priceRegion: PriceRegion = 'brazzaville'
): Promise<MappedProductData> => {
  // ... existing code ...
  
  // Sélection dynamique des prix selon la région
  const selectedPrixAchat = priceRegion === 'pointe-noire'
    ? globalProduct.prix_achat_reference_pnr
    : globalProduct.prix_achat_reference;
    
  const selectedPrixVente = priceRegion === 'pointe-noire'
    ? globalProduct.prix_vente_reference_pnr
    : globalProduct.prix_vente_reference;

  const prix_vente_ttc = selectedPrixVente
    ? unifiedPricingService.roundToNearest(
        selectedPrixVente,
        roundingPrecision,
        roundingMethod,
        currencyCode
      )
    : undefined;

  return {
    // ...
    prix_achat: selectedPrixAchat || undefined,
    prix_vente_ttc
  };
};
```

### 4. Modifier `ProductCatalogImportDialog.tsx`

#### 4.1 Ajouter l'état pour la sélection des prix

```typescript
const [priceRegion, setPriceRegion] = useState<'brazzaville' | 'pointe-noire'>('brazzaville');
```

#### 4.2 Ajouter le RadioGroup avant la sélection de fichier

```tsx
{/* Sélection de la région tarifaire */}
<div className="space-y-3">
  <label className="text-sm font-medium">Prix à importer</label>
  <RadioGroup
    value={priceRegion}
    onValueChange={(value) => setPriceRegion(value as 'brazzaville' | 'pointe-noire')}
    className="flex flex-col gap-2"
  >
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="brazzaville" id="price-brazza" />
      <Label htmlFor="price-brazza" className="font-normal cursor-pointer">
        Prix Brazzaville
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="pointe-noire" id="price-pnr" />
      <Label htmlFor="price-pnr" className="font-normal cursor-pointer">
        Prix Pointe-Noire
      </Label>
    </div>
  </RadioGroup>
  <p className="text-xs text-muted-foreground">
    Les prix d'achat et de vente seront importés selon la région sélectionnée.
  </p>
</div>
```

#### 4.3 Passer la région à `mapToLocalReferences`

```typescript
// Dans processFile(), ligne 211
const mappedData = await mapToLocalReferences(globalProduct, priceRegion);
```

#### 4.4 Réinitialiser l'état à la fermeture

```typescript
const resetState = () => {
  // ... existing resets
  setPriceRegion('brazzaville');
};
```

## Fichiers à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/hooks/useGlobalCatalogLookup.ts` | Ajouter colonnes PNR à l'interface, modifier `mapToLocalReferences` avec paramètre `priceRegion` |
| `src/components/dashboard/modules/referentiel/ProductCatalogImportDialog.tsx` | Ajouter RadioGroup pour sélection des prix, passer le choix à `mapToLocalReferences` |

## Détails Techniques

### Imports à ajouter dans ProductCatalogImportDialog.tsx

```typescript
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
```

### Ordre d'affichage dans le modal

1. **Sélection des prix** (nouveau) - RadioGroup avec "Prix Brazzaville" / "Prix Pointe-Noire"
2. **Sélection du fichier Excel** (existant)
3. **Format attendu** (existant)
4. **Progression** (existant, pendant traitement)

## Résultat Attendu

- L'utilisateur ouvre le modal d'import
- Il voit d'abord les deux options de prix (Brazzaville sélectionné par défaut)
- Il choisit sa région tarifaire
- Il sélectionne son fichier Excel
- Le système importe les produits avec les prix correspondants à son choix
