
# Prise en charge des ventes en bon (dette) dans l'encaissement

## Probleme identifie

Le client "Dorel Regis MASSAMBA GANGA" (type Personnel) a `peut_prendre_bon = true`, ce qui signifie qu'il peut prendre des produits a credit. La vente POS-20260209-0108 a ete correctement creee avec `montant_net = 7 475 FCFA` et `montant_paye = 0` (statut "En cours").

Cependant, au moment de l'encaissement dans `CashRegisterInterface.tsx`, le systeme exige que le montant recu soit >= au montant net (ligne 275). Il n'y a aucune logique pour permettre un paiement partiel ou nul quand le client a le droit de prendre des bons/dettes.

Le meme probleme existe dans `PaymentModal.tsx` (mode non-separe) : la validation exige `amountReceived >= totalAPayer` (ligne 118), mais le code a deja une logique de dette (lignes 127-149) qui gere `resteAPayer > 0` et verifie `peut_prendre_bon` + limite de credit. Le probleme est que `isValidPayment` bloque avant que `canProceed` puisse autoriser le paiement partiel.

## Corrections prevues

### 1. CashRegisterInterface.tsx - Permettre l'encaissement partiel pour les clients "bon"

**Probleme** : Ligne 275, le code bloque si `amountReceived < montant_net` pour les paiements en especes, sans verifier si le client peut prendre des bons.

**Correction** :
- Recuperer les informations du client depuis la transaction selectionnee (deja disponible via `selectedTransaction.client` et `selectedTransaction.metadata`)
- Si le client a `peut_prendre_bon = true`, autoriser un montant recu inferieur au montant net
- Verifier la limite de credit du client avant d'autoriser la dette
- Afficher clairement la part "dette" dans l'interface
- Mettre a jour la vente avec `montant_paye` = montant effectivement recu (pas le montant net)

### 2. PaymentModal.tsx - Corriger la validation pour le mode non-separe

**Probleme** : `isValidPayment` (ligne 116-124) retourne `false` si montant < total, ce qui empeche `canProceed` d'etre evalue correctement.

**Correction** :
- Modifier `isValidPayment` pour prendre en compte `peut_prendre_bon` du client
- Si le client peut prendre des bons, `isValidPayment = true` meme si montant < total
- La logique existante de `canProceed` (lignes 138-149) gerera ensuite la verification de limite de credit

### 3. usePOSData.ts - Mettre a jour `processPayment` pour gerer les paiements partiels

**Probleme** : `processPayment` marque toujours la vente comme "Validee" et enregistre `montant_paye = paymentData.amount_received`. Mais le statut devrait rester "En cours" si le paiement est partiel.

**Correction** :
- Si `amount_received < montant_net` et que le client peut prendre des bons : statut reste "En cours" (dette)
- Si `amount_received >= montant_net` : statut passe a "Validee" (paye)
- Le mouvement de caisse doit enregistrer uniquement le montant effectivement recu

### 4. Affichage dans le panier (ShoppingCartComponent / zone calculs de SalesOnlyInterface)

**Amelioration** : Afficher dans le bloc de calculs du panier les informations de couverture du client selectionne :
- Si taux de couverture (taux_agent) > 0 : afficher la part couverte et la part patient
- Si `peut_prendre_bon = true` et pas de taux de couverture : afficher "Total en dette (a charge du client)"
- Afficher clairement ce que le client doit payer immediatement vs la dette

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx` | Ajouter la logique de paiement partiel pour clients "bon", afficher la dette dans le detail de transaction, ajuster la validation du paiement |
| `src/components/dashboard/modules/sales/pos/PaymentModal.tsx` | Corriger `isValidPayment` pour autoriser le paiement partiel quand `peut_prendre_bon = true` |
| `src/hooks/usePOSData.ts` | Modifier `processPayment` pour gerer les paiements partiels (statut conditionnel, mouvement caisse partiel) |
| `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx` | Afficher les calculs de couverture/dette dans la zone panier |

## Logique metier detaillee

```text
A la vente (SalesOnlyInterface) :
  1. Client selectionne avec peut_prendre_bon = true
  2. Si taux_agent > 0 (couverture) :
     - Part assurance = montant_net * taux_agent / 100
     - Part client = montant_net - part assurance
     - La part assurance est une dette envers l'assureur
     - La part client est ce que le client paie immediatement
  3. Si pas de taux de couverture :
     - Totalite = dette a charge du client
     - Le client peut payer 0 a l'encaissement

A l'encaissement (CashRegisterInterface) :
  1. Montant recu >= montant_net : paiement complet -> statut "Validee"
  2. Montant recu < montant_net ET peut_prendre_bon :
     - Verifier limite credit
     - Enregistrer montant_paye = montant recu
     - Reste a payer = dette
     - Statut reste "En cours" (dette active)
  3. Montant recu < montant_net ET !peut_prendre_bon :
     - Bloquer : "Montant insuffisant"
```
