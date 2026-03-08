

# Plan de correction : Messagerie Réseau (Chat-PharmaSoft)

## Erreurs identifiees

### Erreur 1 : Champs inexistants dans l'insert `sendMessage` (lignes 580-592)

Le hook insere `sender_user_id` et `attachments` dans `network_messages`, mais ces colonnes **n'existent pas** dans la table. Les colonnes reelles sont :
- `channel_id`, `content`, `created_at`, `id`, `message_type`, `metadata`, `priority`, `read_by`, `sender_name`, `sender_pharmacy_id`, `tenant_id`, `updated_at`

**`sender_user_id`** et **`attachments`** ne sont pas des colonnes. Ils devraient etre stockes dans le champ `metadata` (JSONB).

Cela provoque une erreur silencieuse a chaque envoi de message avec pièce jointe ou quand `currentUser?.id` est present.

### Erreur 2 : Champ `channel_type` inexistant dans l'insert `createChannel` (ligne 622)

Le hook insere `channel_type` dans `network_channels`, mais la colonne s'appelle **`type`** dans la table. L'insert devrait utiliser `type` au lieu de `channel_type`.

Meme probleme dans `createCollaboration` (ligne 706) : `channel_type: 'collaboration'` devrait etre `type: 'collaboration'`.

### Erreur 3 : Requete `queryTable` non filtree (lignes 231-234)

`loadChannels` appelle `queryTable('network_channels')` **deux fois** sans filtre, chargeant la table entiere a chaque appel. C'est inefficace et ne respecte pas l'isolation multi-tenant. Il faudrait utiliser des requetes filtrees directement.

### Erreur 4 : `loadChannels` ne charge pas les messages du canal par defaut (ligne 303)

Quand le canal "General" est selectionne automatiquement au chargement, `loadMessages` est appele mais les messages ne s'affichent pas toujours car `activeChannel` n'est pas encore mis a jour dans le state (asynchrone). La condition `if (generalChannel && !activeChannel)` peut etre fausse lors d'un re-render.

### Erreur 5 : `activeUsers` est un calcul fictif (ligne 345)

`activeUsers: Math.floor((totalUsers || 0) * 0.7)` est un pourcentage fixe arbitraire, pas une donnee reelle.

### Erreur 6 : `activeCollaborations` reference `collaborations` avant chargement (ligne 349)

Dans `loadNetworkStats`, `collaborations.filter(c => c.status === 'active').length` utilise le state `collaborations` qui peut etre vide car `loadCollaborations` s'execute en parallele via `Promise.all` et n'est pas encore terminee.

### Erreur 7 : `onKeyPress` deprecie (ligne 356 du composant)

`onKeyPress` est deprecie en React. Il faut utiliser `onKeyDown`.

### Erreur 8 : `canMessageChannel` recoit `activeChannelData` qui peut etre `undefined` (ligne 333)

`canMessageChannel(activeChannelData)` est appele alors que `activeChannelData` peut etre `undefined` si aucun canal ne correspond.

---

## Plan de corrections

### Fichier `src/hooks/useNetworkMessagingEnhanced.ts`

1. **sendMessage** : Retirer `sender_user_id` et `attachments` de l'insert. Les placer dans `metadata` :
   ```typescript
   metadata: { sender_user_id: currentUser?.id, attachments }
   ```

2. **createChannel** : Remplacer `channel_type` par `type` dans l'insert

3. **createCollaboration** : Remplacer `channel_type` par `type` dans l'insert

4. **loadChannels** : Remplacer les appels `queryTable` par des requetes Supabase filtrees (par `tenant_id` pour les propres canaux, par `is_public` pour les publics)

5. **loadNetworkStats** : Supprimer le calcul fictif `activeUsers` et mettre 0 ou un vrai comptage. Deplacer `activeCollaborations` apres le chargement des collaborations.

6. **loadChannels default selection** : Appeler `loadMessages` dans un `useEffect` qui reagit a `activeChannel` au lieu de l'appeler directement dans `loadChannels`

### Fichier `src/components/dashboard/modules/chat/NetworkMessaging.tsx`

7. **onKeyPress** → **onKeyDown** (ligne 356)

8. **canMessageChannel** : Ajouter un guard `if (!activeChannelData) return false` ou verifier avant l'appel

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkMessagingEnhanced.ts` |
| Modifier | `src/components/dashboard/modules/chat/NetworkMessaging.tsx` |

