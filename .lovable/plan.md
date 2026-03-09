

# Fix: Import Excel — Out-of-memory crash

## Problème

Avec 1243 références, le code lance **9 requêtes Supabase en parallèle** (3 chunks × 3 champs : `code_cip`, `code_barre_externe`, `ancien_code_cip`), chacune retournant des objets produits complets. Le navigateur manque de mémoire et crash.

De plus, `parseDate` et le matching génèrent des dizaines de `console.log` par ligne (1243+ logs), ce qui aggrave la consommation mémoire.

## Solution

### 1. Séquentialiser les requêtes par champ (au lieu de tout en parallèle)
Traiter les 3 types de recherche (code_cip, code_barre_externe, ancien_code_cip) **séquentiellement**, et au sein de chaque type, traiter les chunks séquentiellement aussi. Cela réduit la pression mémoire de 9 requêtes simultanées à 1 seule à la fois.

### 2. Réduire la taille des chunks
Passer de 500 à 200 pour limiter la taille de chaque réponse Supabase.

### 3. Supprimer les console.log verbeux
- Retirer les logs individuels dans `parseDate` (appelé 1243+ fois)
- Garder uniquement les logs de résumé dans `matchProductsByReference`

### 4. Libérer la mémoire entre les étapes
Utiliser des variables locales par étape au lieu d'accumuler dans des tableaux géants.

## Fichier modifié

**`src/services/ExcelParserService.ts`**

- Lignes 441-506 : Réécrire le chunking pour exécuter séquentiellement
- Lignes 545-642 : Retirer les console.log de `parseDate`

