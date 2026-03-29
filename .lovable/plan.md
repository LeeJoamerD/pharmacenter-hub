
# Correction définitive du format 39.9 × 20.2 mm

## Diagnostic
Le code contient déjà :
- `marginTop: 6`
- `gapX: 0`
- `gapY: 0`
- suppression de la bordure pour le format 39.9 × 20.2

Donc le problème persistant ne vient plus d’un simple réglage de `gap`. À la lecture du moteur actuel, les écarts visibles viennent très probablement de 2 causes restantes :

1. le rendu est encore pensé “étiquette par étiquette” avec retraits internes, ce qui crée visuellement des coutures même si le pas de placement est à 0  
2. le PDF preview peut montrer des hairlines/seams entre blocs adjacents si on ne force pas un vrai rendu bord-à-bord

## Ce que je vais corriger

### 1. Créer un vrai preset “bord à bord”
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Je vais transformer le preset 39.9 × 20.2 en preset explicite avec :
- `marginTop: 6`
- `gapX: 0`
- `gapY: 0`
- `padding: 0`
- un indicateur dédié du type `edgeToEdge: true`

But :
- ne plus dépendre seulement d’ajustements dispersés dans `drawLabel` / `drawLotLabel`
- avoir une seule logique claire pour ce format

### 2. Utiliser une géométrie de placement dédiée
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Au lieu de simplement réutiliser la logique générique, je vais appliquer au format 39.9 × 20.2 :
- un point d’origine explicite
- un pitch horizontal et vertical explicite
- 5 colonnes et 13 lignes forcées
- aucune compensation interne qui pourrait “annuler visuellement” la marge haute

But :
- garantir que la 1re ligne démarre réellement 1 mm plus bas
- garantir que l’espacement calculé reste strictement nul

### 3. Supprimer les coutures visuelles restantes
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Dans `drawLabel` et `drawLotLabel`, pour ce format uniquement :
- supprimer tout retrait interne résiduel
- supprimer tout tracé de contour
- faire partir les éléments utiles sur toute la largeur utile
- ajouter si nécessaire un très léger “bleed” de rendu pour masquer les hairlines du viewer PDF

But :
- plus aucune séparation visible entre colonnes
- plus aucune séparation visible entre lignes

### 4. Fiabiliser l’activation du format partout
**Fichiers :**
- `src/utils/labelPrinterEnhanced.ts`
- `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

Je vais centraliser une comparaison tolérante du format 39.9 × 20.2 et l’utiliser :
- pour le layout d’impression
- pour la détection du format dans l’UI

But :
- éviter tout cas où le bon preset n’est pas appliqué à cause d’un écart flottant
- assurer le même comportement dans `Produits`, `Lots` et `Par Réception`

## Résultat attendu
Pour le format **39.9 × 20.2 mm (5/ligne)** :
- la marge haute est réellement visible à **6 mm**
- les écarts horizontaux sont réellement à **0 mm**
- les écarts verticaux sont réellement à **0 mm**
- le rendu est identique dans les 3 onglets

## Fichiers à modifier
- `src/utils/labelPrinterEnhanced.ts`
- `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`
