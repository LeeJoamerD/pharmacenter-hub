
# Ajouter le bouton "Fiche VIDAL" aux cartes produits du Point de Vente

## Contexte

Le composant `ProductSearch.tsx` est utilisé dans les deux modes de vente (séparé via `SalesOnlyInterface` et non séparé via `CashRegisterInterface`). Ajouter le bouton ici couvrira automatiquement les deux modes.

## Fichier modifié

**`src/components/dashboard/modules/sales/pos/ProductSearch.tsx`**

### Modifications

1. **Imports** : Ajouter `Pill`, `VidalProductSheet`, et `supabase`.

2. **Nouveaux states** :
   - `vidalSheetProduct` : `{ id: number; name: string } | null` pour contrôler l'ouverture du modal Fiche VIDAL.
   - `isLoadingVidalId` : `string | null` pour afficher le spinner sur le bouton en cours de chargement.

3. **Fonction `handleVidalLookup`** : Reprendre la logique en cascade existante dans `ProductCatalogNew.tsx` :
   - Etape 1 : Vérifier le cache DB (`catalogue_global_produits.vidal_product_id`), en excluant l'ID factice 258795.
   - Etape 2 : Recherche CIP exacte via `vidal-search` Edge Function (mode `exact-code`).
   - Etape 3 : Fallback par nom (premier mot du libellé).
   - Etape 4 : Toast "Non disponible — Ce produit n'est pas référencé dans la base VIDAL" (identique au Catalogue).
   - En cas d'erreur : Toast destructif "Impossible de consulter VIDAL".

4. **Bouton dans la carte produit** : Ajouter un bouton icône `Pill` dans la zone d'actions (ligne 206, `div.flex.items-center.gap-2`), positionné avant le bouton "Mise en détail" et le bouton "Ajouter". Le bouton :
   - Affiche un spinner `Loader2` pendant le chargement.
   - Est désactivé quand le produit n'a pas de `code_cip`.
   - Est toujours visible (pas de condition de stock).

5. **Modal `VidalProductSheet`** : Ajouté en fin de composant, conditionné par `vidalSheetProduct !== null`. Utilise le même composant partagé `@/components/shared/VidalProductSheet`.

## Placement du bouton

```text
[Prix] [Stock]           [Fiche VIDAL] [Détail] [+ Ajouter]
                              ^
                         Nouveau bouton
```

Le bouton sera un petit bouton icône (`size="sm"`, `variant="outline"`) avec l'icône `Pill`, identique visuellement à celui du Catalogue.

## Section technique

### Imports ajoutés
```tsx
import { Pill, Loader2 } from 'lucide-react';  // Loader2 déjà importé
import VidalProductSheet from '@/components/shared/VidalProductSheet';
import { supabase } from '@/integrations/supabase/client';
```

### Nouveau state
```tsx
const [vidalSheetProduct, setVidalSheetProduct] = useState<{ id: number; name: string } | null>(null);
const [isLoadingVidalId, setIsLoadingVidalId] = useState<string | null>(null);
```

### Bouton JSX (dans la zone d'actions, avant le bouton Détail)
```tsx
<Button
  size="sm"
  variant="outline"
  onClick={() => handleVidalLookup(product)}
  disabled={!product.code_cip || isLoadingVidalId === product.id}
  title="Fiche VIDAL"
  className="shrink-0"
>
  {isLoadingVidalId === product.id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Pill className="h-4 w-4" />
  )}
</Button>
```

### Modal en fin de composant
```tsx
{vidalSheetProduct && (
  <VidalProductSheet
    open={!!vidalSheetProduct}
    onOpenChange={(open) => !open && setVidalSheetProduct(null)}
    productId={vidalSheetProduct.id}
    productName={vidalSheetProduct.name}
  />
)}
```

## Résultat attendu

- Le bouton Fiche VIDAL apparait sur chaque carte produit dans le POS (les deux modes).
- Cliquer dessus lance la recherche en cascade et ouvre le modal existant `VidalProductSheet`.
- Si le produit n'est pas référencé VIDAL, un toast identique à celui du Catalogue s'affiche.
- Si le produit n'a pas de code CIP, le bouton est grisé/désactivé.
