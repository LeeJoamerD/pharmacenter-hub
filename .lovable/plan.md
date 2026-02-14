
# Impression inventaire des produits recus par reception

## Objectif

Ajouter un bouton "Imprimer inventaire" dans la colonne Actions du tableau de l'historique des receptions (`ReceptionHistory.tsx`). Ce bouton genere un PDF A4 listant tous les lots crees lors de cette reception avec les colonnes demandees.

---

## Modifications

### Fichier : `src/components/dashboard/modules/stock/ReceptionHistory.tsx`

1. **Imports** : Ajouter `jsPDF`, `autoTable`, `Printer` (icone lucide), et `openPdfWithOptions` depuis `printOptions.ts`

2. **Nouvelle fonction `handlePrintReceptionInventory(reception)`** :
   - Recupere les lots de la reception via `supabase.from('lots').select(...)` avec jointure produit (comme `fetchReceptionLots` existant)
   - Genere un PDF A4 avec jsPDF + autoTable contenant :
     - En-tete : titre "Inventaire Reception", numero reception, date, fournisseur
     - Tableau avec colonnes :
       - N deg Lot (`numero_lot`)
       - Produit (`produit.libelle_produit`)
       - Quantite initiale (`quantite_initiale`)
       - Quantite recue (egale a `quantite_initiale` lors de la reception)
       - Quantite totale (`quantite_restante` = stock actuel restant)
       - Date peremption (`date_peremption` formatee)
       - Prix d'achat (`prix_achat_unitaire`)
     - Pied de page : totaux et date d'impression
   - Ouvre le PDF via `openPdfWithOptions`

3. **Nouveau bouton dans la colonne Actions** (a cote du bouton "Voir") :
   - Icone `Printer` avec tooltip "Imprimer inventaire"
   - Au clic : appelle `handlePrintReceptionInventory(reception)`
   - Variante `outline`, taille `sm`

### Traductions (LanguageContext)

Ajouter les cles suivantes en francais et anglais :
- `receptionHistoryPrintInventory` : "Imprimer" / "Print"
- `receptionHistoryInventoryTitle` : "Inventaire Reception" / "Reception Inventory"

---

## Section technique

### Structure du PDF genere

```text
+--------------------------------------------------+
|           INVENTAIRE RECEPTION                     |
|  Reception: REC-XXXX    Date: 14/02/2026          |
|  Fournisseur: Nom du fournisseur                  |
|  Reference: BL-XXXX                               |
+--------------------------------------------------+
| N Lot | Produit | Qte Init | Qte Recue | Qte Tot | Peremption | Prix Achat |
|-------|---------|----------|-----------|---------|------------|------------|
| ...   | ...     | ...      | ...       | ...     | ...        | ...        |
+--------------------------------------------------+
|                      Total: XX produits            |
|              Imprime le 14/02/2026 a 10:30         |
+--------------------------------------------------+
```

### Fichiers modifies

- `src/components/dashboard/modules/stock/ReceptionHistory.tsx` : bouton + fonction d'impression
- `src/contexts/LanguageContext.tsx` : 2 nouvelles cles de traduction (FR + EN)

Aucune migration SQL necessaire.
