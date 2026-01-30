
# Plan : Flux de Réinitialisation de Mot de Passe Pharmacie (Indépendant de Supabase Auth)

## Problème Actuel

Le flux actuel utilise `supabase.auth.resetPasswordForEmail()` qui nécessite un compte dans `auth.users`. Or, les pharmacies sont authentifiées via leur propre système (`password_hash` dans la table `pharmacies`), indépendamment de Supabase Auth.

```text
┌─────────────────────────────────────────────────────────────┐
│                    FLUX ACTUEL (CASSÉ)                      │
├─────────────────────────────────────────────────────────────┤
│  Pharmacie → resetPasswordForEmail() → auth.users           │
│                                          ↓                  │
│                                    EMAIL NON TROUVÉ ❌      │
└─────────────────────────────────────────────────────────────┘
```

## Solution Proposée

Réutiliser l'infrastructure existante (Edge Functions `send-verification-code` + `verify-code` + table `verification_codes`) pour créer un flux OTP personnalisé.

```text
┌─────────────────────────────────────────────────────────────┐
│                    NOUVEAU FLUX (OTP)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PharmacyPasswordReset.tsx                               │
│     └─→ send-verification-code (type: "email")             │
│         └─→ verification_codes table                        │
│         └─→ Email Resend avec code 6 chiffres               │
│                                                             │
│  2. PharmacyPasswordResetVerify.tsx (NOUVELLE PAGE)         │
│     └─→ Saisie code OTP                                     │
│     └─→ verify-code Edge Function                           │
│     └─→ Si valide → Afficher formulaire nouveau mot de passe│
│     └─→ update_pharmacy_password RPC                        │
│         └─→ Mise à jour password_hash dans pharmacies       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/PharmacyPasswordReset.tsx` | MODIFIER | Appeler `send-verification-code` au lieu de `resetPasswordForEmail` |
| `src/pages/PharmacyPasswordResetVerify.tsx` | CRÉER | Page de vérification OTP + nouveau mot de passe |
| `src/App.tsx` | MODIFIER | Ajouter la nouvelle route |
| `supabase/functions/send-verification-code/index.ts` | MODIFIER | Ajouter type "password_reset" avec template email adapté |

## Détails Techniques

### 1. Modification de PharmacyPasswordReset.tsx

Remplacer l'appel à Supabase Auth par l'Edge Function existante :

```typescript
// AVANT (cassé)
const { error } = await supabase.auth.resetPasswordForEmail(email, {...});

// APRÈS (corrigé)
const response = await fetch(
  `https://pzsoeapzuijhgemjzydo.supabase.co/functions/v1/send-verification-code`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      type: 'email',
      pharmacyName: pharmacyName
    })
  }
);

if (response.ok) {
  // Rediriger vers la page de vérification avec l'email en paramètre
  navigate(`/pharmacy-password-reset-verify?email=${encodeURIComponent(email)}`);
}
```

### 2. Nouvelle Page PharmacyPasswordResetVerify.tsx

Cette page combine :
- **Étape 1** : Saisie du code OTP à 6 chiffres
- **Étape 2** : Formulaire de nouveau mot de passe (visible après validation du code)

```typescript
// Structure de la page
export default function PharmacyPasswordResetVerify() {
  const [email] = useSearchParams().get('email');
  const [code, setCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Étape 1: Vérifier le code OTP
  const handleVerifyCode = async () => {
    const response = await fetch('.../verify-code', {
      body: JSON.stringify({ email, code, type: 'email' })
    });
    
    if (response.ok) {
      setIsCodeVerified(true);  // Passer à l'étape 2
    }
  };
  
  // Étape 2: Mettre à jour le mot de passe
  const handleUpdatePassword = async () => {
    // Récupérer l'ID de la pharmacie via l'email
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('email', email)
      .single();
    
    // Appeler la RPC existante
    const { data, error } = await supabase.rpc('update_pharmacy_password', {
      p_pharmacy_id: pharmacy.id,
      p_new_password: newPassword
    });
    
    if (data?.success) {
      navigate('/pharmacy-connection');
    }
  };
  
  return (
    <>
      {!isCodeVerified ? (
        // Formulaire de saisie du code OTP
        <OTPInput value={code} onChange={setCode} />
        <Button onClick={handleVerifyCode}>Vérifier le code</Button>
      ) : (
        // Formulaire de nouveau mot de passe
        <Input type="password" value={newPassword} />
        <Input type="password" value={confirmPassword} />
        <Button onClick={handleUpdatePassword}>Définir le mot de passe</Button>
      )}
    </>
  );
}
```

### 3. Nouvelle RPC pour Récupérer l'ID Pharmacie par Email

Créer une RPC sécurisée qui retourne uniquement l'ID (pas de données sensibles) :

```sql
CREATE OR REPLACE FUNCTION public.get_pharmacy_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT id FROM pharmacies 
    WHERE lower(email) = lower(p_email) 
    LIMIT 1
  );
END;
$$;
```

### 4. Modification du Template Email (Optionnel)

Adapter le template dans `send-verification-code` pour un contexte de réinitialisation :

```typescript
// Dans send-verification-code/index.ts
const emailSubject = pharmacyName 
  ? `Réinitialisation de mot de passe - ${pharmacyName}`
  : `Votre code de vérification: ${code}`;

const emailHtml = `
  <h1>Réinitialisation de mot de passe</h1>
  <p>Vous avez demandé à réinitialiser le mot de passe de votre pharmacie.</p>
  <p>Votre code de vérification :</p>
  <div style="font-size: 32px; font-weight: bold;">${code}</div>
  <p>Ce code expire dans ${expiryMinutes} minutes.</p>
`;
```

### 5. Route dans App.tsx

```typescript
// Ajouter dans les routes
<Route path="/pharmacy-password-reset-verify" element={<PharmacyPasswordResetVerify />} />
```

## Diagramme de Séquence

```text
┌──────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌───────────┐
│ Utilisat.│    │ send-verif-code │    │ verify-code      │    │ update_pw │
└────┬─────┘    └────────┬────────┘    └────────┬─────────┘    └─────┬─────┘
     │                   │                      │                    │
     │ 1. Entrer email   │                      │                    │
     │──────────────────>│                      │                    │
     │                   │                      │                    │
     │                   │ Générer code 6 chiff.│                    │
     │                   │ Stocker en DB        │                    │
     │                   │ Envoyer email Resend │                    │
     │                   │                      │                    │
     │<──────────────────│                      │                    │
     │ Redirect vers     │                      │                    │
     │ /verify?email=... │                      │                    │
     │                   │                      │                    │
     │ 2. Entrer code OTP│                      │                    │
     │───────────────────────────────────────-->│                    │
     │                   │                      │                    │
     │                   │                      │ Valider code       │
     │<─────────────────────────────────────────│                    │
     │ Afficher form mdp │                      │                    │
     │                   │                      │                    │
     │ 3. Nouveau mdp    │                      │                    │
     │──────────────────────────────────────────────────────────────>│
     │                   │                      │                    │
     │                   │                      │                    │ Hash bcrypt
     │                   │                      │                    │ UPDATE pharmacies
     │<──────────────────────────────────────────────────────────────│
     │ Succès! Redirect  │                      │                    │
     │ /pharmacy-connect │                      │                    │
     │                   │                      │                    │
```

## Sécurité

| Aspect | Implémentation |
|--------|----------------|
| Expiration du code | 10 minutes (configurable via `platform_settings`) |
| Tentatives max | 3 par code (géré par `verification_codes.max_attempts`) |
| Hachage mot de passe | bcrypt via `extensions.crypt()` + `extensions.gen_salt('bf')` |
| Protection brute force | Blocage après 3 tentatives incorrectes |
| Isolation données | Seul l'ID pharmacie est retourné, jamais le hash |

## Avantages de Cette Approche

1. **Réutilisation maximale** : Utilise les Edge Functions et table existantes
2. **Indépendant de Supabase Auth** : Fonctionne pour toutes les pharmacies
3. **Sécurisé** : OTP avec expiration et limite de tentatives
4. **UX fluide** : Processus en 3 étapes claires
5. **Maintenance simplifiée** : Même infrastructure que la vérification email à l'inscription

## Résumé des Modifications

| Fichier | Type | Changement |
|---------|------|------------|
| `src/pages/PharmacyPasswordReset.tsx` | Modifier | Appeler `send-verification-code` + redirection |
| `src/pages/PharmacyPasswordResetVerify.tsx` | Créer | Page OTP + formulaire nouveau mdp |
| `src/App.tsx` | Modifier | Ajouter route `/pharmacy-password-reset-verify` |
| `supabase/functions/send-verification-code/index.ts` | Modifier | Améliorer template email pour reset |
| Migration SQL | Créer | RPC `get_pharmacy_id_by_email` |

