

# Correction : table `familles` inexistante + fuite de caracteres dans le champ

## Diagnostic

### Erreur principale : `relation "familles" does not exist`
La RPC `search_product_by_barcode` actuellement deployee contient a la ligne 127 :
```sql
LEFT JOIN familles f ON p.famille_id = f.id
```
La table `familles` n'existe pas. La vraie table est `famille_produit`. De plus, la colonne utilisee pour le nom est `f.nom` (ligne 119), alors que la colonne reelle est `libelle_famille`.

C'est la cause du `42P01` / 404. Meme si les etapes 1 et 2 sont correctes, l'etape 3 (RETURN QUERY) echoue systematiquement a cause de ce JOIN invalide.

### Probleme secondaire : "LO" reste dans le champ
Le scanner fait `preventDefault` a partir du 3e caractere. Les 2 premiers ("L", "O") passent dans l'input. Apres le scan, rien ne nettoie ces 2 caracteres residuels. Il faut vider le champ de recherche apres un scan reussi.

## Plan

### 1. Migration SQL corrective
Recreer la fonction `search_product_by_barcode` en remplacant :
- `LEFT JOIN familles f ON p.famille_id = f.id` par `LEFT JOIN famille_produit f ON p.famille_id = f.id`
- `COALESCE(f.nom, 'Non categorise')` par `COALESCE(f.libelle_famille, 'Non categorise')`

Tout le reste de la fonction reste identique (les colonnes produit sont deja correctes).

### 2. Nettoyage du champ apres scan
Dans `ProductSearch.tsx`, exposer un moyen de vider `searchInput` apres un scan. Le composant parent (`SalesOnlyInterface` ou `POSInterface`) appelle `onBarcodeScanned` qui ajoute le produit au panier, mais les 2 caracteres fuites restent dans le champ.

Solution : dans `POSBarcodeActions`, apres qu'un scan est detecte, dispatcher un evenement custom ou appeler un callback supplementaire qui vide le champ. Alternativement, dans `barcodeScanner.ts`, nettoyer l'input actif apres le scan en cherchant `document.activeElement` et en vidant sa valeur si c'est un input.

Approche retenue : dans `barcodeScanner.ts`, apres `processScan()`, trouver l'element input actif et vider son contenu pour eliminer les caracteres fuites. C'est plus simple et centralise.

### 3. Verification finale du flux scanner
S'assurer que `POSBarcodeActions.tsx` propage bien le scan normalise vers le parent, et que le parent effectue la recherche RPC sans erreur.

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/migrations/...` | Nouvelle migration : corriger le JOIN `familles` → `famille_produit` et `f.nom` → `f.libelle_famille` |
| `src/utils/barcodeScanner.ts` | Apres `processScan()`, vider `document.activeElement` si c'est un input |

## Detail technique
```text
Cause racine actuelle :
RPC ligne 127 : LEFT JOIN familles f  →  table inexistante
RPC ligne 119 : f.nom               →  colonne inexistante

Correction :
LEFT JOIN famille_produit f ON p.famille_id = f.id
COALESCE(f.libelle_famille, 'Non catégorisé')

Fuite input :
preventDefault ne demarre qu'au 3e caractere
→ 2 premiers caracteres passent dans l'input
→ processScan() doit vider l'input actif
```

