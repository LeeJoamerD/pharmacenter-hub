# Modifications étiquette 38 × 21.2 mm

## Changements dans `src/utils/labelPrinterEnhanced.ts`

### 1. Marge haut du document : -2 mm

- Ligne 69 : `marginTop: 12` → `marginTop: 10`
- Ligne 77 : `originY: 12` → `originY: 10`

### 2. Date d'expiration : réduire police + supprimer "Exp :"

- Fonction dessin produits (~ligne 352) : `setFontSize(10)` → `setFontSize(7)`, `Exp: ${expDate}` → afficher seulement mois/année
- Fonction dessin lots (~ligne 605) : idem

### 3. Première ligne (pharmacie + fournisseur) : doubler la police

Il y a deux fonctions de dessin dans le fichier : une pour les étiquettes produits et une pour les étiquettes lots. Chacune dessine la même première ligne (nom pharmacie + fournisseur). Les deux doivent être modifiées :

- **Ligne 262** (dans la fonction de dessin des étiquettes produits) : c'est bien la ligne pharmacie + fournisseur → `5.5` → `9`
- **Ligne 508** (dans la fonction de dessin des étiquettes lots) : c'est aussi la ligne pharmacie + fournisseur → `5.5` → `9`

Aucune modification n'est faite sur le nom du produit ni sur le nom du lot. Seule la police de la première ligne (pharmacie + fournisseur) est passée de 5.5 à 9

## Fichier modifié

- `src/utils/labelPrinterEnhanced.ts`