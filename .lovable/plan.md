

## Diagnostic — Erreurs 406 sur création de canaux directs

### Cause
Dans `NewMessageDialog.tsx` (ligne 122-127), pour chaque destinataire on cherche un canal direct existant :
```ts
let { data: existingChannel } = await supabase
  .from('network_channels')
  .select('id')
  .eq('type', 'direct')
  .eq('name', directChannelName)
  .single();
```

`.single()` exige **exactement 1 ligne** et renvoie une **erreur HTTP 406 (Not Acceptable)** quand 0 ligne correspond. Or pour un nouveau message direct, le canal n'existe pas encore → 406 systématique pour chaque pharmacie sélectionnée (12 erreurs visibles dans la console).

Effets de bord :
1. Le code part en branche « créer un nouveau canal » mais sans vérifier l'erreur réelle, donc le flux continue.
2. Si la RLS de `network_channels` bloque l'INSERT par un utilisateur non-admin (probable car la table est partagée réseau), le `newChannel` est `null` et le `.insert` suivant sur `channel_participants` puis `network_messages` lèvera `null.id`.
3. Le `try/catch` global gobe les erreurs silencieusement et le toast « succès » s'affiche **alors qu'aucun message n'a réellement été inséré** sur les conversations directes.

### Vérifications préalables (à faire en mode default)
1. `SELECT count(*) FROM network_channels WHERE type='direct' AND name LIKE 'Direct: %';` → confirmer si des canaux ont effectivement été créés.
2. `SELECT count(*) FROM network_messages WHERE channel_id IN (SELECT id FROM network_channels WHERE type='direct');` → confirmer si les messages directs ont été envoyés.
3. Lister les policies RLS sur `network_channels` et `channel_participants` pour vérifier qu'un utilisateur tenant peut INSERT (type=direct).

### Correctifs

**Étape 1 — Remplacer `.single()` par `.maybeSingle()`**  
Élimine les 406 quand le canal n'existe pas encore. `maybeSingle()` retourne `data: null` proprement sans erreur.

**Étape 2 — Gérer correctement les erreurs d'INSERT**  
- Vérifier `error` après chaque `insert` (canal, participants, message).
- En cas d'échec sur une pharmacie, accumuler les erreurs et afficher un toast récapitulatif (`X envoyés, Y échoués`) au lieu d'un faux « succès ».
- Si `newChannel` est `null`, throw explicite avec le message d'erreur RLS.

**Étape 3 — Centraliser via une RPC `SECURITY DEFINER` (recommandé)**  
Créer `send_direct_network_message(recipient_pharmacy_ids uuid[], content text, priority text)` qui :
- Pour chaque destinataire : trouve ou crée le canal direct (`Direct: <sorted ids>`), insère les 2 participants si absent, insère le message.
- Bypasse les frictions RLS (insert sur `network_channels` partagé entre tenants).
- Renvoie `jsonb` avec `sent_count`, `failed_count`, `channel_ids[]`.

Avantages : 1 appel réseau au lieu de 4×N, atomicité par destinataire, plus d'erreurs 406, RLS respectée via SECURITY DEFINER + check `sender_pharmacy_id = current tenant`.

**Étape 4 — Refactor `handleSend` côté client**  
- Branche `direct` : un seul `supabase.rpc('send_direct_network_message', { ... })`.
- Toast adapté selon le retour (`X messages envoyés`, ou erreur si `failed_count > 0`).

### Tableau récap

| Fichier / objet | Changement |
|---|---|
| Migration SQL | Créer RPC `send_direct_network_message(uuid[], text, text)` SECURITY DEFINER avec logique find-or-create canal direct + participants + message |
| `NewMessageDialog.tsx` | Remplacer la boucle `for…of` (lignes 119-163) par un seul appel `supabase.rpc('send_direct_network_message', ...)` ; gérer le retour `sent_count` / `failed_count` ; toast réaliste |
| `NewMessageDialog.tsx` (fallback) | Au minimum, remplacer `.single()` par `.maybeSingle()` ligne 127 si on garde le code client |

### Résultat attendu
- Plus aucune erreur **406 Not Acceptable** dans la console.
- Les canaux directs sont effectivement créés en base et les messages réellement insérés.
- Le toast « Succès » reflète la réalité (compte précis d'envois réussis/échoués).
- Performance : 1 requête au lieu de 4×N (12 destinataires = 1 appel au lieu de 48).
- Les destinataires reçoivent le message direct dans leur fil de conversation.

