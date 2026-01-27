
# Plan de Correction : Amélioration des Messages d'Erreur de Vérification Email

## Problème Identifié

L'erreur **400 Bad Request** se produit lorsque :
1. L'utilisateur entre un **code incorrect** (le plus probable)
2. Le code a **expiré** (10 minutes après l'envoi)
3. Le **nombre maximum de tentatives** est atteint (3 tentatives)

L'edge function `verify-code` retourne des messages d'erreur détaillés mais le frontend affiche génériquement "Code invalide" sans distinguer la cause exacte.

## Analyse des Données

Le code pour `aissiroselyne3@gmail.com` :
- Code envoyé : `778294`
- Tentatives : 3 sur 3 (l'utilisateur a probablement mal tapé le code 2 fois)
- Expiration : 17:37:53 UTC
- Finalement vérifié : 17:36:25 UTC (test manuel réussi)

## Solution Proposée

### Modification 1 : Améliorer la gestion des erreurs dans `useVerification.ts`

**Objectif** : Afficher le message d'erreur exact retourné par l'edge function

**Fichier** : `src/hooks/useVerification.ts`

**Changements** :
- Dans `verifyEmailCode` et `verifyPhoneCode`, extraire le message d'erreur du body de la réponse
- Afficher le message spécifique : "Code incorrect. X tentative(s) restante(s)" ou "Le code a expiré"

```typescript
// Ligne 179-184 - Extraire l'erreur du contexte
const { data, error } = await supabase.functions.invoke('verify-code', {
  body: { email, code, type: 'email' }
});

if (error) {
  // Tenter d'extraire le message d'erreur du contexte
  const errorContext = (error as any).context;
  if (errorContext) {
    try {
      const errorBody = await errorContext.json();
      if (errorBody.error) {
        throw new Error(errorBody.error);
      }
    } catch (parseError) {
      // Si on ne peut pas parser, continuer avec l'erreur originale
    }
  }
  throw error;
}
```

### Modification 2 : Améliorer le feedback visuel dans `VerificationDialog.tsx`

**Objectif** : Afficher un message d'alerte quand le code expire ou si les tentatives sont épuisées

**Fichier** : `src/components/verification/VerificationDialog.tsx`

**Changements** :
- Afficher un message d'avertissement orange quand le countdown arrive à 0
- Indiquer visuellement quand le bouton "Renvoyer le code" est nécessaire

### Modification 3 : Ajouter du logging côté serveur

**Fichier** : `supabase/functions/verify-code/index.ts`

**Changements** :
- Ajouter des logs pour chaque type d'erreur retourné
- Permettre un meilleur débogage futur

```typescript
// Après ligne 53 - Logger l'expiration
if (new Date(verificationCode.expires_at) < new Date()) {
  console.log(`Code expiré pour ${email} (type: ${type}). Expiré à: ${verificationCode.expires_at}`);
  // ...
}

// Après ligne 106 - Logger le code incorrect
if (verificationCode.code !== code) {
  console.log(`Code incorrect pour ${email}. Attendu: ${verificationCode.code.slice(0,2)}***, Reçu: ${code.slice(0,2)}***`);
  // ...
}
```

## Résumé des Fichiers à Modifier

| Fichier | Type | Description |
|---------|------|-------------|
| `src/hooks/useVerification.ts` | Modification | Extraire et afficher les messages d'erreur détaillés |
| `src/components/verification/VerificationDialog.tsx` | Modification | Améliorer le feedback visuel (expiration, tentatives) |
| `supabase/functions/verify-code/index.ts` | Modification | Ajouter des logs de débogage |

## Impact

- **UX améliorée** : Messages d'erreur clairs et actionnables
- **Débogage facilité** : Logs côté serveur pour identifier les problèmes
- **Aucun changement de logique** : La fonctionnalité reste identique

## Estimation

- **Complexité** : Faible
- **Fichiers impactés** : 3
- **Risque** : Très faible (amélioration du feedback uniquement)
