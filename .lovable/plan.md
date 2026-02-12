

# Correction des endpoints VIDAL : `/products` au lieu de `/packages`

## Diagnostic

Les credentials sont correctes et correspondent exactement au PDF. Le probleme est que **l'Edge Function appelle les mauvais endpoints** :

| Mode | URL actuelle (FAUSSE) | URL correcte (selon le PDF officiel) |
|------|----------------------|--------------------------------------|
| Libelle | `/rest/api/packages?q=doliprane` | `/rest/api/products?q=doliprane` |
| Code CIP | `/rest/api/search?code=XXX&filter=PACKAGE` | `/rest/api/packages?code=XXX` ou `/rest/api/products?q=XXX` |

Le PDF montre explicitement l'exemple :
```
https://api.vidal.fr/rest/api/products?app_id=XXX&app_key=YYY&q=doliprane
```

L'API retourne HTTP 204 (No Content) parce que l'endpoint `/packages` avec `?q=` n'est pas le bon point d'entree pour la recherche par nom.

## Correction

### Fichier : `supabase/functions/vidal-search/index.ts`

**Lignes 202-208** - Corriger les deux URLs :

```text
Avant :
  if (searchMode === 'cip') {
    url = `${baseUrl}/search?code=${query}&filter=PACKAGE&${authParams}`
  } else {
    url = `${baseUrl}/packages?q=${query}&start-page=...&page-size=...&${authParams}`
  }

Apres :
  if (searchMode === 'cip') {
    url = `${baseUrl}/packages?q=${query}&${authParams}`
  } else {
    url = `${baseUrl}/products?q=${query}&start-page=...&page-size=...&${authParams}`
  }
```

Pour la recherche par libelle, on utilise `/products?q=...` (endpoint officiel documente dans le PDF).
Pour la recherche par CIP, on utilise `/packages?q=CODE_CIP` qui cherche les conditionnements par code.

### Parsing XML

La reponse de `/products` peut avoir une structure differente de `/packages`. Les entries devraient contenir des `<vidal:product>` au lieu de `<vidal:package>`. Le parsing existant avec les regex namespace-tolerantes devrait fonctionner, mais il faudra peut-etre adapter les champs extraits (le `<summary>` et `<title>` restent les memes dans le format ATOM).

### Fichier concerne

| Fichier | Lignes | Action |
|---------|--------|--------|
| `supabase/functions/vidal-search/index.ts` | 202-208 | Remplacer `/packages?q=` par `/products?q=` et `/search?code=...&filter=PACKAGE` par `/packages?q=` |

## Resultat attendu

La recherche "doliprane" retournera la liste des produits VIDAL correspondants au lieu d'un HTTP 204 vide.

