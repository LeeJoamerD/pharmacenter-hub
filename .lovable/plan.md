

## Diagnostic — Test silencieux v2 : log de l'edge function vide + parser qui n'a rien à parser

### Observations
- Console client : `[testAIModel] Done {resultLength: 0}` après 1506 ms.
- Edge function logs (`network-ai-chat`) : **aucun log** retourné. L'edge function n'a probablement même pas exécuté ses `console.log` (= plante avant) ou les logs sont retardés.
- Le client n'a pas levé d'exception (pas de `[testAIModel] Error...`), donc `response.ok === true` ET aucune ligne SSE valide n'a été lue.
- Le modèle `69c5404d-…` existe en base (`google/gemini-2.5-flash`, `system_prompt = NULL`).

### Hypothèses (par ordre de probabilité)
1. **L'edge function renvoie `200 OK` mais avec un body JSON `{error: "..."}`** au lieu d'un stream SSE — le parser cherche `data: ` et ignore tout. Cela peut arriver si une early-return JSON oublie le bon status (ex : un error path 500 mais le client ne loggue pas le status réel ; ou une réponse 2xx avec body JSON).
2. **Le stream se ferme immédiatement** côté gateway (réponse OK sans aucun token) — possible si la requête au gateway est mal formée (max_tokens, temperature mal castés…) et le gateway renvoie un stream vide + erreur silencieuse.
3. **Auth échoue silencieusement** : `personnel` introuvable → 403 mais le client `testAIModel` ne loggue pas `response.status`, donc on ne le voit pas. Et `response.ok === false` aurait dû lever — sauf si le throw a été avalé. À vérifier.
4. **Logs retardés** : Supabase peut mettre du temps à indexer les logs ; possible faux négatif.

### Plan de correction (instrumentation + corrections probables)

**Fichier 1 : `src/hooks/useNetworkConversationalAI.ts` (testAIModel)**
- Logger systématiquement `response.status`, `response.headers.get('content-type')`, et la longueur du body si la réponse n'est pas un stream SSE.
- Si `content-type` ne contient pas `text/event-stream`, lire le body comme texte/JSON et lancer une erreur explicite (au lieu de retourner une chaîne vide).
- Logger chaque ligne SSE reçue pendant le développement (debug verbose).

**Fichier 2 : `supabase/functions/network-ai-chat/index.ts`**
- Ajouter `console.log('[network-ai-chat] received', { hasMessage, hasModelId, hasConvId })` dès le début pour confirmer l'invocation.
- Logger `response.status` + extrait du body texte (200 chars) si `!response.ok` au retour du gateway, AVANT le early-return.
- Vérifier que `temperature` reste un number quand `parseFloat` reçoit déjà un number (`parseFloat(0.7)` est OK, mais autant le sécuriser : `Number(modelData.temperature) || temperature`).
- Confirmer qu'aucune autre branche ne renvoie `200 OK` avec body non-SSE.

**Fichier 3 : déploiement**
- Re-déployer `network-ai-chat` après instrumentation pour s'assurer que la dernière version tourne (les logs vides peuvent indiquer une version pré-instrumentation).

### Tableau récap

| Fichier | Changement |
|---|---|
| `src/hooks/useNetworkConversationalAI.ts` | Logger status/content-type ; si non-SSE → lire le body et throw explicite |
| `supabase/functions/network-ai-chat/index.ts` | Log d'entrée + log du body d'erreur gateway ; sécuriser cast de `temperature` |
| (déploiement) | Re-déployer `network-ai-chat` pour garantir version courante |

### Résultat attendu
- Soit le test fonctionne immédiatement (cas de version edge function pas déployée).
- Soit la console + un toast d'erreur explicite révèlent la vraie cause (status HTTP, message d'erreur du gateway, problème d'auth) en un seul prochain essai.

