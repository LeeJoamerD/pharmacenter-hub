
# Correction du format 39.9 × 20.2 mm pour supprimer réellement les écarts

## Diagnostic
Le fichier `src/utils/labelPrinterEnhanced.ts` contient déjà :
- `marginTop: 6`
- `gapX: 0`
- `gapY: 0`

Donc le problème ne vient pas seulement des valeurs configurées. D’après le rendu imprimé fourni, il y a très probablement deux causes combinées :
1. la détection du format spécial `39.9 × 20.2` est trop fragile (`width === 39.9 && height === 20.2`)
2. le rendu dessine encore une bordure + un contenu interne qui donne visuellement l’impression d’un espace entre étiquettes, même si le pas de positionnement est à 0

## Ce que je vais corriger

### 1. Fiabiliser l’activation du preset 39.9 × 20.2
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Remplacer la condition stricte :
```ts
width === 39.9 && height === 20.2
```
par une comparaison tolérante, par exemple :
```ts
Math.abs(width - 39.9) < 0.01 && Math.abs(height - 20.2) < 0.01
```

But :
- garantir que le preset spécial s’applique bien dans les 3 onglets `Produits`, `Lots`, `Par Réception`
- éviter qu’un arrondi ou une conversion bloque la bonne configuration

### 2. Séparer le “pas de placement” de la “bordure visuelle”
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Le placement des étiquettes est déjà calculé avec :
```ts
x = marginLeft + col * (width + gapX)
y = marginTop + row * (height + gapY)
```
Je vais conserver ce principe, mais ajuster le rendu visuel du format 39.9 × 20.2 pour éviter les faux interstices :
- désactiver ou alléger fortement la bordure grise pour ce format
- vérifier que `padding` interne ne crée pas un effet de “double marge” perçu entre cases
- conserver `gapX = 0` et `gapY = 0` au niveau géométrique

Objectif :
- aucune séparation visible entre colonnes/ligne autre que celle du support papier lui-même

### 3. Forcer une marge haute réellement plus basse sur la page
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Je vais revoir la marge haute du preset spécial pour qu’elle soit appliquée sans ambiguïté au placement réel de la première rangée. Si nécessaire :
- ajuster `marginTop`
- vérifier que le point de départ du contenu de l’étiquette ne compense pas visuellement cette marge

But :
- déplacer clairement la première ligne d’étiquettes de +1 mm vers le bas, comme demandé

### 4. Appliquer exactement la même logique aux 3 parcours d’impression
**Fichier :** `src/utils/labelPrinterEnhanced.ts`

Le moteur est partagé par :
- `printEnhancedLabels` (Produits)
- `printLotLabels` (Lots)
- `printLotLabels` via `useReceptionLabelPrinting` (Par Réception)

Je garderai une seule source de vérité dans `getLayoutConfig(...)` pour que le correctif s’applique uniformément aux trois onglets.

## Résultat attendu
Pour le format **39.9 × 20.2 mm (5/ligne)** :
- marge haute réellement augmentée
- aucune séparation horizontale visible entre les 5 étiquettes d’une ligne
- aucune séparation verticale visible entre les 13 lignes d’étiquettes
- comportement identique dans `Produits`, `Lots` et `Par Réception`

## Fichier concerné
- `src/utils/labelPrinterEnhanced.ts`
