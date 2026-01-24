

# Plan de correction - Faille de sécurité d'isolation des sessions

## Problème identifié

### Résumé de la faille
Lors de la connexion utilisateur via le bouton dans le Header, le système permet à **n'importe quel utilisateur Supabase Auth valide** de se connecter, même s'il n'appartient pas à la pharmacie (tenant) actuellement active.

### Cas problématique observé
1. Pharmacie "MAZAYU" est connectée (Hero affiche "Pharmacie MAZAYU")
2. L'utilisateur se déconnecte
3. Un utilisateur d'une autre pharmacie (ex: "DJL - Computer Sciences") se connecte via le Header
4. Le Dashboard affiche les données de "DJL" mais le Hero reste sur "MAZAYU"

### Cause technique
La fonction `signIn` (AuthContext) et `enhancedSignIn` (useAdvancedAuth) vérifient qu'une pharmacie est connectée, mais **ne vérifient pas si l'utilisateur appartient à cette pharmacie spécifique**.

---

## Solution proposée

### Stratégie simplifiée

Après authentification Supabase réussie, vérifier que l'utilisateur existe dans la table `personnel` avec :
- `personnel.auth_user_id = user.id` (utilisateur authentifié)
- `personnel.tenant_id = connectedPharmacy.id` (pharmacie active)

Si cette condition n'est pas remplie → déconnexion + erreur explicite.

**Note importante** : Les emails de pharmacie ne sont PAS bloqués car chaque pharmacie a un compte utilisateur Admin avec le même email.

---

## Modifications requises

### 1. Nouvelle fonction RPC : `verify_user_belongs_to_tenant`

Fonction serveur pour valider l'appartenance d'un utilisateur authentifié à un tenant spécifique.

```text
Fonction: public.verify_user_belongs_to_tenant(p_tenant_id UUID)

Logique:
1. Récupérer auth.uid() (utilisateur connecté)
2. Chercher dans personnel WHERE auth_user_id = auth.uid() AND tenant_id = p_tenant_id AND is_active = true
3. Retourner { belongs: boolean, user_name: text, personnel_id: uuid, error: text }
```

### 2. Modification de `src/hooks/useAdvancedAuth.ts`

Modifier la fonction `enhancedSignIn` (lignes 230-248) pour ajouter la vérification après `signInWithPassword` :

```text
Étapes modifiées:
1. Authentifier avec Supabase Auth (existant)
2. NOUVEAU: Appeler verify_user_belongs_to_tenant(pharmacyId)
3. Si belongs = false → signOut + erreur "Ce compte n'existe pas dans cette pharmacie"
4. Si belongs = true → continuer le flux normal
```

### 3. Modification de `src/contexts/AuthContext.tsx`

Modifier la fonction `signIn` (lignes 265-281) avec la même logique de vérification.

---

## Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/[timestamp]_add_tenant_user_verification.sql` | Créer | Nouvelle fonction RPC |
| `src/hooks/useAdvancedAuth.ts` | Modifier | Ajouter validation dans `enhancedSignIn` |
| `src/contexts/AuthContext.tsx` | Modifier | Ajouter validation dans `signIn` |

---

## Détails techniques

### Migration SQL - Fonction RPC

```sql
CREATE OR REPLACE FUNCTION public.verify_user_belongs_to_tenant(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  personnel_record RECORD;
BEGIN
  -- Récupérer l'utilisateur actuel
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('belongs', false, 'error', 'Utilisateur non authentifié');
  END IF;
  
  -- Vérifier si l'utilisateur appartient au tenant spécifié
  SELECT id, noms, prenoms INTO personnel_record
  FROM public.personnel
  WHERE auth_user_id = current_user_id 
    AND tenant_id = p_tenant_id
    AND is_active = true
  LIMIT 1;
  
  IF personnel_record IS NULL THEN
    RETURN jsonb_build_object(
      'belongs', false,
      'error', 'Utilisateur non trouvé dans cette pharmacie'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'belongs', true,
    'user_name', personnel_record.noms || ' ' || COALESCE(personnel_record.prenoms, ''),
    'personnel_id', personnel_record.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_user_belongs_to_tenant TO authenticated;
```

### Modification useAdvancedAuth.ts (lignes 230-248)

**Avant** :
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  await logLoginAttempt(email, false, error.message);
  setLoading(false);
  return { error };
}

await logLoginAttempt(email, true);
```

**Après** :
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  await logLoginAttempt(email, false, error.message);
  setLoading(false);
  return { error };
}

// Vérifier que l'utilisateur appartient au tenant actif
const { data: verification, error: verifyError } = await supabase.rpc(
  'verify_user_belongs_to_tenant',
  { p_tenant_id: pharmacyId }
);

if (verifyError || !verification) {
  await supabase.auth.signOut();
  await logLoginAttempt(email, false, 'Verification failed');
  setLoading(false);
  return { error: new Error('Erreur de vérification du compte') };
}

const verificationResult = verification as {
  belongs: boolean;
  error?: string;
};

if (!verificationResult.belongs) {
  await supabase.auth.signOut();
  await logLoginAttempt(email, false, 'User not in tenant');
  setLoading(false);
  return { 
    error: new Error('Ce compte utilisateur n\'existe pas dans cette pharmacie. Veuillez vérifier que vous êtes connecté à la bonne pharmacie.') 
  };
}

await logLoginAttempt(email, true);
```

### Modification AuthContext.tsx (fonction signIn, lignes 265-281)

**Avant** :
```typescript
const signIn = async (email: string, password: string) => {
  try {
    if (!connectedPharmacy) {
      return { error: new Error('Aucune pharmacie connectée...') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};
```

**Après** :
```typescript
const signIn = async (email: string, password: string) => {
  try {
    if (!connectedPharmacy) {
      return { error: new Error('Aucune pharmacie connectée...') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Vérifier que l'utilisateur appartient au tenant actif
    const { data: verification, error: verifyError } = await supabase.rpc(
      'verify_user_belongs_to_tenant',
      { p_tenant_id: connectedPharmacy.id }
    );

    if (verifyError || !verification) {
      await supabase.auth.signOut();
      return { error: new Error('Erreur de vérification du compte') };
    }

    const verificationResult = verification as { belongs: boolean; error?: string };

    if (!verificationResult.belongs) {
      await supabase.auth.signOut();
      return { 
        error: new Error('Ce compte utilisateur n\'existe pas dans cette pharmacie.') 
      };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

---

## Comportement attendu après correction

| Scénario | Avant | Après |
|----------|-------|-------|
| Utilisateur du bon tenant | Connexion OK | Connexion OK |
| Admin pharmacie dans sa propre pharmacie | Connexion OK | Connexion OK |
| Utilisateur d'un autre tenant | Accès à ses propres données (bug) | Erreur "Ce compte n'existe pas dans cette pharmacie" |

---

## Tests de validation

1. **Test positif** : Connexion Admin MAZAYU dans pharmacie MAZAYU → Succès
2. **Test positif** : Connexion utilisateur lambda dans sa pharmacie → Succès  
3. **Test négatif** : Connexion Admin DJL dans pharmacie MAZAYU → Erreur explicite + déconnexion

