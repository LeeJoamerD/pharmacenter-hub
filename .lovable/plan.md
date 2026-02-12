

# Implémenter le bouton Imprimer dans TransactionDetailsModal

## Contexte

Le bouton "Imprimer" est déjà présent visuellement dans le modal `TransactionDetailsModal` (ligne 49-52 du fichier) mais n'a aucun `onClick` handler. Il faut le connecter à la fonction `printCashReceipt` de `salesTicketPrinter.ts`, identique à celle utilisée dans la Caisse après encaissement.

## Modifications

### Fichier : `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx`

1. **Ajouter les imports** :
   - `printCashReceipt` depuis `@/utils/salesTicketPrinter`
   - `useGlobalSystemSettings` depuis `@/hooks/useGlobalSystemSettings`
   - `useTenant` depuis `@/hooks/useTenant`
   - `toast` depuis `sonner`

2. **Ajouter la prop `pharmacyInfo`** (optionnelle) ou bien utiliser `useGlobalSystemSettings` directement dans le composant pour recuperer les infos pharmacie

3. **Creer la fonction `handlePrint`** qui :
   - Recupere les infos pharmacie via `getPharmacyInfo()`
   - Construit l'objet `CashReceiptData` a partir des champs de `transaction` :
     - `numero_vente`, `date_vente`, `montant_total_ht`, `montant_tva`, `montant_total_ttc`, `montant_net`, `remise_globale` sont deja disponibles dans le type `Transaction`
     - `montant_paye` : utiliser `(transaction as any).montant_paye || transaction.montant_net` (le champ existe en base mais pas dans le type TS)
     - `montant_rendu` : utiliser `(transaction as any).montant_rendu || 0`
     - `mode_paiement` : `transaction.mode_paiement || 'Especes'`
   - Appelle `printCashReceipt(receiptData)` pour generer le PDF
   - Ouvre le PDF dans une nouvelle fenetre avec `window.open`

4. **Connecter le bouton existant** (ligne 49) avec `onClick={handlePrint}`

### Fichier : `src/hooks/useTransactionHistory.ts` (amelioration optionnelle)

Ajouter `montant_paye` et `montant_rendu` au type `Transaction` pour eviter le cast `as any`. Ces champs existent dans la table `ventes` et sont deja recuperes par le `select('*')`.

## Section technique

### Mapping Transaction vers CashReceiptData

```typescript
const receiptData = {
  vente: {
    numero_vente: transaction.numero_vente,
    date_vente: transaction.date_vente,
    montant_total_ht: transaction.montant_total_ht || 0,
    montant_tva: transaction.montant_tva || 0,
    montant_total_ttc: transaction.montant_total_ttc,
    montant_net: transaction.montant_net,
    montant_paye: transaction.montant_paye || transaction.montant_net,
    montant_rendu: transaction.montant_rendu || 0,
    mode_paiement: transaction.mode_paiement || 'Espèces',
    remise_globale: transaction.remise_globale || 0,
  },
  client: transaction.client ? {
    nom: transaction.client.nom_complet,
    type: 'Client',
  } : undefined,
  pharmacyInfo: {
    name: pharmacyInfo?.name || 'Pharmacie',
    adresse: pharmacyInfo?.address,
    telephone: pharmacyInfo?.telephone_appel || pharmacyInfo?.telephone_whatsapp,
  },
  agentName: transaction.agent
    ? `${transaction.agent.prenoms || ''} ${transaction.agent.noms || ''}`.trim()
    : undefined,
};
```

### Aucune autre modification necessaire

La fonction `printCashReceipt` et le composant `TransactionDetailsModal` sont deja en place. Seul le branchement manque.

