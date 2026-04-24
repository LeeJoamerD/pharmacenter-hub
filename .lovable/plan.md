

## Plan — Réparer la visibilité cross-tenant des canaux directs et messages

### Problème identifié

Vérification en base : le canal direct Jeannelle ↔ DJL (`1068d148...`) existe avec `is_public = false` et `tenant_id = b51e3719` (DJL, créateur). La table `channel_participants` contient bien **les deux pharmacies** comme participantes, et les 4 messages (dont "Bonjour les tests") sont bien stockés. Pourtant Pharmacie Jeannelle ne voit rien.

**Cause racine — RLS trop restrictif** :

| Table | Policy SELECT actuelle | Conséquence pour Jeannelle |
|---|---|---|
| `network_channels` | `tenant_id = mon_tenant OR type = 'public'` | Canal invisible (créé par DJL, non public) |
| `channel_participants` | `tenant_id = mon_tenant` | Sa propre ligne participant invisible (tenant_id = DJL) |
| `network_messages` | `channel_id IN (SELECT … FROM channel_participants WHERE pharmacy_id = mon_tenant)` | Sous-requête vide à cause du point précédent → 0 messages |

Le compteur "1 messages aujourd'hui" passe par la RPC `get_network_global_stats` (SECURITY DEFINER), qui voit tout — d'où l'incohérence affichée.

### Solution — Migration SQL (RLS basée sur la participation)

Remplacer les policies SELECT pour autoriser l'accès quand la pharmacie courante est **participante**, indépendamment de `tenant_id` (qui reste le créateur).

#### A. Helper SECURITY DEFINER STABLE (évite la récursion RLS)

```sql
CREATE OR REPLACE FUNCTION public.is_channel_participant(p_channel_id uuid, p_pharmacy_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_participants
    WHERE channel_id = p_channel_id AND pharmacy_id = p_pharmacy_id
  );
$$;
```

#### B. Policies SELECT mises à jour

- **`network_channels` — "View channels"** :
  `tenant_id = get_current_user_tenant_id() OR type = 'public' OR public.is_channel_participant(id, get_current_user_tenant_id())`

- **`channel_participants` — "View participants"** :
  `tenant_id = get_current_user_tenant_id() OR pharmacy_id = get_current_user_tenant_id() OR public.is_channel_participant(channel_id, get_current_user_tenant_id())`

- **`network_messages` — "View messages"** : remplacer la sous-requête actuelle par
  `public.is_channel_participant(channel_id, get_current_user_tenant_id())`

#### C. Realtime

Vérifier que `network_messages` est dans la publication `supabase_realtime` (déjà le cas selon le code existant ; ajouter `ALTER PUBLICATION supabase_realtime ADD TABLE network_messages` en `IF NOT EXISTS` défensif).

### Aucune modification code client requise

`useNetworkMessagingEnhanced.ts` interroge déjà `channel_participants WHERE pharmacy_id = tenantId` puis `network_channels WHERE id IN (...)`. Une fois la RLS corrigée, ces requêtes renverront les bons canaux pour Jeannelle. La déduplication par `name` et l'abonnement realtime déjà en place fonctionneront correctement.

### Vérifications

1. Connecté comme Jeannelle, le canal "Direct · DJL - Computer Sciences" apparaît dans la liste.
2. Les 4 messages historiques (dont "Bonjour les tests") s'affichent.
3. Les nouveaux messages envoyés des deux côtés arrivent en temps réel.
4. Aucun canal ou participant d'autres pharmacies non liées ne devient visible (test négatif).
5. Pas de récursion RLS (helper SECURITY DEFINER STABLE).

### Fichiers modifiés

- **Nouvelle migration SQL** : helper `is_channel_participant` + remplacement des 3 policies SELECT + ajout idempotent à la publication realtime.
- Aucun changement côté client.

