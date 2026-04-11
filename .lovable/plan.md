

# Fix: Recherche par code-barres lot au Point de Vente

## Diagnostic

Le code-barres scanné `LOT°UBIP°260411°00114` ne trouve rien pour **trois raisons cumulatives** :

1. **Le scanner physique tape dans le champ de recherche** : Quand le curseur est dans le champ de recherche (ce qui est le cas normal au POS), le scanner physique y tape le texte. Le handler `handleKeyPress` dans `barcodeScanner.ts` ignore toutes les frappes quand un `INPUT` est focusé (ligne 76). Le barcode n'est donc **jamais envoyé** à `searchByBarcode`.

2. **Le champ de recherche utilise `get_pos_products`** (recherche texte par `ilike` sur le nom/CIP du produit). Cette RPC ne cherche **pas** dans les codes-barres de lots (`lots.code_barre`). Donc `LOT°UBIP°260411°00114` → 0 résultats.

3. **Le caractère `°` est rejeté** par la regex de validation `validateBarcode` (`/^[A-Za-z0-9\-_]+$/`), donc même sans focus sur un input, le code-barres serait silencieusement rejeté.

## Solution

### 1. Modifier `barcodeScanner.ts` — Accepter le caractère `°`

Mettre à jour la regex `validateBarcode` pour inclure `°` et d'autres caractères spéciaux courants dans les codes-barres de lots :

```typescript
validateBarcode(code: string): boolean {
  return /^[A-Za-z0-9\-_°.\/]+$/.test(code);
}
```

### 2. Modifier `barcodeScanner.ts` — Capturer les scans même dans un INPUT

Supprimer la condition qui ignore les frappes dans les inputs. Le scanner physique envoie les caractères très rapidement (< 50ms entre chaque), ce qui le distingue de la saisie manuelle. Adapter la logique :

- Ne plus ignorer les frappes dans les inputs
- Quand un scan est détecté (entrée rapide + Enter), **empêcher l'action par défaut** (`e.preventDefault()`) pour que le texte ne se retrouve pas dans le champ de recherche
- Déclencher le callback `onScan` normalement

### 3. Modifier `ProductSearch.tsx` — Ajouter la recherche par code-barres lot

Détecter quand le terme de recherche ressemble à un code-barres lot (commence par `LOT` ou format spécifique). Dans ce cas, appeler `search_product_by_barcode` au lieu de `get_pos_products` :

- Dans `usePOSProductsPaginated.ts` ou directement dans `ProductSearch.tsx`, si le `searchTerm` ressemble à un code-barres (contient `LOT`, ou est purement numérique de longueur EAN), appeler la RPC `search_product_by_barcode` en priorité
- Si un résultat est trouvé, l'afficher directement dans la liste des produits

### 4. Approche combinée (scanner physique + champ de recherche)

Le flux corrigé sera :
- **Scanner physique actif + curseur dans le champ** : le scanner détecte la saisie rapide, intercepte le barcode, appelle `searchByBarcode` via le callback, et ajoute le produit au panier automatiquement
- **Saisie manuelle d'un code-barres** dans le champ : la recherche texte détecte le pattern lot/barcode et appelle `search_product_by_barcode` comme fallback

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/utils/barcodeScanner.ts` | Regex élargie pour `°`, capture dans les inputs avec distinction rapide/lent |
| `src/hooks/usePOSProductsPaginated.ts` | Fallback vers `search_product_by_barcode` quand le terme ressemble à un code-barres |
| `src/components/dashboard/modules/sales/pos/ProductSearch.tsx` | Gestion de la recherche barcode dans le champ texte |

