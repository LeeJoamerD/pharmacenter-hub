
# Plan de Correction : Erreur 404 sur verify-code

## Problème Identifié

L'erreur `POST https://pzsoeapzuijhgemjzydo.supabase.co/functions/v1/verify-code 404 (Not Found)` indique que la fonction Edge n'est pas déployée.

### Cause Racine
Les fonctions `verify-code` et `send-verification-code` ne sont **pas déclarées dans `supabase/config.toml`**.

| Fonction | Existe dans `supabase/functions/` | Déclarée dans `config.toml` |
|----------|----------------------------------|----------------------------|
| `verify-code` | Oui | **NON** |
| `send-verification-code` | Oui | **NON** |
| `validate-pharmacy-session` | Oui | Oui |
| `create-user-with-personnel` | Oui | Oui |

### Confirmation du Bypass
Le code bypass est bien présent et fonctionnel :
- **`verify-code`** (lignes 77-105) : Accepte tout code à 6 chiffres pour les SMS
- **`send-verification-code`** (lignes 170-264) : Envoi Twilio commenté, code généré mais non envoyé

## Solution

Ajouter les deux fonctions manquantes dans `supabase/config.toml` :

```toml
[functions.verify-code]
verify_jwt = false

[functions.send-verification-code]
verify_jwt = false
```

## Fichier à Modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/config.toml` | Ajouter les déclarations pour `verify-code` et `send-verification-code` |

## Résultat Attendu

Après cette correction :
1. Les fonctions seront automatiquement déployées
2. L'erreur 404 disparaîtra
3. Le bypass SMS continuera de fonctionner (tout code à 6 chiffres accepté)
4. L'envoi email fonctionnera normalement via Resend
