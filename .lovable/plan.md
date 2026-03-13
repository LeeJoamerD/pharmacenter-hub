
Objectif: corriger définitivement l’incohérence “retour Terminé mais vente encore En cours dans Encaissement / blocage fermeture session”, en garantissant cohérence ventes/lignes/mouvements/stock.

Constat confirmé (analyse code + DB):
- Dans `useReturnsExchanges.ts`, le traitement retour fait des opérations multi-tables côté client (non atomiques) et ignore certaines erreurs de suppression (`console.error` sans `throw`).
- La FK `retours.vente_origine_id -> ventes.id` est en `ON DELETE RESTRICT`, donc en retour total la suppression de `ventes` peut échouer après suppression des `lignes_ventes` et `mouvements_caisse`, créant des ventes orphelines `En cours` (exactement le cas des POS fournis).
- Les requêtes “en attente” (`usePendingTransactions`, `useCashSession`, `CloseSessionModal`) filtrent seulement `statut='En cours'` et ramènent ces ventes orphelines, ce qui pollue Encaissement et bloque la fermeture.

Plan d’implémentation

1) Rendre le traitement de retour atomique côté DB (source unique de vérité)
- Ajouter une RPC dédiée (migration SQL), ex: `rpc_process_return_completion(p_return_id uuid)`.
- Cette RPC fera en transaction:
  - validations (retour existe, tenant, statut `Approuvé`);
  - réintégration stock lignes éligibles (avec marquage `remis_en_stock=true`);
  - passage du retour à `Terminé`;
  - recalcul agrégé des quantités retournées pour décider `retour total` vs `partiel`;
  - retour total:
    - détacher les liens `retours.vente_origine_id` (set null, garder `numero_vente_origine`);
    - supprimer `mouvements_caisse` liés, `lignes_ventes`, puis `ventes`;
  - retour partiel:
    - mettre à jour/supprimer `lignes_ventes` selon quantités restantes;
    - recalculer montants de `ventes`;
    - conserver le bon statut métier (si vente initialement `En cours`, elle reste `En cours`; remboursement mouvement seulement si encaissement réel existait).
- Retourner un JSON de résultat complet (`success`, `mode`, `vente_id`, `details`).

2) Simplifier le front pour appeler la RPC (et supprimer la logique fragile)
- Refactor `processReturnMutation` dans `src/hooks/useReturnsExchanges.ts`:
  - remplacer les updates/suppressions manuelles par un unique appel RPC;
  - supprimer les blocs qui swallow les erreurs;
  - invalider précisément les caches:
    - `returns`, `pending-transactions`, `encaissement-transactions`, `active-cash-session`, `session-report`, `cash-movements`, `ventes`, `transaction-history`.

3) Empêcher les ventes orphelines de bloquer les écrans “en attente”
- `src/hooks/usePendingTransactions.ts`:
  - exclure les ventes sans lignes (`lignes_ventes!inner(...)` ou filtre post-query strict).
- `src/hooks/useCashSession.ts` et `src/components/.../CloseSessionModal.tsx`:
  - même garde pour le comptage des transactions en attente.
- Résultat: même en présence d’anomalie historique, Encaissement/Fermeture ne sera plus bloqué par des enregistrements vides.

4) Réparation des données existantes (cas déjà cassés)
- Exécuter une correction data (opération SQL de données, pas migration schéma):
  - identifier ventes `En cours` sans `lignes_ventes` et liées à `retours` `Terminé`;
  - `UPDATE retours SET vente_origine_id = NULL` pour ces ventes;
  - `DELETE FROM ventes` pour ces ventes orphelines.
- Cibler d’abord le tenant **Pharmacie SIRACIDE 38**, puis étendre globalement avec prévisualisation (`SELECT`) avant suppression.

5) Synchronisation UI robuste (réel + fallback)
- Dans `usePendingTransactions`, ajouter subscription `postgres_changes` sur `ventes`/`retours` (tenant + session), et conserver le polling en fallback (backoff léger).
- But: disparition quasi immédiate des ventes après traitement retour, même si un event realtime est raté.

Fichiers ciblés
- `src/hooks/useReturnsExchanges.ts`
- `src/hooks/usePendingTransactions.ts`
- `src/hooks/useCashSession.ts`
- `src/components/dashboard/modules/sales/cash/CloseSessionModal.tsx`
- `supabase/migrations/*` (nouvelle RPC atomique de traitement retour)

Validation fonctionnelle (après implémentation)
- Cas 1: retour total d’une vente `En cours` → vente supprimée, absente d’Encaissement, fermeture session non bloquée.
- Cas 2: retour partiel d’une vente `En cours` → montants/lignes mis à jour, vente reste encaisable au bon montant.
- Cas 3: retour partiel d’une vente encaissée → mouvement `Remboursement` correct, session cohérente.
- Cas 4: impression/rapport/session reflètent immédiatement les nouveaux totaux.
