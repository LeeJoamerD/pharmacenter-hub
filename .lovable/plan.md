

# Plan de correction : Assistant IA Réseau Conversationnel (Chat-PharmaSoft)

## Erreurs identifiées

### Erreur 1 (CRITIQUE) : Authentification incorrecte pour les appels edge function

`sendMessage` (ligne 229) et `testAIModel` (ligne 424) envoient la clé anonyme (`VITE_SUPABASE_PUBLISHABLE_KEY`) comme token d'authentification. Or l'edge function `network-ai-chat` valide le JWT via `auth.getUser()`, qui ne reconnaît pas la clé anonyme comme un utilisateur valide. Résultat : **toutes les requêtes IA retournent 401 "Non autorisé"**. Le chat IA ne fonctionne pas du tout.

Il faut récupérer le token de session de l'utilisateur connecté via `supabase.auth.getSession()` et l'envoyer dans le header `Authorization`.

### Erreur 2 : `loadConversations` non filtré par tenant (ligne 100-103)

La requête charge toutes les conversations de la table `ai_conversations` sans filtre `.eq('tenant_id', tenantId)`, exposant les conversations de tous les tenants.

### Erreur 3 : `loadAIModels` non filtré par tenant (ligne 317-320)

Même problème : tous les modèles IA de la plateforme sont chargés sans filtre tenant.

### Erreur 4 : `loadInsights` non filtré par tenant (ligne 479-482)

Tous les insights sont chargés sans filtre tenant.

### Erreur 5 : `handleCreateConversation` arguments inversés (ligne 156)

Le composant appelle `createConversation(data.title, data.modelId, data.context, data.participants)` mais la signature du hook est `createConversation(title, context, modelId, participants)`. Les arguments `modelId` et `context` sont inversés. Bien que ce soit du code mort (le dialog utilise `createConversation` directement), c'est un bug à corriger.

### Erreur 6 : `getAverageConfidence` retourne 94 en dur (ligne 620)

Quand il n'y a aucun message assistant, la fonction retourne `94` au lieu de `0`, ce qui affiche un faux indicateur de fiabilité.

### Erreur 7 : `saveSettings` upsert sans `onConflict`

L'upsert sur `network_admin_settings` ne spécifie pas les colonnes de conflit. Si un index unique existe sur `(tenant_id, setting_category, setting_key)`, l'upsert pourrait échouer ou créer des doublons.

---

## Plan de corrections

### Fichier `src/hooks/useNetworkConversationalAI.ts`

1. **Corriger l'authentification** dans `sendMessage` et `testAIModel` : Récupérer le token de session via `supabase.auth.getSession()` et l'utiliser dans le header `Authorization: Bearer ${session.access_token}`.

2. **Ajouter `.eq('tenant_id', tenantId)`** dans `loadConversations`, `loadAIModels`, et `loadInsights`.

3. **Corriger `getAverageConfidence`** : Retourner `0` au lieu de `94` quand aucun message n'a de confiance.

4. **Corriger `saveSettings`** : Ajouter `onConflict: 'tenant_id,setting_category,setting_key'` dans l'upsert.

### Fichier `src/components/dashboard/modules/chat/NetworkConversationalAI.tsx`

5. **Corriger `handleCreateConversation`** : Inverser les arguments `modelId` et `context` pour correspondre à la signature du hook `(title, context, modelId, participants)`.

---

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkConversationalAI.ts` |
| Modifier | `src/components/dashboard/modules/chat/NetworkConversationalAI.tsx` |

