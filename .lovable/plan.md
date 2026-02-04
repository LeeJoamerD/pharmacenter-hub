
## Objectif
Éliminer les erreurs **409 Conflict** (et autres erreurs REST) dans **Comptabilité → Intégrations** en testant chaque onglet et en corrigeant les causes racines côté frontend/hooks.

---

## Diagnostic (cause la plus probable du 409)
Un **409** sur PostgREST/Supabase n’indique pas seulement un “doublon” ; il arrive très souvent lors d’une **violation de contrainte** (ex: clé étrangère).

Dans votre cas, la table **`external_integrations`** a :
- `created_by UUID REFERENCES public.personnel(id)` (FK vers **personnel.id**, pas vers **auth.users.id**)

Or dans `useSystemIntegrations.ts`, on insère actuellement :
- `created_by: user.id` (où `user.id` = **auth.users.id**)

Résultat attendu côté DB : **violation de FK** → Supabase REST renvoie **409 Conflict**.

Même problème potentiel dans les autres onglets :
- `module_sync_logs.triggered_by` référence `personnel(id)` mais on met `user.id`
- `fec_exports.exported_by` référence `personnel(id)` mais on met `user.id`
- `webhooks_config.created_by` référence `personnel(id)` mais on met `user.id`

Donc : l’onglet “Intégrations Externes” échoue (409), et les autres onglets peuvent échouer dès qu’ils tentent d’insérer une ligne avec un champ *_by.

---

## Tests à exécuter (reproduction / validation)
### A) Intégrations Externes
1. Aller dans **Comptabilité → Intégrations → Intégrations Externes**
2. Créer une intégration (ex: type = bank, nom = Ecobank)
3. Attendu :
   - Pas d’erreur console
   - Ligne créée visible dans la liste
4. Tester “Test connexion” (bouton check) :
   - Attendu : statut passe à “connected”, `last_connection_at` mis à jour

### B) API & Webhooks
1. Aller dans **API & Webhooks**
2. Créer un webhook (nom + url)
3. Attendu : webhook créé, pas d’erreur 409/400
4. Tester webhook (si bouton présent) :
   - Attendu : insertion d’un log `webhooks_logs` OK

### C) Export FEC
1. Aller dans **Export FEC**
2. Cliquer “Générer FEC”
3. Attendu : ligne créée dans `fec_exports`, pas d’erreur 409/400

### D) Modules Internes
1. Aller dans **Modules Internes**
2. Cliquer “Sync” sur un module
3. Attendu : insertion `module_sync_logs` OK, pas d’erreur 409/400

---

## Correctifs à implémenter (code)

### 1) Utiliser `personnel.id` au lieu de `auth.user.id` pour les champs *_by
**Fichier : `src/hooks/useSystemIntegrations.ts`**

#### Changement de source d’identité
- Actuellement : `const { user } = useAuth();`
- À faire : récupérer aussi `personnel` depuis `useAuth()` (ou `currentUser` depuis `useTenant()`), puis utiliser `personnel.id` pour :
  - `external_integrations.created_by`
  - `webhooks_config.created_by`
  - `fec_exports.exported_by`
  - `module_sync_logs.triggered_by`

#### Garde-fous
Avant toute mutation qui écrit un champ *_by, vérifier :
- `tenantId` présent
- `personnel?.id` présent  
Sinon : `throw new Error("Profil utilisateur (personnel) non chargé. Veuillez vous reconnecter.")`

> Important : ça évite des inserts “semi-valides” et fournit un message explicite.

---

### 2) Améliorer la gestion d’erreur : afficher la vraie cause du 409
Toujours dans `useSystemIntegrations.ts`, pour les mutations de création :
- Ajouter `onError` sur :
  - `createExternalIntegrationMutation`
  - `createWebhookMutation`
  - `generateFECMutation`
  - `syncModuleMutation` (si pas déjà clair)
- Dans `onError`, afficher un toast plus utile :
  - Si erreur 409 et message contient “foreign key” → “Le profil personnel n’est pas correctement lié (created_by/exported_by/triggered_by).”
  - Sinon, afficher `error.message`

Cela permet de diagnostiquer immédiatement si un futur 409 vient d’autre chose (doublon, contrainte, etc.).

---

### 3) Vérifier/aligner les types et colonnes des autres inserts (cohérence)
Toujours dans `useSystemIntegrations.ts` :
- `syncModuleMutation` : `started_at`/`completed_at`  
  - La table a `started_at DEFAULT NOW()` ; on insère actuellement sans `started_at`, c’est OK.
- `generateFECMutation` : conserve la simulation, mais corriger `exported_by` avec `personnel.id`.
- `createWebhookMutation` : corriger `created_by` avec `personnel.id`.
- `createExternalIntegrationMutation` : corriger `created_by` avec `personnel.id`.

---

## Portée “tests de tous les composants” (ce qui sera couvert)
### Couvert par les corrections ci-dessus
- Tous les inserts qui avaient un champ FK vers `personnel(id)` mais recevaient `auth.users.id`
- Erreurs 409/constraint sur :
  - Intégrations Externes
  - Webhooks
  - Export FEC
  - Logs de sync module

### Non couvert (si jamais ça apparaît)
- Un vrai conflit “doublon” (nécessiterait une contrainte unique explicite + upsert / check existence).  
Si après correction, vous voyez encore un 409 avec “duplicate key”, on ajoutera :
- soit un check d’existence avant insert
- soit une contrainte unique composite + `upsert(..., { onConflict, ignoreDuplicates })`

---

## Fichiers impactés
1. `src/hooks/useSystemIntegrations.ts`
   - Remplacer `user.id` par `personnel.id` pour tous les champs *_by
   - Ajouter garde-fous (tenantId + personnel.id)
   - Ajouter `onError` explicites pour remonter la cause réelle

(Aucun changement DB requis pour résoudre le 409 FK.)

---

## Critères d’acceptation (Done)
- Création d’une intégration externe fonctionne (plus de 409)
- Création webhook fonctionne (plus de 409)
- Génération FEC crée une ligne sans erreur (plus de 409)
- Sync module insère un log sans erreur (plus de 409)
- Les toasts d’erreur sont explicites si un problème subsiste
