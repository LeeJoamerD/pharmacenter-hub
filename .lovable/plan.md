
## Objectif
Corriger l’erreur `400 (Bad Request)` lors du clic sur **Créer** dans le modal **Nouvelle Action Corrective** (module Rapports > Réglementaire > Conformité).

## Ce que j’ai identifié
La requête qui échoue est l’insert dans `compliance_actions`.

En base, la table `public.compliance_actions` a une contrainte CHECK :

- `priority` doit être dans `['low', 'normal', 'high', 'urgent']`
- `status` doit être dans `['pending', 'in_progress', 'completed', 'cancelled']`

Or, le code actuel envoie :
- `priority: 'medium'` (valeur interdite) → provoque un 400

## Changements à implémenter

### 1) Corriger la valeur `priority` lors de la création d’action
**Fichier :** `src/services/RegulatoryService.ts`  
**Méthode :** `createComplianceAction(...)`

- Remplacer :
  - `priority: 'medium'`
- Par :
  - `priority: 'normal'`

Cela aligne le payload avec la contrainte SQL.

### 2) (Recommandé) Sécuriser le mapping de priorité côté service
Toujours dans `createComplianceAction`, ajouter un petit mapping/validation pour éviter qu’une valeur UI future (“moyenne/medium”) recasse l’insert :

- Si on reçoit “medium/moyenne” → envoyer `normal`
- Si on reçoit une valeur inconnue → fallback `normal`

Même si aujourd’hui le modal ne demande pas la priorité, ça protège des évolutions.

### 3) (Optionnel mais utile) Corriger l’inversion titre/description dans la lecture des actions
**Fichier :** `src/services/RegulatoryService.ts`  
**Méthode :** `getComplianceActions(...)`

Actuellement :
- `titre` est alimenté par `action_description`
- `description` par `action_type`

Mais à la création :
- `action_description = description`
- `action_type = titre`

Donc l’affichage risque d’être inversé/incohérent. Je propose d’aligner :
- `titre` ← `action_type`
- `description` ← `action_description`

(Ça ne bloque pas la création, mais améliore la cohérence UI et évite la confusion.)

## Résultat attendu après implémentation
- Le bouton **Créer** ne renvoie plus de 400
- L’action corrective est correctement enregistrée en base
- (Optionnel) Le libellé “Titre / Description” affiché dans la liste correspond aux champs saisis dans le modal

## Tests de validation (rapides)
1. Ouvrir : Rapports → Réglementaire → Conformité
2. Cliquer **Ajouter** → remplir Titre + Description → **Créer**
3. Vérifier :
   - Pas d’erreur 400 dans la console
   - L’action apparaît dans la liste
4. Vérifier aussi qu’une action nouvellement créée a bien `priority='normal'` (via logs réseau ou table Supabase)

## Fichiers concernés
- `src/services/RegulatoryService.ts` (modif obligatoire)
- Aucun changement DB nécessaire
