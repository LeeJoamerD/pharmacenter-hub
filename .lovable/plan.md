

# Ajout du bouton "Supprimer" dans l'historique des réceptions

## Contexte

La suppression d'une réception implique de supprimer en cascade les données liées dans cet ordre (basé sur les FK réelles) :

```text
receptions_fournisseurs
  ├── mouvements_lots (via lots.reception_id → lot_id) — delete_rule: CASCADE
  ├── stock_mouvements (via lots.reception_id → lot_id) — SET NULL
  ├── alertes_peremption (via lots → lot_id) — CASCADE
  ├── inventaire_items (via lots → lot_id) — CASCADE  
  ├── suggestions_vente (via lots → lot_id) — CASCADE
  ├── lots (reception_id) — SET NULL (delete_rule: 'a' = NO ACTION)
  ├── lignes_reception_fournisseur (reception_id) — CASCADE
  ├── inventaire_sessions (reception_id) — SET NULL
  ├── factures (reception_id) — SET NULL  
  ├── paiements_fournisseurs (reception_id) — SET NULL
  └── commandes_fournisseurs (via commande_id)
        ├── lignes_commande_fournisseur — CASCADE
        ├── suivi_commandes — CASCADE
        ├── pharmaml_transmissions — CASCADE
        └── evaluations_fournisseurs — SET NULL
```

Certains FK sont `NO ACTION` ou `SET NULL`, donc il faut supprimer manuellement dans le bon ordre.

## Solution

### 1. Nouvelle migration SQL — RPC `delete_reception_cascade`

Fonction `SECURITY DEFINER` qui :
1. Récupère les `lot_id` liés à la réception
2. Supprime `mouvements_lots`, `stock_mouvements`, `alertes_peremption`, `inventaire_items`, `suggestions_vente`, `lignes_ventes`, `lot_optimization_suggestions`, `ai_stock_predictions`, `ai_quality_controls`, `narcotics_registry` pour ces lots
3. Met à NULL `lots.reception_id` ou supprime les lots
4. Supprime `lignes_reception_fournisseur`
5. Met à NULL `factures.reception_id`, `paiements_fournisseurs.reception_id`, `inventaire_sessions.reception_id`
6. Récupère `commande_id` de la réception
7. Supprime la réception
8. Si `commande_id` existe : supprime `lignes_commande_fournisseur`, `suivi_commandes`, `pharmaml_transmissions`, met à NULL `evaluations_fournisseurs.commande_id`, puis supprime la commande
9. Retourne le résultat

### 2. Modification de `ReceptionHistory.tsx`

- Ajouter import `Trash2` de lucide-react
- Ajouter state `deleteReceptionId` et `isDeleting`
- Ajouter un bouton rouge "Supprimer" à côté du bouton "Voir" dans la colonne Actions
- Au clic : ouvrir un `AlertDialog` de confirmation (réutiliser le pattern `DeleteConfirmModal`)
- À la confirmation : appeler `supabase.rpc('delete_reception_cascade', { p_reception_id: id })` puis rafraîchir la liste via `refetch`

### 3. Types Supabase

Ajouter `delete_reception_cascade` aux définitions RPC dans `types.ts` (automatique après migration).

## Fichiers modifiés
- Nouvelle migration SQL — fonction `delete_reception_cascade`
- `src/components/dashboard/modules/stock/ReceptionHistory.tsx` — bouton Supprimer + dialog confirmation + appel RPC

