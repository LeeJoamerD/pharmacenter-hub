
## Diagnostic (pourquoi l’erreur 404 est revenue)

- Le `404 (Not Found)` que tu vois dans le navigateur ne veut pas forcément dire “fonction inexistante”.
- Dans notre cas, **la fonction `verify-code` répond bien**, mais elle renvoie elle-même un **HTTP 404** quand elle ne trouve **aucun code en attente** en base (`verification_codes`).
- Or, le bypass SMS actuel est placé **après** la lecture en base :

Dans `supabase/functions/verify-code/index.ts` :
1) la fonction cherche d’abord un enregistrement dans `verification_codes` (email + type, non vérifié)  
2) si rien n’est trouvé → elle renvoie `404 { error: "Aucun code de vérification en attente" }`  
3) donc **le bypass SMS ne s’exécute jamais** dans ce scénario, même si l’utilisateur tape un code à 6 chiffres.

C’est exactement ce que j’ai reproduit avec un appel direct à l’edge function : elle répond 404 “Aucun code …” (ce qui ressemble visuellement à “Not Found” côté navigateur).

## Cause racine probable

Un “code en attente” n’existe pas (ou plus) pour la paire (email, type='sms') au moment de la vérification. Cela peut arriver si :
- l’étape “envoyer le code” n’a pas réellement créé d’enregistrement (erreur silencieuse côté UX),
- l’utilisateur vérifie avec un email différent de celui utilisé pour l’envoi,
- ou la donnée a été supprimée/écrasée avant la vérification (nouvelle demande de code, etc.).

Mais dans tous les cas, **si on veut un bypass fiable**, il ne doit pas dépendre de la présence de `verification_codes`.

## Objectif de la correction

- Maintenir le flux “comme si le SMS a été envoyé”
- Accepter **n’importe quel code à 6 chiffres** pour `type="sms"`
- Éviter que `verify-code` renvoie 404 en SMS bypass

## Changements à implémenter

### 1) Modifier `supabase/functions/verify-code/index.ts` (bypass avant la DB)

- Après parsing/validation des champs (email/code/type), ajouter un bloc tout en haut :

Comportement attendu :
- Si `type === "sms"` ET `code` match `^\d{6}$` :
  - retourner `200 { success: true, message: "Numéro de téléphone vérifié avec succès" }`
  - ne pas exiger un enregistrement `verification_codes`
  - (optionnel mais recommandé) log “BYPASS SMS ACTIF …”

Option A (simple, robuste) :
- Bypass SMS = succès immédiat, sans écritures DB.

Option B (audit/traçabilité) :
- Faire un `upsert/insert` d’un enregistrement `verification_codes` (si on veut garder une trace), ou mettre `verified_at` sur le plus récent si existant.
- Attention : il faut que cette logique reste safe (pas de contrainte cassée), et ne fasse pas échouer le bypass si l’insert échoue.

Je recommande Option A pour garantir zéro retour 404 en bypass.

### 2) Garder la vérification normale pour `type="email"`

- La logique existante (lookup `verification_codes`, expiry, attempts, comparaison du code) reste inchangée pour les emails.

### 3) Ajuster les headers CORS (durcissement)

Actuellement les edge functions utilisent :
`Access-Control-Allow-Headers: "authorization, x-client-info, apikey, content-type"`

Je vais aligner sur l’en-tête recommandé afin d’éviter des problèmes intermittents selon les navigateurs/SDK :
`authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version`

Même si ce n’est pas la cause du 404 actuel, c’est une correction préventive solide.

## Vérifications / Tests après correction

### Test technique direct (sans UI)
- Appeler `POST /functions/v1/verify-code` avec :
  - `{ "email": "test@example.com", "code":"123456", "type":"sms" }`
- Résultat attendu : **HTTP 200** (plus de 404), message de succès.

### Test end-to-end UI
Sur `/pharmacy-connection` :
1) Choisir vérif téléphone
2) Entrer un numéro (même si aucun SMS n’est envoyé)
3) Entrer un code 6 chiffres quelconque (ex: 123456)
4) Résultat attendu : validation OK, progression du workflow (comme avant)

## Fichiers concernés

- `supabase/functions/verify-code/index.ts` (principal)
- (optionnel) `supabase/functions/send-verification-code/index.ts` (CORS aligné aussi, par cohérence)

## Risques / impacts

- Impact limité au flux SMS (bypass volontaire).
- Aucun impact sur l’email.
- Réduit les faux “Not Found” côté UX en SMS.

## Critère de succès

- Plus aucun `POST .../verify-code 404` lors de la vérification téléphone (SMS bypass).
- Le flux “téléphone vérifié” fonctionne systématiquement avec un code 6 chiffres.
