
# Corriger la recherche "Par code CIP" dans GlobalCatalogVidalSearch

## Problème identifié

Le composant `GlobalCatalogVidalSearch.tsx` utilise `searchMode: 'cip'` lors de la recherche par code CIP. Dans la Edge Function `vidal-search/index.ts`, ce mode génère l'URL `/packages?code=XXX` — un endpoint qui **n'existe pas** dans l'API VIDAL REST. Le paramètre `code=` est ignoré et VIDAL retourne toute sa base (319 472 entrées), sans aucun filtre.

La bonne URL, documentée au §4.3.2 du manuel VIDAL, est :
```
/rest/api/search?q=&code=3400930471722&filter=package
```

Ce mode correct existe déjà dans la Edge Function sous le nom `exact-code` (ligne 174), mais le composant ne l'utilise jamais.

## Fichiers modifiés

### 1. `src/components/platform-admin/GlobalCatalogVidalSearch.tsx`

**Modification 1** — Changer la valeur du Select "Par code CIP" pour envoyer `exact-code` au lieu de `cip` :

```tsx
// Avant
<SelectItem value="cip">Par code CIP</SelectItem>

// Après
<SelectItem value="exact-code">Par code CIP</SelectItem>
```

**Modification 2** — Mettre à jour le type du state `searchMode` pour inclure `'exact-code'` :

```tsx
// Avant
const [searchMode, setSearchMode] = useState<'label' | 'cip'>('label');

// Après
const [searchMode, setSearchMode] = useState<'label' | 'cip' | 'exact-code'>('label');
```

**Modification 3** — Mettre à jour le `onValueChange` du Select et le placeholder de l'Input :

```tsx
// Avant
<Select value={searchMode} onValueChange={(v: 'label' | 'cip') => setSearchMode(v)}>

// Après
<Select value={searchMode} onValueChange={(v: 'label' | 'cip' | 'exact-code') => setSearchMode(v)}>
```

**Modification 4** — Mettre à jour le placeholder de l'Input pour afficher `Code CIP7 ou CIP13...` quand `exact-code` est sélectionné :

```tsx
// Avant
placeholder={searchMode === 'label' ? 'Nom du produit...' : 'Code CIP13...'}

// Après
placeholder={searchMode === 'label' ? 'Nom du produit...' : 'Code CIP7 ou CIP13...'}
```

### 2. Edge Function `supabase/functions/vidal-search/index.ts` — Amélioration du mode `cip` (défense en profondeur)

Supprimer ou corriger le mode `cip` pour qu'il redirige vers `exact-code`, évitant que toute future utilisation du mode `cip` ne cause le même problème silencieux :

```typescript
// Avant (ligne 175-176)
} else if (searchMode === 'cip') {
  url = `${baseUrl}/packages?code=${encodeURIComponent(query)}&${authParams}`

// Après : rediriger vers exact-code
} else if (searchMode === 'cip' || searchMode === 'exact-code') {
  url = `${baseUrl}/search?q=&code=${encodeURIComponent(query)}&filter=package&${authParams}`
```

## Comportement après correction

- Saisir `3990000008427` → 1 seul résultat : **AZIC 500MG CPR PELL B/3**
- Saisir un CIP7 → retrouve le bon packaging
- Saisir un CIP invalide → 0 résultat (propre)
- La recherche "Par libellé" n'est pas affectée

## Cas particulier : résultats `totalResults`

L'endpoint `/search?code=...&filter=package` retourne les mêmes champs XML que `/packages?q=...`, le parseur `parsePackageEntries()` existant fonctionne sans modification.

## Déploiement requis

Après modification de la Edge Function, un redéploiement de `vidal-search` sera nécessaire.
