

# Correction du nom produit sur étiquette 38 × 21.2 mm

## Problème
Le nom du produit en police 11pt déborde horizontalement sur les étiquettes adjacentes. Le texte est centré, ce qui masque le début du nom quand il est long.

## Changements dans `src/utils/labelPrinterEnhanced.ts`

### Deux blocs identiques à modifier (lignes ~283-293 et ~522-532)

1. **Réduire la police** : de `11` à `8` pt
2. **Aligner à gauche** : remplacer `x + width / 2` par `x + textInset` et retirer `{ align: 'center' }`
3. **Clipper le texte** : au lieu de tronquer à 30 caractères (arbitraire), utiliser `pdf.getTextWidth()` pour calculer la largeur réelle du texte et tronquer dynamiquement pour qu'il tienne dans `width - 2 * textInset`, avec `...` si tronqué

### Logique de troncature dynamique
Remplacer `truncateText(product.nom, 30)` par une fonction qui mesure la largeur en mm avec `pdf.getTextWidth()` et coupe le texte pour qu'il ne dépasse jamais la zone disponible (`width - 2 * textInset`).

## Fichier modifié
- `src/utils/labelPrinterEnhanced.ts`

