

# Modifications intérieures de l'étiquette 38 × 21.2 mm

Basé sur l'image de référence fournie, voici les changements à apporter aux deux fonctions de dessin (`drawLabelContent` pour produits, ligne ~244, et pour lots, ligne ~455) dans `src/utils/labelPrinterEnhanced.ts`.

## Changements

### 1. Marges intérieures +1 mm (Haut/Bas/Gauche/Droite)
- `textInset` pour edgeToEdge : de `0.15` → `1.15` mm
- `currentY` départ : de `y + 0.1` → `y + 1.1` mm

### 2. Ligne 1 — Pharmacie + Fournisseur
- Police : de `4.5` → `5.5` pt
- Troncature pharmacie : de `20` caractères → `30` caractères (il y a de la place avant le fournisseur aligné à droite)

### 3. Ligne 2 — Nom du produit (fond noir, texte blanc)
- Police : de `5.5` → `11` pt (double)
- Ajouter un `pdf.setFillColor(0, 0, 0)` + `pdf.rect(x, currentY, width, bandHeight, 'F')` pour le fond noir
- `pdf.setTextColor(255, 255, 255)` pour le texte blanc
- Remettre `pdf.setTextColor(0, 0, 0)` après

### 4. Prix et date d'expiration
- Police : de `5` → `10` pt (double)
- Prix : utiliser `formatCurrencyNumber` (nombre seul sans devise) au lieu de `formatCurrencyAmount`
- Vérifier si `formatCurrencyNumber` existe, sinon créer un formatage sans devise directement dans le label

### 5. Appliquer les mêmes changements aux deux fonctions de dessin
- Fonction produits (ligne ~244)
- Fonction lots (ligne ~455)

## Fichiers modifiés
- `src/utils/labelPrinterEnhanced.ts`

