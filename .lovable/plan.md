

# Corrections du modal de details et du PDF de facture

## Problemes identifies

### 1. Pas de nom client/assureur affiche
La vue SQL `v_factures_avec_details` ne contient pas `assureur_id` ni le nom de l'assureur. Elle fait un JOIN uniquement sur `clients` et `fournisseurs`. Quand une facture assureur est creee (avec `assureur_id` mais sans `client_id`), le champ `client_nom` est `NULL` car il n'y a pas de client associe.

**Solution** : Modifier la vue SQL pour inclure `assureur_id` et `libelle_assureur` via un LEFT JOIN sur la table `assureurs`.

### 2. L'en-tete affiche "PharmaSoft" au lieu du client/assureur facture
Dans `InvoicePDFService.ts`, l'en-tete du PDF utilise `companyInfo.nom` (="PharmaSoft") comme titre principal. C'est correct pour l'emetteur, mais la section "Facture a" affiche `N/A` car `clientName` est null pour les factures assureur.

**Solution** : 
- Ajouter `assureur_nom` dans l'interface `Invoice` et le propager dans `InvoiceDetailDialog.tsx` et `InvoicePDFService.ts`.
- Quand `assureur_id` est present, afficher le nom de l'assureur dans "Facture a" au lieu du client.
- Ajouter les details du beneficiaire (depuis `details_vente_bon`) dans le PDF et le modal.

### 3. Formatage des montants incorrect (decimales pour FCFA)
Les montants dans `InvoiceDetailDialog.tsx` utilisent `.toFixed(2)` en dur au lieu du hook `useCurrencyFormatting`. De meme, `InvoicePDFService.ts` utilise `.toFixed(2)` sans verifier si la devise est sans decimales (XAF/FCFA).

**Solution** :
- Dans `InvoiceDetailDialog.tsx` : remplacer tous les `.toFixed(2) FCFA` par le hook `useCurrencyFormatting.formatAmount()`.
- Dans `InvoicePDFService.ts` : modifier `formatAmount` pour ne pas afficher de decimales quand la devise est XAF/FCFA (utiliser la liste `noDecimalCurrencies` de `DEFAULT_SETTINGS`).

## Modifications detaillees

### Migration SQL : Mettre a jour la vue `v_factures_avec_details`

Ajouter un LEFT JOIN sur `assureurs` et inclure les colonnes :
- `f.assureur_id`
- `a.libelle_assureur AS assureur_nom`
- `a.adresse AS assureur_adresse`
- `a.telephone_appel AS assureur_telephone`
- `a.email AS assureur_email`

Modifier aussi le champ `client_fournisseur` pour inclure l'assureur :
```sql
COALESCE(c.nom_complet, a.libelle_assureur, fou.nom) AS client_fournisseur
```

### Fichier : `src/hooks/useInvoiceManager.ts`

- Ajouter les champs `assureur_nom`, `assureur_telephone`, `assureur_email`, `assureur_adresse` a l'interface `Invoice`.

### Fichier : `src/components/accounting/InvoiceDetailDialog.tsx`

1. Importer `useCurrencyFormatting` et utiliser `formatAmount` pour tous les montants.
2. Detecter les factures assureur (`invoice.assureur_id` present) et afficher :
   - Badge "Assureur" au lieu de "Client"
   - Titre "Informations Assureur" avec le nom, telephone, email, adresse de l'assureur
3. Remplacer les 8 occurrences de `.toFixed(2) FCFA` par `formatAmount(montant)`.
4. Charger et afficher les details du beneficiaire depuis `details_vente_bon` quand c'est une facture assureur.

### Fichier : `src/services/InvoicePDFService.ts`

1. Modifier la logique pour detecter les factures assureur et afficher le nom de l'assureur dans "Facture a".
2. Modifier `formatAmount` pour respecter les devises sans decimales (XAF, XOF, FCFA) en utilisant la config `DEFAULT_SETTINGS.currency.noDecimalCurrencies`.
3. Afficher le badge "Assureur" au lieu de "Client" dans le PDF.
4. Ajouter une section beneficiaire dans le PDF si les details sont disponibles.

## Resume des fichiers modifies

| Fichier | Modifications |
|---------|-------------|
| Migration SQL | Vue `v_factures_avec_details` avec JOIN assureurs |
| `useInvoiceManager.ts` | Interface Invoice etendue avec champs assureur |
| `InvoiceDetailDialog.tsx` | Formatage via `useCurrencyFormatting`, affichage assureur, details beneficiaire |
| `InvoicePDFService.ts` | Formatage sans decimales pour FCFA, affichage assureur, section beneficiaire |

## Resultat attendu

- Le modal affiche "Informations Assureur" avec le nom de l'assureur pour les factures assureur
- Le PDF affiche le nom de l'assureur dans "Facture a" avec le badge "Assureur"
- Tous les montants sont formates sans decimales pour le FCFA (ex: "1 134 FCFA" au lieu de "1134.00 FCFA")
- Les separateurs de milliers sont appliques correctement
- Les details du beneficiaire sont affiches dans le modal et le PDF

