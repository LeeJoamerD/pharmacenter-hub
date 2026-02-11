
# Afficher et modifier "quantite_unites_details_source" dans le formulaire de modification

## Contexte

Le formulaire "Modifier le produit" dans `ProductCatalogNew.tsx` charge deja les champs `niveau_detail` et `quantite_unites_details_source` dans les donnees du formulaire (via `reset(productWithoutStock)` ligne 351), mais aucun champ visuel ne permet de les voir ni de les modifier.

## Correction

### Fichier : `src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx`

Ajouter un bloc conditionnel dans le formulaire de modification, visible uniquement quand le produit est un detail (niveau 2 ou 3). Ce bloc sera insere apres la section des seuils de stock (apres la ligne 1188, dans la colonne gauche du formulaire).

**Contenu du bloc :**
- Affichage en lecture seule du **niveau de detail** (badge visuel : "Niveau 2" ou "Niveau 3")
- Champ editable **"Quantite unites par source"** (`quantite_unites_details_source`) de type number, minimum 1
- Le bloc ne s'affiche que si `editingProduct?.niveau_detail` est 2 ou 3
- Le champ est enregistre via `register("quantite_unites_details_source")` de react-hook-form, donc il sera automatiquement inclus dans les donnees soumises au `onSubmit`

**Condition d'affichage :**
```text
Si editingProduct ET editingProduct.niveau_detail >= 2 :
  Afficher le bloc avec :
  - Badge "Produit detail - Niveau {niveau_detail}"
  - Input "Quantite unites par source" (number, min=1)
```

Aucun autre fichier n'est modifie. Le `onSubmit` transmet deja toutes les donnees du formulaire au `updateMutation`, donc `quantite_unites_details_source` sera sauvegarde automatiquement.

| Fichier | Modification |
|---------|-------------|
| `ProductCatalogNew.tsx` | Ajouter un bloc conditionnel apres ligne 1188 pour afficher/modifier `quantite_unites_details_source` quand `niveau_detail >= 2` |
