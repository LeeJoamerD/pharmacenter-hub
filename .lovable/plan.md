

# Plan de correction : Productivite Collaborative - Erreurs restantes

## Erreurs identifiees

### Erreur 1 (CRITIQUE) : Recursion infinie RLS entre `collaborative_workspaces` et `workspace_members`

La politique SELECT sur `collaborative_workspaces` (pour les workspaces reseau) fait un `EXISTS (SELECT 1 FROM workspace_members ...)`. La politique SELECT sur `workspace_members` fait un `EXISTS (SELECT 1 FROM collaborative_workspaces ...)`. Postgres detecte la boucle et renvoie l'erreur `42P17`.

De plus, la politique contient un bug : `wm.workspace_id = wm.id` (compare la table a elle-meme) au lieu de `wm.workspace_id = collaborative_workspaces.id`.

**Correction** : Creer une fonction `SECURITY DEFINER` pour verifier l'appartenance a un workspace sans declencher les politiques RLS. Remplacer les politiques circulaires.

### Erreur 2 : `nom_pharmacie` 400 Bad Request

Le code dans `useCollaborativeProductivity.ts` est deja corrige (utilise `name`). L'erreur vient probablement d'un cache du build precedent. Si l'erreur persiste, il faut verifier si d'autres hooks de la meme section font encore la requete avec `nom_pharmacie`.

---

## Plan de corrections

### Migration SQL (nouvelle)

1. **Creer la fonction `is_workspace_member`** (SECURITY DEFINER) :

```sql
CREATE OR REPLACE FUNCTION public.is_workspace_member(
  _workspace_id UUID,
  _pharmacy_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = _workspace_id
      AND pharmacy_id = _pharmacy_id
      AND status = 'active'
  );
$$;
```

2. **Creer la fonction `get_workspace_tenant_id`** (SECURITY DEFINER) :

```sql
CREATE OR REPLACE FUNCTION public.get_workspace_tenant_id(_workspace_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM collaborative_workspaces WHERE id = _workspace_id;
$$;
```

3. **Remplacer la politique SELECT circulaire sur `collaborative_workspaces`** :
   - DROP la politique "Users can view network workspaces they are members of"
   - Recreer avec `is_workspace_member(id, get_current_user_tenant_id())` au lieu du sous-SELECT vers `workspace_members`

4. **Remplacer les politiques SELECT/INSERT/UPDATE/DELETE sur `workspace_members`** :
   - Utiliser `get_workspace_tenant_id(workspace_id) = get_current_user_tenant_id()` au lieu du sous-SELECT vers `collaborative_workspaces`

### Aucun changement frontend

Le code TypeScript est deja corrige. Seule la migration SQL est necessaire.

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Migration SQL | Fonctions SECURITY DEFINER + politiques RLS |

