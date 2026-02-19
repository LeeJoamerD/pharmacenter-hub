

# Correction du debordement des etiquettes 39.9 x 20.2 mm

## Probleme identifie

Les deux fonctions `drawLabel` et `drawLotLabel` utilisent des espacements concus pour des etiquettes de 30-40mm de haut. Pour le format 20.2mm, le contenu total depasse largement :

| Element | Espace actuel | Espace compact |
|---------|--------------|----------------|
| Padding haut | 1 mm | 0.8 mm |
| Pharmacie + fournisseur | 4 mm | 2.5 mm |
| Separateur | 1 mm | 0.5 mm |
| Nom produit | 4 mm | 2.5 mm |
| DCI | 3 mm | 2 mm |
| Lot | 3 mm | 2 mm |
| Code-barres | 9 mm | 5.5 mm |
| Prix + Exp | 2.5 mm | 2 mm |
| **Total** | **27.5 mm** | **17.8 mm** |

Le total compact (17.8mm) tient dans les 18.2mm utilisables (20.2 - 2x1mm padding).

## Modification unique

### Fichier : `src/utils/labelPrinterEnhanced.ts`

Introduire un mode "compact" dans `drawLabel` et `drawLotLabel`, active quand la hauteur de l'etiquette est inferieure a 25mm. Ce mode ajuste :

1. **Tailles de police** : reduites de 1-2 points (pharmacie 5pt au lieu de 6pt, nom 5.5pt au lieu de 7pt, DCI 4pt au lieu de 5pt)
2. **Espacement vertical** entre chaque ligne : reduit de 30-40%
3. **Hauteur du code-barres** : 5mm au lieu de 8mm, largeur reduite aussi
4. **Troncature du nom produit** : plus agressive (25 caracteres au lieu de 35)
5. **Gaps internes** (offsets +2.5 des textes) : reduits a +1.5 ou +2

La detection se fait simplement via `const compact = height < 25;` au debut de chaque fonction, et chaque dimension est conditionnee par ce flag. Aucun impact sur les 3 autres formats existants.

