

# Correction de l'erreur 404 sur search_lots_paginated

## Probleme

La migration precedente a renomme le parametre `p_page_size` en `p_limit` dans la fonction SQL, mais le hook frontend envoie toujours `p_page_size`. PostgREST ne trouve pas de fonction correspondant a cette signature et retourne 404.

## Correction

### Fichier : `src/hooks/useLotsPaginated.ts` (ligne 66)

Remplacer `p_page_size` par `p_limit` :

```typescript
// Avant
p_page_size: pageSize,

// Apres
p_limit: pageSize,
```

C'est la seule modification necessaire. Aucun autre fichier n'est impacte.

