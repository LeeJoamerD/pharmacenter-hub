
# Plan d'amélioration - Gestion des erreurs de création d'utilisateur

## Objectif
Améliorer les messages d'erreur lors de la création d'un utilisateur pour afficher des messages traduits, explicites et adaptés à chaque type d'erreur.

---

## Analyse du problème actuel

### Flux actuel
1. L'Edge Function `create-user-with-personnel` retourne une erreur en anglais : `"Failed to create auth user: A user with this email address has already been registered"`
2. Le frontend affiche ce message brut dans le toast, ce qui n'est pas traduit ni explicite pour l'utilisateur

### Erreurs possibles identifiées
| Code d'erreur Supabase | Message actuel | Message souhaité (FR) |
|------------------------|----------------|----------------------|
| Email déjà utilisé | "A user with this email address has already been registered" | "Cette adresse email est déjà utilisée par un autre compte" |
| Champs manquants | "Missing required fields" | "Veuillez remplir tous les champs obligatoires" |
| Mot de passe trop court | "Password must be at least 8 characters" | "Le mot de passe doit contenir au moins 8 caractères" |
| Email invalide | "Unable to validate email address" | "L'adresse email n'est pas valide" |
| Erreur création personnel | "Failed to create personnel: ..." | "Erreur lors de la création du profil" |

---

## Modifications requises

### 1. Ajouter des clés de traduction dans `LanguageContext.tsx`

Ajouter les nouvelles clés de traduction après la ligne 988 (section française) :

```typescript
// Error messages for user creation
emailAlreadyExists: "Cette adresse email est déjà utilisée par un autre compte.",
missingRequiredFields: "Veuillez remplir tous les champs obligatoires.",
invalidEmailFormat: "L'adresse email n'est pas valide.",
personnelCreationError: "Erreur lors de la création du profil utilisateur.",
genericCreationError: "Une erreur inattendue s'est produite. Veuillez réessayer.",
```

Ajouter également les traductions équivalentes pour :
- Anglais (après ligne 2991)
- Espagnol (après ligne 4993)
- Lingala (après ligne 6947)

### 2. Modifier `UserSettings.tsx` - Fonction de parsing d'erreur

Ajouter une fonction helper pour parser et traduire les erreurs (avant la mutation, vers ligne 69) :

```typescript
// Helper function to parse and translate error messages
const parseCreateUserError = (error: any): string => {
  const errorMessage = error?.message || error?.error || '';
  
  // Check for known error patterns
  if (errorMessage.includes('already been registered') || 
      errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate key')) {
    return t('emailAlreadyExists');
  }
  
  if (errorMessage.includes('Missing required fields')) {
    return t('missingRequiredFields');
  }
  
  if (errorMessage.includes('Password must be at least') ||
      errorMessage.includes('password')) {
    return t('passwordMinLength');
  }
  
  if (errorMessage.includes('validate email') ||
      errorMessage.includes('invalid email')) {
    return t('invalidEmailFormat');
  }
  
  if (errorMessage.includes('Failed to create personnel')) {
    return t('personnelCreationError');
  }
  
  // Fallback to generic error
  return t('genericCreationError');
};
```

### 3. Modifier le callback `onError` de la mutation

Modifier les lignes 96-103 pour utiliser la nouvelle fonction de parsing :

```typescript
onError: (error: any) => {
  console.error('Erreur lors de la création:', error);
  const translatedMessage = parseCreateUserError(error);
  toast({
    title: t('createUserError'),
    description: translatedMessage,
    variant: 'destructive'
  });
}
```

---

## Résumé des fichiers à modifier

| Fichier | Action |
|---------|--------|
| `src/contexts/LanguageContext.tsx` | Ajouter 5 nouvelles clés de traduction dans chaque langue (FR, EN, ES, LN) |
| `src/components/dashboard/modules/parametres/UserSettings.tsx` | Ajouter fonction `parseCreateUserError` + modifier `onError` |

---

## Résultat attendu

| Situation | Message affiché avant | Message affiché après |
|-----------|----------------------|----------------------|
| Email déjà utilisé | "Failed to create auth user: A user with this email address has already been registered" | "Cette adresse email est déjà utilisée par un autre compte." |
| Champs manquants | "Missing required fields" | "Veuillez remplir tous les champs obligatoires." |
| Mot de passe court | "Password must be at least 8 characters" | "Le mot de passe doit contenir au moins 8 caractères" |
| Erreur inconnue | Message technique en anglais | "Une erreur inattendue s'est produite. Veuillez réessayer." |

---

## Avantage de cette approche

- **Aucune modification de l'Edge Function** - Le parsing est fait côté frontend
- **Messages traduits** - Utilise le système de traduction existant (4 langues)
- **Extensible** - Facile d'ajouter de nouveaux patterns d'erreur
- **UX améliorée** - Messages clairs et actionables pour l'utilisateur
