

# Correction du calcul du montant theorique dans la fermeture de session

## Probleme

Dans `src/hooks/useCashRegister.ts`, la fonction `getSessionBalance` (ligne 424) ne soustrait que les mouvements de type `'Retrait'`, qui n'est meme pas un type valide dans le systeme. Les types sortants reels sont `'Sortie'`, `'Remboursement'` et `'Depense'` (definis dans `src/types/cashMovement.ts`).

Resultat : les depenses et sorties sont **additionnees** au lieu d'etre soustraites, gonflant le montant theorique.

## Correction

**Fichier** : `src/hooks/useCashRegister.ts`

Remplacer la logique de la ligne 424 :

Avant :
```
const amount = m.type_mouvement === 'Retrait' ? -m.montant : m.montant;
```

Apres :
```
const isOutgoing = ['Sortie', 'Remboursement', 'Dépense'].includes(m.type_mouvement);
const amount = isOutgoing ? -m.montant : m.montant;
```

Cela utilise la meme liste que le helper `isOutgoingMovement` deja defini dans `cashMovement.ts`, garantissant la coherence.

## Impact

- Le montant theorique sera correctement calcule : Fond de caisse + Entrees (Ventes, Entrees) - Sorties (Depenses, Sorties, Remboursements)
- L'ecart affiche sera correct
- Aucun autre fichier a modifier

