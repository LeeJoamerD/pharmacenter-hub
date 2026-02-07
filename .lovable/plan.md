
# Ajout des colonnes Prix Achat et Prix Vente a l'import Excel des Categories

## Contexte

Le composant `GlobalCatalogCategoryUpdate` permet actuellement d'importer un fichier Excel avec 2 colonnes :
- **CodeCIP** : identifiant du produit
- **Categorie** : nouvelle categorie de tarification

La table `catalogue_global_produits` possede deja les colonnes `prix_achat_reference` et `prix_vente_reference`. Il suffit donc d'etendre l'import pour les mettre a jour.

## Modifications prevues

### Fichier unique : `src/components/platform-admin/GlobalCatalogCategoryUpdate.tsx`

**1. Ajouter les champs a l'interface `ExcelRow`**

Ajouter `PrixAchat` et `PrixVente` comme colonnes optionnelles du fichier Excel.

**2. Adapter la validation des lignes**

Actuellement, seules les lignes avec `CodeCIP` ET `Categorie` sont traitees. Elargir pour accepter les lignes qui ont `CodeCIP` et au moins un des 3 champs (`Categorie`, `PrixAchat`, `PrixVente`).

**3. Enrichir l'objet de mise a jour**

Dans la boucle de traitement, construire dynamiquement l'objet `update` :
- `libelle_categorie_tarification` seulement si `Categorie` est renseigne
- `prix_achat_reference` seulement si `PrixAchat` est renseigne et est un nombre valide
- `prix_vente_reference` seulement si `PrixVente` est renseigne et est un nombre valide

**4. Mettre a jour l'interface utilisateur**

- Ajouter les 2 nouvelles colonnes dans la section "Format attendu"
- Enrichir le resultat avec un compteur de prix mis a jour (optionnel, pour plus de clarte)

**5. Mettre a jour la description du dialogue**

Adapter le texte descriptif pour mentionner les prix en plus des categories.

## Format Excel attendu (apres modification)

| CodeCIP | Categorie | PrixAchat | PrixVente |
|---------|-----------|-----------|-----------|
| 3400001 | CAT_A     | 1500      | 2500      |
| 3400002 |           | 800       |           |
| 3400003 | CAT_B     |           |           |

Les colonnes `PrixAchat` et `PrixVente` seront optionnelles : si elles sont vides ou absentes, seule la categorie sera mise a jour (et inversement).

## Aucune migration SQL necessaire

Les colonnes `prix_achat_reference` et `prix_vente_reference` existent deja dans la table `catalogue_global_produits`.
