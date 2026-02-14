
# Fix des liens des cartes du tableau de bord principal

## Probleme

Les cartes KPI du tableau de bord utilisent `useNavigate()` de React Router pour naviguer vers des routes comme `/ventes`, `/stock`, `/stock/alertes`, etc. Or ces routes n'existent pas dans `App.tsx` - toute l'application est hebergee sous `/tableau-de-bord` avec un systeme de modules internes gere par `NavigationContext` (`navigateToModule`). Resultat : chaque clic produit une erreur 404.

## Solution

Remplacer `useNavigate` + `navigate('/...')` par `useNavigation` + `navigateToModule(...)` dans les 2 composants concernes :

### Fichier 1 : `src/components/dashboard/SalesMetricsCards.tsx`

- Remplacer `useNavigate` par `useNavigation`
- Les 4 cartes ventes appellent `navigateToModule('ventes')` au lieu de `navigate('/ventes')`

### Fichier 2 : `src/components/dashboard/StockMetricsCards.tsx`

- Remplacer `useNavigate` par `useNavigation`
- "Valeur stock" et "Produits disponibles" : `navigateToModule('stock', 'stock disponible')`
- "Alertes stock faible" et "Ruptures" : `navigateToModule('stock', 'alertes')`

### Fichier 3 : `src/components/dashboard/QuickActionsPanel.tsx`

- Remplacer `useNavigate` par `useNavigation`
- Mapper les paths vers les bons appels `navigateToModule` :
  - `/ventes/pos` -> `navigateToModule('ventes', 'point de vente')`
  - `/ventes/caisses` -> `navigateToModule('ventes', 'caisses')`
  - `/ventes/encaissements` -> `navigateToModule('ventes', 'encaissements')`
  - `/stock/inventaires` -> `navigateToModule('stock', 'inventaires')`
  - `/rapports` -> `navigateToModule('rapports')`

Les autres composants du dashboard (CriticalAlertsList, TopProductsList, ActiveSessionsCards, CreditPromotionsSummary, RecentActivitiesTimeline) n'ont pas de `onClick` ni de navigation, donc aucune modification necessaire.

---

## Section technique

### Mapping des navigations

```text
AVANT (navigate)                    APRES (navigateToModule)
navigate('/ventes')              -> navigateToModule('ventes')
navigate('/stock')               -> navigateToModule('stock', 'stock disponible')
navigate('/stock/alertes')       -> navigateToModule('stock', 'alertes')
navigate('/ventes/pos')          -> navigateToModule('ventes', 'point de vente')
navigate('/ventes/caisses')      -> navigateToModule('ventes', 'caisses')
navigate('/ventes/encaissements')-> navigateToModule('ventes', 'encaissements')
navigate('/stock/inventaires')   -> navigateToModule('stock', 'inventaires')
navigate('/rapports')            -> navigateToModule('rapports')
```

### Fichiers modifies

- `src/components/dashboard/SalesMetricsCards.tsx`
- `src/components/dashboard/StockMetricsCards.tsx`
- `src/components/dashboard/QuickActionsPanel.tsx`

Aucune migration SQL necessaire.
