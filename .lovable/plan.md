
# Plan de correction - Ajouter les Options d'affichage pour l'onglet Lots

## Problème identifié

Les checkboxes "Options d'affichage" (DCI, numéro de lot, date d'expiration) sont bien présentes dans l'onglet **Produits** (lignes 190-226), mais elles n'ont pas été ajoutées dans l'onglet **Lots**.

## Structure actuelle de la section "Configuration Lots"

| Ligne | Élément |
|-------|---------|
| 389-404 | Taille d'étiquette |
| 406-416 | Quantité par lot |
| 418-422 | Info (texte explicatif) |
| 424-438 | Bouton "Imprimer étiquettes lots" |

**Manquant** : Les options d'affichage entre "Quantité par lot" et "Info"

---

## Modification à effectuer

**Fichier** : `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

**Action** : Insérer les 3 checkboxes après la section "Quantité par lot" (ligne 416) et avant l'info (ligne 418)

```tsx
{/* Options d'affichage - À AJOUTER */}
<div className="space-y-3">
  <label className="text-sm font-medium">Options d'affichage</label>
  
  <div className="flex items-center space-x-2">
    <Checkbox
      id="lotIncludeDci"
      checked={lotsConfig.includeDci}
      onCheckedChange={(v) => handleLotConfigChange('includeDci', !!v)}
    />
    <label htmlFor="lotIncludeDci" className="text-sm cursor-pointer">
      Inclure le DCI
    </label>
  </div>

  <div className="flex items-center space-x-2">
    <Checkbox
      id="lotIncludeLot"
      checked={lotsConfig.includeLot}
      onCheckedChange={(v) => handleLotConfigChange('includeLot', !!v)}
    />
    <label htmlFor="lotIncludeLot" className="text-sm cursor-pointer">
      Inclure le numéro de lot
    </label>
  </div>

  <div className="flex items-center space-x-2">
    <Checkbox
      id="lotIncludeExpiry"
      checked={lotsConfig.includeExpiry}
      onCheckedChange={(v) => handleLotConfigChange('includeExpiry', !!v)}
    />
    <label htmlFor="lotIncludeExpiry" className="text-sm cursor-pointer">
      Inclure la date d'expiration
    </label>
  </div>
</div>
```

---

## Résultat attendu

Après cette modification, l'onglet **Lots** affichera les mêmes options d'affichage que l'onglet **Produits** :
- ☑ Inclure le DCI
- ☑ Inclure le numéro de lot
- ☑ Inclure la date d'expiration

Ces options contrôleront ce qui apparaît sur les étiquettes de lots lors de l'impression.
