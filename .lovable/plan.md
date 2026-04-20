

## Diagnostic — "Tester le Modèle IA" silencieux

### Symptôme
Clic sur « Lancer le test » → aucun toast, console vide, zone réponse non affichée.

### Causes identifiées

**1. Parsing SSE fragile côté client (`useNetworkConversationalAI.testAIModel`, lignes 450-474)**
Le code fait `decoder.decode(value, { stream: true })` puis `text.split('\n')` sans buffer entre les chunks. Quand une ligne `data: {...}` est coupée en deux chunks réseau, `JSON.parse` échoue, l'erreur est avalée par `catch {}`, et le contenu de ce token est perdu. Sur un modèle qui répond rapidement en un seul gros chunk SSE, tous les tokens peuvent ainsi être perdus → `result = ""`.

**2. Affichage conditionné à un résultat non vide (`TestModelDialog.tsx`, ligne 51)**
```ts
if (result) { setResponse(result); setMetrics(...); }
```
Si `result` est `""` (chaîne vide), aucun affichage, aucun toast → expérience silencieuse. C'est exactement ce que l'utilisateur observe.

**3. Pas de toast d'erreur**
Aucun `useToast` n'est branché dans `TestModelDialog`. Une erreur attrapée écrit juste dans le textarea, et un résultat vide ne déclenche rien.

**4. Détail edge function**
L'edge function fonctionne (auth OK, appel gateway OK) mais ne loggue rien si la réponse est rapide. À vérifier dans les logs après corrections.

### Correctifs

| Fichier | Changement |
|---|---|
| `src/hooks/useNetworkConversationalAI.ts` (testAIModel) | Réécrire le parser SSE selon le pattern recommandé Lovable AI : buffer `textBuffer`, split ligne-à-ligne avec `indexOf("\n")`, gestion CRLF, re-buffer des JSON partiels, flush final. Gérer explicitement statuts 429/402 avant de lire le stream. |
| `src/components/dashboard/modules/chat/dialogs/TestModelDialog.tsx` | Importer `useToast`. Si `result` est vide → afficher toast d'avertissement « Réponse vide du modèle » + log console. Dans le `catch`, afficher un toast `destructive` au lieu de seulement remplir la zone réponse. Toujours setter `response` même vide pour debug. Logger le début/fin du test dans la console. |

### Résultat attendu
- La réponse du modèle s'affiche correctement dans le modal (parser SSE robuste).
- En cas d'échec (429 crédits, 402, réponse vide, exception), un toast clair s'affiche et la console contient des logs explicites.
- Aucun changement côté edge function (le serveur fonctionne déjà correctement).

