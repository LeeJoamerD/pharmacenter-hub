

## Diagnostic

The error `null value in column "fournisseur_id" violates not-null constraint` is caused by the database column `receptions_fournisseurs.fournisseur_id` being defined as `NOT NULL`. When a UG has a non-reception source (Don, Stock Orphelin, Autre), there is no supplier, so `null` is sent — which the DB rejects.

The previous fix correctly changed the code to send `null` instead of `""`, but the DB constraint still blocks it.

## Plan

### 1. Migration SQL: Make `fournisseur_id` nullable

```sql
ALTER TABLE receptions_fournisseurs 
ALTER COLUMN fournisseur_id DROP NOT NULL;
```

This is safe because the foreign key constraint still ensures referential integrity when a value IS provided. It just allows `NULL` for cases without a supplier (UG donations, orphan stock, etc.).

### 2. Update `useReceptions.ts` type signature

Change `fournisseur_id: string` to `fournisseur_id?: string | null` in the `createReception` parameter type (line 80) to reflect the now-optional nature.

### Files to modify
- **Migration SQL** — `ALTER COLUMN fournisseur_id DROP NOT NULL`
- **`src/hooks/useReceptions.ts`** line 80 — Make type optional

