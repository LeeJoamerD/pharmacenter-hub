

# Correction : Montant incorrect dans les mouvements de caisse

## Probleme

Lors d'un encaissement, le mouvement de caisse enregistre le **montant remis par le client** (ex: 5000 FCFA) au lieu du **montant net de la vente** (ex: 2075 FCFA). Cela fausse :
- Le "Detail des Mouvements" dans le rapport de session
- Le calcul du solde theorique de la caisse
- Les totaux Entrees/Ventes dans la cloture de session

Le probleme se trouve dans deux endroits du fichier `src/hooks/usePOSData.ts` :

| Ligne | Code actuel | Valeur enregistree | Valeur correcte |
|-------|------------|-------------------|-----------------|
| 257 | `montant: transactionData.payment.amount_received` | 5000 (remis par client) | 2075 (net a payer) |
| 426 | `montant: paymentData.amount_received` | idem | montant net de la vente |

## Correction

### Fichier : `src/hooks/usePOSData.ts`

**Ligne 257** (creation de vente avec paiement immediat) :

Remplacer `transactionData.payment.amount_received` par `totalAPayer` qui est deja calcule juste au-dessus (ligne 195) et represente le montant net apres couverture assurance, ticket moderateur et remise.

**Ligne 426** (encaissement ulterieur d'une vente en attente) :

Remplacer `paymentData.amount_received` par `montantNet` qui est deja disponible dans le scope (la variable est utilisee ligne 411). Pour un paiement partiel, utiliser `Math.min(paymentData.amount_received, montantNet)` pour enregistrer uniquement ce qui est effectivement encaisse sans depasser le montant du.

## Impact

- Le rapport de session affichera le bon montant (2075 au lieu de 5000)
- Le solde theorique sera correct
- Les ecarts de caisse seront fiables
- Les transactions deja enregistrees en base ne seront pas modifiees retroactivement

