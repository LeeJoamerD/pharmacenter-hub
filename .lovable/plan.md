

# Diagnostic et correction : Recherche VIDAL retourne 0 resultats

## Probleme

L'API VIDAL repond avec un status 200 (pas d'erreur) mais la fonction `parseEntries()` retourne un tableau vide. Deux causes possibles :

1. **L'API VIDAL retourne reellement 0 resultats** (credentials limitees, compte demo sans acces aux donnees)
2. **Le parsing XML echoue silencieusement** car les tags XML utilisent des prefixes de namespace (ex: `<atom:entry>` au lieu de `<entry>`)

## Plan de correction

### Etape 1 : Ajouter du logging de diagnostic dans l'Edge Function

Modifier `supabase/functions/vidal-search/index.ts` pour logger :
- Le status HTTP de la reponse VIDAL
- Les 500 premiers caracteres du XML brut retourne
- Le nombre de `<entry>` detectes
- Le `totalResults` du OpenSearch

Cela permettra de voir immediatement si le XML contient des donnees ou non.

### Etape 2 : Rendre le parsing XML plus robuste

Le regex actuel `/<entry>([\s\S]*?)<\/entry>/g` ne matchera pas si les entries sont prefixees (ex: `<atom:entry>`). Modifier pour accepter les deux formats :

```text
Avant:  /<entry>([\s\S]*?)<\/entry>/g
Apres:  /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
```

### Etape 3 : Retourner le XML brut en mode debug

Ajouter temporairement le XML brut (tronque) dans la reponse JSON pour pouvoir diagnostiquer depuis le frontend sans avoir a consulter les logs Supabase.

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `supabase/functions/vidal-search/index.ts` | Ajouter logging + robustifier le parsing XML |

## Section technique

### Modifications dans `supabase/functions/vidal-search/index.ts`

**Ligne 71** - Regex des entries plus tolerant :
```typescript
const entryRegex = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g
```

**Lignes 225-230** - Ajouter logging apres reception de la reponse :
```typescript
const xmlText = await response.text()
console.log('VIDAL response status:', response.status)
console.log('VIDAL response length:', xmlText.length)
console.log('VIDAL response preview:', xmlText.substring(0, 500))

const packages = parseEntries(xmlText)
console.log('Parsed packages count:', packages.length)
```

**Lignes 232-235** - Inclure des infos de debug dans la reponse :
```typescript
return new Response(
  JSON.stringify({
    packages,
    totalResults,
    page: startPage,
    pageSize,
    _debug: {
      responseLength: xmlText.length,
      responsePreview: xmlText.substring(0, 300),
      httpStatus: response.status
    }
  }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
)
```

## Resultat attendu

Apres deploiement, la prochaine recherche VIDAL affichera dans les logs le contenu XML brut, ce qui permettra d'identifier si :
- Le XML est vide (probleme de credentials/acces)
- Le XML contient des entries mais le parsing echoue (probleme de namespace)

