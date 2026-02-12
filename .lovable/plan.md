

# Implémenter le bouton Imprimer dans TransactionDetailsModal

## Contexte

Le plan a ete approuve precedemment mais jamais execute. Le bouton "Imprimer" existe visuellement (ligne 49-52) mais n'a aucune fonctionnalite. Il faut le connecter a `printCashReceipt` pour generer le meme recu de caisse que celui produit apres encaissement dans le module Caisse.

## Modifications

### Fichier : `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx`

1. **Ajouter les imports** :
   - `printCashReceipt` depuis `@/utils/salesTicketPrinter`
   - `useGlobalSystemSettings` depuis `@/hooks/useGlobalSystemSettings`
   - `toast` depuis `sonner`

2. **Dans le composant, ajouter les hooks et la fonction handlePrint** :
   - Appel a `useGlobalSystemSettings()` pour recuperer `getPharmacyInfo`
   - Fonction `handlePrint` qui construit l'objet `CashReceiptData` a partir de `transaction` et appelle `printCashReceipt`

3. **Connecter le bouton** existant avec `onClick={handlePrint}`

### Fichier : `src/hooks/useTransactionHistory.ts`

Ajouter `montant_paye` et `montant_rendu` au type `Transaction` pour eviter les casts `as any`.

## Section technique

### Mapping Transaction vers CashReceiptData

```typescript
const pharmacyInfo = getPharmacyInfo();

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
    mode_paiement: transaction.mode_paiement || 'Especes',
    remise_globale: transaction.remise_globale || 0,
  },
  lignesVente: transaction.lignes_ventes?.map(l => ({
    produit: l.produit?.libelle_produit || 'Produit',
    quantite: l.quantite,
    prix_unitaire: l.prix_unitaire_ttc,
    montant: l.montant_ligne_ttc,
  })) || [],
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

printCashReceipt(receiptData);
```

### Bouton modifie

```tsx
<Button variant="outline" size="sm" onClick={handlePrint}>
  <Printer className="h-4 w-4 mr-1" />
  Imprimer
</Button>
```
