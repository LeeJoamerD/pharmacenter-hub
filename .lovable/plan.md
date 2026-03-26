

# Correction des colonnes Quantité dans le PDF "Inventaire Réception"

## Diagnostic

Dans `ReceptionHistory.tsx` lignes 177-185, le mapping des données est incorrect :

```javascript
// Ligne 180: Qté Initiale → lot.quantite_initiale (= quantité reçue du lot !)
// Ligne 181: Qté Reçue   → lot.quantite_initiale (identique !)
// Ligne 182: Qté Totale  → lot.quantite_restante (= stock restant actuel, pas la somme)
```

Les 3 colonnes utilisent les mauvais champs, d'où les valeurs identiques.

## Données disponibles dans la table `lots`
- `quantite_initiale` = quantité entrée dans le lot lors de la réception (= quantité reçue)
- `quantite_restante` = stock restant actuel dans ce lot

## Solution

### Étape 1 — Récupérer le stock "avant réception" par produit
Après le fetch des lots de cette réception, faire un second fetch groupé : pour chaque `produit_id` présent dans la réception, récupérer la somme de `quantite_initiale` de tous les **autres** lots (ceux dont `reception_id != reception.id`). Cela donne le stock provenant d'autres sources = stock avant cette réception.

Query Supabase : fetch tous les lots des mêmes produits, puis en JS calculer la somme par produit en excluant ceux de cette réception.

### Étape 2 — Corriger le mapping du tableau PDF
```
Qté Initiale = stockAvantParProduit[lot.produit_id] || 0
Qté Reçue    = lot.quantite_initiale
Qté Totale   = Qté Initiale + Qté Reçue
```

### Étape 3 — Corriger le total articles en bas de page
Ligne 211 : remplacer la somme de `quantite_initiale` par la somme des `Qté Reçue` (= `quantite_initiale` des lots de cette réception, ce qui est déjà correct mais la sémantique sera clarifiée).

### Fichier modifié
- `src/components/dashboard/modules/stock/ReceptionHistory.tsx` (fonction `handlePrintReceptionInventory`, lignes 132-240)

