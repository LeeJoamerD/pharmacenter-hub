

## Diagnostic

Two errors found:

### Error 1: `generate_lot_barcode` 404
The RPC function `generate_lot_barcode(p_tenant_id, p_fournisseur_id)` requires both parameters as `uuid`. When UG has no supplier (`fournisseur_id: null`), `null` is passed for `p_fournisseur_id`, which doesn't match the function signature `(uuid, uuid)` — PostgREST can't find a matching overload.

**Fix in `useReceptions.ts`**: Skip the barcode RPC call when `fournisseur_id` is null/undefined. Generate a fallback barcode client-side (e.g., `UG-{timestamp}-{random}`) instead.

### Error 2: `reception_lignes` relation not found (400)
`FreeUnitsHistory.tsx` line 62 references `reception_lignes` but the actual table/relation name is `lignes_reception_fournisseur`. The PostgREST hint confirms this.

**Fix in `FreeUnitsHistory.tsx`**: Replace `reception_lignes` with `lignes_reception_fournisseur` in the select query (line 62) and update the `UGReception` interface property name (line 22) plus all references throughout the component.

### Files to modify
- `src/hooks/useReceptions.ts` — Guard barcode RPC call against null fournisseur_id, use fallback
- `src/components/dashboard/modules/stock/free-units/FreeUnitsHistory.tsx` — Fix relation name from `reception_lignes` to `lignes_reception_fournisseur`

