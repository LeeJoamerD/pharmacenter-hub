

# Correction du taux de couverture par défaut et ajout du sélecteur Agent/Ayant Droit

## Contexte

Actuellement le système utilise toujours `taux_ayant_droit` comme taux de couverture. Le client souhaite que le taux par défaut soit `taux_agent`, avec possibilité de basculer via des coches radio dans l'affichage des taux.

## Modifications

### 1. Ajouter une colonne `type_taux_couverture` dans la table `ventes`

Migration SQL :
```sql
ALTER TABLE public.ventes 
ADD COLUMN type_taux_couverture TEXT DEFAULT 'agent' 
CHECK (type_taux_couverture IN ('agent', 'ayant_droit'));
```

### 2. Ajouter un champ `type_taux_couverture` au type `CustomerInfo` (`src/types/pos.ts`)

Ajouter `type_taux_couverture?: 'agent' | 'ayant_droit'` avec défaut `'agent'`.

### 3. Modifier `CustomerSelection.tsx` — Ajouter les coches radio

Remplacer les deux blocs d'affichage des taux (lignes 298-312) par des radio buttons cliquables :
- Petites coches rondes (radio) à côté de "Taux Agent: X%" et "Taux AD: Y%"
- Par défaut, "Taux Agent" est coché
- Cliquer sur l'un décoche l'autre
- Au changement, mettre à jour `customer.type_taux_couverture` via le callback `onCustomerChange` existant, ce qui recalcule automatiquement les montants

### 4. Modifier `usePOSCalculations.ts` — Utiliser le taux sélectionné

Remplacer (lignes 114-117) :
```ts
const estAssure = !!(customer.assureur_id && (customer.taux_ayant_droit ?? 0) > 0);
const tauxCouverture = estAssure ? (customer.taux_ayant_droit ?? 0) : 0;
```
Par :
```ts
const typeTaux = customer.type_taux_couverture ?? 'agent';
const tauxChoisi = typeTaux === 'agent' 
  ? (customer.taux_agent ?? 0) 
  : (customer.taux_ayant_droit ?? 0);
const estAssure = !!(customer.assureur_id && tauxChoisi > 0);
const tauxCouverture = estAssure ? tauxChoisi : 0;
```

### 5. Modifier `usePOSData.ts` — Même logique + sauvegarder le type

Appliquer la même logique de sélection du taux (lignes 173-178), et ajouter `type_taux_couverture` dans l'objet inséré dans la table `ventes`.

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `supabase/migrations/nouveau.sql` | Ajout colonne `type_taux_couverture` |
| `src/types/pos.ts` | Ajout champ `type_taux_couverture` à `CustomerInfo` |
| `src/components/dashboard/modules/sales/pos/CustomerSelection.tsx` | Radio buttons pour sélection du taux |
| `src/hooks/usePOSCalculations.ts` | Utiliser le taux selon `type_taux_couverture` |
| `src/hooks/usePOSData.ts` | Même logique + sauvegarde dans `ventes` |

