

## Plan — Afficher des libellés lisibles pour les canaux directs

### Problème

Dans **Chat-PharmaSoft → Messagerie Réseau**, les canaux de type `direct` affichent un titre brut issu de la base : `Direct: <uuid-A>-<uuid-B>` (utilisé en interne comme clé d'unicité). Idem dans la liste des canaux à gauche, dans le placeholder de la zone de saisie, et dans le titre principal à droite.

### Cause

La RPC `send_direct_network_message` stocke `name = 'Direct: ' || string_agg(uuid)` pour garantir l'unicité du canal direct entre 2 pharmacies. Ce nom n'est pas destiné à l'affichage, mais l'UI l'utilise tel quel.

### Solution (UI uniquement, aucun changement DB)

Ajouter une fonction utilitaire `getChannelDisplayName(channel, currentPharmacy)` dans `src/components/dashboard/modules/chat/NetworkMessaging.tsx` qui :

1. Si `channel.type !== 'direct'` → retourne `channel.name` inchangé.
2. Sinon, construit un libellé lisible via, dans l'ordre :
   - **a)** Si `channel.description` commence par `'Conversation directe entre '` → extraire les deux noms de pharmacies, retirer celui de la pharmacie courante (`currentPharmacy.name`) et afficher : `Direct · <Autre Pharmacie>`. Si on ne peut pas distinguer, afficher `Direct · <PharmacieA> ↔ <PharmacieB>`.
   - **b)** Fallback (description absente ou format inattendu) : afficher `Direct · Conversation`.

### Points d'application dans `NetworkMessaging.tsx`

Remplacer toutes les occurrences brutes de `channel.name` / `activeChannelData?.name` côté affichage par l'appel à `getChannelDisplayName(...)` :

- Liste des canaux (ligne ~213) : `<p>{getChannelDisplayName(channel, currentPharmacy)}</p>`.
- Titre du panneau de droite (ligne ~247) : `getChannelDisplayName(activeChannelData, currentPharmacy)`.
- Description (ligne ~250) : pour les canaux directs, masquer la description brute (qui contient déjà les noms) et afficher à la place `Conversation directe`.
- Placeholder de la zone de saisie (ligne ~354) : `Envoyer un message à <Autre Pharmacie>...` pour les directs ; `Envoyer un message dans #<nom>...` sinon.

### Règles métier respectées

- Aucun changement de schéma ni de RPC : le `name` brut reste la clé d'unicité interne.
- Multi-tenant : la résolution dépend de `currentPharmacy` (déjà fourni par le hook).
- Localisation : libellés alignés sur le style FR existant du module ("Direct · …", "Conversation directe").
- Pas d'appel réseau supplémentaire : on s'appuie sur la `description` déjà chargée par la RPC `get_user_accessible_channels`.

### Fichier modifié

- `src/components/dashboard/modules/chat/NetworkMessaging.tsx` (ajout helper + 4 substitutions d'affichage).

### Vérifications

1. Canal `Général` (système) : titre inchangé.
2. Canal direct créé entre deux pharmacies : la liste, le titre et le placeholder affichent `Direct · <Nom de l'autre pharmacie>`.
3. Description du panneau de droite affiche `Conversation directe` (sans UUID).
4. Aucun impact sur l'envoi/réception de messages (la sélection se fait toujours via `channel.id`).

