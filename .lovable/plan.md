
# Audit et Optimisation des 4 composants Mouvements Stock

## Diagnostic

Les quatre composants de la section Mouvements partagent le meme probleme fondamental : ils chargent toutes les donnees cote client sans pagination serveur.

| Composant | Source de donnees | Limite actuelle | Pagination UI | Pagination serveur |
|-----------|------------------|----------------|---------------|-------------------|
| Journal | `useLotMovementsQuery()` | 5000 (defaut) | Oui (client) | Non |
| Ajustements | `useLotMovementsQuery({type: 'ajustement'})` | 5000 (defaut) | Non | Non |
| Transferts | `useLotMovementsQuery({type: 'transfert'})` | 5000 (defaut) | Non | Non |
| Audit | `useTenantQueryWithCache` | 1000 (explicite) | Non | Non |

Le "Total: 1000" visible dans l'image du Journal confirme que les donnees sont tronquees (il y a probablement plus de 1000 mouvements reels).

## Solution

Creer une **RPC serveur unique** `search_movements_paginated` qui gere la recherche, le filtrage, le tri et la pagination cote serveur. Les quatre composants l'utiliseront via un hook partage.

### Etape 1 : Nouvelle migration SQL - RPC `search_movements_paginated`

Creer une fonction RPC qui :
- Accepte des parametres : `p_tenant_id`, `p_search`, `p_type_mouvement`, `p_date_debut`, `p_date_fin`, `p_sort_by`, `p_sort_order`, `p_page_size`, `p_page`
- Fait la recherche full-text sur produit, lot, motif, reference
- Retourne un JSON avec `{ movements: [...], count: N, stats: { total, entrees, sorties, ajustements, transferts, retours } }`
- Les stats sont calculees sur l'ensemble filtre (pas seulement la page courante)
- Joint les tables `produits` et `lots` pour les libelles
- Termine par `NOTIFY pgrst, 'reload schema'`

### Etape 2 : Nouveau hook `useMovementsPaginated`

Creer `src/hooks/useMovementsPaginated.ts` :
- Appelle la RPC `search_movements_paginated`
- Gere la pagination (page, pageSize)
- Gere le debounce de la recherche (400ms)
- Utilise `keepPreviousData` pour eviter le flicker
- Retourne `{ movements, count, totalPages, stats, isLoading, isFetching }`

### Etape 3 : Refactoriser `StockMovementJournal.tsx`

- Remplacer `useLotMovementsQuery()` par `useMovementsPaginated`
- Les filtres (type, dates, recherche) sont envoyes au serveur
- Les stats viennent de la RPC (pas de calcul client)
- La pagination existante devient serveur
- L'export utilise une requete separee sans limite de page pour exporter tout

### Etape 4 : Refactoriser `StockAdjustments.tsx`

- Remplacer `useLotMovementsQuery({ type_mouvement: 'ajustement' })` par `useMovementsPaginated` avec `type_mouvement: 'ajustement'` fixe
- Ajouter une pagination UI (comme le Journal)
- Les metriques (en attente, valides, rejetes) sont calculees cote serveur via les stats

### Etape 5 : Refactoriser `StockTransfers.tsx`

- Remplacer `useLotMovementsQuery({ type_mouvement: 'transfert' })` par `useMovementsPaginated` avec `type_mouvement: 'transfert'` fixe
- Supprimer `useLots()` global pour le formulaire et garder la requete ciblee par produit existante
- Ajouter une pagination UI

### Etape 6 : Refactoriser `StockAudit.tsx`

- Remplacer les deux appels `useTenantQueryWithCache` (audit_logs + mouvements_lots) par `useMovementsPaginated` (source movements, qui est le fallback actuel fonctionnel)
- Ajouter une pagination UI
- Supprimer la limite explicite de 1000

## Resume des fichiers modifies

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx.sql` | Creer RPC `search_movements_paginated` |
| `src/hooks/useMovementsPaginated.ts` | Nouveau hook pagination serveur |
| `src/components/.../StockMovementJournal.tsx` | Refactoriser avec hook pagine |
| `src/components/.../StockAdjustments.tsx` | Refactoriser avec hook pagine + pagination UI |
| `src/components/.../StockTransfers.tsx` | Refactoriser avec hook pagine + pagination UI |
| `src/components/.../StockAudit.tsx` | Refactoriser avec hook pagine + pagination UI |
