

# Plan de correction : Securite Reseau (Chat-PharmaSoft)

## Cause de l'instabilite (boucle infinie)

Le probleme est une **boucle de dependances circulaire** dans `useNetworkSecurity.ts` :

```text
useEffect (ligne 845)
  ├── depends on: loadMetrics (dans le dependency array)
  ├── calls: loadSecuritySettings() → setSecuritySettings(settings)
  │
  └── securitySettings change
        └── loadMetrics recree (ligne 487: depends on securitySettings)
              └── loadMetrics reference change
                    └── useEffect re-declenche (loadMetrics dans ses deps)
                          └── BOUCLE INFINIE
```

Le cycle est :
1. `useEffect` s'execute, appelle `loadSecuritySettings()` qui met a jour `securitySettings`
2. `securitySettings` change → `loadMetrics` est recree (car `securitySettings` est dans ses deps `useCallback`)
3. `loadMetrics` change de reference → le `useEffect` se re-declenche (car `loadMetrics` est dans son dependency array)
4. Retour a l'etape 1 → boucle infinie

## Erreurs identifiees

### Erreur 1 (CRITIQUE) : Boucle infinie `loadMetrics` ↔ `securitySettings` ↔ `useEffect`

`loadMetrics` (ligne 487) depend de `securitySettings` dans son `useCallback`. Le `useEffect` principal (ligne 868) inclut `loadMetrics` dans son dependency array. Quand `loadSecuritySettings` met a jour `securitySettings`, `loadMetrics` est recree, ce qui re-declenche le `useEffect`, qui re-appelle `loadSecuritySettings`, etc.

**Correction** : Retirer `securitySettings` des dependances de `loadMetrics`. Utiliser un `useRef` pour acceder aux settings actuels sans creer de nouvelle reference de callback.

### Erreur 2 : `loadSecuritySettings` utilise `securitySettings` en closure (ligne 392)

La ligne `const settings: SecuritySettings = { ...securitySettings }` capture le state actuel via closure. Le `eslint-disable` masque ce probleme. Si les settings par defaut sont deja corrects (ils le sont), on peut simplement utiliser les valeurs par defaut en dur plutot que le state.

**Correction** : Utiliser les valeurs par defaut directement au lieu de `{ ...securitySettings }`.

### Erreur 3 : `loadEncryptionConfigs` et `loadAuthMethods` inserent des donnees par defaut a chaque chargement si vide

Si les tables sont vides, ces fonctions inserent des lignes par defaut, puis rechargent. Cela n'est pas une boucle, mais c'est un double appel inutile a chaque montage.

**Correction** : Pas de changement structurel (pas de boucle), mais ajouter un commentaire de documentation.

## Plan de corrections

### Fichier `src/hooks/useNetworkSecurity.ts`

1. **Creer un `useRef` pour `securitySettings`** : Ajouter `const securitySettingsRef = useRef(securitySettings)` et le synchroniser quand `securitySettings` change. `loadMetrics` utilisera la ref au lieu du state.

2. **Retirer `securitySettings` des deps de `loadMetrics`** : La fonction utilisera `securitySettingsRef.current` au lieu de `securitySettings` directement, cassant le cycle de recreation.

3. **Corriger `loadSecuritySettings`** : Remplacer `{ ...securitySettings }` par les valeurs par defaut en dur, supprimant la dependance closure au state.

4. **Simplifier le dependency array du `useEffect` principal** : Avec la ref, `loadMetrics` ne sera plus recree quand les settings changent, cassant la boucle infinie.

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkSecurity.ts` |

