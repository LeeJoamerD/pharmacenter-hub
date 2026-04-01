

# Fix: "Créer votre compte Admin" option not appearing in pharmacy badge

## Root Cause

`usePharmacyAdmin` queries the `personnel` table directly:
```typescript
const { count, error } = await supabase
  .from('personnel')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
  .eq('role', 'Admin');
```

When only a pharmacy session exists (no Supabase Auth user), **RLS blocks the query**. The result is `count = null` or an error, so `hasAdmin` becomes `null`. In Hero.tsx, the condition `hasAdmin === false` does not match `null`, so the button is hidden.

## Solution

Replace the direct table query in `usePharmacyAdmin.ts` with a call to a `SECURITY DEFINER` RPC that bypasses RLS, similar to the pattern used for `create_initial_admin_personnel`.

### 1. New SQL migration — `check_pharmacy_has_admin` RPC

```sql
CREATE OR REPLACE FUNCTION public.check_pharmacy_has_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM personnel
    WHERE tenant_id = p_tenant_id AND role = 'Admin' AND is_active = true
  );
$$;
```

### 2. Update `src/hooks/usePharmacyAdmin.ts`

Replace the direct query with:
```typescript
const { data, error } = await supabase.rpc('check_pharmacy_has_admin', {
  p_tenant_id: tenantId
});
if (error) {
  console.error('Erreur vérification admin:', error);
  return false; // Treat error as "no admin" so the button appears
}
return !!data;
```

### 3. Update Supabase types

Add `check_pharmacy_has_admin` to `types.ts` RPC definitions.

## Files modified
- New SQL migration — `check_pharmacy_has_admin`
- `src/hooks/usePharmacyAdmin.ts` — use RPC instead of direct query
- `src/integrations/supabase/types.ts` — add RPC type

