

# Prise en compte des configurations d'impression et ajout de l'apercu avant impression

## Constat actuel

1. **Les configurations d'impression ne sont pas utilisees** : Les parametres de `Parametres/Impressions` (largeur papier, en-tete, pied de page, logo) et de `Ventes/Configuration/Impression` (autoprint, receiptFooter, printLogo, includeBarcode, paperSize, receiptTemplate) sont sauvegardes en base mais **jamais lus** par les fonctions de generation de recus.

2. **Pas d'option "Apercu avant impression"** : Actuellement, l'impression ouvre toujours un nouvel onglet avec le PDF puis lance `window.print()` automatiquement. Il n'existe aucun toggle pour desactiver cet apercu. Le parametre `autoprint` dans Ventes/Configuration/Impression est le plus proche conceptuellement mais n'est pas utilise.

3. **4 points d'impression concernes** :
   - `POSInterface.tsx` (mode non separe) - utilise `printReceipt`
   - `SalesOnlyInterface.tsx` (mode separe - vente) - utilise `printSalesTicket`
   - `CashRegisterInterface.tsx` (mode separe - encaissement) - utilise `printCashReceipt`
   - `TransactionDetailsModal.tsx` (historique) - utilise `printCashReceipt`

## Configuration "Apercu avant impression"

Le parametre `autoprint` dans `Ventes/Configuration/Impression` sera reinterprete :

| Valeur `autoprint` | Comportement |
|---|---|
| **Active** (true) | Impression directe : le PDF s'ouvre et `window.print()` est appele immediatement |
| **Desactive** (false) | Apercu seulement : le PDF s'ouvre dans un nouvel onglet, l'utilisateur decide s'il imprime |

Son libelle dans l'interface sera renomme : **"Impression automatique (sans apercu)"** avec une description claire.

## Modifications prevues

### 1. Fichier : `src/hooks/useSalesSettings.ts`

Ajouter un champ `showPreview` (inverse de `autoprint`) a l'interface `printing` pour plus de clarte, ou simplement utiliser `autoprint` tel quel. **Aucun changement de structure necessaire** - on utilise `autoprint` directement.

### 2. Fichier : `src/utils/salesTicketPrinter.ts`

Modifier les fonctions `printSalesTicket` et `printCashReceipt` pour accepter un objet `options` optionnel :

```text
interface PrintOptions {
  autoprint: boolean;        // Impression automatique (sans apercu)
  receiptFooter?: string;    // Pied de page personnalise
  printLogo?: boolean;       // Afficher le logo
  includeBarcode?: boolean;  // Code-barres sur le recu
  paperSize?: string;        // Format papier (thermal_80mm, thermal_58mm)
  headerLines?: string;      // Lignes d'en-tete personnalisees
  footerLines?: string;      // Lignes de pied personnalisees
}
```

- Adapter la largeur du PDF selon `paperSize` (58mm vs 80mm)
- Utiliser `receiptFooter` / `footerLines` pour le pied de page au lieu du texte en dur
- Utiliser `headerLines` pour l'en-tete personnalise si fourni
- Conditionner l'affichage du logo selon `printLogo`
- Conditionner le code-barres selon `includeBarcode`
- Gerer l'ouverture du PDF : si `autoprint=true`, ouvrir + `print()` ; si `false`, ouvrir seulement (apercu)

### 3. Fichier : `src/utils/receiptPrinter.ts`

Meme adaptation que `salesTicketPrinter.ts` pour le `printReceipt` utilise par `POSInterface.tsx` (mode non separe).

### 4. Fichier : `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx`

- Importer et utiliser `useSalesSettings` pour lire les parametres d'impression
- Passer les `PrintOptions` a `printSalesTicket`
- Conditionner `window.open` + `print()` vs `window.open` seul selon `autoprint`

### 5. Fichier : `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx`

- Importer et utiliser `useSalesSettings`
- Passer les `PrintOptions` a `printCashReceipt`
- Meme logique d'apercu/impression directe

### 6. Fichier : `src/components/dashboard/modules/sales/POSInterface.tsx`

- Importer et utiliser `useSalesSettings`
- Passer les `PrintOptions` a `printReceipt`
- Meme logique d'apercu/impression directe

### 7. Fichier : `src/components/dashboard/modules/sales/SalesConfiguration.tsx`

- Renommer le libelle du switch `autoprint` en : **"Impression directe (sans apercu)"**
- Ajouter une description : "Desactive : le recu s'ouvre en apercu. Active : le recu est envoye directement a l'imprimante."

### 8. Fichier : `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx`

- Importer et utiliser `useSalesSettings`
- Appliquer la meme logique d'apercu/impression directe

## Resume du comportement

```text
Utilisateur configure "Impression directe" = OFF (apercu)
  -> Apres validation d'une vente/encaissement :
     -> PDF genere et ouvert dans un nouvel onglet
     -> L'utilisateur peut consulter puis imprimer manuellement

Utilisateur configure "Impression directe" = ON (sans apercu)
  -> Apres validation d'une vente/encaissement :
     -> PDF genere, ouvert et window.print() appele automatiquement
```

