
# Configurer les secrets API de maniere securisee

## Situation actuelle
- `vidal-search` lit deja les credentials depuis les variables d'environnement (pas de retour en arriere)
- `send-verification-code` lit deja `RESEND_API_KEY` depuis `Deno.env.get()`
- Secrets actuellement configures : `GOOGLE_GEMINI_API_KEY`, `LOVABLE_API_KEY`
- Secrets manquants : `RESEND_API_KEY`, `VIDAL_API_URL`, `VIDAL_APP_ID`, `VIDAL_APP_KEY`

## Plan d'action

### Etape 1 : Ajouter RESEND_API_KEY
- Demander la cle via l'outil securise de Lovable (les valeurs ne sont jamais visibles dans le chat)
- La cle est utilisee par `send-verification-code` pour envoyer les emails de verification

### Etape 2 : Ajouter les 3 secrets VIDAL
- `VIDAL_API_URL` : URL de base de l'API VIDAL (ex: `https://api.vidal.fr/rest/api`)
- `VIDAL_APP_ID` : identifiant de l'application
- `VIDAL_APP_KEY` : cle d'application
- Ces credentials sont utilises par `vidal-search`

### Etape 3 : Redeployer les fonctions
- Redeployer `send-verification-code` et `vidal-search` pour qu'elles prennent en compte les nouveaux secrets

### Etape 4 : Mettre a jour le finding de securite
- Supprimer le finding `platform_settings_secrets` (SECRETS_EXPOSED) car les credentials sont desormais dans les secrets securises

## Aucune modification de code necessaire
Le code est deja en place pour lire depuis `Deno.env.get()`. Seule la configuration des secrets est requise.
