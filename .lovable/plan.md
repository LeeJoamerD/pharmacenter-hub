

# Plan de correction : Integrations Reseau (Chat-PharmaSoft)

## Erreurs identifiees

### Erreur 1 (CRITIQUE) : Jointure `pharmacy:tenant_id(id, nom_pharmacie)` invalide -- cause des 400

Les requetes sur `ventes`, `clients`, `alertes_peremption`, et `prescriptions` utilisent la syntaxe PostgREST `pharmacy:tenant_id(id, nom_pharmacie)`. Cela echoue pour deux raisons :
- **Aucune cle etrangere** n'existe entre `tenant_id` de ces tables et la table `pharmacies` -- PostgREST ne peut pas resoudre la jointure.
- La colonne `nom_pharmacie` **n'existe pas** dans `pharmacies` -- c'est `name`.

C'est la cause directe de toutes les erreurs **400 Bad Request** dans la console.

**Correction** : Supprimer ces jointures imbriquees. Charger le nom de la pharmacie separement (une seule requete batch pour le tenant courant) ou utiliser le `currentTenant.name` du contexte puisque toutes les donnees sont filtrees par un seul tenant.

### Erreur 2 : `prescriptions` utilise `prescripteur_nom` au lieu de `medecin_nom`

La table `prescriptions` a la colonne `medecin_nom` (pas `prescripteur_nom`). La requete selectionne un champ inexistant, ce qui retourne `null` silencieusement.

### Erreur 3 : `reminder_settings` utilise `.single()` au lieu de `.maybeSingle()` -- cause le 406

La requete utilise `.single()` qui envoie un header `Accept: application/vnd.pgrst.object+json`. Si aucune ligne n'existe, PostgREST retourne un **406 Not Acceptable**. Bien que le code gere l'erreur `PGRST116`, l'erreur 406 apparait dans la console. La correction est d'utiliser `.maybeSingle()`.

### Erreur 4 : Etat local des rappels non synchronise avec les donnees async

Les states locaux (`localRenewalEnabled`, `localVaccinationEnabled`, etc.) sont initialises au montage avec `reminderSettings?.xxx ?? default`, mais `reminderSettings` est `undefined` au montage (chargement async). Quand les donnees arrivent, les states locaux gardent les valeurs par defaut. Il faut un `useEffect` de synchronisation.

### Erreur 5 : `lignes_ventes(count)` dans la requete `ventes`

La syntaxe `lignes_ventes(count)` necessite une cle etrangere de `lignes_ventes` vers `ventes`. Si cette FK n'existe pas ou si le nom de la table est different, cela contribue au 400. Il faut verifier et le retirer si necessaire.

---

## Plan de corrections

### Fichier `src/hooks/useNetworkBusinessIntegrations.ts`

1. **Requete `orders` (ventes)** : Retirer `pharmacy:tenant_id(id, nom_pharmacie)` et `lignes_ventes(count)`. Utiliser `currentTenant?.name` pour le nom de pharmacie. Compter les lignes de vente en batch separe via une requete `.in()`.

2. **Requete `patients` (clients)** : Retirer `pharmacy:tenant_id(id, nom_pharmacie)`. Utiliser `currentTenant?.name`.

3. **Requete `stockAlerts` (alertes_peremption)** : Retirer `pharmacy:tenant_id(id, nom_pharmacie)`. Utiliser `currentTenant?.name`.

4. **Requete `prescriptions`** : Retirer `pharmacy:tenant_id(id, nom_pharmacie)`. Remplacer `prescripteur_nom` par `medecin_nom`. Utiliser `currentTenant?.name`.

5. **Requete `reminderSettings`** : Remplacer `.single()` par `.maybeSingle()`.

### Fichier `src/components/dashboard/modules/chat/NetworkBusinessIntegrations.tsx`

6. **Synchronisation etat local** : Ajouter un `useEffect` pour synchroniser `localRenewalEnabled`, `localVaccinationEnabled`, `localControlEnabled`, `localDaysBeforeExpiry`, `localReminderFrequency` avec `reminderSettings` quand il change.

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkBusinessIntegrations.ts` |
| Modifier | `src/components/dashboard/modules/chat/NetworkBusinessIntegrations.tsx` |

