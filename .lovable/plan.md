

# Onglet "Unites gratuites" - Prix d'achat modifiable avec recalcul automatique

## Mise a jour du plan

Le prix d'achat unitaire sera **affiche dans le tableau** avec une valeur par defaut de **0** (unite gratuite), mais l'utilisateur pourra le modifier. Toute modification declenchera un **recalcul automatique** des prix de vente (HT, TVA, Centime Additionnel, TTC).

## Comportement du tableau

Chaque ligne de produit dans le tableau contiendra :

| Produit | Code CIP | Categorie | Quantite | N Lot | Date Peremption | Prix Achat | HT | TVA | Centime Add. | TTC |
|---------|----------|-----------|----------|-------|-----------------|------------|-----|-----|-------------|-----|
| Doliprane | 340001 | CAT_A | 10 | LOT001 | 2027-01 | **0** (editable) | 0 | 0 | 0 | 0 |

- Le champ **Prix Achat** est un `Input` de type texte, pre-rempli a 0
- Quand l'utilisateur modifie ce champ, les colonnes HT, TVA, Centime Additionnel et TTC se recalculent instantanement via `unifiedPricingService.calculateSalePrice()`
- Le pattern est identique a celui de `LotDetailsDialog.tsx` (`handlePrixAchatChange`) : on parse la valeur, on appelle le service de pricing avec le coefficient et les taux de la categorie du produit, et on met a jour l'etat local

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/dashboard/modules/stock/FreeUnitsTab.tsx` | Creation - Composant complet avec prix d'achat editable et recalcul temps reel |
| `src/components/dashboard/modules/stock/tabs/StockApprovisionnementTab.tsx` | Modification - Ajout de l'onglet entre "Import Excel" et "Historique" |

## Detail technique du composant FreeUnitsTab

### Structure de donnees par ligne

```text
interface FreeUnitLine {
  id: string
  produitId: string
  produitNom: string
  codeCip: string
  categorieTarificationId: string
  quantite: number
  numeroLot: string
  dateExpiration: string
  prixAchat: number          // Defaut 0, modifiable
  prixVenteHT: number        // Calcule automatiquement
  montantTVA: number          // Calcule automatiquement
  montantCentimeAdd: number   // Calcule automatiquement
  prixVenteTTC: number        // Calcule automatiquement
  tauxTVA: number
  tauxCentimeAdd: number
  coefficientPrixVente: number
}
```

### Logique de recalcul

Quand le prix d'achat change sur une ligne :

1. Parser la nouvelle valeur en nombre
2. Recuperer le coefficient et les taux depuis la categorie de tarification du produit (via `usePriceCategories`)
3. Appeler `unifiedPricingService.calculateSalePrice()` avec les parametres d'arrondi du tenant
4. Mettre a jour les champs calcules de la ligne dans le state local
5. Les colonnes HT, TVA, Centime Add. et TTC se mettent a jour instantanement

### Hooks utilises

- `useProducts` : recherche de produits dans le catalogue
- `useReceptions` : lister les receptions et creer la nouvelle
- `usePriceCategories` : coefficients et taux par categorie
- `useStockSettings` : precision d'arrondi
- `useSalesSettings` : methode d'arrondi
- `useCurrencyFormatting` : formatage des montants affiches
- `useAuth` / `useTenant` : contexte utilisateur

### Sauvegarde

Le bouton "Enregistrer" appellera `useReceptions.createReception()` avec pour chaque ligne :
- `prix_achat_reel` = la valeur saisie par l'utilisateur (0 par defaut ou modifiee)
- `prix_vente_ht`, `montant_tva`, `montant_centime_additionnel`, `prix_vente_ttc` = les valeurs calculees
- Les lots crees dans la base auront `prix_vente_suggere = prix_vente_ttc`

Aucune migration SQL requise.

