
# Bypass total de la verification telephone

## Contexte
Twilio ne fonctionne pas actuellement. Il faut simuler entierement le flux de verification telephone cote client, sans appeler le serveur, tout en conservant la verification email reelle.

## Modification unique

### Fichier : `src/hooks/useVerification.ts`

**`sendPhoneCode`** (lignes 123-173) : Remplacer l'appel a l'edge function par une simulation locale :
- Afficher un delai simule de 1 seconde (setState isSendingPhone true/false)
- Afficher un toast "Code envoye" comme si le SMS avait ete envoye
- Mettre a jour `phoneExpiresAt` avec une duree fictive de 10 minutes
- Aucun appel reseau

**`verifyPhoneCode`** (lignes 224-276) : Remplacer l'appel a l'edge function par une acceptation automatique :
- Verifier uniquement que le code fait 6 chiffres (format valide)
- Accepter n'importe quel code a 6 chiffres
- Afficher le toast "Numero de telephone verifie avec succes"
- Appeler `onPhoneVerified` et `onAllVerified` normalement
- Aucun appel reseau

**Tout le reste est inchange** : email reel, flux UI identique, callbacks preserves.

## Ce qui ne change pas
- `sendEmailCode` et `verifyEmailCode` restent reels (appels edge function)
- L'edge function `send-verification-code` et `verify-code` ne sont pas modifiees
- L'interface utilisateur (dialogs, inputs, boutons) reste identique
- Un commentaire `// BYPASS TWILIO` sera ajoute pour faciliter le retour a la vraie verification
