

# Fix: Code-barres `LOT-89060640-260411-00114` non trouvé au POS

## Diagnostic

Deux problemes identifes dans la base de donnees :

Le produit PROGYNANCE 200MG OVULES B/30 a dans la table `lots` :
- `code_barre` = `LOT-UBIP-260411-00114`
- `numero_lot` = `LOT-89060640-260411-001`

Le code-barres scanne est `LOT-89060640-260411-00114` qui ne correspond **ni au `code_barre` ni au `numero_lot`** exactement. Il ressemble au format `numero_lot` mais avec un suffixe different.

### Probleme 1 : `maxLength` trop court dans `barcodeScanner.ts`

`maxLength` est fixe a **20** caracteres. Le code-barres `LOT-89060640-260411-00114` fait **24 caracteres**. Il est donc **silencieusement rejete** par `processScan()` avant meme d'atteindre la recherche. La DB contient des codes-barres allant jusqu'a 22 caracteres et des numeros de lot jusqu'a 32.

### Probleme 2 : La RPC `search_product_by_barcode` ne cherche que dans `code_barre`

Le code-barres scanne (`LOT-89060640-260411-00114`) ne correspond pas au champ `code_barre` (`LOT-UBIP-260411-00114`). La RPC ne cherche pas dans `numero_lot`, donc meme avec la bonne longueur, aucun resultat ne serait trouve.

### Probleme 3 : Recherche trop stricte (correspondance exacte)

Le `numero_lot` est `LOT-89060640-260411-001` mais le scan donne `LOT-89060640-260411-00114`. La recherche doit aussi supporter une correspondance partielle (le numero de lot est un prefixe du code-barres scanne, ou inversement).

## Corrections

### 1. `src/utils/barcodeScanner.ts` — Augmenter `maxLength`

Passer `maxLength` de 20 a **50** pour accepter tous les formats de codes-barres et numeros de lot.

### 2. Migration SQL — Modifier `search_product_by_barcode` pour chercher aussi dans `numero_lot`

Ajouter une clause `OR` dans la RPC pour chercher dans `lots.numero_lot` en plus de `lots.code_barre`. Utiliser une recherche par prefixe (LIKE) en plus de la correspondance exacte pour couvrir les variantes de suffixe.

```sql
-- Chercher dans code_barre OU numero_lot (exact ou prefixe)
WHERE (l.code_barre = p_barcode 
   OR l.numero_lot = p_barcode
   OR l.code_barre LIKE p_barcode || '%'
   OR p_barcode LIKE l.numero_lot || '%')
```

### 3. `src/hooks/usePOSProductsPaginated.ts` — Aucun changement necessaire

La detection `looksLikeBarcode` fonctionne deja correctement (commence par `LOT`), le probleme est en amont (maxLength) et en aval (RPC).

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/utils/barcodeScanner.ts` | `maxLength: 50` au lieu de 20 |
| Migration SQL | `search_product_by_barcode` : ajouter recherche dans `numero_lot` + correspondance prefixe |

