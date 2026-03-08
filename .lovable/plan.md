

# Plan de correction : Sécurité Réseau (Chat-PharmaSoft)

## Erreurs identifiées

### Erreur 1 : Signature incompatible `handleConfirmResolve` / `ResolveSecurityEventDialog`

Le dialog `ResolveSecurityEventDialog` déclare `onResolve: (eventId: string, notes: string) => Promise<void>` et appelle `onResolve(event.id, fullNotes)`. Mais dans `NetworkSecurityManager.tsx` (ligne 129), `handleConfirmResolve` est défini comme `async (notes: string)` -- il n'accepte pas le `eventId` comme premier argument. Le `eventId` envoyé par le dialog est interprété comme `notes`, et le vrai `notes` est ignoré.

**Correction** : Modifier `handleConfirmResolve` pour accepter `(eventId: string, notes: string)` afin de correspondre à la signature du dialog.

### Erreur 2 : `compliance_requirements` -- champ `requirement_name` inexistant

Dans `useNetworkSecurity.ts` (ligne 516), le code accède à `(control.requirement as { requirement_name?: string })?.requirement_name`. Or la table `compliance_requirements` a un champ `title`, pas `requirement_name`.

**Correction** : Remplacer `requirement_name` par `title`.

### Erreur 3 : `EncryptionDetailDialog` reçoit `rotations={[]}` au lieu des vraies données

Dans `NetworkSecurityManager.tsx` (ligne 972), le prop `rotations` est hardcodé à `[]`. Le hook expose `keyRotations` mais il n'est pas destructuré dans le composant.

**Correction** : Destructurer `keyRotations` depuis le hook et le passer en prop `rotations={keyRotations}`.

---

## Plan de corrections

### Fichier `src/components/dashboard/modules/chat/NetworkSecurityManager.tsx`

1. **Destructurer `keyRotations`** depuis `useNetworkSecurity()` (ligne 48-70).

2. **Corriger `handleConfirmResolve`** (ligne 129) : Changer la signature de `async (notes: string)` à `async (eventId: string, notes: string)` pour correspondre au contrat du dialog.

3. **Passer `keyRotations`** au lieu de `[]` dans le prop `rotations` de `EncryptionDetailDialog` (ligne 972).

### Fichier `src/hooks/useNetworkSecurity.ts`

4. **Corriger l'accès à `requirement_name`** (ligne 516) : Remplacer par `title` pour correspondre au schéma de la table `compliance_requirements`.

---

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkSecurity.ts` |
| Modifier | `src/components/dashboard/modules/chat/NetworkSecurityManager.tsx` |

