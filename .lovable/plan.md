

# Plan : Désactivation Temporaire de l'Envoi SMS Twilio

## Objectif

Commenter le code d'envoi SMS via Twilio pour éviter l'erreur 500, tout en conservant :
- La génération du code de vérification
- L'enregistrement en base de données
- Le flux utilisateur intact (le numéro sera "vérifié" avec n'importe quel code à 6 chiffres)

## Modification

### Fichier : `supabase/functions/send-verification-code/index.ts`

**Section à commenter** : Lignes 169-250 (bloc `else if (type === "sms")`)

Le code sera remplacé par :

```typescript
} else if (type === "sms") {
  // ============================================================
  // ⚠️ ENVOI SMS TWILIO TEMPORAIREMENT DÉSACTIVÉ ⚠️
  // Raison: Identifiants Twilio invalides (erreur 20003)
  // Date: 2026-01-27
  // Le code est quand même généré et stocké en base.
  // Le bypass dans verify-code accepte n'importe quel code à 6 chiffres.
  // Pour réactiver: Décommenter le bloc ci-dessous et supprimer ce commentaire.
  // ============================================================
  
  console.log("⚠️ BYPASS SMS ACTIF: Envoi Twilio désactivé temporairement");
  console.log("Code généré (non envoyé):", code);
  console.log("Pour:", phone);
  
  /*
  const twilioSid = settingsMap.get("TWILIO_ACCOUNT_SID");
  const twilioToken = settingsMap.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = settingsMap.get("TWILIO_PHONE_NUMBER");

  ... (tout le code Twilio commenté) ...
  
  console.log("SMS envoyé à:", normalizedPhone.slice(0, 4) + "****" + normalizedPhone.slice(-2));
  */
}
```

## Flux Résultant

```text
Utilisateur demande vérification SMS
           │
           ▼
┌─────────────────────────────────┐
│  Code généré (ex: 847293)       │
│  Stocké en base de données      │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  ⚠️ Envoi Twilio IGNORÉ        │
│  Log: "BYPASS SMS ACTIF"        │
│  Retourne succès immédiat       │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  UI affiche "Code envoyé"       │
│  Utilisateur entre 6 chiffres   │
│  (n'importe lesquels)           │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  verify-code (bypass actif)     │
│  Accepte tout code à 6 chiffres │
│  Marque comme vérifié ✓         │
└─────────────────────────────────┘
```

## Résumé

| Élément | État |
|---------|------|
| Génération du code | ✅ Active |
| Stockage en base | ✅ Active |
| Envoi SMS Twilio | ⏸️ Commenté |
| Réponse succès | ✅ Retournée |
| Vérification (verify-code) | ✅ Bypass actif |

## Fichiers Impactés

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/send-verification-code/index.ts` | Commenter le bloc Twilio (lignes 169-250) |

## Pour Réactiver Plus Tard

1. Mettre à jour le `TWILIO_AUTH_TOKEN` dans `platform_settings`
2. Décommenter le bloc Twilio dans `send-verification-code`
3. Supprimer le bypass dans `verify-code` (lignes 75-99)
4. Redéployer les deux edge functions

