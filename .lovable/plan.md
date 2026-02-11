

# Mise en detail directe depuis le Point de Vente

## Objectif

Ajouter un bouton "Mise en details" sur les fiches produits dans le module POS (modes Separe et Non separe), visible uniquement pour les produits detaillables. Ce bouton ouvre le meme modal que dans le LotTracker et met a jour le stock en temps reel apres validation.

## Architecture

Les deux modes (Separe via `SalesOnlyInterface` et Non separe via `POSInterface`) utilisent le meme composant `ProductSearch.tsx` pour afficher les produits. Toute modification dans ce composant s'applique donc automatiquement aux deux modes.

## Etapes

### 1. Modifier la RPC `get_pos_products` (nouvelle migration SQL)

Ajouter deux champs au JSON retourne par la RPC :
- `niveau_detail` : le niveau du produit (1, 2 ou 3)
- `has_detail_product` : booleen indiquant si le produit a un produit detail configure (sous-requete sur `produits` via `id_produit_source`)

Cela permet au frontend de determiner si un produit est detaillable sans requete supplementaire.

**Condition detaillable** (identique au LotTracker) :
```text
niveau_detail < 3 
ET il existe au moins un produit enfant actif 
  avec quantite_unites_details_source > 0
```

### 2. Mettre a jour le type `POSProduct` (`src/types/pos.ts`)

Ajouter les champs optionnels :
- `niveau_detail?: number`
- `has_detail_product?: boolean`

### 3. Mettre a jour le mapping dans `usePOSProductsPaginated.ts`

Mapper les nouveaux champs `niveau_detail` et `has_detail_product` depuis le resultat de la RPC vers l'objet `POSProduct`.

### 4. Ajouter le bouton et le modal dans `ProductSearch.tsx`

- Importer `DetailBreakdownDialog` et l'icone `Layers`
- Calculer `isDetailable` pour chaque produit : `(product.niveau_detail ?? 1) < 3 && product.has_detail_product`
- Ajouter un bouton `Layers` entre le badge Stock et le bouton "Ajouter" (emplacement indique par l'image de reference)
- Le bouton est desactive si `stock < 1`
- Au clic, recuperer le premier lot disponible du produit (via `getProductLots`) puis ouvrir `DetailBreakdownDialog` avec le `lotId`
- Gerer les etats : `detailBreakdownOpen`, `selectedLotForBreakdown`

### 5. Rafraichir les donnees apres mise en detail

Dans le callback `onSuccess` du `DetailBreakdownDialog`, invalider le cache React Query (`pos-products-paginated`) pour que les stocks mis a jour (produit source -1, produit detail +N) soient immediatement refletes dans la liste de recherche.

## Details techniques

| Fichier | Modification |
|---------|-------------|
| Nouvelle migration SQL | Ajouter `niveau_detail` et `has_detail_product` dans `get_pos_products` |
| `src/types/pos.ts` | Ajouter `niveau_detail` et `has_detail_product` au type `POSProduct` |
| `src/hooks/usePOSProductsPaginated.ts` | Mapper les deux nouveaux champs |
| `src/components/dashboard/modules/sales/pos/ProductSearch.tsx` | Ajouter bouton "Mise en details" conditionnel + integration `DetailBreakdownDialog` + invalidation cache apres succes |

