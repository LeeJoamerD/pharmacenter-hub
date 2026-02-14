
# Fix: Modal "Lancer Inventaire" - Erreur 404

## Probleme

Le modal `QuickInventoryDialog.tsx` utilise `useNavigate` de React Router pour naviguer vers `/stock/inventaires`, ce qui genere une erreur 404. Le tableau de bord fonctionne avec une navigation interne par modules, pas avec des routes URL classiques.

## Modification

**Fichier** : `src/components/dashboard/modules/stock/dashboard/dialogs/QuickInventoryDialog.tsx`

- Remplacer `import { useNavigate } from 'react-router-dom'` par `import { useNavigation } from '@/contexts/NavigationContext'`
- Remplacer `const navigate = useNavigate()` par `const { navigateToModule } = useNavigation()`
- Remplacer `navigate('/stock/inventaires')` par `navigateToModule('stock', 'inventaires')`

Meme correctif deja applique avec succes sur `QuickSupplyDialog.tsx`.

Un seul fichier modifie, aucune migration SQL necessaire.
