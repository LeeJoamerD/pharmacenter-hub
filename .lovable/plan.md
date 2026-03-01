

# Fix : Primes configurées non appliquées lors de l'activation par Switch

## Problème identifié

Quand l'utilisateur active une prime via le Switch dans le modal "Modifier le bulletin", seul `actif` passe à `true` mais le `montant` reste à `0`. Le code ne consulte jamais `parametres.primes_defaut` pour pré-remplir le montant configuré.

## Solution

Modifier les 3 fonctions `updateEditPI`, `updateEditPNI` et `updateEditRet` dans `BulletinsList.tsx` pour que lorsque le champ modifié est `actif` et la valeur est `true`, le montant soit automatiquement pré-rempli depuis `parametres.primes_defaut` (sauf si un montant est déjà > 0).

### Détails techniques

**Dans `updateEditPI` (primes imposables)** : Quand `field === 'actif'` et `value === true`, vérifier `parametres?.primes_defaut?.[key]` et l'affecter au `montant` si le montant actuel est 0.

**Dans `updateEditPNI` (primes non imposables)** : Idem avec la clé `ni_${key}` (convention utilisée dans PayrollSettings).

**Dans `updateEditRet` (retenues)** : Pour `tol`, utiliser `parametres?.tol_defaut`. Pour les autres, vérifier `parametres?.primes_defaut?.[ret_${key}]` si configuré.

### Fichier impacté
- `src/components/dashboard/modules/accounting/salary/BulletinsList.tsx` — fonctions `updateEditPI`, `updateEditPNI`, `updateEditRet` (lignes 222-241)

