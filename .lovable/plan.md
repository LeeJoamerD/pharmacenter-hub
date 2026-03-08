

# Plan de correction : Productivite Collaborative (Chat-PharmaSoft)

## Erreurs identifiees

### Erreur 1 (CRITIQUE) : Colonne `nom_pharmacie` inexistante -- requete echoue silencieusement

Dans `useCollaborativeProductivity.ts` (ligne 190), la requete `loadPharmacies` selectionne `nom_pharmacie` et ordonne par `nom_pharmacie`. Or la table `pharmacies` a une colonne `name`, pas `nom_pharmacie`. Cela provoque une erreur 400 silencieuse (catchee), et la liste des pharmacies reste vide. Consequence : aucun nom d'assignee n'est affiche, et les selects de pharmacie dans les dialogs sont vides.

**Correction** : Remplacer `nom_pharmacie` par `name` dans le `.select()` et `.order()`.

### Erreur 2 (CRITIQUE) : Boucle de re-rendu potentielle via `loadAll` / `pharmacies` / `loadTasks`

Le meme pattern de boucle infinie que dans la section Securite :
1. `useEffect` appelle `loadAll` (ligne 915-919)
2. `loadAll` appelle `loadPharmacies()` qui met a jour `pharmacies` state
3. `loadTasks` depend de `pharmacies` dans son `useCallback` (ligne 245)
4. `loadTasks` change de reference → `loadAll` change de reference (depend de `loadTasks`)
5. `useEffect` se re-declenche car `loadAll` est dans ses deps
6. Boucle potentielle (attenuee par le fait que `setPharmacies` peut retourner le meme resultat, mais instable)

**Correction** : Utiliser un `useRef` pour `pharmacies` dans `loadTasks` (meme pattern que la correction securite). Stabiliser `loadAll` en retirant les callbacks instables de son dependency array.

### Erreur 3 : `updateTask` envoie des champs TypeScript non-DB (`assignee_name`, `comments_count`)

`updateTask` (ligne 286) fait `{ ...updates }` et envoie directement a Supabase. Si le composant passe des champs enrichis comme `assignee_name` ou `comments_count` (qui n'existent pas dans la table), Supabase retourne une erreur 400.

**Correction** : Filtrer les champs avant l'envoi pour ne garder que les colonnes valides de la table.

### Erreur 4 : `loadWorkspaces` fait N+1 requetes (3 requetes par workspace)

`loadWorkspaces` (ligne 670) effectue 3 requetes par workspace pour compter members, tasks, documents. Avec 10 workspaces = 30 requetes. Pas une erreur fonctionnelle mais un goulot de performance.

**Correction** : Utiliser `{ count: 'exact', head: true }` et regrouper les requetes ou accepter le cout actuel avec un commentaire.

---

## Plan de corrections

### Fichier `src/hooks/useCollaborativeProductivity.ts`

1. **Corriger `loadPharmacies`** (ligne 190) : Remplacer `nom_pharmacie` par `name` dans `.select('id, name')` et `.order('name')`.

2. **Ajouter un `useRef` pour `pharmacies`** : Creer `pharmaciesRef` et le synchroniser via `useEffect`. `loadTasks` utilisera `pharmaciesRef.current` au lieu de `pharmacies` dans ses deps, stabilisant la reference du callback.

3. **Stabiliser `loadAll` et le `useEffect` principal** : Retirer les callbacks instables du dependency array du `useEffect` principal. Utiliser une fonction `loadAll` stable qui ne se recree pas a chaque changement d'etat intermediaire.

4. **Filtrer les champs dans `updateTask`** : Avant l'envoi a Supabase, ne garder que les colonnes valides (`title`, `description`, `assignee_pharmacy_id`, `priority`, `status`, `due_date`, `tags`, `workspace_id`, `is_network_task`, `metadata`, `completed_at`).

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useCollaborativeProductivity.ts` |

