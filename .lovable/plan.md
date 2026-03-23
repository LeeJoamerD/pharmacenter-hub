

# Améliorations du document "Inventaire Réception" (impression PDF)

## Fichier modifié
`src/components/dashboard/modules/stock/ReceptionHistory.tsx` — fonction `handlePrintReceptionInventory` (lignes 132-218)

## Corrections

### 1. Afficher les montants financiers en bas à droite
Après le tableau, ajouter un bloc récapitulatif aligné à droite avec :
- Sous-total HT (`reception.montant_ht`)
- TVA (`reception.montant_tva`)
- Centime Additionnel (`reception.montant_centime_additionnel`)
- ASDI (`reception.montant_asdi`)
- **Total TTC** (`reception.montant_ttc`) en gras

Ces champs sont déjà présents dans l'objet `reception` (fetchés via `SELECT *`).

### 2. Afficher le total des articles en bas à gauche
Sous la ligne existante "Total: X produit(s)", ajouter :
```
Total articles: {somme des quantite_initiale de tous les lots}
```

### 3. Corriger le séparateur "/" dans les montants
Ajouter la fonction `normalizePdfSpaces` (comme dans `reportPrintService.ts`) pour remplacer les espaces Unicode `\u202F` et `\u00A0` par des espaces standard avant passage à jsPDF.

### 4. Afficher le numéro de facture (Bon de livraison) dans l'entête
La ligne `reference_facture` existe déjà conditionnellement (ligne 168-170), mais elle affiche "Référence". Renommer en "N° Facture / BL" et s'assurer qu'elle s'affiche systématiquement dans l'en-tête du document.

## Détail technique

```text
┌──────────────────────────────────────┐
│   INVENTAIRE RÉCEPTION               │
│ Réception: REC-XXX    Date: dd/mm/yy │
│ Fournisseur: XXX   N° Facture/BL: XX │
├──────────────────────────────────────┤
│  [TABLEAU DES LOTS]                  │
├──────────────────────────────────────┤
│ Total: 12 produit(s)    Sous-total HT│
│ Total articles: 156        TVA       │
│                     Centime Add.     │
│                            ASDI      │
│ Imprimé le...       TOTAL TTC: XXXXX │
└──────────────────────────────────────┘
```

Tous les montants formatés avec `normalizePdfSpaces(Number(x).toLocaleString('fr-FR'))` + ` FCFA`.

