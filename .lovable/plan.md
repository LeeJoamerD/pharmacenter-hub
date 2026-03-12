

# Plan: Restructurer les rapports de session de caisse (impression/PDF)

## Corrections de build (prerequis)

Remplacer toutes les references `process.env.NODE_ENV` par `import.meta.env.MODE` et `NodeJS.Timeout` par `ReturnType<typeof setTimeout>` dans les fichiers concernes (6 fichiers).

## Modifications principales

### 1. `reportPrintService.ts` — Separer rapport principal et detail mouvements

**HTML (`generateReportHTML` / `printCashReport`)** :
- Creer deux fonctions : `generateSummaryHTML` (resume financier seul) et `generateMovementsHTML` (detail des mouvements)
- `printCashReport` prend un nouveau parametre optionnel `includeMovements: boolean`
- Quand `includeMovements = false` (defaut) : uniquement le resume financier (bloc rouge de l'image)
- Quand `includeMovements = true` : resume + mouvements sur pages separees

**PDF (`exportToPDF`)** :
- Meme logique : parametre `includeMovements`
- Sans mouvements : PDF d'une page avec le resume financier
- Avec mouvements : les mouvements commencent sur une nouvelle page (`doc.addPage()`)

**En-tete** : Remplacer `'Pharmacie'` par `pharmacy?.nom_pharmacie || pharmacy?.nom_entreprise || 'Pharmacie'` (deja en place dans le HTML, verifier le PDF).

**Pied de page** : Ajouter sur chaque page, en bas a droite, en 7pt gris : `"PharmaSoft - Systeme de Gestion Pharmaceutique"`. Ceci dans le HTML (`position: fixed; bottom`) et le PDF (boucle sur les pages).

### 2. `CashReport.tsx` — Ajouter des boutons distincts

Remplacer les deux boutons actuels par 4 boutons :
- **Imprimer Rapport** : imprime le resume financier seul (HTML)
- **Exporter Rapport** : PDF du resume financier seul
- **Imprimer Mouvements** : imprime resume + detail mouvements (HTML)
- **Exporter Complet** : PDF resume + mouvements

Pour garder l'interface propre, utiliser un bouton principal "Imprimer" et un dropdown/menu pour les options supplementaires (Rapport seul / Rapport + Mouvements, en HTML ou PDF).

### 3. Structure des boutons (proposition)

```text
[Imprimer ▼]  [Exporter PDF ▼]
  ├ Rapport seul        ├ Rapport seul
  └ Rapport + Mouvements └ Rapport + Mouvements
```

Utiliser `DropdownMenu` de Radix UI deja installe.

## Fichiers modifies
1. `src/services/reportPrintService.ts` — refactor HTML/PDF, footer, en-tete
2. `src/components/dashboard/modules/sales/cash/CashReport.tsx` — boutons dropdown
3. `src/components/RegistrationFlowValidator.tsx` — fix `process.env` → `import.meta.env`
4. `src/components/TestingIndicator.tsx` — fix `process.env` → `import.meta.env`
5. `src/components/dashboard/modules/sales/pos/ClientSearchField.tsx` — fix `NodeJS.Timeout`
6. `src/components/dashboard/modules/stock/BarcodeScanner.tsx` — fix `NodeJS.Timeout`
7. `src/components/security/SecurityMonitoring.tsx` — fix `NodeJS.Timeout`
8. `src/hooks/useCashExpenseSearch.ts` — fix `NodeJS.Timeout`
9. `src/hooks/useCashSessionSearch.ts` — fix `NodeJS.Timeout`
10. `src/utils/performanceMonitoring.ts` — fix `NodeJS.Timeout`

