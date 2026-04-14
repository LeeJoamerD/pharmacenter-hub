

# Fix: RPC still references non-existent table `familles`

## Root cause

There are/were two function signatures:
- `(p_barcode TEXT, p_tenant_id UUID)` — the corrected migration targeted this one
- `(p_tenant_id UUID, p_barcode TEXT)` — the one actually called by the app

The DROP migration removed the corrected version, leaving the broken one live. The surviving function still has:
- Line 119: `f.nom` (should be `f.libelle_famille`)
- Line 127: `LEFT JOIN familles f` (should be `LEFT JOIN famille_produit f`)

## Plan

### 1. New migration: re-create the function with correct signature

Create `OR REPLACE` for `search_product_by_barcode(p_tenant_id UUID, p_barcode TEXT)` — the signature the app actually calls — with:
- `LEFT JOIN famille_produit f ON p.famille_id = f.id`
- `COALESCE(f.libelle_famille, 'Non catégorisé') AS category`

Everything else in the function body stays identical to what's currently deployed.

### Files
| File | Change |
|------|--------|
| `supabase/migrations/new` | `CREATE OR REPLACE FUNCTION` with correct signature and fixed JOIN |

