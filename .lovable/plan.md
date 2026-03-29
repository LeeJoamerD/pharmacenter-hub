
# Correction réelle du format 39.9 × 20.2 mm

## Diagnostic
Le moteur applique déjà bien :
- `marginTop: 6`
- `gapX: 0`
- `gapY: 0`
- pas de bordure externe pour ce format

Donc le problème ne vient plus du “pas de placement” des étiquettes.  
Le vrai problème visible sur votre capture est que le rendu conserve encore des **marges internes** importantes dans chaque étiquette :
- `padding: 1`
- décalage vertical compact (`currentY = y + 0.8`)
- séparateur tracé avec retrait intérieur
- code-barres volontairement plus étroit que la largeur utile

Résultat : même avec `gapX/gapY = 0`, on voit encore des “coutures blanches” entre colonnes et entre lignes, car ce sont en réalité des **espaces internes cumulés** de deux étiquettes adjacentes.

## Correction à faire

### 1. Créer un preset réellement “bord à bord” pour 39.9 × 20.2
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Dans `getLayoutConfig(width, height)` :
- conserver la détection tolérante
- garder `marginTop: 6`
- garder `gapX: 0` et `gapY: 0`
- réduire fortement ou supprimer la marge interne pour ce format :
  - `padding: 0` ou quasi nul

But :
- supprimer la couture visuelle gauche/droite et haut/bas
- faire commencer le contenu plus près des limites réelles de l’étiquette

### 2. Adapter le rendu interne des étiquettes compactes
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Dans `drawLabel(...)` et `drawLotLabel(...)`, ajouter une logique spécifique au format 39.9 × 20.2 :
- démarrage vertical plus haut (réduire le `currentY` initial)
- ligne séparatrice sur toute la largeur utile, sans retrait perceptible
- élargir le code-barres au maximum utile pour éviter l’impression de colonne “centrée dans un bloc blanc”
- réduire les retraits latéraux du texte et des blocs bas
- conserver l’absence de bordure externe

But :
- supprimer les faux gaps visibles sur la capture
- obtenir un rendu réellement continu entre 5 colonnes et 13 lignes

### 3. Vérifier la marge haute de manière visible
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Le positionnement de la première ligne dépend de `y = marginTop + row * (...)`.  
Je vais garder la valeur demandée à **6 mm**, mais m’assurer que le rendu interne ne compense pas visuellement cette marge par un décalage inverse du contenu.

But :
- la première rangée sera réellement plus basse qu’avant
- l’effet sera visible dans les 3 onglets

### 4. Appliquer la même correction aux 3 parcours
Le moteur est partagé par :
- `printEnhancedLabels` → onglet **Produits**
- `printLotLabels` → onglet **Lots**
- `printLotLabels` via `useReceptionLabelPrinting` → onglet **Par Réception**

Donc une seule correction dans `labelPrinterEnhanced.ts` suffira pour les trois.

## Fichier concerné
- `src/utils/labelPrinterEnhanced.ts`

## Résultat attendu
Pour **39.9 × 20.2 mm (5/ligne)** :
- marge haute réellement visible à 6 mm
- plus de couture blanche visible entre les 5 colonnes
- plus de couture blanche visible entre les 13 lignes
- comportement identique dans **Produits**, **Lots** et **Par Réception**
