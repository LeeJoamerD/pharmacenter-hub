

## Probleme identifie

`InvoicePDFService.generateInvoicePDF()` genere un fichier **HTML** (ligne 49: `type: 'text/html'`, ligne 52: `.html`), pas un vrai PDF. C'est utilise par les trois onglets (Clients, Assureurs, Fournisseurs) via `handleDownloadInvoice`.

## Plan

### 1. Ajouter une methode `generateRealPDF` dans `InvoicePDFService.ts`

Creer une nouvelle methode statique qui utilise **jsPDF + jspdf-autotable** (deja installes) pour generer un vrai fichier PDF :

- En-tete avec infos societe (depuis `regionalParams`)
- Badge type (Client/Assureur/Fournisseur)
- Infos destinataire
- Tableau des lignes de facture avec colonnes : Designation, Quantite, PU, Remise, TVA, Total
- Totaux (HT, TVA, centime additionnel si applicable, TTC)
- Infos beneficiaire si assureur
- Mentions legales
- Normalisation des espaces insecables (U+202F, U+00A0) pour les montants

Le fichier sera nomme `facture-{numero}-{date}.pdf`.

### 2. Modifier `handleDownloadInvoice` dans `InvoiceManager.tsx`

Remplacer l'appel a `generateInvoicePDF` par la nouvelle methode qui produit un vrai PDF. Les trois onglets (Clients, Assureurs, Fournisseurs) utilisent deja le meme handler, donc une seule modification suffit.

### 3. Mettre a jour `handleExportPDF` dans `InvoiceDetailDialog.tsx`

Meme modification pour le bouton "Exporter PDF" du dialogue de detail, pour coherence.

### 4. Mettre a jour `handleDownloadCreditNote` dans `InvoiceManager.tsx`

Appliquer le meme traitement PDF aux avoirs.

### Fichiers a modifier
- `src/services/InvoicePDFService.ts` -- Ajouter methode PDF reelle avec jsPDF
- `src/components/dashboard/modules/accounting/InvoiceManager.tsx` -- Utiliser la nouvelle methode
- `src/components/accounting/InvoiceDetailDialog.tsx` -- Utiliser la nouvelle methode

