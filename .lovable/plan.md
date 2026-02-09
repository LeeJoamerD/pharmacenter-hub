

# Correction du calcul du montant theorique (line 424)

## Probleme

La correction precedente n'a pas ete appliquee. La ligne 424 de `src/hooks/useCashRegister.ts` utilise toujours `'Retrait'` comme condition pour soustraire les mouvements, alors que ce type n'existe pas dans le systeme. Les types sortants reels sont `'Sortie'`, `'Remboursement'` et `'Depense'`.

La fonction `getSessionBalance` est appelee par `CloseSessionModal` pour calculer le montant theorique affiche lors de la fermeture de session. L'erreur fait que les depenses et sorties sont additionnees au lieu d'etre soustraites.

## Correction

**Fichier** : `src/hooks/useCashRegister.ts`, ligne 424

Remplacer :
```
const amount = m.type_mouvement === 'Retrait' ? -m.montant : m.montant;
```

Par :
```
const isOutgoing = ['Sortie', 'Remboursement', 'Dépense'].includes(m.type_mouvement);
const amount = isOutgoing ? -m.montant : m.montant;
```

## Impact

- Le montant theorique dans le modal de fermeture sera correct : Fond de caisse + Entrees/Ventes - Sorties/Depenses/Remboursements
- L'ecart affiche sera correct
- Un seul fichier, une seule ligne a modifier

