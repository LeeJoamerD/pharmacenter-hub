

# Plan : Rendre la section Impressions 100% opérationnelle

## Analyse de l'existant

### Ce qui fonctionne
- Sauvegarde/chargement des paramètres dans `parametres_systeme` (catégorie `print`)
- Gestion CRUD des imprimantes dans `print_printers`
- Test d'impression (page test avec paramètres appliqués)
- Paramètres de rapports de caisse (`reportPrintService.ts`) utilisent partiellement `printSettings`

### Ce qui ne fonctionne PAS

| Problème | Détail |
|---|---|
| **Sélecteurs d'imprimantes vides** | Le dropdown "Imprimante par défaut" filtre `type === 'standard'` uniquement, le dropdown "Imprimante de reçus" filtre `type === 'receipt' || 'thermal'`. Si aucune imprimante de ce type n'existe, le dropdown est vide. Il faut montrer TOUTES les imprimantes dans les deux sélecteurs. |
| **En-tête/pied de page reçus non appliqués** | `receiptSettings.headerLines` et `footerLines` sont configurés mais jamais transmis aux générateurs de tickets (`receiptPrinter.ts`, `salesTicketPrinter.ts`). Les tickets utilisent `pharmacyInfo` hardcodé. |
| **Largeur papier reçu non appliquée** | `receiptSettings.receiptWidth` (58/80/110mm) est ignoré. Le `paperSize` vient de `useSalesSettings.printing.paperSize`. |
| **Logo/Adresse sur reçu non appliqués** | `receiptSettings.showLogo`, `showAddress` ne sont pas transmis aux générateurs. |
| **Tiroir-caisse non connecté** | `autoOpenCashDrawer` est configuré mais jamais lu lors de l'encaissement. |
| **Paramètres d'impression généraux non propagés** | `printSettings` (en-tête, pied de page, filigrane, police) ne sont appliqués que dans `reportPrintService.ts`, pas dans les autres impressions (stocks, etc.). |

## Corrections prévues

### 1. Sélecteurs d'imprimantes — Montrer toutes les imprimantes

**Fichier** : `src/components/dashboard/modules/parametres/PrintSettings.tsx`

Retirer les filtres `.filter(p => p.type === 'standard')` et `.filter(p => p.type === 'receipt' || p.type === 'thermal')`. Montrer toutes les imprimantes dans les deux sélecteurs, avec le type affiché entre parenthèses pour différencier.

### 2. Connecter les paramètres de reçus aux générateurs de tickets

**Fichiers** : `src/utils/printOptions.ts`, `src/utils/receiptPrinter.ts`, `src/utils/salesTicketPrinter.ts`

Étendre l'interface `PrintOptions` avec les champs reçus :
```ts
receiptHeaderLines?: string;
receiptFooterLines?: string;
showAddress?: boolean;
showLogo?: boolean;  // déjà printLogo
receiptWidth?: number;
```

Modifier `printReceipt()`, `printSalesTicket()`, `printCashReceipt()` pour :
- Utiliser `options.receiptHeaderLines` au lieu du pharmacyInfo hardcodé pour l'en-tête
- Utiliser `options.receiptFooterLines` au lieu du footer hardcodé
- Respecter `options.receiptWidth` pour la largeur du papier (priorité sur `paperSize`)
- Respecter `options.showAddress` pour afficher/masquer l'adresse

### 3. Propager les paramètres d'impression depuis les interfaces POS

**Fichiers** : `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx`, `CashRegisterInterface.tsx`, `POSInterface.tsx`, `RecentTransactions.tsx`, `TransactionDetailsModal.tsx`

Ces fichiers construisent déjà un objet `printOptions` depuis `salesSettings.printing`. Ajouter `usePrintSettings()` et fusionner les `receiptSettings` dans les `printOptions` transmis aux générateurs :
```ts
const { receiptSettings } = usePrintSettings();
const printOptions = {
  ...salesSettings.printing,
  receiptHeaderLines: receiptSettings.headerLines,
  receiptFooterLines: receiptSettings.footerLines,
  showAddress: receiptSettings.showAddress,
  receiptWidth: receiptSettings.receiptWidth,
};
```

### 4. Connecter le tiroir-caisse

**Fichier** : `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx`

Après un encaissement réussi, si `receiptSettings.autoOpenCashDrawer` est activé, émettre la commande d'ouverture (log console + éventuel appel futur à une API imprimante réseau). Étant donné que l'ouverture physique d'un tiroir-caisse nécessite un driver natif, on ajoutera un indicateur visuel (toast) confirmant que la commande a été envoyée.

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/dashboard/modules/parametres/PrintSettings.tsx` | Retirer filtres type dans les sélecteurs |
| `src/utils/printOptions.ts` | Étendre `PrintOptions` avec champs reçus |
| `src/utils/receiptPrinter.ts` | Utiliser headerLines/footerLines/showAddress des options |
| `src/utils/salesTicketPrinter.ts` | Idem pour les deux fonctions (printSalesTicket, printCashReceipt) |
| `src/components/dashboard/modules/sales/pos/SalesOnlyInterface.tsx` | Fusionner receiptSettings dans printOptions |
| `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx` | Fusionner receiptSettings + tiroir-caisse |
| `src/components/dashboard/modules/sales/POSInterface.tsx` | Fusionner receiptSettings dans printOptions |
| `src/components/dashboard/modules/sales/widgets/RecentTransactions.tsx` | Fusionner receiptSettings |
| `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx` | Fusionner receiptSettings |

