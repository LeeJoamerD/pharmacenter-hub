

# Correction definitive : suppression de la fonction dupliquee

## Cause racine trouvee

Il existe **deux versions** de la fonction `search_lots_paginated` en base de donnees, avec des signatures differentes :

```text
Version 1 (ancienne - oid 416894):
  (uuid, text, text, text, text, integer, integer)
  Ordre: tenant_id, search, status_filter, sort_by, sort_order, limit, page

Version 2 (nouvelle - oid 417045):
  (uuid, text, integer, integer, text, text, text)
  Ordre: tenant_id, search, limit, page, status_filter, sort_by, sort_order
```

PostgreSQL autorise la surcharge de fonctions (function overloading). Quand la migration a utilise `CREATE OR REPLACE`, le changement d'ordre des types de parametres a cree une **deuxieme** fonction au lieu de remplacer l'ancienne. PostgREST ne sait pas laquelle appeler quand le frontend envoie des parametres nommes, ce qui provoque une erreur ou un timeout.

## Solution

### Migration SQL unique

1. **Supprimer** l'ancienne version avec la signature `(uuid, text, text, text, text, integer, integer)`
2. La nouvelle version (deja correcte et testee) restera la seule en place
3. Ajouter `NOTIFY pgrst, 'reload schema'` pour rafraichir le cache PostgREST

```sql
DROP FUNCTION IF EXISTS search_lots_paginated(uuid, text, text, text, text, integer, integer);
NOTIFY pgrst, 'reload schema';
```

### Aucune modification frontend

Le hook `useLotsPaginated.ts` et le composant `LotTracker.tsx` restent inchanges. Le probleme est purement cote base de donnees.

## Impact attendu

- Plus d'ambiguite PostgREST : une seule fonction avec une seule signature
- Le tri par "Date d'entree" en decroissant affichera les lots du 23/02/2026 en premier
- Plus d'erreur de chargement ni de timeout

