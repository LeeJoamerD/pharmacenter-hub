

# Plan de correction : Analytics Réseau (Chat-PharmaSoft)

## Erreur identifiée

### `collaborationStats` est `null` -- crash TypeError

Le hook `useNetworkAdvancedAnalytics` initialise `collaborationStats` à `null` (ligne 89). Le composant `NetworkAdvancedAnalytics.tsx` accède directement à `collaborationStats.activeProjects` (ligne 423), `collaborationStats.pharmacyEngagement` (ligne 452), et `collaborationStats.trends` (lignes 477-492) sans vérifier si `collaborationStats` est `null`. Quand les données n'ont pas encore été chargées (ou si le RPC échoue), cela provoque le crash `Cannot read properties of null (reading 'activeProjects')`.

## Correction

### Fichier `src/components/dashboard/modules/chat/NetworkAdvancedAnalytics.tsx`

Ajouter l'opérateur de chaînage optionnel (`?.`) sur toutes les références à `collaborationStats` dans le JSX :

1. **Ligne 423** : `collaborationStats.activeProjects` → `collaborationStats?.activeProjects`
2. **Ligne 424** : idem sur `.slice(0, 5)`
3. **Ligne 452** : `collaborationStats.pharmacyEngagement` → `collaborationStats?.pharmacyEngagement`
4. **Ligne 453** : idem sur `.slice(0, 5)`
5. **Lignes 477-492** : `collaborationStats.trends` → `collaborationStats?.trends` (déjà partiellement fait avec `?.` mais le parent `collaborationStats` lui-même n'est pas gardé)

Concrètement, la condition ternaire à la ligne 423 devient :
```
collaborationStats?.activeProjects && collaborationStats.activeProjects.length > 0 ? (...)
```

Et à la ligne 452 :
```
collaborationStats?.pharmacyEngagement && collaborationStats.pharmacyEngagement.length > 0 ? (...)
```

Et les lignes 476-492 : ajouter `collaborationStats?.trends` (déjà présent mais le bloc parent doit aussi être gardé car `collaborationStats` lui-même peut être null).

Aucun élément du frontend n'est supprimé. Seuls des gardes null sont ajoutés.

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/dashboard/modules/chat/NetworkAdvancedAnalytics.tsx` |

