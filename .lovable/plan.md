

# Correction du tri persistant - Cache React Query non invalide

## Probleme identifie

La fonction SQL `search_lots_paginated` a ete corrigee et **fonctionne correctement** au niveau base de donnees (verifie en appelant directement la RPC -- les lots du 23/02/2026 apparaissent en premier).

Le probleme reside dans le frontend : le bouton "Actualiser" et le bouton "Reinitialiser" ne forcent pas React Query a refetcher les donnees depuis le serveur. Ils ne font que modifier des variables d'etat locales (`setCurrentPage(1)`), et si la queryKey ne change pas (par exemple si `currentPage` etait deja 1), React Query retourne les donnees en cache.

De plus, `staleTime: 10000` (10 secondes) empeche un refetch automatique tant que les donnees sont considerees "fraiches". Combine avec `placeholderData: keepPreviousData`, l'utilisateur voit les anciennes donnees.

## Correction

### Fichier : `src/components/dashboard/modules/stock/LotTracker.tsx`

**Modification 1** : Importer `useQueryClient` de `@tanstack/react-query` (ligne 2).

```typescript
import { useQueryClient } from "@tanstack/react-query";
```

**Modification 2** : Initialiser le queryClient dans le composant (apres la ligne 35).

```typescript
const queryClient = useQueryClient();
```

**Modification 3** : Modifier `handleRefresh` (lignes 67-73) pour invalider le cache.

```typescript
const handleRefresh = () => {
  queryClient.invalidateQueries({ queryKey: ['lots-paginated'] });
  queryClient.invalidateQueries({ queryKey: ['lot-metrics'] });
  setCurrentPage(1);
  toast({
    title: "Donnees actualisees",
    description: "Les lots ont ete recharges avec succes.",
  });
};
```

**Modification 4** : Modifier `handleReset` (lignes 75-86) pour invalider aussi le cache.

```typescript
const handleReset = () => {
  queryClient.invalidateQueries({ queryKey: ['lots-paginated'] });
  queryClient.invalidateQueries({ queryKey: ['lot-metrics'] });
  setSearchTerm("");
  setStatusFilter("all");
  setSortBy("date_entree");
  setSortOrder("desc");
  setPageSize(100);
  setCurrentPage(1);
  toast({
    title: "Filtres reinitialises",
    description: "Tous les filtres ont ete remis a zero.",
  });
};
```

### Aucune modification SQL

La RPC fonctionne deja correctement. Le tri retourne les bons resultats.

## Resume

| Element | Avant | Apres |
|---------|-------|-------|
| Bouton Actualiser | Ne recharge pas les donnees | Invalide le cache React Query et force un refetch |
| Bouton Reinitialiser | Ne recharge pas les donnees | Invalide le cache et remet les filtres par defaut |
| Lots du 23/02/2026 | Non visibles (donnees en cache) | Visibles des la premiere page en tri decroissant |
