

## Plan : Choix entre Ticket de vente et Reçu de caisse dans les modals "Détails de la transaction"

### Constat
Deux modals "Détails de la transaction" ont actuellement un seul bouton **Imprimer** :

1. `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx` (Module Ventes/Historique) — déclenche `printCashReceipt` (reçu d'encaissement uniquement).
2. `src/components/dashboard/modules/sales/encaissements/TransactionDetailsModal.tsx` (ouvert depuis le Rapport de Session de Caisse via `CashReport.tsx`) — bouton **non câblé** (aucun `onClick`).

Côté générateurs, deux fonctions existent déjà dans `src/utils/salesTicketPrinter.ts` :
- `printSalesTicket(...)` → ticket de la vente (au moment de la vente, avec code-barres).
- `printCashReceipt(...)` → reçu de caisse (à l'encaissement).

Le pattern de menu déroulant à reproduire est celui du bouton Imprimer dans `CashReport.tsx` (lignes 163–181) : `DropdownMenu` + `DropdownMenuTrigger` + 2 `DropdownMenuItem`, avec icône `ChevronDown`.

### Modifications proposées

#### 1. `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx`
- Remplacer le bouton `Imprimer` simple par un `DropdownMenu` avec deux items :
  - **Ticket de vente** → appelle `printSalesTicket(...)`
  - **Reçu de caisse** → appelle `printCashReceipt(...)` (logique actuelle conservée).
- Refactoriser `handlePrint` en deux fonctions : `handlePrintSalesTicket()` et `handlePrintCashReceipt()`, qui partagent un helper `buildPrintPayload()` (mêmes données pharmacy/agent/lignes/options déjà collectées). Le mapping `lignes_ventes` reste sur `prix_unitaire_ttc` / `montant_ligne_ttc`.
- Imports à ajouter : `DropdownMenu*` depuis `@/components/ui/dropdown-menu`, `ChevronDown` depuis `lucide-react`, `printSalesTicket` depuis `@/utils/salesTicketPrinter`.

#### 2. `src/components/dashboard/modules/sales/encaissements/TransactionDetailsModal.tsx`
- Câbler le bouton Imprimer (actuellement vide) en le remplaçant par le même `DropdownMenu` (Ticket de vente / Reçu de caisse).
- Ajouter les mêmes hooks que dans le modal Historique pour récupérer les paramètres d'impression : `useGlobalSystemSettings`, `useSalesSettings`, `usePrintSettings`.
- Construire le payload depuis `details: TransactionDetails`. Attention : ici les lignes utilisent `prix_unitaire` et `montant_ligne` (pas `_ttc`), donc le mapping diffère :
  - `prix_unitaire_ttc: l.prix_unitaire`
  - `montant_ligne_ttc: l.montant_ligne`
- Brancher `printSalesTicket` et `printCashReceipt` + `openPdfWithOptions`. Toasts `sonner` pour succès/erreur.
- Ne pas toucher au bouton **Exporter** (hors scope).

#### 3. Aucune modification base de données
Tout est purement frontend, basé sur des fonctions et hooks déjà existants.

### Détails techniques

```text
Structure du DropdownMenu à appliquer aux deux modals (identique à CashReport.tsx) :

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Printer className="h-4 w-4 mr-2" />
      Imprimer
      <ChevronDown className="h-3 w-3 ml-1" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handlePrintSalesTicket}>
      <Receipt className="h-4 w-4 mr-2" />
      Ticket de vente
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handlePrintCashReceipt}>
      <CreditCard className="h-4 w-4 mr-2" />
      Reçu de caisse
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Fichiers concernés
| Fichier | Changement |
|---|---|
| `src/components/dashboard/modules/sales/history/TransactionDetailsModal.tsx` | Remplacer bouton par DropdownMenu, factoriser handlePrint en deux handlers (Ticket vente / Reçu caisse). |
| `src/components/dashboard/modules/sales/encaissements/TransactionDetailsModal.tsx` | Câbler le bouton Imprimer avec le même DropdownMenu et brancher les générateurs PDF avec les hooks de paramètres d'impression. |

### Résultat attendu
- Dans les deux modals "Détails de la transaction", cliquer sur **Imprimer** ouvre un sous-menu identique à celui de `CashReport.tsx`.
- L'utilisateur choisit explicitement **Ticket de vente** (re-génère le ticket initial avec code-barres) ou **Reçu de caisse** (re-génère le reçu d'encaissement).
- Aucune régression sur le contenu actuellement imprimé (le reçu de caisse reste comportement par défaut côté Historique).

