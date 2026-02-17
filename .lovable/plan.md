

# Correction : Impression directe sans apercu dans le POS

## Probleme

La fonction `openPdfWithOptions` dans `src/utils/printOptions.ts` ouvre **toujours** un nouvel onglet avec `window.open(pdfUrl, '_blank')`, ce qui affiche le PDF a l'ecran. Quand `autoprint=true`, elle declenche aussi `print()`, mais l'onglet d'apercu reste visible. Le comportement attendu : quand `autoprint=true`, **aucun onglet d'apercu** ne doit s'ouvrir.

## Solution

### Fichier unique : `src/utils/printOptions.ts`

Modifier `openPdfWithOptions` pour utiliser un **iframe cache** quand `autoprint=true` :

1. Si `autoprint=true` : creer un `<iframe>` invisible (hors ecran), y charger le PDF, declencher `print()` automatiquement, puis supprimer l'iframe apres impression
2. Si `autoprint=false` : comportement actuel inchange (ouvrir dans un nouvel onglet pour apercu)

```text
autoprint = true ?
  -> Creer iframe cache
  -> Charger le PDF dedans
  -> iframe.onload -> iframe.contentWindow.print()
  -> Apres impression -> supprimer l'iframe
  -> Aucun onglet visible

autoprint = false ?
  -> window.open (comportement actuel)
  -> Apercu dans un nouvel onglet
```

Cette correction est centralisee : tous les appels a `openPdfWithOptions` dans les 5 fichiers (POSInterface, SalesOnlyInterface, CashRegisterInterface, TransactionDetailsModal, RecentTransactions) beneficieront automatiquement du fix sans aucune modification.

