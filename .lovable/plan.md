
# Correction : Recuperer les codes CIP via les packages de chaque produit VIDAL

## Probleme

L'endpoint `/products?q=...` retourne des produits **sans codes CIP**. Les codes CIP13/CIP7 sont disponibles uniquement au niveau des **conditionnements** (packages), accessibles via `/products/{id}/packages`.

Actuellement, les 50 produits retournent tous `cip13: null`, ce qui bloque l'import (le bouton exige un code CIP valide).

## Solution

Modifier l'Edge Function `vidal-search` pour implementer un enrichissement en deux etapes :

1. Rechercher les produits via `/products?q=...` (comme actuellement)
2. Pour chaque produit retourne, appeler `/products/{id}/packages` pour recuperer ses conditionnements avec les codes CIP

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `supabase/functions/vidal-search/index.ts` | Ajouter l'etape de recuperation des packages par produit |

## Section technique

### Modifications dans `supabase/functions/vidal-search/index.ts`

**Nouvelle fonction `fetchProductPackages`** (a ajouter avant le `Deno.serve`) :

```typescript
async function fetchProductPackages(
  baseUrl: string, 
  authParams: string, 
  productId: number
): Promise<VidalPackage[]> {
  const url = `${baseUrl}/products/${productId}/packages?${authParams}`
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/atom+xml' },
    })
    if (!response.ok) return []
    const xmlText = await response.text()
    if (!xmlText || xmlText.length === 0) return []
    return parseEntries(xmlText)
  } catch {
    return []
  }
}
```

**Modification du flux de recherche par libelle** (apres la ligne 230) :

Apres le premier appel `/products`, les entries retournees sont des produits (pas des packages). Le code doit :
1. Extraire les IDs produits
2. Appeler `/products/{id}/packages` pour chacun (en parallele, par lots de 5 pour ne pas surcharger l'API)
3. Fusionner les informations produit (nom, company, marketStatus) avec les donnees package (CIP13, CIP7, prix, forme)
4. Retourner la liste aplatie des packages enrichis

```typescript
// After getting product entries from /products endpoint:
const productEntries = parseEntries(xmlText)

// Fetch packages for each product in parallel (batches of 5)
const allPackages: VidalPackage[] = []
for (let i = 0; i < productEntries.length; i += 5) {
  const batch = productEntries.slice(i, i + 5)
  const batchResults = await Promise.all(
    batch.map(product => fetchProductPackages(baseUrl, authParams, product.id))
  )
  for (let j = 0; j < batch.length; j++) {
    const product = batch[j]
    const pkgs = batchResults[j]
    if (pkgs.length > 0) {
      // Enrich packages with product-level info
      for (const pkg of pkgs) {
        pkg.name = pkg.name || product.name
        pkg.company = pkg.company || product.company
        pkg.marketStatus = pkg.marketStatus || product.marketStatus
        pkg.productId = product.id
        allPackages.push(pkg)
      }
    } else {
      // No packages found, keep product entry as-is
      allPackages.push(product)
    }
  }
}
```

**Modification du frontend** (`GlobalCatalogVidalSearch.tsx`) :

Aucune modification necessaire cote frontend. Le format de reponse reste le meme (tableau `packages`), mais cette fois les objets contiendront des codes CIP13 valides.

### Gestion de la recherche par code CIP

Pour la recherche par CIP, l'endpoint `/packages?q=CODE_CIP` actuel ne fonctionne pas (retourne 204). Alternative :
- Utiliser `/packages?code=CODE_CIP` (parametre `code` au lieu de `q`)
- Ou chercher dans `/products?q=CODE_CIP` puis enrichir comme ci-dessus

Le code testera d'abord `/packages?code=CODE_CIP`, et en fallback utilisera la recherche produit.

## Impact sur les performances

Chaque recherche par libelle generera N appels supplementaires (1 par produit retourne). Avec un pageSize de 50 et des lots de 5, cela fait 10 lots sequentiels. Le temps de reponse passera de ~1s a ~3-5s. Un indicateur de progression sera ajoute dans les logs.

## Resultat attendu

Les resultats VIDAL afficheront desormais les codes CIP13, les prix, les formes galeniques et les autres donnees de conditionnement, permettant l'import dans le catalogue global.
