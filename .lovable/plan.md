

# Correction des calculs d'assurance inversés au POS

## Diagnostic

Le bug est dans la détermination du taux de couverture. Le système utilise `taux_agent` (20%) comme taux de couverture assurance, alors qu'il devrait utiliser `taux_ayant_droit` (80%).

Dans l'image : le client CONGO TERMINAL a `taux_agent = 20%` et `taux_ayant_droit = 80%`. La couverture réelle est 80%, mais le code prend `taux_agent` (20%), d'où l'inversion des parts.

## Cause racine

**2 fichiers** utilisent `customer.taux_agent` au lieu de `customer.taux_ayant_droit` :

1. **`src/hooks/usePOSCalculations.ts`** (lignes 115-117) — calculs d'affichage :
   - `estAssure` vérifie `taux_agent > 0` → devrait vérifier `taux_ayant_droit > 0`
   - `tauxCouverture = taux_agent` → devrait être `taux_ayant_droit`

2. **`src/hooks/usePOSData.ts`** (lignes 173-178) — sauvegarde en base :
   - Même logique inversée pour `estAssure` et `tauxCouverture`

## Corrections

### 1. `src/hooks/usePOSCalculations.ts`

Remplacer :
```ts
const estAssure = !!(customer.assureur_id && (customer.taux_agent ?? 0) > 0);
const tauxCouverture = estAssure ? (customer.taux_agent ?? 0) : 0;
```
Par :
```ts
const estAssure = !!(customer.assureur_id && (customer.taux_ayant_droit ?? 0) > 0);
const tauxCouverture = estAssure ? (customer.taux_ayant_droit ?? 0) : 0;
```

### 2. `src/hooks/usePOSData.ts`

Remplacer :
```ts
const estAssure = !!(customerData.assureur_id && (customerData.taux_agent ?? 0) > 0);
if (estAssure) {
  tauxCouverture = customerData.taux_agent || 0;
```
Par :
```ts
const estAssure = !!(customerData.assureur_id && (customerData.taux_ayant_droit ?? 0) > 0);
if (estAssure) {
  tauxCouverture = customerData.taux_ayant_droit || 0;
```

## Impact

Ces 2 corrections suffisent car :
- **Affichage POS** (les 2 interfaces) : utilise `calculations.tauxCouverture`, `calculations.partAssurance`, `calculations.partClient` → corrigé via `usePOSCalculations`
- **Sauvegarde en base** (`taux_couverture_assurance`, `montant_part_assurance`, `montant_part_patient`) → corrigé via `usePOSData`
- **Ticket imprimé** : lit `vente.taux_couverture_assurance` et `vente.montant_part_assurance` depuis la base → corrigé par la sauvegarde
- **PaymentModal, SplitPaymentDialog** : utilisent le même hook `usePOSCalculations` → corrigé automatiquement

| Fichier | Modification |
|---|---|
| `src/hooks/usePOSCalculations.ts` | `taux_agent` → `taux_ayant_droit` (2 occurrences) |
| `src/hooks/usePOSData.ts` | `taux_agent` → `taux_ayant_droit` (2 occurrences) |

