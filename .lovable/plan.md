

# Fix: Bouton "Récupérer les prix" invisible

## Problème

1. **Cache PWA** : Le navigateur sert toujours `index-DwXCAMfH.js` au lieu du dernier build. Toutes les modifications des 10+ itérations n'ont jamais été exécutées.

2. **Condition trop stricte** : `l.prixAchatReel === 0` ne matche pas si le champ est `undefined` ou `null`. Le bouton ne s'afficherait pas même avec le bon build.

## Corrections (ReceptionExcelImport.tsx)

### 1. Toujours afficher le bouton quand `validationResult` existe
Remplacer la condition complexe par une simple vérification de `validationResult` :

```typescript
// AVANT (ligne 2286-2288)
const zeroPriceCount = parseResult?.lines?.filter(l => l.prixAchatReel === 0 && l.produitId).length || 0;
if (zeroPriceCount === 0) return null;

// APRÈS - toujours visible après validation
const zeroPriceCount = parseResult?.lines?.filter(l => !l.prixAchatReel && l.produitId).length || 0;
// Ne plus cacher le bouton - toujours le montrer après validation
```

Le bouton sera **toujours visible** après validation (pas de `return null`), avec le compteur qui indique combien de lignes ont besoin de prix. S'il n'y en a pas, le bouton dira "(0)" et sera disabled.

### 2. Corriger la condition du filtre dans `handleEnrichPrices`
Utiliser `!l.prixAchatReel` au lieu de `l.prixAchatReel === 0` partout pour attraper `undefined`, `null`, `0`, et `NaN`.

### 3. Forcer un cache bust
Ajouter un commentaire unique horodaté pour garantir un nouveau hash de build, forçant le service worker PWA à servir le nouveau fichier.

