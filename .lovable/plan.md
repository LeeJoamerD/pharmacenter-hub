
# Corriger la troncature du modal "Enregistrer une dépense de caisse"

## Problème identifié

Dans `src/components/dashboard/modules/sales/cash/CashExpenseModal.tsx`, le `DialogContent` n'a aucune contrainte de hauteur maximale. Sur les écrans à faible résolution verticale, le contenu déborde hors de l'écran et le bouton "Enregistrer la dépense" (dans le `DialogFooter`) devient inaccessible.

La structure actuelle est :
```
DialogContent (pas de max-height)
  ├── DialogHeader    (titre + description)
  ├── <div> contenu  (formulaire long, pas de scroll)
  └── DialogFooter   (boutons — TRONQUÉ)
```

## Solution

Restructurer le modal en 3 zones fixes :
- **Header** : reste en haut, ne défile pas
- **Corps du formulaire** : défile verticalement (`overflow-y-auto`) avec une hauteur maximale calculée dynamiquement en `vh`
- **Footer** : reste en bas, toujours visible, séparé par une bordure

La nouvelle structure sera :
```
DialogContent (flex column, max-h-[90vh])
  ├── DialogHeader      (fixe en haut)
  ├── <div> formulaire  (flex-1, overflow-y-auto, scroll si nécessaire)
  └── DialogFooter      (fixe en bas, border-top)
```

## Fichier modifié

**`src/components/dashboard/modules/sales/cash/CashExpenseModal.tsx`**

### Modifications précises :

1. **`DialogContent`** : Ajouter `className="sm:max-w-[500px] max-h-[90vh] flex flex-col"` pour contraindre la hauteur à 90% de la fenêtre et activer le layout flex colonne.

2. **Zone de contenu `<div className="space-y-4 py-4">`** : Remplacer par `<div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">` pour que cette zone absorbe l'espace disponible et scroll si le contenu dépasse.

3. **`DialogFooter`** : Ajouter `className="border-t pt-4 mt-0"` pour le détacher visuellement du contenu scrollable et garantir sa visibilité permanente.

## Résultat attendu

- Sur grands écrans : le modal s'affiche exactement comme avant, sans changement visuel perceptible.
- Sur petits écrans (résolution basse) : le formulaire devient scrollable verticalement, et les boutons "Annuler" et "Enregistrer la dépense" restent toujours visibles en bas du modal.
- La modal ne dépasse jamais 90% de la hauteur de l'écran.
