

# Correction de l'erreur 401 lors de la création admin après inscription pharmacie

## Diagnostic

Le flux actuel est :
1. La pharmacie est créée via `register_pharmacy_simple` **sans** session Supabase Auth (pas d'utilisateur connecté)
2. Ensuite, le dialog de création admin appelle `supabase.functions.invoke('create-user-with-personnel')`
3. Cette Edge Function exige un `Authorization` header avec un JWT valide et vérifie que l'appelant a le rôle Admin/Pharmacien
4. **Problème** : à ce stade, aucun utilisateur n'est authentifié → 401 Unauthorized

C'est un problème de poule et d'œuf : on ne peut pas créer le premier admin via une fonction qui exige d'être déjà admin.

## Solution

Modifier `useAdminCreation.ts` pour contourner l'Edge Function lors de la **création initiale du premier admin** d'une pharmacie. Au lieu d'appeler `create-user-with-personnel`, utiliser directement :

1. `supabase.auth.signUp()` pour créer le compte utilisateur
2. `supabase.auth.signInWithPassword()` pour obtenir une session
3. Puis, une fois authentifié, appeler une **RPC `SECURITY DEFINER`** (existante ou nouvelle) pour créer l'enregistrement personnel

### Détail des modifications

**Fichier : `src/hooks/useAdminCreation.ts`** (lignes 125-138)

Remplacer l'appel `supabase.functions.invoke('create-user-with-personnel')` par :

```typescript
// 1. Créer l'utilisateur via Auth (pas besoin d'être connecté)
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: adminData.email,
  password: adminData.password,
  options: {
    data: { noms: adminData.noms, prenoms: adminData.prenoms, role: 'Admin' }
  }
});

// 2. Se connecter immédiatement
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: adminData.email,
  password: adminData.password
});

// 3. Créer le personnel via RPC SECURITY DEFINER
const { data, error } = await supabase.rpc('create_initial_admin_personnel', {
  p_tenant_id: pharmacyId,
  p_auth_user_id: signUpData.user.id,
  p_noms: adminData.noms,
  p_prenoms: adminData.prenoms,
  p_email: adminData.email,
  p_telephone: adminData.phone
});
```

**Fichier : nouvelle migration SQL** — Créer la RPC `create_initial_admin_personnel`

```sql
CREATE OR REPLACE FUNCTION public.create_initial_admin_personnel(
  p_tenant_id uuid, p_auth_user_id uuid,
  p_noms text, p_prenoms text, p_email text, p_telephone text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  admin_count int;
  new_personnel_id uuid;
BEGIN
  -- Sécurité : n'autoriser que si la pharmacie n'a AUCUN admin
  SELECT count(*) INTO admin_count
  FROM personnel WHERE tenant_id = p_tenant_id AND role = 'Admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Cette pharmacie possède déjà un administrateur';
  END IF;

  INSERT INTO personnel (tenant_id, auth_user_id, noms, prenoms, email,
    telephone_appel, role, reference_agent, is_active)
  VALUES (p_tenant_id, p_auth_user_id, p_noms, p_prenoms, p_email,
    p_telephone, 'Admin', 'AG-' || extract(epoch from now())::text, true)
  RETURNING id INTO new_personnel_id;

  -- Créer le client associé
  INSERT INTO clients (tenant_id, type_client, personnel_id, nom_complet, telephone)
  VALUES (p_tenant_id, 'Personnel', new_personnel_id, p_prenoms || ' ' || p_noms, p_telephone);

  RETURN jsonb_build_object('success', true, 'personnel_id', new_personnel_id);
END;
$$;
```

**Sécurité** : La RPC vérifie qu'aucun admin n'existe pour ce tenant avant d'en créer un, empêchant toute exploitation.

## Fichiers modifiés
- `src/hooks/useAdminCreation.ts` — remplacer l'appel Edge Function par signUp + signIn + RPC
- Nouvelle migration SQL — fonction `create_initial_admin_personnel`

