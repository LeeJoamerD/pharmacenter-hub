

# Correction : Intégrer les calculs assurance/remise dans ProformaInterface

## Problème
Le composant `ProformaInterface.tsx` calcule manuellement `totalHT`, `totalTVA`, `totalTTC` sans utiliser le hook `usePOSCalculations`. Résultat : quand un client assuré est sélectionné, les taux de couverture (part assurance / part client), le ticket modérateur et la remise automatique ne sont pas affichés ni calculés.

## Solution
Remplacer les calculs manuels par `usePOSCalculations(cart, customer)` — exactement comme dans `SalesOnlyInterface.tsx` — et afficher les lignes de détail conditionnelles (couverture assurance, ticket modérateur, remise) dans le bloc des totaux.

## Modifications dans `ProformaInterface.tsx`

1. **Importer `usePOSCalculations`** et `ShieldCheck` (icône lucide)

2. **Remplacer les calculs manuels** (lignes 80-82) par :
   ```ts
   const calculations = usePOSCalculations(cart, customer);
   ```

3. **Mettre à jour le bloc totaux** (lignes 267-282) pour afficher :
   - Total HT → `calculations.totalHT`
   - TVA → `calculations.montantTVA`
   - Sous-total TTC → `calculations.sousTotalTTC`
   - Couverture assurance (si assuré) → taux + `partAssurance` / `partClient`
   - Ticket modérateur (si applicable) → `montantTicketModerateur`
   - Remise automatique (si applicable) → `montantRemise`
   - **Total à payer** → `calculations.totalAPayer`

4. **Mettre à jour `handleCreateProforma`** pour utiliser les valeurs de `calculations` dans les données PDF et dans l'appel `createProforma` (montant_net = totalAPayer, remise_globale = montantRemise + montantTicketModerateur)

5. **Mettre à jour les données PDF** pour inclure les infos assurance dans les totaux affichés

