

# Plan de Correction : Erreur d'Authentification Twilio (SMS)

## Problème Identifié

L'envoi de SMS échoue avec l'erreur Twilio **20003 (Authenticate - 401 Unauthorized)**. Les identifiants Twilio stockés dans `platform_settings` sont invalides ou ont été révoqués.

Les logs montrent :
- Email fonctionne correctement (Resend OK)
- SMS échoue systématiquement avec une erreur d'authentification

## Solution

### Étape 1 : Vérification des identifiants Twilio

L'administrateur doit :
1. Se connecter au [tableau de bord Twilio](https://console.twilio.com)
2. Aller dans **Account > Keys & Credentials > API Keys**
3. Vérifier que l'**Account SID** commence bien par `AC5129e7ee...`
4. Copier le **Auth Token** actuel (il peut avoir été régénéré)

### Étape 2 : Mise à jour des identifiants dans la base de données

Mettre à jour les valeurs dans la table `platform_settings` :

```sql
UPDATE platform_settings 
SET setting_value = 'NOUVEAU_TWILIO_AUTH_TOKEN' 
WHERE setting_key = 'TWILIO_AUTH_TOKEN';
```

### Étape 3 (optionnel) : Améliorer le message d'erreur

Ajouter une gestion explicite de l'erreur 20003 dans l'edge function :

**Fichier** : `supabase/functions/send-verification-code/index.ts`

Dans la section de gestion des erreurs Twilio (lignes 222-236), ajouter :

```typescript
} else if (twilioCode === 20003) {
  userMessage = "Erreur d'authentification Twilio. Veuillez vérifier les identifiants API.";
  console.error("CRITIQUE: Les identifiants Twilio sont invalides. Vérifiez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN dans platform_settings.");
```

---

## Détails Techniques

| Élément | Valeur actuelle | Statut |
|---------|-----------------|--------|
| TWILIO_ACCOUNT_SID | AC5129e7ee... | Présent mais peut-être incorrect |
| TWILIO_AUTH_TOKEN | ebf6e1f3ee... | **Invalide** (cause du 401) |
| TWILIO_PHONE_NUMBER | +14482210506 | OK |
| RESEND_API_KEY | re_TWDZoNht... | Fonctionne |

## Actions Requises

1. **Immédiate** : Obtenir le nouveau Auth Token depuis le dashboard Twilio
2. **Mise à jour SQL** : Remplacer la valeur dans `platform_settings`
3. **Test** : Réessayer l'envoi de SMS

## Notes Importantes

- Les identifiants Twilio ne sont PAS stockés dans les secrets Supabase Edge Functions, mais dans la table `platform_settings`
- Twilio régénère parfois les Auth Tokens lors de changements de sécurité
- Vérifier que le compte Twilio n'est pas en mode Trial (limité à certains numéros vérifiés)

