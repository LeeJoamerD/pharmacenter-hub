
# Fix: Redirections 404 du Dashboard Stock

## Probleme

Le composant `StockDashboardUnified.tsx` et ses sous-composants (`StockRupture.tsx`, `QuickAdjustmentDialog.tsx`) utilisent `useNavigate()` avec des routes inexistantes comme `/stock/alertes`, `/stock/mouvements`, `/stock/stock actuel`, `/stock/produit/{id}`, `/stock/rapports`. Ces routes n'existent pas -- la navigation doit passer par `navigateToModule` du `NavigationContext`.

## Solution

Remplacer `useNavigate` par `useNavigation` dans les 3 fichiers concernes et mettre a jour tous les appels `navigate(...)`.

## Fichiers modifies

### 1. `StockDashboardUnified.tsx` (fichier principal -- 10 appels a corriger)

| Element | Avant (404) | Apres |
|---|---|---|
| Bouton "Rapports" (ligne 231) | `navigate('/stock/rapports')` | `navigateToModule('stock', 'analyses')` |
| Carte "Valeur Stock" (ligne 248) | `navigate('/stock/stock actuel')` | `navigateToModule('stock', 'stock actuel')` |
| Carte "Disponibles" (ligne 269) | `navigate('/stock/stock actuel')` | `navigateToModule('stock', 'stock actuel')` |
| Carte "Alertes Stock" (ligne 293) | `navigate('/stock/alertes')` | `navigateToModule('stock', 'alertes')` |
| Carte "Ruptures" (ligne 314) | `navigate('/stock/alertes')` | `navigateToModule('stock', 'alertes')` |
| Carte "Surstock" (ligne 330) | `navigate('/stock/alertes')` | `navigateToModule('stock', 'alertes')` |
| Alerte produit clic (ligne 409) | `navigate('/stock/produit/${id}')` | `navigateToModule('stock', 'stock actuel')` |
| Menu "Voir details" (ligne 441) | `navigate('/stock/produit/${id}')` | `navigateToModule('stock', 'stock actuel')` |
| Bouton "Voir Mouvements" (ligne 488) | `navigate('/stock/mouvements')` | `navigateToModule('stock', 'mouvements')` |
| Bouton "Voir Alertes" (ligne 496) | `navigate('/stock/alertes')` | `navigateToModule('stock', 'alertes')` |

### 2. `StockRupture.tsx` (1 appel)

| Element | Avant (404) | Apres |
|---|---|---|
| Bouton "Voir tout" | `navigate('/tableau-de-bord/stock/stock-actuel/rupture')` | `navigateToModule('stock', 'stock actuel')` |

### 3. `QuickAdjustmentDialog.tsx` (1 appel)

| Element | Avant (404) | Apres |
|---|---|---|
| Navigation post-ajustement | `navigate('/stock/mouvements')` | `navigateToModule('stock', 'mouvements')` |

## Section technique

- Supprimer `import { useNavigate } from 'react-router-dom'` dans les 3 fichiers
- Ajouter `import { useNavigation } from '@/contexts/NavigationContext'`
- Remplacer `const navigate = useNavigate()` par `const { navigateToModule } = useNavigation()`
- Les identifiants de sous-modules utilises correspondent exactement aux cases du switch dans `StockModule.tsx` : `'stock actuel'`, `'alertes'`, `'mouvements'`, `'analyses'`
- Les liens vers `/stock/produit/${id}` n'ont pas de page produit individuelle, ils seront rediriges vers le sous-module `'stock actuel'` qui liste tous les produits

Aucune migration SQL necessaire.
