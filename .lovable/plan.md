
# Correction : Colonnes vides (Forme, Prix, DCI) dans les resultats VIDAL

## Probleme

Les champs `galenicalForm`, `activeSubstances`, `publicPrice` et `atcClass` sont tous `null` dans les resultats. Le XML VIDAL utilise des tags avec attribut `name` sur des elements auto-fermants, par exemple :

```text
<vidal:galenicalForm name="suppositoire" vidalId="47"/>
<vidal:company name="Opella Healthcare" vidalId="123"/>
```

Le regex actuel `/<vidal:galenicalForm[^>]*>([^<]*)</` cherche du texte entre les balises ouvrante et fermante, mais ne matche pas les tags auto-fermants avec attribut `name`.

Le champ `marketStatus` fonctionne deja correctement parce qu'il a une logique specifique qui extrait l'attribut `name` en premier. Il faut appliquer la meme logique aux autres champs.

## Correction

### Fichier : `supabase/functions/vidal-search/index.ts`

**Modifier les regex des lignes 90-94** pour extraire l'attribut `name` en priorite (comme `marketStatus` le fait deja), puis fallback sur le contenu texte :

| Champ | Regex actuelle | Correction |
|-------|---------------|------------|
| `galenicalForm` | `/<vidal:galenicalForm[^>]*>([^<]*)</` | Extraire `name="..."` en priorite |
| `activeSubstances` | `/<vidal:activeSubstances>([^<]*)</` | Extraire `name="..."` en priorite |
| `atcClass` | `/<vidal:atcClass[^>]*>([^<]*)</` | Extraire `name="..."` en priorite |
| `company` | Deja OK (utilise `[^>]*>`) | Ajouter extraction `name="..."` |
| `publicPrice` | `/<vidal:publicPrice>([^<]*)</` | Garder tel quel (valeur numerique) |

Pour chaque champ, la nouvelle logique sera :

```text
1. Chercher name="..." dans le tag  (ex: <vidal:galenicalForm name="comprime"/>)
2. Si pas trouve, chercher le contenu texte (ex: <vidal:galenicalForm>comprime</vidal:galenicalForm>)
```

Cela s'applique a `galenicalForm`, `activeSubstances`, `atcClass`, et `company` — les memes champs qui sont actuellement vides.

### Implementation technique

Creer une fonction helper `extractVidalField(entry, tagName)` qui centralise cette logique pour eviter la duplication :

```typescript
function extractVidalField(entry: string, tagName: string): string | null {
  // Priority 1: name attribute
  const nameMatch = entry.match(
    new RegExp(`<vidal:${tagName}[^>]*\\bname="([^"]*)"`)
  )
  if (nameMatch) return nameMatch[1].trim() || null
  
  // Priority 2: text content
  const textMatch = entry.match(
    new RegExp(`<vidal:${tagName}[^>]*>([^<]+)<`)
  )
  if (textMatch) return textMatch[1].trim() || null
  
  return null
}
```

Puis remplacer les lignes individuelles par :

```typescript
const company = extractVidalField(entry, 'company')
const activeSubstances = extractVidalField(entry, 'activeSubstances')
const galenicalForm = extractVidalField(entry, 'galenicalForm')
const atcClass = extractVidalField(entry, 'atcClass')
```

### Redploiement

Apres modification, redeployer la fonction `vidal-search` et tester avec "doliprane" pour verifier que les colonnes Forme, DCI, et Prix s'affichent.

## Resultat attendu

Les colonnes Forme, DCI, Classe ATC et Laboratoire afficheront les valeurs extraites du XML VIDAL au lieu de "---".
