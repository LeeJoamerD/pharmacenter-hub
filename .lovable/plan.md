

# Plan : Ajouter VidalNewsWidget au tableau de bord pharmacie

## Modification unique

**Fichier** : `src/components/dashboard/DashboardHome.tsx`

- Importer `VidalNewsWidget` depuis `@/components/shared/VidalNewsWidget`
- Ajouter le widget après la Row 7 (Activités Récentes), juste avant le `QuickActionsPanel`, dans une grille `md:grid-cols-2` avec le widget occupant toute la largeur ou en colonne à côté des actions rapides

Layout proposé (nouvelle Row 8) :
```text
[VidalNewsWidget (pleine largeur)]
[QuickActionsPanel]
```

Le composant `VidalNewsWidget` est déjà dans `src/components/shared/` et fonctionne de manière autonome (appel Edge Function `vidal-search` avec action `get-news`). Aucune autre modification nécessaire.

