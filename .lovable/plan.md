

# Implementation des boutons Actions dans "Transactions Recentes" (module Ventes)

## Contexte

Les trois boutons d'action (Voir, Imprimer, Menu contextuel) dans le widget "Transactions Recentes" du tableau de bord Ventes sont actuellement des boutons vides sans fonctionnalite. Il faut les rendre operationnels.

## Boutons a implementer

1. **Oeil (Voir)** : Ouvre le modal `TransactionDetailsModal` avec les details complets de la vente
2. **Imprimante (Imprimer)** : Genere et imprime le recu de caisse via `printCashReceipt`
3. **3 points (MoreVertical)** : Menu deroulant avec options supplementaires (Voir details, Imprimer, Annuler)

## Defi technique

Le widget utilise `RecentTransaction` (structure simplifiee avec `invoice_number`, `amount`, etc.) alors que le `TransactionDetailsModal` et `printCashReceipt` necessitent un objet `Transaction` complet (avec `lignes_ventes`, `client`, `agent`, etc.). Il faut donc charger les donnees completes de la vente depuis Supabase quand l'utilisateur clique sur un bouton.

## Modifications

### Fichier unique : `src/components/dashboard/modules/sales/widgets/RecentTransactions.tsx`

1. **Nouveaux imports** :
   - `TransactionDetailsModal` depuis `../history/TransactionDetailsModal`
   - `printCashReceipt` et `openPdfWithOptions` depuis les utilitaires d'impression
   - `useGlobalSystemSettings` et `useSalesSettings` pour les parametres d'impression
   - `DropdownMenu` et sous-composants depuis les composants UI
   - `supabase` pour charger les donnees completes
   - `Transaction` depuis le hook `useTransactionHistory`
   - `toast` de sonner pour les notifications

2. **Nouveaux states** :
   - `selectedTransaction` : stocke la `Transaction` complete chargee
   - `detailsModalOpen` : controle l'ouverture du modal
   - `loadingTransaction` : indicateur de chargement pendant le fetch

3. **Fonction `fetchFullTransaction(venteId)`** :
   - Requete Supabase sur la table `ventes` avec jointures (`client`, `agent:personnel`, `caisse:caisses`, `lignes_ventes(*, produit:produits(*))`)
   - Retourne un objet `Transaction` complet

4. **Fonction `handleViewDetails(transaction)`** :
   - Appelle `fetchFullTransaction` avec l'ID de la transaction
   - Stocke le resultat dans `selectedTransaction`
   - Ouvre le modal

5. **Fonction `handlePrint(transaction)`** :
   - Appelle `fetchFullTransaction` pour obtenir les donnees completes
   - Mappe les donnees vers le format `CashReceiptData` (meme logique que dans `TransactionDetailsModal`)
   - Appelle `printCashReceipt` puis `openPdfWithOptions`

6. **Bouton Oeil** : `onClick={() => handleViewDetails(transaction)}`

7. **Bouton Imprimante** : `onClick={() => handlePrint(transaction)}`

8. **Bouton 3 points** : Remplace par un `DropdownMenu` avec :
   - "Voir les details" (meme action que le bouton oeil)
   - "Imprimer le recu" (meme action que le bouton imprimante)
   - Separateur
   - "Annuler la vente" (action d'annulation si le statut n'est pas deja "Annulee")

9. **Rendu du modal** : `<TransactionDetailsModal>` en bas du composant

Aucune migration SQL necessaire -- toutes les tables et colonnes existent deja.

