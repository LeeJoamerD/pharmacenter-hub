
# Plan : Creation Administrateur Apres Creation Pharmacie (avec Bypass SMS)

## Resume

Apres la creation reussie d'une pharmacie via `/pharmacy-creation`, un formulaire obligatoire permet de creer le premier compte administrateur. La verification telephone utilise le **meme bypass SMS** deja en place.

## Architecture du Bypass SMS (Existant)

Le bypass SMS fonctionne en deux temps :

| Etape | Edge Function | Comportement |
|-------|--------------|--------------|
| Envoi code | `send-verification-code` | Code genere et stocke en base, mais **SMS non envoye** (Twilio commente) |
| Verification | `verify-code` | Tout code a 6 chiffres accepte immediatement pour `type="sms"` |

Le hook `useVerification` utilise ces edge functions. Donc tout composant utilisant ce hook beneficie automatiquement du bypass.

## Fichiers a Creer

### 1. `src/hooks/useAdminCreation.ts`

Hook dedie a la creation du premier administrateur.

```typescript
// Fonctionnalites:
// - Validation email different de pharmacie
// - Validation disponibilite email (RPC check_email_available_for_user)
// - Validation mot de passe selon politique tenant (validatePassword)
// - Appel Edge Function create-user-with-personnel avec role='Admin'
// - Utilise useVerification pour email/telephone (bypass SMS inclus)
```

### 2. `src/components/pharmacy-creation/AdminCreationDialog.tsx`

Dialog modal obligatoire affiche apres creation pharmacie.

```typescript
// Structure:
// - Champs: Prenoms, Noms, Email (different pharmacie), Telephone, Mot de passe, Confirmation
// - Indicateur progression: [1. Email] --- [2. Telephone] 
// - PasswordStrengthIndicator + politique de securite
// - Boutons: "Verifier mon email" -> "Creer mon compte"
// - Utilise useVerification (meme hook que PharmacyCreation)
```

## Fichier a Modifier

### `src/pages/PharmacyCreation.tsx`

Ajouter l'etape de creation admin apres le succes de la creation pharmacie.

```typescript
// Nouveaux etats:
const [showAdminCreation, setShowAdminCreation] = useState(false);
const [createdPharmacyData, setCreatedPharmacyData] = useState<{
  pharmacyId: string;
  pharmacyEmail: string;
  pharmacyName: string;
} | null>(null);

// Dans handleSubmit, apres succes:
if (result?.success && result.pharmacy_id) {
  setCreatedPharmacyData({
    pharmacyId: result.pharmacy_id,
    pharmacyEmail: formData.email,
    pharmacyName: formData.name
  });
  setShowAdminCreation(true);  // Ouvrir le dialog
  // NE PAS naviguer immediatement
}

// Rendu:
<AdminCreationDialog
  open={showAdminCreation}
  pharmacyId={createdPharmacyData?.pharmacyId}
  pharmacyEmail={createdPharmacyData?.pharmacyEmail}
  pharmacyName={createdPharmacyData?.pharmacyName}
  onSuccess={() => navigate('/dashboard')}
/>
```

## Flux Utilisateur Complet

```text
1. Formulaire pharmacie
   |
2. Verifier email pharmacie (OTP reel via Resend)
   |
3. Verifier telephone pharmacie (BYPASS: n'importe quel code 6 chiffres)
   |
4. Creer pharmacie (register_pharmacy_simple)
   |
5. === NOUVEAU: Dialog Creation Admin ===
   |
   +-- Remplir formulaire admin
   |   - Email DIFFERENT de pharmacie (obligatoire)
   |   - Prenoms, Noms, Telephone, Mot de passe
   |
   +-- Verifier email admin (OTP reel via Resend)
   |
   +-- Verifier telephone admin (BYPASS: n'importe quel code 6 chiffres)
   |
   +-- Creer admin (create-user-with-personnel avec role='Admin')
   |
6. Redirection Dashboard
```

## Details Techniques

### Validation Email Different

```typescript
// Dans AdminCreationDialog ou useAdminCreation
const validateAdminEmail = (adminEmail: string, pharmacyEmail: string) => {
  if (adminEmail.toLowerCase().trim() === pharmacyEmail.toLowerCase().trim()) {
    throw new Error("L'email de l'administrateur doit etre different de celui de la pharmacie");
  }
};

// + Verification disponibilite via RPC
const { data } = await supabase.rpc('check_email_available_for_user', {
  p_email: adminEmail
});
if (!data?.available) {
  throw new Error("Cet email est deja utilise");
}
```

### Appel Edge Function pour Creation Admin

```typescript
const { data, error } = await supabase.functions.invoke('create-user-with-personnel', {
  body: {
    email: adminData.email,
    password: adminData.password,
    noms: adminData.noms,
    prenoms: adminData.prenoms,
    role: 'Admin',  // Role explicite
    telephone_appel: adminData.phone,
    tenant_id: pharmacyId  // ID de la pharmacie creee
  }
});
```

### Bypass SMS Garanti

Le composant `AdminCreationDialog` utilisera exactement :

```typescript
const verification = useVerification({
  onEmailVerified: () => {
    // Passer a verification telephone
    verification.sendPhoneCode(email, phone);
  },
  onPhoneVerified: () => {
    // Creer le compte admin
    createAdmin();
  },
});
```

Ce hook appelle `verify-code` avec `type: 'sms'`, qui retourne immediatement `success: true` pour tout code a 6 chiffres grace au bypass implemente precedemment.

## Structure du Dialog

```text
+-----------------------------------------------+
|         Creer votre compte administrateur     |
+-----------------------------------------------+
| Cette etape est obligatoire pour gerer        |
| votre pharmacie.                              |
|                                               |
| Note: L'email doit etre different de celui    |
| de la pharmacie (user@example.com)            |
+-----------------------------------------------+
| Prenoms:     [__________________________]     |
| Noms:        [__________________________]     |
| Email:       [__________________________]     |
| Telephone:   [__________________________]     |
| Mot de passe:[__________________________]     |
| Confirmer:   [__________________________]     |
|                                               |
| [Indicateur force mot de passe]               |
| [Politique de securite tenant]                |
+-----------------------------------------------+
| [O] Email  ----  [O] Telephone                |
+-----------------------------------------------+
|                    [Verifier mon email]       |
+-----------------------------------------------+
```

## Composants Reutilises

| Composant | Source | Usage |
|-----------|--------|-------|
| `useVerification` | `src/hooks/useVerification.ts` | Hook email/SMS avec bypass |
| `VerificationDialog` | `src/components/verification/` | Dialog OTP 6 chiffres |
| `PasswordStrengthIndicator` | `src/components/auth/` | Jauge force mot de passe |
| `useAdvancedAuth` | `src/hooks/useAdvancedAuth.ts` | Validation politique MDP |

## Criteres de Succes

1. Apres creation pharmacie, le dialog admin s'ouvre automatiquement
2. L'email admin doit etre different de l'email pharmacie
3. La verification email fonctionne (OTP reel)
4. La verification telephone accepte n'importe quel code 6 chiffres (bypass)
5. Le compte admin est cree avec role='Admin'
6. L'admin peut se connecter et acceder a Parametres/Utilisateurs
7. Le trigger cree automatiquement le client associe

## Resume des Modifications

| Fichier | Action |
|---------|--------|
| `src/hooks/useAdminCreation.ts` | CREER |
| `src/components/pharmacy-creation/AdminCreationDialog.tsx` | CREER |
| `src/pages/PharmacyCreation.tsx` | MODIFIER |
