
# Correction du tri dans search_lots_paginated

## Probleme identifie

La RPC `search_lots_paginated` (derniere version : migration `20251231014153`) a un bug critique dans sa structure SQL :

```
FROM (
  SELECT ... sort_key
  FROM lots l
  JOIN produits p ON ...
  WHERE ...
  LIMIT $3 OFFSET $6    -- Pas d'ORDER BY ici !
) sub
```

Le `LIMIT/OFFSET` est applique **sans ORDER BY** dans le sous-requete. PostgreSQL retourne donc un sous-ensemble arbitraire de 100 lignes, puis le `json_agg(... ORDER BY sort_key)` ne trie que ces 100 lignes. C'est pourquoi les lots du 23/02/2026 n'apparaissent pas en tri decroissant -- ils ne font pas partie du sous-ensemble aleatoire selectionne.

De plus, le `sort_key` est converti en `text`, ce qui cause un tri alphabetique au lieu de numerique pour la colonne "stock" (ex: "10" < "2" en texte).

## Correction

### Fichier : nouvelle migration SQL

Recreer la fonction `search_lots_paginated` avec :

1. **Ajouter `ORDER BY` dans le sous-requete, avant le `LIMIT/OFFSET`** : Le tri doit s'appliquer sur l'ensemble complet des donnees filtrees, puis le LIMIT selectionne la bonne page.

2. **Corriger le type du sort_key pour "stock"** : Utiliser `lpad(l.quantite_restante::text, 15, '0')` pour que le tri textuel respecte l'ordre numerique, ou mieux, utiliser des CASEs separes pour chaque type de tri.

3. **Structure corrigee** :

```sql
FROM (
  SELECT ...
  FROM lots l
  JOIN produits p ON ...
  LEFT JOIN fournisseurs f ON ...
  WHERE ...
  ORDER BY
    CASE WHEN p_sort_by = 'date_entree' AND p_sort_order = 'desc' 
         THEN COALESCE(l.date_reception, l.created_at) END DESC,
    CASE WHEN p_sort_by = 'date_entree' AND p_sort_order = 'asc' 
         THEN COALESCE(l.date_reception, l.created_at) END ASC,
    CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'desc' 
         THEN l.date_peremption END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'asc' 
         THEN l.date_peremption END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' 
         THEN l.quantite_restante END DESC,
    CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' 
         THEN l.quantite_restante END ASC,
    CASE WHEN p_sort_by = 'numero_lot' AND p_sort_order = 'desc' 
         THEN l.numero_lot END DESC,
    CASE WHEN p_sort_by = 'numero_lot' AND p_sort_order = 'asc' 
         THEN l.numero_lot END ASC,
    COALESCE(l.date_reception, l.created_at) DESC
  LIMIT p_limit OFFSET v_offset
) sub
```

4. **Supprimer le `ORDER BY` du `json_agg`** : Il n'est plus necessaire puisque les lignes arrivent deja triees. On peut le garder pour garantir l'ordre, mais en utilisant un index de ligne (`row_number()`) plutot que la colonne `sort_key` textuelle.

### Aucune modification frontend

Le hook `useLotsPaginated.ts` et les composants ne changent pas. Le probleme est 100% cote SQL.

## Resume

| Element | Avant | Apres |
|---------|-------|-------|
| ORDER BY dans sous-requete | Absent | Present avec CASE par type |
| Tri "stock" | Alphabetique (text) | Numerique natif |
| Tri "date_entree" desc, page 1 | Dates aleatoires | 23/02/2026 en premier |
| Metriques (Total, Expires, etc.) | Correctes (RPC separee) | Inchangees |
| Nombre de lots pris en compte | Tous pour le count, arbitraire pour l'affichage | Tous, correctement pagines |
