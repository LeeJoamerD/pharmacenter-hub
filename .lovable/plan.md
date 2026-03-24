

# Ajout colonne "Prix Vente" et suppression devise dans le PDF Inventaire Réception

## Modifications dans `ReceptionHistory.tsx`

### 1. PDF (fonction `handlePrintReceptionInventory`, lignes 174-199)
- Ajouter "Prix Vente" comme 8ème colonne dans le header du tableau après "Prix d'achat"
- Dans `tableData`, retirer "FCFA" des montants prix_achat et ajouter prix_vente_ttc (sans devise)
- Format : `Number(lot.prix_achat_unitaire).toLocaleString('fr-FR').replace(/[\u202F\u00A0]/g, ' ')` (sans "FCFA")
- Même format pour `lot.prix_vente_ttc`

### 2. Modal détails (tableau HTML, lignes 650-684)
- Ajouter `<TableHead>Prix de vente</TableHead>` après "Prix d'achat"
- Ajouter `<TableCell>` affichant `lot.prix_vente_ttc` sans devise
- Retirer "FCFA" de l'affichage du prix d'achat existant (ligne 679)

### Fichier modifié
- `src/components/dashboard/modules/stock/ReceptionHistory.tsx`

