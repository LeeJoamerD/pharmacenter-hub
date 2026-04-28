# Plan — Script de nettoyage de stock MAZAYU corrigé

## Constat

1. **Le script précédent (#7549) est bien le dernier en date** pour MAZAYU. Aucune version corrigée n'a été produite ensuite — tu l'avais exécuté avec succès la première fois parce qu'il n'existait pas encore de `retours` pour ce tenant. Depuis, des retours ont été enregistrés et bloquent maintenant la suppression des lots.

2. **Cause du blocage** : la FK `lignes_retours_lot_id_fkey` est définie **sans `ON DELETE`** (ni CASCADE ni SET NULL), contrairement aux autres FK pointant vers `lots` (vérifié sur la base). Toute suppression d'un lot référencé par une ligne de retour est rejetée.

3. **Autres FK vers `lots`** déjà gérées proprement (CASCADE ou SET NULL) — pas besoin de les nettoyer manuellement : `inventaire_items`, `lignes_reception_fournisseur`, `stock_mouvements`, `suggestions_vente`, `lignes_ventes`, `alertes_peremption`, `lot_optimization_suggestions`, `mouvements_lots`, `ai_stock_predictions`, `ai_quality_controls`, `narcotics_registry`.

## Action

Te fournir un **nouveau script SQL** à exécuter dans le SQL Editor Supabase. Il :

1. Supprime d'abord les **lignes de retours** liées aux lots du tenant (préalable manquant).
2. Supprime les **retours** (entêtes) du tenant pour ne pas laisser d'entêtes vides.
3. Supprime les **transactions / lignes_ventes** du tenant (pour libérer toute référence FK et nettoyer les ventes liées).
4. Reprend ensuite la séquence du script original : `mouvements_lots` → `lots` → `lignes_reception_fournisseur` → `receptions_fournisseurs` → `commandes_fournisseurs`.
5. Affiche un `RAISE NOTICE` par étape avec le nombre de lignes supprimées.

Tenant ciblé : `aa8717d1-d450-48dd-a484-66402e435797` (Pharmacie MAZAYU).

## Détails techniques

- Aucune migration de schéma (pas de modification de FK).
- Bloc `DO $$ ... $$` unique → transactionnel : si une étape échoue, rien n'est commit.
- Ordre de suppression :
  ```text
  lignes_retours (filtré par lot.tenant_id)
  → retours (tenant_id)
  → lignes_ventes (filtré par transaction.tenant_id)
  → transactions (tenant_id)
  → mouvements_lots (tenant_id)
  → lots (tenant_id)
  → lignes_reception_fournisseur (filtré par reception.tenant_id)
  → receptions_fournisseurs (tenant_id)
  → commandes_fournisseurs (tenant_id)
  ```
- Aucun secret requis. Aucun changement de code applicatif.

## Livrable

Une fois le plan approuvé, je te poste le script SQL complet dans le chat (à coller directement dans le SQL Editor Supabase). Aucune modification du codebase.
