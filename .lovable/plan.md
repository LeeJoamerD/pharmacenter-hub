# Plan : Catalogue Produits RDC

Ajouter une nouvelle section dans **Platform Admin** dédiée au catalogue de la République Démocratique du Congo (RDC), isolée du catalogue Congo Brazzaville actuel, avec deux onglets : **Liste des produits** et **Importer depuis Excel**.

## 1. Base de données (migration)

Créer une nouvelle table **`catalogue_global_produits_rdc`** dont la structure est identique à `catalogue_global_produits` (mêmes colonnes : `id`, `code_cip`, `ancien_code_cip`, `libelle_produit`, `libelle_forme`, `libelle_famille`, `libelle_rayon`, `libelle_dci`, `libelle_classe_therapeutique`, `libelle_laboratoire`, `libelle_categorie_tarification`, `tva`, `prix_achat_reference`, `prix_vente_reference`, `prix_achat_reference_pnr`, `prix_vente_reference_pnr`, timestamps, etc.).

- RLS identiques à `catalogue_global_produits` (lecture publique pour pharmacies, écriture restreinte aux platform admins).
- Index sur `code_cip`, `libelle_produit` pour la recherche.
- Contrainte unique sur `code_cip` (comme la table source).

Note : on duplique la table plutôt que d'ajouter une colonne `pays` afin de garder une isolation stricte demandée (les tenants RDC consommeront leur propre catalogue, sans pollution des produits Congo Brazza).

## 2. Composants UI

Approche : **factoriser par paramètre `tableName`** pour éviter la duplication.

### a. Refactor léger
- `GlobalCatalogTable.tsx` : ajouter une prop optionnelle `tableName?: 'catalogue_global_produits' | 'catalogue_global_produits_rdc'` (défaut = `catalogue_global_produits`). Remplacer les 4 occurrences en dur par cette variable.
- `GlobalCatalogImport.tsx` : même prop `tableName` + un titre/description configurables. Remplacer les 2 occurrences.

### b. Nouveau composant `GlobalCatalogRDCManager.tsx`
Calque de `GlobalCatalogManager.tsx` mais :
- Titre : « Catalogue Global des Produits — RDC »
- Icône drapeau / Package + badge « RDC »
- **2 onglets seulement** : Liste des produits, Importer depuis Excel (pas de Recherche VIDAL, pas de bouton « Vérifier les changements VIDAL »)
- Passe `tableName="catalogue_global_produits_rdc"` aux deux sous-composants

## 3. Routing & navigation

- **`src/pages/PlatformAdmin.tsx`** : ajouter `<Route path="catalogue-rdc" element={<GlobalCatalogRDCManager />} />`
- **`src/components/platform-admin/PlatformAdminLayout.tsx`** : ajouter une entrée de menu « Catalogue Produits RDC » (icône `Package` ou `Flag`) pointant vers `/platform-admin/catalogue-rdc`, juste sous « Catalogue Produits ».

## 4. Hors scope (à confirmer plus tard)

- Le combobox de recherche `global-catalog-search-combobox.tsx` utilisé dans les autres modules continue à pointer sur `catalogue_global_produits` (Congo Brazza). L'aiguillage par pays du tenant côté pharmacie sera traité dans une étape ultérieure quand vous voudrez activer la consommation RDC.
- Pas de migration de données : la table RDC est créée vide, prête à recevoir un import Excel.

## Détails techniques

```text
src/
├── pages/PlatformAdmin.tsx                              [edit]  +1 route
├── components/platform-admin/
│   ├── PlatformAdminLayout.tsx                          [edit]  +1 menu item
│   ├── GlobalCatalogManager.tsx                         [unchanged]
│   ├── GlobalCatalogRDCManager.tsx                      [NEW]
│   ├── GlobalCatalogTable.tsx                           [edit]  prop tableName
│   └── GlobalCatalogImport.tsx                          [edit]  prop tableName

supabase migration:
└── create table public.catalogue_global_produits_rdc    [NEW]
    + RLS policies (mirror catalogue_global_produits)
    + indexes + unique(code_cip)
```

Confirmez et je passe à l'implémentation.
