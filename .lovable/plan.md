

# Fix: Problemes restants du scanner de codes-barres au POS

## Diagnostic

### Probleme 1 — Minuscules produisent des caracteres garbage
Le scanner physique envoie des keycodes bruts. Sans Caps Lock, sur un clavier AZERTY francais, `Shift+°` produit `°` mais sans Shift, la touche `°` produit `)`. De meme, les chiffres sans Shift deviennent `é`, `à`, `'`, `&`, etc. sur AZERTY.

**Solution** : Forcer le champ de recherche en `text-transform: uppercase` ne suffit PAS car le probleme est au niveau des keycodes, pas de l'affichage. La vraie solution est d'utiliser `e.code` (code physique de la touche) au lieu de `e.key` (caractere produit) dans le scanner, OU plus simplement : dans le scanner, convertir tout en majuscules avec `.toUpperCase()` et aussi ajouter `style={{ textTransform: 'uppercase' }}` sur l'input pour l'experience visuelle.

Cependant le vrai probleme est plus profond : sans Shift/CapsLock, la touche physique du `°` produit `)` et les chiffres produisent `éà'(&-è_ç`. Le scanner physique devrait envoyer les caracteres avec Shift. **Il faut configurer le lecteur de codes-barres en mode "majuscules forcees"** ou bien le scanner doit etre configure pour envoyer les bons caracteres.

**Approche pragmatique** : Ajouter une table de correspondance AZERTY dans le scanner pour convertir les caracteres minuscules AZERTY en leurs equivalents majuscules/chiffres. Cela permet de supporter les scanners meme sans Caps Lock.

### Probleme 2 — "Q" au lieu de "A" (AZERTY/QWERTY)
Le scanner physique est probablement configure en mode QWERTY mais le systeme interprete les touches en AZERTY. `A` physique → `q` en AZERTY. 

**Solution** : La table de correspondance AZERTY resoudra aussi ce probleme en mappant les touches.

### Probleme 3 — Valeur apparait puis disparait
Le `barcodeScanner.ts` detecte le scan rapide, nettoie le champ input (lignes 99-111), puis appelle `processScan()` qui notifie les callbacks. Mais `maxLength: 20` est **encore hardcode** dans `POSBarcodeActions.tsx` (ligne 39) et `SalesOnlyInterface.tsx` (ligne 158), ce qui fait que les codes de 24+ caracteres sont rejetes par `processScan()`. Le champ est nettoye mais aucun produit n'est recherche.

De plus, il y a **deux registrations de scanner en parallele** : une dans `SalesOnlyInterface` (ligne 149) et une dans `POSBarcodeActions` (ligne 37). Les deux partagent le singleton global, ce qui cree des conflits.

## Corrections

### 1. `src/utils/barcodeScanner.ts` — Table de correspondance AZERTY

Ajouter une fonction de normalisation qui convertit les caracteres AZERTY sans Shift en leurs equivalents corrects :
- `)` → `°`, `é` → `2`, `"` → `3`, `'` → `4`, `(` → `5`, `-` → `6`, `è` → `7`, `_` → `8`, `ç` → `9`, `à` → `0`
- `q` → `a`, `a` → `q` (et inversement pour AZERTY — mais en fait le scanner envoie des keycodes, donc on doit juste forcer `.toUpperCase()` et mapper les symboles AZERTY)

Appliquer `.toUpperCase()` sur chaque caractere ajoute au buffer ET appliquer la table de correspondance pour les symboles numeriques AZERTY.

### 2. `POSBarcodeActions.tsx` — `maxLength: 50`

Ligne 39 : passer `maxLength` de 20 a 50.

### 3. `SalesOnlyInterface.tsx` — `maxLength: 50` + supprimer le doublon

Ligne 158 : passer `maxLength` de 20 a 50. Supprimer le `setupBarcodeScanner` duplique (lignes 148-160) car `POSBarcodeActions` gere deja le scanner physique.

### 4. `ProductSearch.tsx` — `textTransform: uppercase` sur l'input

Ajouter `className="uppercase"` sur l'input de recherche pour que la saisie manuelle soit aussi en majuscules, et normaliser `searchInput` avec `.toUpperCase()` dans le `onChange`.

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/utils/barcodeScanner.ts` | Table AZERTY, `.toUpperCase()` dans le buffer, normalisation des symboles |
| `src/components/dashboard/modules/sales/pos/POSBarcodeActions.tsx` | `maxLength: 50` |
| `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx` | `maxLength: 50`, suppression du doublon scanner |
| `src/components/dashboard/modules/sales/pos/ProductSearch.tsx` | Input en majuscules forcees |

