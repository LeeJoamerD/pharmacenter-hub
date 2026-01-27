

# Plan de Refactoring : Découplage Complet Pharmacie/Utilisateur

## Objectif
Séparer complètement l'authentification des pharmacies (tenants) de celle des utilisateurs individuels, pour que les déconnexions utilisateurs n'impactent jamais l'état de connexion des pharmacies.

---

## Vue d'Ensemble de l'Architecture Cible

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AVANT (Architecture Actuelle)                │
├─────────────────────────────────────────────────────────────────┤
│  auth.users (email: pharmacie@mail.com)                         │
│       ↓                                                         │
│  personnel (Admin, email: pharmacie@mail.com, tenant_id: X)     │
│       ↓                                                         │
│  pharmacies (id: X, email: pharmacie@mail.com)                  │
│                                                                 │
│  PROBLEME: Même compte auth pour pharmacie ET utilisateur admin │
└─────────────────────────────────────────────────────────────────┘

                              ↓ REFACTORING ↓

┌─────────────────────────────────────────────────────────────────┐
│                    APRES (Architecture Cible)                   │
├─────────────────────────────────────────────────────────────────┤
│  PHARMACIE (Session indépendante)                               │
│  ─────────────────────────────                                  │
│  pharmacies (id: X, email: pharmacie@mail.com, password_hash)   │
│       ↓                                                         │
│  pharmacy_sessions (session_token, pharmacy_id: X)              │
│                                                                 │
│  UTILISATEUR (Session Supabase Auth séparée)                    │
│  ────────────────────────────────────────────                   │
│  auth.users (email: utilisateur@mail.com) -- Email DIFFERENT    │
│       ↓                                                         │
│  personnel (user_id, tenant_id: X) -- Lié à la pharmacie        │
│                                                                 │
│  EMAIL PHARMACIE ≠ EMAIL UTILISATEUR (contrainte unique)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 : Modifications Base de Données

### 1.1 Ajouter un champ `password_hash` à la table `pharmacies`

Permet aux pharmacies de s'authentifier directement sans passer par `auth.users`.

```sql
ALTER TABLE pharmacies ADD COLUMN password_hash TEXT;
```

### 1.2 Créer une fonction RPC `authenticate_pharmacy`

Nouvelle fonction pour authentifier une pharmacie par son email et mot de passe stockés directement dans la table `pharmacies`.

```sql
CREATE OR REPLACE FUNCTION public.authenticate_pharmacy(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pharmacy RECORD;
  v_session_token TEXT;
BEGIN
  -- Vérifier les credentials
  SELECT * INTO v_pharmacy 
  FROM pharmacies 
  WHERE lower(email) = lower(p_email)
  AND password_hash = crypt(p_password, password_hash)
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email ou mot de passe incorrect');
  END IF;
  
  -- Créer une session pharmacie
  v_session_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy.id, v_session_token, NOW() + INTERVAL '7 days', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy', row_to_json(v_pharmacy),
    'session_token', v_session_token
  );
END;
$$;
```

### 1.3 Modifier `register_pharmacy_with_admin`

Nouvelle version qui :
- Crée UNIQUEMENT la pharmacie (sans utilisateur, sans personnel)
- Hash et stocke le mot de passe dans `pharmacies.password_hash`
- Ne crée PAS de compte `auth.users`

### 1.4 Créer une fonction de vérification d'email unique

Empêcher qu'un email de pharmacie soit utilisé pour un compte utilisateur.

```sql
CREATE OR REPLACE FUNCTION public.check_email_available_for_user(p_email TEXT)
RETURNS JSONB
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email)) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'email_used_by_pharmacy');
  END IF;
  RETURN jsonb_build_object('available', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 2 : Modifications Frontend - Création de Pharmacie

### 2.1 Simplifier `PharmacyCreation.tsx`

**Supprimer entièrement** :
- La section "Informations de l'administrateur" (noms, prenoms, reference_agent, telephone personnel)
- L'appel à `supabase.auth.signUp()`

**Conserver** :
- Informations pharmacie
- Email + mot de passe (pour la pharmacie uniquement)
- Vérifications email/SMS

**Nouveau flux** :
```text
1. Vérification email pharmacie
2. Vérification téléphone pharmacie
3. Appel RPC register_pharmacy_simple (sans admin)
4. Création session pharmacie (localStorage)
5. Redirection vers accueil (pas tableau de bord)
```

### 2.2 Fichier : `src/pages/PharmacyCreation.tsx`

Modifications majeures :
- Lignes 21-38 : Supprimer les champs admin (`noms`, `prenoms`, `reference_agent`, `telephone`)
- Lignes 156-206 : Supprimer `supabase.auth.signUp()` - Plus d'utilisateur créé
- Lignes 209-233 : Modifier l'appel RPC pour utiliser `register_pharmacy_simple`
- Lignes 250-258 : Rediriger vers `/` au lieu de `/tableau-de-bord`
- Supprimer tout le bloc HTML "Informations de l'administrateur" (lignes ~455-550)

---

## Phase 3 : Modifications Frontend - Authentification

### 3.1 Modifier `connectPharmacy` dans `AuthContext.tsx`

**Avant** (lignes 393-479) :
- Utilise `supabase.auth.signInWithPassword()`
- Lie la session pharmacie à Supabase Auth

**Après** :
- Appelle la RPC `authenticate_pharmacy`
- Ne touche JAMAIS à `supabase.auth`
- Stocke uniquement le token dans localStorage

```typescript
const connectPharmacy = async (email: string, password: string) => {
  const { data, error } = await supabase.rpc('authenticate_pharmacy', {
    p_email: email,
    p_password: password
  });
  
  if (error || !data?.success) {
    return { error: new Error(data?.error || 'Erreur connexion') };
  }
  
  const pharmacyData = data.pharmacy;
  const sessionToken = data.session_token;
  
  setConnectedPharmacy({ ...pharmacyData, sessionToken });
  localStorage.setItem('pharmacy_session', JSON.stringify({
    sessionToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  return { error: null };
};
```

### 3.2 Fichier : `src/contexts/AuthContext.tsx`

Modifications :
- Lignes 393-479 : Réécrire `connectPharmacy` sans `supabase.auth`
- Lignes 417-426 : Supprimer l'appel à `signInWithPassword`

---

## Phase 4 : Modifications Frontend - Inscription Utilisateur

### 4.1 Modifier `UserRegister.tsx`

**Ajouter** une vérification avant inscription :
```typescript
// Avant de créer le compte
const { data: emailCheck } = await supabase.rpc('check_email_available_for_user', {
  p_email: email
});

if (!emailCheck?.available) {
  toast.error("Cette adresse email est réservée à une pharmacie");
  return;
}
```

### 4.2 Fichier : `src/pages/UserRegister.tsx`

Modifications :
- Ligne 185-238 : Ajouter la vérification email avant `handleSubmit`

---

## Phase 5 : Nettoyage des Données Existantes

### 5.1 Script SQL de Migration

Ce script doit être exécuté manuellement dans le SQL Editor de Supabase :

```sql
-- 1. Identifier les comptes à supprimer
WITH duplicate_admin_accounts AS (
  SELECT 
    u.id as auth_user_id,
    u.email,
    p.id as pharmacy_id,
    p.name as pharmacy_name
  FROM auth.users u
  INNER JOIN pharmacies p ON lower(p.email) = lower(u.email)
  INNER JOIN personnel pe ON pe.auth_user_id = u.id AND pe.tenant_id = p.id
  WHERE pe.role = 'Admin'
)
SELECT * FROM duplicate_admin_accounts;

-- 2. Supprimer les enregistrements personnel admin dupliqués
DELETE FROM personnel 
WHERE id IN (
  SELECT pe.id
  FROM personnel pe
  INNER JOIN auth.users u ON pe.auth_user_id = u.id
  INNER JOIN pharmacies p ON pe.tenant_id = p.id AND lower(p.email) = lower(u.email)
  WHERE pe.role = 'Admin'
);

-- 3. Supprimer les comptes auth.users dupliqués
-- NOTE: Nécessite service_role ou accès admin
DELETE FROM auth.users 
WHERE email IN (SELECT email FROM pharmacies);

-- 4. Migrer les mots de passe existants vers pharmacies.password_hash
-- NOTE: Impossible car les mots de passe sont hashés par Supabase Auth
-- Les pharmacies devront réinitialiser leur mot de passe via /pharmacy-password-reset
```

### 5.2 Comptes Concernés (5 pharmacies)

| Pharmacie | Email |
|-----------|-------|
| Phamacie La GLOIRE | louzolocatherine@gmail.com |
| Pharmacie Nuit Rond Point de la Paix | pharmacienuitrondpointdelapaix@gmail.com |
| Pharmacie MAZAYU | mdorefr@gmail.com |
| DJL - Computer Sciences | lee.joamer@gmail.com |
| Pharmacie TESTS | mdorelfr@yahoo.fr |

---

## Phase 6 : Mise à Jour des Flux d'Authentification

### 6.1 Nouveau flux de connexion pharmacie

```text
┌─────────────────────────────────────────────────────────────────┐
│ Page PharmacyConnection                                         │
│ 1. Utilisateur entre email + mot de passe                       │
│ 2. Appel RPC authenticate_pharmacy                              │
│ 3. Réponse: { success, pharmacy, session_token }                │
│ 4. Stocker session_token dans localStorage                      │
│ 5. Afficher Hero "Pharmacie connectée"                          │
│ 6. Bouton Header pour connexion utilisateur (séparée)           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Nouveau flux de connexion utilisateur

```text
┌─────────────────────────────────────────────────────────────────┐
│ Page UserLogin (via bouton Header)                              │
│ 1. Vérifier que pharmacie est connectée (obligatoire)           │
│ 2. Utilisateur entre email + mot de passe                       │
│ 3. Vérifier email non utilisé par une pharmacie                 │
│ 4. Appel supabase.auth.signInWithPassword                       │
│ 5. Vérifier personnel.tenant_id = connectedPharmacy.id          │
│ 6. Accès au tableau de bord                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Résumé des Fichiers à Modifier

| Fichier | Type | Description |
|---------|------|-------------|
| `supabase/migrations/XXXXXX_decouple_pharmacy_auth.sql` | Création | Nouvelle migration SQL |
| `src/pages/PharmacyCreation.tsx` | Modification majeure | Supprimer bloc admin, simplifier RPC |
| `src/contexts/AuthContext.tsx` | Modification majeure | Réécrire `connectPharmacy` sans auth.users |
| `src/pages/UserRegister.tsx` | Modification | Ajouter vérification email pharmacie |
| `src/pages/PharmacyConnection.tsx` | Modification | Utiliser nouvelle RPC authenticate_pharmacy |
| Edge Function: `create-pharmacy` (optionnel) | Création | Si nécessaire pour hasher le mot de passe |

---

## Points de Vigilance

### Sécurité
- Les mots de passe pharmacie doivent être hashés avec `pgcrypto` (déjà installé)
- Ne jamais exposer `password_hash` via les policies RLS

### Migration des Mots de Passe
- Les pharmacies existantes n'ont pas de `password_hash` dans la table `pharmacies`
- Elles devront utiliser `/pharmacy-password-reset` pour définir un nouveau mot de passe

### Rétrocompatibilité
- Les utilisateurs existants (non-admin) ne sont pas affectés
- Seuls les comptes admin partageant l'email de la pharmacie seront supprimés

---

## Estimation

| Phase | Complexité | Fichiers | Risque |
|-------|------------|----------|--------|
| Phase 1 (DB) | Moyenne | 1 migration | Faible |
| Phase 2 (PharmacyCreation) | Élevée | 1 | Moyen |
| Phase 3 (AuthContext) | Élevée | 1 | Moyen |
| Phase 4 (UserRegister) | Faible | 1 | Faible |
| Phase 5 (Nettoyage) | Moyenne | SQL manuel | Moyen |
| Phase 6 (Tests) | - | - | - |

**Total** : ~5 fichiers modifiés, 1 migration SQL, 1 script de nettoyage manuel

