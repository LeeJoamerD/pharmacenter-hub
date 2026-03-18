
Diagnostic retenu

- Le code de `DashboardHome.tsx` contient bien `<VidalNewsWidget />`.
- Dans la session utilisateur, il n’y a aucune requête `vidal-search` ni log VIDAL : le widget ne se monte donc pas du tout côté dashboard pharmacie.
- Le problème principal n’est probablement pas l’Edge Function, mais le chemin de rendu/visibilité du dashboard.
- J’ai identifié une faiblesse structurelle : il y a 2 états de visibilité indépendants pour le dashboard :
  - `useDashboardVisibility()` dans `DashboardHome`
  - un autre `isVisible` local dans `DashboardVisibilityToggle`
- Cette double logique rend l’affichage fragile et explique bien les “éléments ajoutés mais invisibles”.

Plan de correction

1. Unifier la logique de visibilité
- Refactor `src/components/dashboard/DashboardVisibilityToggle.tsx` pour qu’il ne gère plus son propre `isVisible`.
- Le composant deviendra un simple garde piloté par props :
  - `hasDashboardPermission`
  - `isVisible`
  - `onShow`
  - `children`
- Objectif : une seule source de vérité pour savoir si le dashboard est affiché.

2. Simplifier `DashboardHome`
- Mettre toute la zone visible du dashboard derrière cette logique unifiée.
- Garder `DashboardHeader` comme bouton maître d’affichage/masquage.
- Supprimer le pattern actuel où `DashboardVisibilityToggle` reçoit seulement `<div />`, car il masque le vrai contenu et complique le rendu.

3. Rendre la section VIDAL explicitement visible
- Encapsuler `VidalNewsWidget` dans une vraie section dédiée du dashboard, avec un conteneur clair (`div/section`) et une ligne de layout explicite.
- Le placer dans une rangée dédiée, juste avant `QuickActionsPanel`, pour éviter toute ambiguïté visuelle.

4. Ajouter un diagnostic de rendu temporaire
- Ajouter un `console.log` de développement dans `DashboardHome` et `VidalNewsWidget` pour confirmer :
  - que `DashboardHome` rend bien la branche visible
  - que `VidalNewsWidget` se monte effectivement
- Vérifier ensuite qu’une requête `vidal-search` apparaît bien quand le dashboard est visible.

5. Corriger durablement le “problème de visibilité”
- Après validation sur `DashboardHome`, appliquer le même modèle aux autres dashboards qui utilisent le même anti-pattern :
  - `SalesDashboard.tsx`
  - `AccountingDashboard.tsx`
  - `ReportsDashboard.tsx`
  - `StockDashboardUnified.tsx`
- Cela évitera que d’autres ajouts semblent “ne pas apparaître” à l’avenir.

Fichiers à modifier

- `src/components/dashboard/DashboardVisibilityToggle.tsx`
- `src/components/dashboard/DashboardHome.tsx`
- `src/components/shared/VidalNewsWidget.tsx`
- puis, si on généralise le correctif :
  - `src/components/dashboard/modules/sales/SalesDashboard.tsx`
  - `src/components/dashboard/modules/accounting/AccountingDashboard.tsx`
  - `src/components/dashboard/modules/reports/ReportsDashboard.tsx`
  - `src/components/dashboard/modules/stock/dashboard/StockDashboardUnified.tsx`

Résultat attendu

- Le widget VIDAL apparaît réellement sur le dashboard pharmacie.
- Son montage déclenche enfin l’appel `vidal-search`.
- La logique de visibilité devient fiable, ce qui réduit les futurs cas où un composant “ajouté” n’apparaît pas.
