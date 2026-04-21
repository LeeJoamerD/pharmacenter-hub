

## Diagnostic — Compteurs réseau bloqués par RLS

### Cause racine
Les compteurs « officines actives », « utilisateurs actifs », « messages échangés », etc. sont calculés côté client par `supabase.from('pharmacies').select(..., { count: 'exact' })` et requêtes équivalentes sur `personnel` / `network_messages`.

Or les **policies RLS** de ces tables sont strictement tenant-scopées :

| Table | Policy SELECT | Effet |
|---|---|---|
| `pharmacies` | `id IN (personnel.tenant_id WHERE auth_user_id = auth.uid())` | L'utilisateur ne voit QUE sa propre pharmacie → count = 1 |
| `personnel` | `tenant_id = get_current_user_tenant_id()` | Ne voit que son propre personnel → "7 utilisateurs" = personnel de Jeannelle |
| `network_messages` | filtré par participation à des canaux | Idem |

Vérifié en DB : il y a en réalité **14 pharmacies actives**, mais l'utilisateur n'en voit qu'1 → affichage "1 officines actives".

C'est cohérent avec le principe de cloisonnement multi-tenant (mémoire `multi-tenant-user-restriction`) — mais les **statistiques réseau globales** doivent légitimement contourner cette RLS via une RPC `SECURITY DEFINER`.

### Composants impactés (même bug)
1. `NetworkMessaging.tsx` — "1 officines actives" (image 1)
2. `NetworkOverview.tsx` — "Officines Connectées: 1", "Utilisateurs Actifs: 7" (image 2)
3. `MultiPharmacyManagement.tsx` — cartes statistiques réseau
4. `NetworkMetrics.tsx` — disponibilité réseau, latence
5. `useMultiPharmacyManagement.ts` — `regionsCount`, `networkAvailability`
6. `useNetworkChatAdmin.ts` — `total_pharmacies`, `active_pharmacies`
7. `useNetworkMessagingEnhanced.ts` (`loadNetworkStats`) — toutes les stats

### Correctif

**Étape 1 — Migration SQL : RPC `get_network_global_stats()` SECURITY DEFINER**

```sql
CREATE OR REPLACE FUNCTION public.get_network_global_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_pharmacies',  (SELECT count(*) FROM pharmacies),
    'active_pharmacies', (SELECT count(*) FROM pharmacies WHERE status = 'active'),
    'total_users',       (SELECT count(*) FROM personnel WHERE is_active = true),
    'regions_count',     (SELECT count(DISTINCT region) FROM pharmacies WHERE region IS NOT NULL),
    'total_messages',    (SELECT count(*) FROM network_messages),
    'today_messages',    (SELECT count(*) FROM network_messages WHERE created_at >= date_trunc('day', now())),
    'recent_messages_24h', (SELECT count(*) FROM network_messages WHERE created_at >= now() - interval '24 hours'),
    'total_channels',    (SELECT count(*) FROM network_channels),
    'active_collaborations', (SELECT count(*) FROM network_channels WHERE type = 'collaboration')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_network_global_stats() TO authenticated;
```

Ne renvoie que des **agrégats anonymes** (aucune donnée personnelle/PII), donc safe à exposer à tout utilisateur authentifié pour le module Chat-Réseau.

**Étape 2 — Refactor des hooks/composants pour utiliser la RPC**

| Fichier | Changement |
|---|---|
| `src/hooks/useNetworkMessagingEnhanced.ts` (`loadNetworkStats`) | Remplacer les 7 requêtes count par 1 appel `supabase.rpc('get_network_global_stats')` |
| `src/components/dashboard/modules/chat/NetworkOverview.tsx` (`loadNetworkStats`) | Idem — remplacer les comptes directs par la RPC |
| `src/hooks/useMultiPharmacyManagement.ts` (autour ligne 332-381) | Idem pour `totalPharmacies`, `activePharmacies`, `regionsCount`, `networkAvailability` |
| `src/hooks/useNetworkChatAdmin.ts` (autour ligne 405-460) | Idem pour `total_pharmacies`, `active_pharmacies`, `total_messages` |
| `src/components/dashboard/modules/chat/NetworkMetrics.tsx` (autour ligne 49-72) | Idem pour `availabilityRate` |

Conserver le client Supabase et les types existants. Pas de changement d'UI.

### Résultat attendu
- "Officines actives" affiche **14** (ou le nombre réel) au lieu de 1.
- Vue d'Ensemble Réseau affiche les vraies métriques globales.
- Toutes les statistiques agrégées du module Chat-PharmaSoft reflètent la réalité du réseau, sans casser le cloisonnement RLS pour les données détaillées (chaque pharmacie ne voit toujours QUE ses propres lignes dans `pharmacies` / `personnel`).

