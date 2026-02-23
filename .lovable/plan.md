

# Correction definitive du tri - Forcer le rafraichissement des donnees

## Probleme identifie

La fonction SQL `search_lots_paginated` fonctionne **parfaitement** -- test direct confirme que les lots du 23/02/2026 apparaissent en premier en tri decroissant (verifie 3 fois via SQL).

Le probleme est que le navigateur affiche des **donnees en cache** datant d'avant la correction SQL. Voici pourquoi :

1. **`staleTime: 10000`** : React Query considere les donnees comme "fraiches" pendant 10 secondes, meme apres invalidation
2. **`placeholderData: keepPreviousData`** : Affiche les anciennes donnees pendant le chargement des nouvelles
3. **Le queryKey ne change pas** : Quand l'utilisateur arrive sur la page avec les memes parametres par defaut (sortBy='date_entree', sortOrder='desc', page=1), React Query reutilise les donnees en cache de la session precedente (avant la correction SQL)
4. **Pas de `refetchOnMount`** : React Query ne refetch pas automatiquement quand le composant se monte si les donnees sont encore "fraiches"

## Solution

### Fichier 1 : `src/hooks/useLotsPaginated.ts`

Modifier la configuration React Query pour forcer un comportement plus agressif de rafraichissement :

```typescript
// Query lots pagines
const { data, isLoading, isFetching, error } = useQuery({
  queryKey: ['lots-paginated', tenantId, searchTerm, pageSize, currentPage, statusFilter, sortBy, sortOrder],
  queryFn: async () => {
    // ... (inchange)
  },
  enabled: !!tenantId,
  placeholderData: keepPreviousData,
  staleTime: 0,              // CHANGE: Les donnees sont toujours considerees comme perimes --> refetch a chaque montage
  refetchOnMount: 'always',  // AJOUT: Toujours refetcher quand le composant se monte
  gcTime: 5 * 60 * 1000,     // AJOUT: Garder les donnees en garbage collection pendant 5 min (pour le placeholder)
});
```

Modifier aussi la query des metriques :

```typescript
// Query metriques
const { data: metricsData } = useQuery({
  queryKey: ['lot-metrics', tenantId],
  queryFn: async () => { /* ... */ },
  enabled: !!tenantId,
  staleTime: 0,              // CHANGE: Toujours refetcher
  refetchOnMount: 'always',  // AJOUT
});
```

### Fichier 2 : `src/components/dashboard/modules/stock/LotTracker.tsx`

Modifier `handleRefresh` pour forcer un refetch immediat au lieu d'une simple invalidation :

```typescript
const handleRefresh = () => {
  queryClient.resetQueries({ queryKey: ['lots-paginated'] });
  queryClient.resetQueries({ queryKey: ['lot-metrics'] });
  setCurrentPage(1);
  toast({ title: "Donnees actualisees", description: "Les lots ont ete recharges." });
};

const handleReset = () => {
  queryClient.resetQueries({ queryKey: ['lots-paginated'] });
  queryClient.resetQueries({ queryKey: ['lot-metrics'] });
  setSearchTerm("");
  setStatusFilter("all");
  setSortBy("date_entree");
  setSortOrder("desc");
  setPageSize(100);
  setCurrentPage(1);
  toast({ title: "Filtres reinitialises", description: "Tous les filtres ont ete remis a zero." });
};
```

La difference entre `invalidateQueries` et `resetQueries` : `resetQueries` supprime completement les donnees en cache, forcant un rechargement complet depuis le serveur. `invalidateQueries` marque simplement les donnees comme perimes mais peut encore afficher le placeholder.

### Aucune modification SQL

La RPC fonctionne deja correctement. Le tri retourne les bons resultats.

## Resume technique

| Element | Avant | Apres |
|---------|-------|-------|
| staleTime | 10000ms (lots), 30000ms (metriques) | 0 (toujours refetcher) |
| refetchOnMount | Non specifie (par defaut: true, mais respecte staleTime) | 'always' (ignore staleTime) |
| Boutons Actualiser/Reinitialiser | invalidateQueries (garde le placeholder) | resetQueries (supprime le cache) |
| Premier chargement apres correction | Donnees en cache d'avant la correction | Donnees fraiches du serveur |

