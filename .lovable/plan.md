

## Diagnostic — La requête atteint le SPA, pas l'Edge Function

### Preuve
Console : `[testAIModel] Response {status: 200, contentType: 'text/html'}` avec body = `<!DOCTYPE html><html lang="fr"><title>PharmaSoft…`. C'est `index.html` servi par le preview Lovable, pas la fonction Edge.

### Cause
Dans `useNetworkConversationalAI.ts` ligne 432 :
```ts
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/network-ai-chat`, …)
```
`import.meta.env.VITE_SUPABASE_URL` est `undefined` au runtime (build-time inlining manquant ou variable absente du bundle de prod), donc l'URL devient `/functions/v1/network-ai-chat` — un chemin relatif. Le serveur SPA répond avec `index.html` (fallback HTML5 history), d'où le HTML reçu.

À noter : tous les autres appels (chat normal, login pharmacie, RPC) passent par le client Supabase (`supabase.functions.invoke` ou `supabase.from`) et fonctionnent. Seul `testAIModel` utilise `fetch` direct avec `VITE_SUPABASE_URL` → seul cas cassé.

### Correctif

**Fichier : `src/hooks/useNetworkConversationalAI.ts` (testAIModel)**

Remplacer le `fetch` brut par une URL fiable récupérée depuis le client Supabase déjà importé. Pattern recommandé (déjà utilisé ailleurs dans le projet) :

```ts
const SUPABASE_URL = "https://pzsoeapzuijhgemjzydo.supabase.co";
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/network-ai-chat`,
  { method: 'POST', headers: { ... }, body: ... }
);
```

Plus robuste : importer la constante depuis `@/integrations/supabase/client` si elle y est exposée, sinon hardcoder l'URL Supabase de prod (sûr — c'est une URL publique non-secrète identique à celle utilisée par le SDK).

Conserver toute l'instrumentation actuelle (logs status/contentType, gestion 429/402, parser SSE buffer) — elle est correcte.

### Tableau récap

| Fichier | Changement |
|---|---|
| `src/hooks/useNetworkConversationalAI.ts` | Remplacer `import.meta.env.VITE_SUPABASE_URL` par l'URL Supabase explicite dans `testAIModel` |

### Résultat attendu
- La requête atteint l'Edge Function `network-ai-chat`.
- Le stream SSE est correctement parsé.
- La réponse du modèle s'affiche dans le modal avec métriques (temps, tokens).

