
# Fix: Actions Rapides du Dashboard Administration - Erreurs 404

## Probleme

Le composant `QuickActions.tsx` du dashboard Administration utilise `useNavigate()` de React Router avec des routes inexistantes (`/dashboard/administration/personnel`, etc.). L'application fonctionne avec un systeme de modules internes via `NavigationContext`.

## Solution

Remplacer `useNavigate` par `useNavigation` du `NavigationContext` et utiliser `navigateToModule` avec les bons identifiants de modules.

## Fichier modifie

`src/components/dashboard/admin/QuickActions.tsx`

## Mapping des navigations

| Carte | Avant (404) | Apres |
|---|---|---|
| Ajouter Personnel | `navigate('/dashboard/administration/personnel')` | `navigateToModule('administration', 'personnel')` |
| Nouveau Partenaire | `navigate('/dashboard/administration/partenaires')` | `navigateToModule('administration', 'partenaires')` |
| Nouveau Produit | `navigate('/dashboard/administration/referentiel')` | `navigateToModule('administration', 'referentiel')` |
| Upload Document | `navigate('/dashboard/administration/documents')` | `navigateToModule('administration', 'documents')` |
| Gestion Roles | `navigate('/dashboard/parametres')` | `navigateToModule('parametres')` |
| Configuration | `navigate('/dashboard/parametres')` | `navigateToModule('parametres')` |

## Section technique

- Supprimer l'import de `useNavigate` de `react-router-dom`
- Ajouter l'import de `useNavigation` depuis `@/contexts/NavigationContext`
- Remplacer `const navigate = useNavigate()` par `const { navigateToModule } = useNavigation()`
- Mettre a jour les 6 callbacks `action` avec les appels `navigateToModule` ci-dessus

Un seul fichier modifie, aucune migration SQL necessaire.
