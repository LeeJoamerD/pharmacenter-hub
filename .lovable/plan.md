

# Plan de correction : Dashboard Chat PharmaSoft Reseau

## Erreurs identifiees

### Erreur 1 : Colonne `sender_user_id` inexistante dans `network_messages`
**Fichiers :** `NewMessageDialog.tsx` (ligne 102), `NetworkAlertDialog.tsx` (ligne 150)

La table `network_messages` ne possede PAS de colonne `sender_user_id`. Les deux dialogues inserent cette colonne, ce qui provoque une erreur Supabase silencieuse ou un echec d'insertion. La donnee `sender_user_id` doit etre placee dans la colonne `metadata` (JSONB) qui existe deja.

### Erreur 2 : Colonne `metadata` inexistante dans `network_channels`
**Fichier :** `NewMessageDialog.tsx` (lignes 116 et 128)

La table `network_channels` ne possede PAS de colonne `metadata`. Le code tente de :
- Filtrer avec `.contains('metadata', { participants: [...] })` (ligne 116)
- Inserer `metadata: { participants: [...] }` (ligne 128)

Cela provoque un echec lors de la recherche/creation de canaux directs. La solution est d'utiliser la colonne `description` pour stocker l'identifiant de conversation directe, et de chercher le canal par nom plutot que par metadata.

### Erreur 3 : Colonne `ville` inexistante dans `pharmacies`
**Fichier :** `ExpertSearchDialog.tsx` (ligne 66)

La jointure selectionne `pharmacies!tenant_id(name, ville)` mais la table `pharmacies` a une colonne `city`, pas `ville`. Le resultat est toujours `null` pour la ville de la pharmacie (ligne 233).

## Verification des autres composants

| Composant | Statut |
|-----------|--------|
| `NetworkChatDashboard.tsx` | OK - Composant de layout |
| `NetworkOverview.tsx` | OK - Colonnes correctes (`pharmacies`, `personnel`, `network_messages`, `network_channels`) |
| `PharmacyDirectory.tsx` | OK - Colonnes correctes, N+1 present mais fonctionnel |
| `GlobalActivity.tsx` | OK - Colonnes correctes, jointure `channel:network_channels(name)` valide |
| `NetworkMetrics.tsx` | OK - Colonnes correctes, `network_activity_stats.avg_response_time_ms` existe |
| `QuickNetworkActions.tsx` | OK - Requetes correctes |

## Corrections

### Fichier 1 : `src/components/dashboard/modules/chat/dialogs/NewMessageDialog.tsx`
- Retirer `sender_user_id` de l'insert `network_messages` et le deplacer dans `metadata`
- Remplacer la recherche par `metadata` sur `network_channels` par une recherche par `name` (convention de nommage des canaux directs)
- Retirer `metadata` de l'insert `network_channels`

### Fichier 2 : `src/components/dashboard/modules/chat/dialogs/NetworkAlertDialog.tsx`
- Retirer `sender_user_id` de l'insert `network_messages` et le deplacer dans `metadata`

### Fichier 3 : `src/components/dashboard/modules/chat/dialogs/ExpertSearchDialog.tsx`
- Changer `pharmacies!tenant_id(name, ville)` en `pharmacies!tenant_id(name, city)`
- Changer `expert.pharmacy.ville` en `expert.pharmacy.city` dans le rendu

## Aucune suppression d'element frontend. Corrections strictement logiques.

