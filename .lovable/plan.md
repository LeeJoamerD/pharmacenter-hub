

# Correction : Trop de produits affichés lors de la sélection d'une commande

## Probleme identifie

Le hook `useOrderLines()` est appele **sans argument** (sans `commande_id`) dans 3 fichiers. Cela provoque le chargement de **toutes les lignes de commande** de la base (actuellement **10 220 lignes**) au lieu de celles de la commande selectionnee.

### Fichiers concernes

| Fichier | Ligne | Appel actuel | Probleme |
|---------|-------|-------------|----------|
| `OrderDetails.tsx` | 37 | `useOrderLines()` | Charge TOUTES les lignes, calcule les totaux sur toutes |
| `OrderDetailsModal.tsx` | 40 | `useOrderLines()` | Charge tout, filtre ensuite cote client (ligne 46) |
| `OrderList.tsx` | 759 | `useOrderLines(order.id)` | Correct |
| `ReceptionForm.tsx` | 117 | `useOrderLines(selectedOrder)` | Correct |

### Impact

- `OrderDetails.tsx` : affiche et calcule les totaux sur des dizaines/milliers de lignes au lieu de 3
- `OrderDetailsModal.tsx` : charge 10 220 lignes puis filtre cote client -- fonctionnel mais tres lent et inutile

### Filtrage tenant

Le hook `useOrderLines` ne filtre **pas** par `tenant_id` dans sa requete SQL. Cependant, la table `lignes_commande_fournisseur` a une politique RLS (`tenant_id = get_current_user_tenant_id()`), donc le filtrage tenant est assure au niveau base de donnees quand l'utilisateur est authentifie. Pas de probleme de securite ici.

## Corrections

### 1. `OrderDetails.tsx` (ligne 37)

Passer `order.id` au hook :

```typescript
// Avant
const { orderLines, loading: loadingLines } = useOrderLines();

// Apres
const { orderLines, loading: loadingLines } = useOrderLines(order?.id);
```

### 2. `OrderDetailsModal.tsx` (ligne 40)

Passer `order.id` au hook et supprimer le filtre client inutile :

```typescript
// Avant
const { orderLines, loading: linesLoading } = useOrderLines();
// ...
const orderLineItems = orderLines.filter(line => line.commande_id === order.id);

// Apres
const { orderLines, loading: linesLoading } = useOrderLines(order?.id);
// orderLines contient deja uniquement les lignes de cette commande
// Supprimer la ligne de filtre et utiliser orderLines directement
```

### 3. Aucune modification dans `useOrderLines.ts`

Le hook fonctionne correctement -- il filtre par `commande_id` quand un argument est passe. Le probleme vient uniquement des appelants qui ne passent pas l'argument.

## Resultat attendu

- Selectionner une commande avec 3 produits affichera exactement 3 produits
- Les totaux seront calcules sur les bonnes lignes
- Les performances seront ameliorees (3 lignes chargees au lieu de 10 220)

