

## Diagnostic — Erreur diffusion alerte réseau

### Cause principale

Le modal `Diffuser une Alerte Réseau` a bien été corrigé pour afficher les officines, mais l’envoi utilise encore une logique côté client fragile :

```ts
supabase
  .from('network_channels')
  .select('id')
  .eq('name', 'Alertes Réseau')
  .eq('is_system', true)
  .single();
```

Problèmes détectés :

1. **Erreur 406**
   - `.single()` échoue si aucun canal `Alertes Réseau` n’existe encore.
   - Supabase retourne alors `406 Not Acceptable`.

2. **Erreur 400 lors de la création du canal**
   - Le code tente de créer un canal avec :
   ```ts
   type: 'alert'
   ```
   - Or la contrainte actuelle de `network_channels.type` autorise notamment :
   ```text
   public, private, direct, team, collaboration, function, supplier, system
   ```
   - `alert` n’est pas une valeur valide.

3. **Erreur suivante probable sur le message**
   - Le code insère aussi :
   ```ts
   message_type: 'alert'
   ```
   - Or `network_messages.message_type` autorise seulement :
   ```text
   text, image, file, system
   ```

4. **Problème structurel RLS**
   - Le client ne devrait pas gérer lui-même :
     - la création du canal système,
     - l’ajout des participants,
     - l’insertion du message,
     - l’audit.
   - Comme pour `send_direct_network_message`, cette logique doit être atomique côté base via une RPC `SECURITY DEFINER`.

---

## Correctif proposé

### 1. Créer une RPC atomique `send_network_alert`

Ajouter une migration SQL avec une fonction :

```sql
public.send_network_alert(
  p_title text,
  p_message text,
  p_priority text,
  p_recipient_ids uuid[]
)
returns jsonb
```

La fonction fera côté serveur :

- Résoudre l’officine expéditrice via `personnel.auth_user_id = auth.uid()`.
- Valider le titre, le message et la priorité.
- Nettoyer la liste des destinataires :
  - retirer les doublons,
  - retirer l’officine expéditrice,
  - garder uniquement les officines existantes.
- Trouver ou créer le canal système `Alertes Réseau`.
- Créer ce canal avec des valeurs compatibles :
  ```sql
  type = 'system'
  is_system = true
  is_public = true
  category = 'alert'
  ```
- Ajouter les participants dans `channel_participants` :
  - expéditeur,
  - destinataires.
- Insérer le message dans `network_messages` avec :
  ```sql
  message_type = 'system'
  priority = 'high' ou 'urgent'
  ```
- Stocker les informations d’alerte dans `metadata` :
  ```json
  {
    "alert_type": "network",
    "title": "...",
    "recipients": [...],
    "sender_user_id": "..."
  }
  ```
- Insérer une entrée dans `network_audit_logs`.
- Retourner :
  ```json
  {
    "sent_count": 12,
    "failed_count": 0,
    "channel_id": "...",
    "recipients": [...]
  }
  ```

---

### 2. Modifier `NetworkAlertDialog.tsx`

Remplacer toute la séquence actuelle :

- recherche du canal,
- création du canal,
- insertion du message,
- insertion audit,

par un seul appel RPC :

```ts
const { data: result, error } = await supabase.rpc('send_network_alert', {
  p_title: title,
  p_message: message,
  p_priority: priority,
  p_recipient_ids: recipients
});

if (error) throw error;
```

Puis afficher un toast basé sur le vrai résultat :

```ts
toast.success(`Alerte diffusée à ${sentCount} officine(s)`);
```

---

### 3. Corriger aussi la logique du hook dupliqué

Le hook `useNetworkMessagingEnhanced.ts` contient une fonction `sendNetworkAlert()` avec la même logique fragile :

```ts
.from('network_channels')
.eq('name', 'Alertes Réseau')
.eq('is_system', true)
.maybeSingle()
```

Je la remplacerai aussi par l’appel RPC `send_network_alert` pour éviter que la même erreur revienne depuis une autre partie du module Chat-PharmaSoft.

---

### 4. Sécuriser le retour d’erreurs côté UI

Dans `NetworkAlertDialog.tsx`, améliorer le `catch` pour afficher le message réel si la RPC retourne une erreur explicite :

```ts
toast.error(error.message || 'Erreur lors de la diffusion de l’alerte');
```

Cela évitera les erreurs génériques difficiles à diagnostiquer.

---

## Fichiers concernés

| Élément | Changement |
|---|---|
| Nouvelle migration SQL | Création de la RPC `send_network_alert(...)` en `SECURITY DEFINER` |
| `NetworkAlertDialog.tsx` | Remplacement de la création client du canal/message par l’appel RPC |
| `useNetworkMessagingEnhanced.ts` | Remplacement de la logique dupliquée par la même RPC |
| Aucun changement manuel dans `types.ts` | Le fichier Supabase types est généré automatiquement et ne sera pas modifié |

---

## Résultat attendu

- Plus d’erreur `406` sur la recherche du canal `Alertes Réseau`.
- Plus d’erreur `400` liée au `type: 'alert'`.
- Plus de risque d’erreur sur `message_type: 'alert'`.
- Le canal `Alertes Réseau` est créé correctement avec `type = 'system'`.
- Les participants sont ajoutés automatiquement.
- L’alerte est réellement visible dans le réseau pour les officines destinataires.
- Le toast affiche le vrai nombre d’officines alertées.
- La logique devient cohérente avec la correction déjà appliquée pour les messages directs.

