

# Optimisation des Dépenses de Caisse — Filtrage serveur, Pagination et Exports

## Problème actuel

Le hook `useCashExpenses` charge toutes les dépenses côté client avec `.limit(1000)` puis filtre en mémoire. Cela :
- Perd les données au-delà de 1000 lignes
- Effectue le tri/filtrage côté client au lieu du serveur
- N'offre aucune pagination ni export

## Approche

Reproduire exactement le pattern utilisé pour les sessions de caisse (`search_cash_sessions_paginated` + `fetch_all_cash_sessions_for_export`).

### 1. Migration SQL — 2 RPCs

**`search_cash_expenses_paginated`** : Filtrage serveur avec pagination, retourne JSONB `{ expenses: [...], count: N }`.
- Paramètres : `p_tenant_id`, `p_date_from`, `p_date_to`, `p_motif`, `p_agent_id`, `p_session_status` (open/closed/all), `p_includes_cancelled`, `p_search`, `p_montant_min`, `p_montant_max`, `p_session_id`, `p_sort_field`, `p_sort_direction`, `p_page`, `p_page_size`
- JOIN sur `sessions_caisse` (statut, agent_id, date_ouverture), `personnel` (noms/prenoms agent), `personnel` (annulé par)
- Filtrage par rôle géré côté hook (on passe `p_agent_session_id` pour les caissiers)

**`fetch_all_cash_expenses_for_export`** : Mêmes filtres, sans pagination, boucle par batch de 1000 pour tout récupérer.

### 2. Hook `useCashExpenseSearch.ts`

Nouveau hook dédié (même pattern que `useCashSessionSearch.ts`) :
- État des filtres enrichi : `montantMin`, `montantMax`, `sessionId` ajoutés
- Pagination : `page`, `pageSize`, `totalCount`
- Appelle la RPC `search_cash_expenses_paginated`
- Fonction `fetchAllForExport` appelant `fetch_all_cash_expenses_for_export`

### 3. `ExpensesFiltersPanel.tsx` — Nouveaux filtres + Exports

Ajouter dans les filtres avancés :
- **Montant min** / **Montant max** (Input number)
- **Session** (Select avec les sessions du tenant)
- Boutons **Excel** et **PDF** dans la barre d'actions (à côté de Filtres/Réinitialiser)

### 4. `cashExpenseExports.ts` — Utilitaire d'export

Fonctions `exportCashExpensesToExcel` et `exportCashExpensesToPDF` (même style que `cashSessionExports.ts`).
Colonnes : Date, Description, Motif, Montant, Agent, Session, Statut.

### 5. `CashExpensesManager.tsx` — Intégration

- Remplacer `useCashExpenses` par `useCashExpenseSearch` pour l'onglet liste
- Conserver `useCashExpenses` pour les statistiques (ou les alimenter via le hook search)
- Ajouter pagination (Précédent/Suivant + compteur) sous le tableau
- Passer `onExportExcel`/`onExportPDF` au panel de filtres

### 6. `ExpensesTable.tsx` — Aucun changement structurel

Le tableau reste inchangé, il reçoit juste la page courante.

## Fichiers impactés
- **Nouveau** : Migration SQL (2 RPCs)
- **Nouveau** : `src/hooks/useCashExpenseSearch.ts`
- **Nouveau** : `src/utils/cashExpenseExports.ts`
- **Modifié** : `ExpensesFiltersPanel.tsx` (montant min/max, session, boutons export)
- **Modifié** : `CashExpensesManager.tsx` (nouveau hook + pagination)

