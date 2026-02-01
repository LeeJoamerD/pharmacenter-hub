
# Correction de l'erreur 400 - Module Stock/Étiquettes

## Problème identifié

La requête vers la table `lots` dans le module d'impression d'étiquettes utilise un nom de colonne incorrect :
- **Utilisé** : `quantite_disponible` (n'existe pas)
- **Correct** : `quantite_restante` (colonne réelle dans la table `lots`)

Cela provoque une erreur `400 Bad Request` car PostgREST ne trouve pas cette colonne.

## Fichier à corriger

`src/hooks/useLabelPrinting.ts` - Ligne 58

## Modification

Remplacer :
```typescript
.gt('quantite_disponible', 0)
```

Par :
```typescript
.gt('quantite_restante', 0)
```

## Impact

- L'onglet "Produits" du module Stock/Étiquettes pourra charger correctement les informations de lots (numéro de lot, date de péremption) pour chaque produit
- Plus d'erreur 400 dans la console lors du chargement du module

## Vérification

Après correction, le chargement du module Stock/Étiquettes ne devrait plus générer d'erreurs dans la console.
