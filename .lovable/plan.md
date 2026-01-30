
# Plan de Correction : Export Excel avec Libellés Complets

## Diagnostic

L'export Excel du catalogue utilise la vue `produits_with_stock` qui ne contient que les **IDs** des références (famille_id, rayon_id, etc.), pas leurs libellés. La colonne DCI fonctionne car elle utilise `dci_noms`, un champ calculé présent dans cette vue.

### Comparaison des Vues

| Champ | `produits_with_stock` | `v_produits_with_famille` |
|-------|----------------------|---------------------------|
| famille_libelle | Non disponible | `libelle_famille` |
| rayon_libelle | Non disponible | `libelle_rayon` |
| forme_libelle | Non disponible | `libelle_forme` |
| classe_therapeutique_libelle | Non disponible | `classe_therapeutique_libelle` |
| laboratoire_nom | Non disponible | `laboratoire_nom` |
| categorie_tarification_libelle | Non disponible | `categorie_tarification_libelle` |
| dci_noms | Disponible | Disponible |

## Solution

Modifier la fonction `exportCatalogToExcel` pour utiliser la vue `v_produits_with_famille` qui inclut tous les libellés via des JOINs.

## Modification Requise

### Fichier : `src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx`

#### Changement 1 : Requête vers la bonne vue (ligne 524)

Remplacer :
```typescript
.from('produits_with_stock')
```

Par :
```typescript
.from('v_produits_with_famille')
```

#### Changement 2 : Mapping des champs avec les bons noms (lignes 554-560)

Les noms des champs dans `v_produits_with_famille` diffèrent légèrement :

| Champ attendu | Nom dans la vue |
|---------------|-----------------|
| `famille_libelle` | `libelle_famille` |
| `rayon_libelle` | `libelle_rayon` |
| `forme_libelle` | `libelle_forme` |

Modifier le mapping :
```typescript
'Famille': product.libelle_famille || '',
'Rayon': product.libelle_rayon || '',
'Forme Galénique': product.libelle_forme || '',
'DCI': product.dci_noms || '',
'Classe Thérapeutique': product.classe_therapeutique_libelle || '',
'Laboratoire': product.laboratoire_nom || '',
'Catégorie Tarification': product.categorie_tarification_libelle || '',
```

## Résultat Attendu

Après la modification, le fichier Excel exporté contiendra :

| Colonne | Avant | Après |
|---------|-------|-------|
| Famille | (vide) | "MEDICAMENTS", "PARAPHARMACIES", etc. |
| Rayon | (vide) | "RAYON A", "RAYON B", etc. |
| Forme Galénique | (vide) | "COMPRIME", "SIROP", etc. |
| Classe Thérapeutique | (vide) | "ANTIBIOTIQUES", etc. |
| Laboratoire | (vide) | "SANOFI", "PFIZER", etc. |
| Catégorie Tarification | (vide) | "MEDICAMENTS", "LAITS ET FARINES", etc. |
| DCI | Fonctionne déjà | (inchangé) |

## Résumé des Modifications

| Fichier | Ligne | Modification |
|---------|-------|-------------|
| `ProductCatalogNew.tsx` | 524 | Changer `produits_with_stock` → `v_produits_with_famille` |
| `ProductCatalogNew.tsx` | 554 | Changer `famille_libelle` → `libelle_famille` |
| `ProductCatalogNew.tsx` | 555 | Changer `rayon_libelle` → `libelle_rayon` |
| `ProductCatalogNew.tsx` | 556 | Changer `forme_libelle` → `libelle_forme` |

## Impact

- **Aucun impact** sur les autres fonctionnalités du catalogue
- La vue `v_produits_with_famille` contient toutes les colonnes de `produits_with_stock` plus les libellés
- Les champs `stock_actuel`, `dci_noms` et tous les autres continueront de fonctionner
