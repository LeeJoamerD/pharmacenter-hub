
## Plan — Corriger définitivement la visibilité des messages directs entre DJL et Pharmacie Jeannelle

### Problème confirmé

La base n’est plus le blocage principal: le canal direct est maintenant visible chez Jeannelle. Le vrai blocage restant est côté client dans **Messagerie Réseau**.

Le screenshot de Jeannelle montre 3 symptômes cohérents :
1. le canal `Direct · DJL - Computer Sciences` apparaît bien dans la liste,
2. il reste visuellement grisé,
3. la zone centrale affiche encore `Sélectionnez un canal pour voir les messages`.

Cela signifie que le canal est **chargé**, mais que l’interface **refuse sa sélection**.

### Cause racine

Dans `src/components/dashboard/modules/chat/NetworkMessaging.tsx`, la sélection d’un canal dépend de `canMessageChannel(channel)` :

- si `channel.tenant_id === currentTenant?.id` → autorisé
- si `channel.is_public` → autorisé
- sinon → `hasPermissionWith(channel.tenant_id, 'chat')`

Pour un canal direct créé par DJL :
- `tenant_id` du canal = DJL
- `is_public = false`
- Jeannelle est bien participante, mais **la participation n’est jamais prise en compte dans `canMessageChannel`**
- donc le canal reste grisé et le clic est bloqué

Le correctif RLS précédent permet à Jeannelle de **voir** le canal et ses messages, mais l’UI empêche encore d’ouvrir la conversation.

### Correctifs à appliquer

#### 1. `src/hooks/useNetworkMessagingEnhanced.ts`
Enrichir les canaux chargés avec les informations réellement utiles à l’UI :

- ajouter sur chaque canal :
  - `is_participant: boolean`
  - `members_count: number`
  - `messages_count: number`
  - éventuellement `last_activity`
- utiliser les `participantChannelIds` déjà récupérés pour marquer :
  - `is_participant = true` si le tenant courant fait partie du canal
- récupérer en batch les compteurs :
  - `channel_participants` pour `members_count`
  - `network_messages` pour `messages_count` et `last_activity`
- conserver la déduplication des canaux directs par `name`

Résultat attendu :
- les canaux directs reçus depuis un autre tenant ne sont plus “externes inconnus”, mais des canaux auxquels l’utilisateur participe réellement
- les compteurs ne restent plus à `0 messages` / `0 participants` alors qu’il existe déjà des échanges

#### 2. `src/components/dashboard/modules/chat/NetworkMessaging.tsx`
Corriger la logique d’accès/sélection des canaux.

Remplacer la règle actuelle par une logique métier cohérente :

Un canal est sélectionnable si au moins une des conditions est vraie :
- il appartient au tenant courant
- il est public
- le tenant courant est participant du canal
- une permission inter-tenant explicite existe

Concrètement :
- `canMessageChannel(channel)` doit accepter `channel.is_participant`
- le `onClick` ne doit plus bloquer un canal direct dont l’utilisateur est membre
- l’opacité réduite ne doit plus s’appliquer à ces canaux participants

#### 3. Affichage des compteurs
Toujours dans `NetworkMessaging.tsx` :

- la liste de gauche doit afficher le vrai `messages_count`
- l’en-tête du canal doit afficher le vrai `members_count`
- les canaux directs existants ne doivent plus afficher `0 messages` et `0 participants` si des données existent

#### 4. Robustesse de chargement
Toujours dans le hook :

- si `activeChannel` n’existe plus dans la liste après refresh, le réinitialiser proprement
- après `sendMessage`, mettre à jour localement le compteur du canal actif ou recharger les canaux
- au changement de canal, éviter tout état où le canal est visible mais inutilisable

### Pourquoi cette correction est la bonne

Elle aligne enfin l’interface sur la règle métier correcte :

- **la RLS dit déjà** : “un participant peut voir le canal et ses messages”
- **l’UI doit donc dire la même chose** : “un participant peut ouvrir et utiliser ce canal”

Aujourd’hui la DB et le front n’appliquent pas la même règle. Le bug vient de cette divergence.

### Vérifications après correction

1. Connecté comme **Pharmacie Jeannelle**, le canal `Direct · DJL - Computer Sciences` n’est plus grisé.
2. Un clic sur ce canal ouvre immédiatement l’historique.
3. Les messages déjà envoyés par DJL, dont `Bonjour les tests`, s’affichent.
4. Le compteur à gauche n’affiche plus `0 messages` si des messages existent.
5. L’en-tête du canal n’affiche plus `0 participants` pour un direct à deux officines.
6. Jeannelle peut répondre dans le même canal.
7. DJL continue de voir tout l’historique existant.
8. Aucun impact sur les canaux publics, système ou collaborations.

### Fichiers à modifier

- `src/hooks/useNetworkMessagingEnhanced.ts`
- `src/components/dashboard/modules/chat/NetworkMessaging.tsx`

### Détail technique

```text
Etat actuel
DB autorise la lecture via participation
        +
UI autorise seulement owner/public/permission explicite
        =
Canal visible mais non ouvrable

Etat corrigé
DB autorise la lecture via participation
        +
UI autorise aussi participant
        =
Canal ouvrable + messages visibles
```
