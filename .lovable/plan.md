

# Plan de correction : Multi-Officines (Chat-PharmaSoft)

## Erreurs identifiees

### Erreur 1 : `loadSystemConfig` traite `network_chat_config` comme une table plate (lignes 362-377)

La table `network_chat_config` est une table **cle-valeur** avec les colonnes `config_key`, `config_value`, `category`, etc. Or le hook fait `.select('*').maybeSingle()` et accede a `chatConfig.message_limit_per_day`, `chatConfig.max_file_size_mb`, `chatConfig.inter_tenant_enabled`, `chatConfig.message_retention_days` -- **aucun de ces champs n'existe**.

Il faut requeter toutes les lignes de config pour ce tenant et mapper les `config_key` vers les valeurs du `SystemConfig`.

### Erreur 2 : `response_time_avg` est un `Math.random()` (ligne 199)

Dans `loadPharmaciesWithMetrics`, le temps de reponse moyen est genere aleatoirement : `Math.random() * 100 + 20`. Cela donne des valeurs differentes a chaque rechargement. Il faut utiliser les donnees reelles de `network_activity_stats` ou mettre 0.

### Erreur 3 : `collaborations` dans `monthlyActivity` est un `Math.random()` (ligne 468)

Dans `loadAnalyticsData`, les collaborations mensuelles sont generees aleatoirement : `Math.floor(Math.random() * 5)`. Il faut compter les vrais canaux de type `collaboration` crees dans le mois.

### Erreur 4 : `networkAvailability` est code en dur a 98.5 (ligne 345)

La disponibilite reseau est toujours 98.5%. Ce n'est pas une erreur bloquante mais c'est un faux indicateur.

### Erreur 5 : `loadAnalyticsData` utilise `pharmacies` state potentiellement vide (lignes 428-430)

`loadAnalyticsData` est appele apres `Promise.all` dans `loadAllData`, mais il accede au state `pharmacies` qui peut ne pas encore etre mis a jour (setState est asynchrone). `topPharmacies` et `typeDistribution` seront donc vides.

### Erreur 6 : Requetes N+1 massives dans `loadPharmaciesWithMetrics` (lignes 147-203)

Pour chaque pharmacie, 3 requetes sont executees (messages envoyes, participations + messages recus, derniere activite). Avec 20 pharmacies, cela fait 60+ requetes. Cela ralentit enormement le chargement.

### Erreur 7 : `loadCollaborations` n'est pas filtre par tenant (ligne 232)

La requete charge **toutes** les collaborations de type `collaboration` sans filtre `tenant_id`, ce qui expose les collaborations d'autres tenants.

### Erreur 8 : `loadRecentActivities` n'est pas filtre par tenant (lignes 387-397)

Les messages et logs d'audit sont charges sans filtre `tenant_id`, exposant les activites de tous les tenants.

### Erreur 9 : `loadNetworkStats` charge les stats de toutes les pharmacies (lignes 304-311)

Les comptages `totalPharmacies` et `activePharmacies` incluent **toutes** les pharmacies de la plateforme, pas seulement le reseau du tenant.

---

## Plan de corrections

### Fichier `src/hooks/useMultiPharmacyManagement.ts`

1. **`loadSystemConfig`** (lignes 362-378) : Requeter `network_chat_config` avec `.select('config_key, config_value').eq('tenant_id', tenantId)` et mapper les cles vers les champs `SystemConfig` en iterant sur les resultats.

2. **`response_time_avg`** (ligne 199) : Remplacer `Math.random() * 100 + 20` par `0` (valeur par defaut). L'indicateur sera alimente par les donnees reelles quand disponibles.

3. **`monthlyActivity` collaborations** (ligne 468) : Remplacer le `Math.random()` par un vrai comptage des canaux de type `collaboration` crees dans le mois, via une requete sur `network_channels`.

4. **`loadAnalyticsData` state race** (ligne 428) : Passer `pharmacies` en parametre a `loadAnalyticsData` au lieu de lire le state, ou utiliser un `useRef` pour avoir la valeur courante. Alternative : retourner les pharmacies depuis `loadPharmaciesWithMetrics` et les passer directement.

5. **`loadCollaborations` filtre tenant** (ligne 232) : Ajouter un filtre pour ne charger que les collaborations ou le tenant est participant. Utiliser une sous-requete via `channel_participants` filtre par `pharmacy_id = tenantId`.

6. **`loadRecentActivities` filtre tenant** (lignes 387-397) : Ajouter `.eq('tenant_id', tenantId)` sur les deux requetes (messages et audit logs).

7. **`loadNetworkStats` contexte** : Les comptages globaux sont acceptables pour une vue reseau, mais ajouter un commentaire clarifiant que c'est intentionnel (vue globale du reseau).

8. **Optimisation N+1** : Reduire les requetes dans `loadPharmaciesWithMetrics` en chargeant les comptages de messages et participations en batch au lieu de par pharmacie. Utiliser des requetes groupees.

### Fichier `src/components/dashboard/modules/chat/MultiPharmacyManagement.tsx`

Aucune erreur structurelle dans le composant. Les corrections sont concentrees dans le hook.

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useMultiPharmacyManagement.ts` |

