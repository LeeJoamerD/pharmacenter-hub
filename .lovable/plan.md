

# Reorganisation des colonnes du tableau Catalogue Global

## Etat actuel

Le tableau `GlobalCatalogTable.tsx` (lignes 347-431) affiche 7 colonnes de donnees : Code CIP, Libelle, Forme, Famille, Laboratoire, TVA, Prix Ref.

## Nouvelle structure

| Colonne | Contenu (superpose) |
|---------|---------------------|
| **Produit** | Libelle (bold) + Laboratoire (muted) + Code CIP / Ancien CIP (mono, muted) |
| **Labo / DCI / Classe** | Laboratoire (bold) + DCI (muted) + Classe therapeutique (xs, muted) |
| **Famille / Forme / Rayon** | Famille (bold) + Rayon (muted) + Forme (xs, muted) |
| **Categorie / Prix** | Categorie (bold) + Prix achat (muted) + Prix vente (muted) |

Les colonnes TVA et Actions restent inchangees.

## Modifications

**Fichier unique :** `src/components/platform-admin/GlobalCatalogTable.tsx`

- **Lignes 357-364** (TableHeader) : Remplacer les 7 en-tetes par les 4 nouveaux + TVA + Actions
- **Lignes 377-397** (TableBody cells) : Remplacer les 7 cellules par les 4 nouvelles avec divs superposes, en suivant exactement le pattern du `ProductCatalogNew.tsx` (font-medium pour le titre, text-sm text-muted-foreground pour le sous-titre, text-xs pour le troisieme niveau)

Aucun element frontend supprime. Toutes les informations existantes sont conservees et regroupees.

