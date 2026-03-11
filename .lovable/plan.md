

# Plan: En-tête et pied de page dynamiques sur tous les tickets/reçus

## Problème

L'en-tête affiche des données codées en dur ("PharmaSoft SARL", "Abidjan, Cocody Riviera", "+225 0123456789") issues des valeurs par défaut de `receiptSettings.headerLines`, au lieu des vraies informations du tenant. Le pied de page affiche "À bientôt chez PharmaSoft" au lieu d'un message pertinent. Les paramètres `headerEnabled`/`footerEnabled` de Paramètres/Impressions ne sont pas pris en compte dans les tickets.

## Structure cible

**En-tête (après le bandeau titre) :**
```text
PharmaSoft - Système de Gestion Pharmaceutique    ← codé en dur, petite taille (6pt)
DJL - Computer Sciences                           ← pharmacyInfo.name (10pt bold)
[adresse réelle du tenant]                         ← pharmacyInfo.adresse (7pt)
Tél: [téléphone réel du tenant]                    ← pharmacyInfo.telephone (7pt)
[texte en-tête configuré]                          ← seulement si headerEnabled=true (7pt)
```

**Pied de page :**
```text
Merci de votre visite !                            ← codé en dur (6pt)
A bientôt, prompte guérison                       ← par défaut, OU texte configuré si footerEnabled=true (6pt)
```

## Modifications

### 1. `src/utils/printOptions.ts` — Ajouter champs à `PrintOptions`

Ajouter 4 nouveaux champs optionnels :
- `printHeaderEnabled?: boolean`
- `printHeaderText?: string`
- `printFooterEnabled?: boolean`
- `printFooterText?: string`

### 2. `src/utils/salesTicketPrinter.ts` — Modifier `printSalesTicket` et `printCashReceipt`

Pour les deux fonctions, remplacer la logique d'en-tête (lignes ~136-170 et ~368-402) :

- **Supprimer** la branche `if (options?.receiptHeaderLines)` qui remplace tout l'en-tête
- **Toujours** afficher dans cet ordre :
  1. "PharmaSoft - Système de Gestion Pharmaceutique" (fontSize 6, normal)
  2. `pharmacyInfo.name` (fontSize 10, bold)
  3. `pharmacyInfo.adresse` si présente (fontSize 7)
  4. `pharmacyInfo.telephone` si présent (fontSize 7)
  5. Si `options.printHeaderEnabled` → afficher `options.printHeaderText` (fontSize 7)

Pour les deux fonctions, remplacer la logique de pied de page (lignes ~328-337 et ~501-510) :

- **Toujours** afficher "Merci de votre visite !" (avec espace avant !)
- Ligne 2 : si `options.printFooterEnabled` → `options.printFooterText`, sinon "A bientôt, prompte guérison"

### 3. `src/utils/receiptPrinter.ts` — Modifier `printReceipt` (mode non séparé)

Même logique que ci-dessus pour l'en-tête (lignes ~67-103) et le pied de page (lignes ~232-242).

### 4. `src/utils/advancedReceiptPrinter.ts` — Modifier `printAdvancedReceipt`

Même logique pour l'en-tête (lignes ~73-89) et le pied de page (ligne 251). La fonction ne reçoit pas encore `PrintOptions`, il faudra ajouter un paramètre optionnel ou adapter la structure existante.

### 5. Tous les appelants (6 fichiers) — Passer les nouveaux champs

Dans chaque fichier qui construit `printOptions`, ajouter :
```typescript
printHeaderEnabled: printSettings.headerEnabled,   // depuis usePrintSettings
printHeaderText: printSettings.headerText,
printFooterEnabled: printSettings.footerEnabled,
printFooterText: printSettings.footerText,
```

Fichiers concernés :
- `POSInterface.tsx`
- `SalesOnlyInterface.tsx`
- `CashRegisterInterface.tsx`
- `TransactionDetailsModal.tsx`
- `RecentTransactions.tsx`
- `CashReport.tsx` (si applicable)

### 6. Valeurs par défaut dans `usePrintSettings.ts`

Corriger `DEFAULT_RECEIPT_SETTINGS.headerLines` et `footerLines` pour ne plus contenir de données factices ("PharmaSoft SARL", "Abidjan"). Ces champs ne seront plus utilisés pour l'en-tête des tickets (la pharmacyInfo du tenant prend le relais), mais resteront pour les paramètres d'impression généraux.

