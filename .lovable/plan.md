

# Correction du doublon d'URL VIDAL (erreur 502 / 404)

## Probleme

L'Edge Function `vidal-search` construit une URL avec un chemin duplique :
- `VIDAL_API_URL` dans la base = `https://api.vidal.fr/rest/api`
- Le code ajoute `/rest/api/packages?q=...`
- Resultat : `https://api.vidal.fr/rest/api/rest/api/packages?q=...` -> 404

## Correction

Modifier `supabase/functions/vidal-search/index.ts`, lignes 204 et 207 : retirer le prefixe `/rest/api` deja present dans l'URL de base.

### Avant (lignes 202-208)
```typescript
if (searchMode === 'cip') {
  url = `${baseUrl}/rest/api/search?code=...`
} else {
  url = `${baseUrl}/rest/api/packages?q=...`
}
```

### Apres
```typescript
if (searchMode === 'cip') {
  url = `${baseUrl}/search?code=...`
} else {
  url = `${baseUrl}/packages?q=...`
}
```

## Fichier concerne

| Fichier | Lignes | Action |
|---------|--------|--------|
| `supabase/functions/vidal-search/index.ts` | 202-208 | Retirer `/rest/api` des chemins |

## Resultat attendu

L'URL construite sera `https://api.vidal.fr/rest/api/packages?q=...` (correcte) et la recherche VIDAL retournera des resultats au lieu d'un 404/502.
