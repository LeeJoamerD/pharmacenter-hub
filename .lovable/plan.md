

# Plan : Filtres, pagination et exports pour l'historique des sessions de caisse

## Contexte
L'onglet **Historique** dans `CashManagement.tsx` affiche `allSessions` via `CashSessionList`, chargées en une seule requête sans filtre, pagination, ni gestion de la limite des 1000 lignes Supabase. Pas de boutons d'export.

## 1. Créer une RPC `search_cash_sessions_paginated`

Migration SQL pour une RPC qui :
- Accepte : `p_tenant_id`, `p_date_from`, `p_date_to`, `p_statut`, `p_caissier_id`, `p_caisse_id`, `p_montant_min`, `p_montant_max`, `p_page`, `p_page_size`
- Filtre sur `sessions_caisse` avec les paramètres fournis (NULL = pas de filtre)
- Joint `personnel` (caissier) et `caisses` (nom_caisse)
- Retourne un JSONB `{ sessions: [...], count: total }` avec pagination `LIMIT/OFFSET`
- Tri par `date_ouverture DESC`

Seconde RPC `fetch_all_cash_sessions_for_export` : identique mais sans pagination (retourne TOUTES les lignes filtrées pour l'export), utilisant un `LOOP` de batch de 1000 lignes pour contourner la limite.

## 2. Créer un hook `useCashSessionSearch`

Nouveau fichier `src/hooks/useCashSessionSearch.ts` :
- State : `filters` (dateFrom, dateTo, statut, cashierId, caisseId, minAmount, maxAmount), `page`, `pageSize`, `sessions`, `totalCount`, `loading`
- Appelle la RPC `search_cash_sessions_paginated` à chaque changement de filtre/page
- Expose `fetchAllForExport()` qui appelle la RPC sans pagination pour l'export complet
- Debounce 400ms sur les filtres montant

## 3. Créer un composant `CashSessionFilters`

Nouveau fichier `src/components/dashboard/modules/sales/cash/CashSessionFilters.tsx` :
- Filtres : Date début, Date fin (`<Input type="date">`), Statut (`Select`: Tous/Ouverte/Fermée), Caissier (`Select` dynamique depuis `personnel`), Caisse (`Select` dynamique depuis `caisses`), Montant min/max (`Input number`)
- Boutons Export Excel et Export PDF
- Layout en grille similaire à `TransactionFiltersPanel`

## 4. Modifier `CashSessionList`

- Recevoir `totalCount`, `page`, `pageSize`, `onPageChange` en props
- Ajouter un composant de pagination en bas (boutons Précédent/Suivant + indicateur "Page X sur Y")
- Garder l'affichage actuel des cartes de session

## 5. Modifier `CashManagement.tsx` (onglet Historique)

- Remplacer l'utilisation directe de `allSessions` par le hook `useCashSessionSearch`
- Intégrer `CashSessionFilters` au-dessus de `CashSessionList`
- Passer les props de pagination à `CashSessionList`

## 6. Exports Excel et PDF

Dans le hook ou un utilitaire dédié :
- **Excel** : Utiliser `xlsx` (déjà installé) pour générer un fichier avec colonnes : N° Session, Statut, Caissier, Caisse, Date ouverture, Date fermeture, Fond ouverture, Montant théorique, Montant réel, Écart
- **PDF** : Utiliser `jsPDF` + `autoTable` (déjà installés) pour générer un tableau A4 paysage avec les mêmes colonnes
- Les exports récupèrent TOUTES les lignes filtrées (pas seulement la page courante) via `fetchAllForExport()`

## Fichiers impactés
- **Nouveau** : Migration SQL (RPC)
- **Nouveau** : `src/hooks/useCashSessionSearch.ts`
- **Nouveau** : `src/components/dashboard/modules/sales/cash/CashSessionFilters.tsx`
- **Modifié** : `CashSessionList.tsx` (ajout pagination)
- **Modifié** : `CashManagement.tsx` (intégration filtres + nouveau hook)

