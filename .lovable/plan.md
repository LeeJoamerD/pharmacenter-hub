

# Fix: Demo Login Redirect + Button Visibility

## Root Causes

### Issue 1: Redirect to homepage after successful OTP verification
Two bugs in `TestAccessDialog.tsx`:

1. **Wrong localStorage format**: The dialog stores `{ pharmacy_id, pharmacy_name, session_token, expires_at }` (snake_case, flat). But `AuthContext.restorePharmacySession` expects `{ sessionToken, expiresAt, pharmacy: { id, name, ... } }` (camelCase, nested). On reload, it finds no `sessionToken` key → deletes the session → Dashboard sees no pharmacy → redirects home.

2. **Fake session token**: `auto-login-test` returns `session_token: "test-1773258590727"` which has no record in `pharmacy_sessions` table. `validate-pharmacy-session` always rejects it.

### Issue 2: "Tester PharmaSoft" not showing on custom domain
The code already shows "Tester PharmaSoft" on all domains (no domain-based logic). The custom domain still serves the old PWA-cached build from before the button was added. The `maximumFileSizeToCacheInBytes` fix from the previous iteration should resolve this after a hard reload.

## Fixes

### 1. `supabase/functions/auto-login-test/index.ts` — Create a real pharmacy session

After generating the magic link, call `create_pharmacy_session` RPC to create a real session in `pharmacy_sessions` table for the test tenant:

```typescript
const { data: sessionData } = await supabase.rpc('create_pharmacy_session', {
  p_pharmacy_id: TEST_TENANT_ID,
  p_ip_address: null,
  p_user_agent: 'test-access'
});
```

Return the real `session_token` and `expires_at` from this RPC instead of the fake `test-${Date.now()}`.

Also fetch the pharmacy data to return it for enriched localStorage storage.

### 2. `src/components/test-access/TestAccessDialog.tsx` — Fix localStorage format + navigation

After successful login:
- Store localStorage in the **enriched format** that AuthContext expects:
```typescript
const enrichedSession = {
  sessionToken: loginData.session_token,
  expiresAt: loginData.expires_at,
  pharmacy: {
    id: TEST_TENANT_ID,
    name: loginData.pharmacy_name,
    email: loginData.pharmacy_email,
    city: loginData.pharmacy_city,
    // ...
  }
};
localStorage.setItem('pharmacy_session', JSON.stringify(enrichedSession));
```

- Remove `window.location.reload()` — instead, after `setSession`, navigate directly. The `onAuthStateChange` listener in AuthContext will pick up the user, and `restorePharmacySession` will correctly parse the enriched localStorage.

### 3. No code change for button visibility
The translation `seeDemo: "Tester PharmaSoft"` is already set for all languages. The PWA cache fix will propagate to the custom domain on next hard reload.

## Constants
- Test Tenant ID: `2f7365aa-eadd-4aa9-a5c8-330b97d55ea8`
- Test User auth ID: `63c51688-ad32-4299-82b7-bbb1408e668e`
- Test Personnel ID: `ae6f6441-45bd-44d5-9e53-e98a72a8c503`

