

# Fix: RPC `search_movements_paginated` - SQL Alias Error

## Problem

The migration creating `search_movements_paginated` has a SQL error: the outer `jsonb_agg(... ORDER BY ...)` references columns with the `m.` table alias, but those columns come from a subquery aliased as `sub`. PostgreSQL cannot resolve `m.date_mouvement` at the outer scope, causing `missing FROM-clause entry for table "m"`. Since the function creation fails, PostgREST returns 404 when the frontend calls it.

## Fix

Re-create the RPC with a new migration that removes the `m.` prefix from the outer ORDER BY clause. The subquery already exposes these columns as bare names (`date_mouvement`, `type_mouvement`, `quantite_mouvement`), so they just need to be referenced without a table prefix.

### Changes in the outer `jsonb_agg` ORDER BY (lines 60-75)

Replace all `m.date_mouvement`, `m.type_mouvement`, `m.quantite_mouvement` with `date_mouvement`, `type_mouvement`, `quantite_mouvement`.

## File changed

| File | Action |
|------|--------|
| New migration SQL | `CREATE OR REPLACE FUNCTION search_movements_paginated(...)` with corrected column references + `NOTIFY pgrst, 'reload schema'` |

No frontend changes needed -- the hook and components are already correct.

