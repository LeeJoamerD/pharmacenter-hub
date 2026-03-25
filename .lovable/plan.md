

# Ajout du switch "Quantité selon les Seuils" dans OrderForm et EditOrderTab

## Résumé
Ajouter un switch dans le bloc "Ajouter des Produits" des deux composants. Par défaut actif (comportement actuel). Quand désactivé, la logique de quantité change selon la source du produit.

## Logique du switch

| Source | Switch ON (défaut) | Switch OFF |
|--------|-------------------|------------|
| Recherche produit | `max(1, seuilMax - stockActuel)` | `1` |
| Demandes clients | `max(1, seuilMax - stockActuel)` | `1` |
| Depuis Session (par session/période) | `max(1, seuilMax - stockActuel)` | `quantite_suggeree` (quantité vendue agrégée) |
| Ruptures / Critiques / Faibles | `max(1, seuilMax - stockActuel)` | `max(1, seuilMax - stockActuel)` (inchangé) |

## Modifications techniques

### 1. OrderForm.tsx
- Ajouter état : `const [useThresholdQuantity, setUseThresholdQuantity] = useState(true);`
- Importer `Switch` depuis `@/components/ui/switch`
- Dans le bloc "Ajouter des Produits" (après le titre, avant les badges), ajouter le switch avec label "Quantité selon les Seuils"
- **`addOrderLine`** (recherche) : si `!useThresholdQuantity`, quantité = `1` au lieu du calcul par seuil
- **`addProductsFromSuggestions`** : si `!useThresholdQuantity`, appliquer la logique par source :
  - `source === 'demande'` → quantité = `1`
  - `source === 'session'` → quantité = `suggestion.quantite_suggeree` (la quantité vendue)
  - `source === 'rupture' | 'critique' | 'faible'` → garder calcul par seuil
- **`handleImportFromSale`** : pas de changement (le switch est vérifié dans `addProductsFromSuggestions`)

### 2. EditOrderTab.tsx
- Mêmes modifications : état `useThresholdQuantity`, import `Switch`, UI du switch
- **`addOrderLine`** : si `!useThresholdQuantity`, `quantite_commandee = 1`
- **`addProductsFromSuggestions`** : même logique par source que OrderForm

### 3. UI du switch (identique dans les 2 composants)
Placé dans le `CardHeader` du bloc "Ajouter des Produits", sur la ligne des boutons/badges :

```text
┌─────────────────────────────────────────────────────┐
│ Ajouter des Produits                                │
│ [🔘 Quantité selon les Seuils] Demandes(3) ...     │
└─────────────────────────────────────────────────────┘
```

Un `div` flex avec le `Switch` et un `Label` "Quantité selon les Seuils", placé avant les badges existants.

## Fichiers modifiés
- `src/components/dashboard/modules/stock/OrderForm.tsx`
- `src/components/dashboard/modules/stock/EditOrderTab.tsx`

