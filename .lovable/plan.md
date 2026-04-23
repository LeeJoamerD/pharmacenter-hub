

## Plan — Réparer l'affichage des messages dans les conversations directes

### Problème identifié

Pour chaque conversation directe entre deux pharmacies, **deux canaux distincts** existent en base avec le même `name` (`Direct: <uuid_a>-<uuid_b>`) — un par `tenant_id`. La RPC `send_direct_network_message` cherche le canal via `WHERE type='direct' AND name = ... LIMIT 1` (sans `ORDER BY`) : selon l'ordre non déterministe renvoyé, les messages partent dans l'un ou l'autre canal.

Conséquence : la sidebar n'affiche qu'**un seul** canal direct (celui dont `tenant_id = me` ou un seul des doublons), tandis que les messages de l'interlocuteur sont stockés dans **l'autre** canal — donc invisibles. Exemple actuel : conversation Pharmacie Jeannelle ↔ DJL : 2 canaux (`9e5ef33b...` côté Jeannelle, `1068d148...` côté DJL). Les messages "Depuis Jeannelle" et "xxxx" sont dispersés.

### Cause racine

1. **Pas de contrainte d'unicité** sur `(type, name)` dans `network_channels`.
2. **RPC non déterministe** : `LIMIT 1` sans `ORDER BY created_at` peut renvoyer le canal le plus récent au lieu du canal historique.
3. **Données existantes en double** déjà créées avant correction.

### Solution (3 volets)

#### A. Migration SQL

1. **Fusionner les doublons existants** : pour chaque groupe `(type='direct', name)` ayant >1 lignes, garder le canal le plus ancien (`MIN(created_at)`), réaffecter `network_messages.channel_id` et `channel_participants.channel_id` vers ce canal, dédupliquer les `channel_participants`, puis supprimer les canaux orphelins.
2. **Ajouter une contrainte d'unicité partielle** : `CREATE UNIQUE INDEX ux_network_channels_direct_name ON public.network_channels (name) WHERE type = 'direct';` pour empêcher toute future duplication.
3. **Corriger la RPC `send_direct_network_message`** : remplacer `LIMIT 1` par `ORDER BY created_at ASC LIMIT 1` dans la recherche du canal existant, afin de garantir un comportement déterministe même en cas de doublon résiduel.

#### B. Code client (défense en profondeur)

Dans `src/hooks/useNetworkMessagingEnhanced.ts` → `loadChannels()` : après la fusion en `Map<id, Channel>`, ajouter une seconde déduplication pour les canaux `type='direct'` basée sur `name` (garder le plus ancien `created_at`). Évite l'affichage de canaux orphelins si la migration n'a pas encore été exécutée chez un client offline.

#### C. Vérifications

1. La sidebar n'affiche plus qu'**un seul** canal "Direct · <Pharmacie>" par interlocuteur.
2. Les messages des deux côtés (envoyés et reçus) apparaissent dans la même conversation.
3. L'envoi d'un nouveau message via la RPC `send_direct_network_message` réutilise le canal historique (le plus ancien).
4. La contrainte unique empêche toute future création de doublon.
5. Aucun impact sur les canaux non-directs (système, public, collaboration).

### Fichiers modifiés

- **Migration SQL** (nouvelle) : fusion des doublons + index unique partiel + remplacement de `send_direct_network_message`.
- `src/hooks/useNetworkMessagingEnhanced.ts` : déduplication par `name` pour les canaux directs dans `loadChannels`.

