

# Plan de correction : Canaux Reseau (Chat-PharmaSoft)

## Erreurs identifiees

### Erreur 1 : `loadFluxConfig` traite `network_chat_config` comme une table plate (lignes 377-398)

La table `network_chat_config` est une table **cle-valeur** avec les colonnes `config_key`, `config_value`, `category`, etc. Or le hook fait `.select('*').eq('tenant_id', tenantId).maybeSingle()` et accede ensuite a `data.sync_frequency`, `data.destination_channel`, `data.realtime_notifications`, `data.duplicate_filtering` -- **aucun de ces champs n'existe** dans la table.

Il faut requeter avec `.select('config_key, config_value').eq('tenant_id', tenantId)` et filtrer par `config_key = 'flux_config'`, puis parser le `config_value` JSON.

### Erreur 2 : `loadPharmacies` selectionne `email` et le mappe vers `nom_pharmacie` (lignes 401-416)

La table `pharmacies` a une colonne `name` (pas `nom_pharmacie`). Le hook selectionne `id, email` et utilise `p.email` comme nom de pharmacie : `nom_pharmacie: p.email || p.id.slice(0, 8)`. Il devrait selectionner `id, name` et mapper vers `nom_pharmacie: p.name`.

### Erreur 3 : `loadPermissions` utilise `pharmacies.email` pour le nom de la pharmacie (lignes 290-297)

Quand une permission a un `pharmacy_id`, le hook charge la pharmacie avec `.select('id, email')` et utilise `pharmacyData?.email` comme nom. Il devrait utiliser `pharmacyData?.name`.

### Erreur 4 : `togglePartner` met a jour `chat_enabled` au lieu de `is_active` (lignes 692-708)

Le hook fait `.update({ chat_enabled: isActive })` mais le composant UI utilise `partner.is_active` pour l'affichage et le switch. La colonne `chat_enabled` existe dans la table mais c'est `status` qui controle l'activation du partenaire. De plus, `loadPartners` mappe `p.is_active` mais cette colonne n'existe pas -- la table a `status` et `chat_enabled`. Le mapping `is_active: p.is_active` lira toujours `undefined`.

En verifiant le schema : `network_partner_accounts` n'a **pas** de colonne `is_active`. Les colonnes pertinentes sont `status` (string) et `chat_enabled` (boolean). Le hook devrait mapper `is_active: p.chat_enabled ?? (p.status === 'active')` et `togglePartner` devrait mettre a jour `chat_enabled`.

### Erreur 5 : `loadPartners` mappe `last_activity_at` vers `last_activity` (ligne 337)

La table a la colonne `last_active_at` (pas `last_activity_at`). Le mapping `last_activity: p.last_activity_at` lira `undefined`.

### Erreur 6 : `loadIntegrations` accede a `i.name` qui n'existe pas (lignes 361-368)

La table `external_integrations` n'a **pas** de colonne `name`. Les colonnes sont `provider_name` et `integration_type`. Le mapping devrait utiliser `name: i.provider_name`.

### Erreur 7 : N+1 requetes dans `loadChannels` (lignes 152-189)

Pour chaque canal, 2 requetes sont executees (membres count + messages count). Avec 30 canaux, cela fait 60+ requetes. Il faut batacher.

### Erreur 8 : N+1 requetes dans `loadKeywordAlerts` (lignes 225-249)

Pour chaque alerte, une requete est executee pour charger les noms de canaux. Il faut collecter tous les `channel_ids` uniques et les charger en une seule requete.

### Erreur 9 : N+1 requetes dans `loadPermissions` (lignes 278-311)

Pour chaque permission, 1-2 requetes sont executees (canal + pharmacie). Il faut batacher.

### Erreur 10 : `localFluxConfig` n'est pas synchronise avec `fluxConfig` du hook (ligne 77)

`localFluxConfig` est initialise avec `fluxConfig` au montage du composant, mais quand `fluxConfig` est mis a jour apres le chargement asynchrone, `localFluxConfig` garde l'ancienne valeur par defaut. Il faut un `useEffect` pour synchroniser.

### Erreur 11 : `loadPartners` mappe `contact_email` mais la table a `email` (ligne 334)

La table `network_partner_accounts` a une colonne `email` (pas `contact_email`). Le mapping `contact_email: p.contact_email` lira `undefined`.

---

## Plan de corrections

### Fichier `src/hooks/useNetworkChannelManagement.ts`

1. **`loadFluxConfig`** : Requeter `network_chat_config` avec `.eq('config_key', 'flux_config')` et parser `config_value` comme JSON pour extraire les champs `sync_frequency`, `destination_channel`, etc.

2. **`loadPharmacies`** : Selectionner `id, name` au lieu de `id, email`. Mapper `nom_pharmacie: p.name`.

3. **`loadPermissions`** : Selectionner `id, name` au lieu de `id, email` pour la pharmacie. Utiliser `pharmacyData?.name`. Optimiser en batchant les requetes (charger tous les canaux et pharmacies concernes en 2 requetes au lieu de N).

4. **`togglePartner`** : Garder `.update({ chat_enabled: isActive })` (correct pour la table). Corriger `loadPartners` pour mapper `is_active: p.chat_enabled ?? (p.status === 'active')`.

5. **`loadPartners`** : Corriger `last_activity: p.last_active_at` (au lieu de `p.last_activity_at`). Corriger `contact_email: p.email` (au lieu de `p.contact_email`).

6. **`loadIntegrations`** : Mapper `name: i.provider_name` (au lieu de `i.name`).

7. **`loadChannels` optimisation N+1** : Charger tous les `channel_participants` et `network_messages` counts en batch (2 requetes totales au lieu de 2*N).

8. **`loadKeywordAlerts` optimisation N+1** : Collecter tous les `channel_ids` uniques, charger les noms en une seule requete, puis distribuer.

9. **`loadPermissions` optimisation N+1** : Charger tous les canaux et pharmacies concernes en 2 requetes batch.

### Fichier `src/components/dashboard/modules/chat/NetworkChannelManagement.tsx`

10. **`localFluxConfig` sync** : Ajouter un `useEffect` pour synchroniser `localFluxConfig` quand `fluxConfig` change apres le chargement.

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkChannelManagement.ts` |
| Modifier | `src/components/dashboard/modules/chat/NetworkChannelManagement.tsx` |

