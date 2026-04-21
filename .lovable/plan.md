

## Diagnostic révisé — 8 officines au lieu de 13 : filtrage par `status`

### Nouvelle observation
La liste est bien scrollable. L'utilisateur voit **8 officines** sur les 14 attendues. Les officines manquantes incluent **Pharmacie SIRACIDE 38**, **Pharmacie Jeannelle** (normal, exclue) et 4 autres.

Les 8 affichées partagent toutes le badge `standard`. Les 5 manquantes ont vraisemblablement un autre `status` (ex: `pending`, `inactive`, `trial`, `suspended`, NULL…).

### Cause probable
La RPC `get_network_pharmacy_directory()` ne filtre pas par `status`, mais **soit** :
1. La RPC ne renvoie réellement que 9 lignes (Jeannelle + 8) car un `WHERE` implicite ou une jointure cachée filtre, **soit**
2. Le composant `NewMessageDialog.tsx` applique un filtre côté client (ex: `.filter(p => p.status === 'standard' || p.status === 'active')`).

### Vérifications à faire avant correctif
1. Exécuter `SELECT id, name, status FROM pharmacies ORDER BY name;` pour lister les 14 officines avec leur status réel.
2. Exécuter `SELECT * FROM get_network_pharmacy_directory();` pour vérifier ce que la RPC renvoie réellement.
3. Relire `NewMessageDialog.tsx` (mapping `pharmaciesRes.data`) pour détecter un éventuel filtre client.
4. Relire la définition de la RPC pour détecter un `WHERE status = ...` éventuellement ajouté.

### Correctif (selon résultat des vérifications)

**Cas A — La RPC filtre :**  
Recréer `get_network_pharmacy_directory()` sans aucun `WHERE` sur `pharmacies` (juste `SELECT … FROM pharmacies p ORDER BY p.name`).

**Cas B — Le composant filtre :**  
Retirer le filtre côté client dans `NewMessageDialog.tsx` (garder uniquement le `.filter(p => p.id !== currentTenant?.id)`).

**Cas C — Plusieurs status sont volontairement exclus :**  
Confirmer la règle métier (faut-il pouvoir envoyer un message direct à une officine `pending` ou `suspended` ?) puis ajuster.

### Tableau récap

| Étape | Action |
|---|---|
| 1 | SQL : lister les 14 pharmacies avec leur `status` |
| 2 | SQL : appeler la RPC pour comparer le retour réel |
| 3 | Lire `NewMessageDialog.tsx` (mapping) pour détecter un filtre client |
| 4 | Appliquer correctif Cas A, B ou C selon résultat |

### Résultat attendu
- Les **13 officines** (toutes sauf Pharmacie Jeannelle) apparaissent dans la liste de sélection.
- Pharmacie SIRACIDE 38 est sélectionnable et recevable d'un message direct.
- La cohérence avec le répertoire (qui affiche bien 14) est rétablie.

