
# Fix: `clone_tenant_referential` — section `produits` encore basée sur un ancien schéma

## Diagnostic
L’erreur actuelle ne vient pas d’un simple champ isolé. La fonction SQL active en base insère encore dans `produits` avec un schéma obsolète :

- colonnes utilisées par la fonction : `description`, `code_produit`, `code_barre`, `prix_vente`, `stock_actuel`, `unite_mesure`, `laboratoire`, `forme_pharmaceutique`, `dosage`, `quantite_stock`
- mais dans le schéma réel actuel de `public.produits`, ces colonnes n’existent plus

Le schéma réel contient notamment :
- `code_cip`
- `prix_achat`, `prix_vente_ht`, `prix_vente_ttc`
- `tva`, `centime_additionnel`
- `stock_limite`, `stock_faible`
- `niveau_detail`, `id_produit_source`, `quantite_unites_details_source`
- `famille_id`, `rayon_id`, `forme_id`, `dci_id`, `classe_therapeutique_id`, `categorie_tarification_id`, `laboratoires_id`, `rayon_produit_id`
- `taux_tva`, `taux_centime_additionnel`
- `prescription_requise`, `code_barre_externe`, `scanner_config`
- `stock_critique`, `conditions_conservation`, `ancien_code_cip`
- `is_stupefiant`, `is_controlled_substance`

Donc si on corrige seulement `description`, il y aura immédiatement d’autres erreurs `42703` sur les colonnes suivantes.

## Correction à appliquer
Créer une nouvelle migration SQL qui fait `CREATE OR REPLACE FUNCTION public.clone_tenant_referential(...)` et remplace entièrement la section **8. Produits** par une version alignée sur le schéma réel actuel.

## Changement technique
### Remplacer l’INSERT `produits` actuel
Au lieu de :
```sql
INSERT INTO produits (
  tenant_id, libelle_produit, description, code_produit, code_barre, code_cip,
  prix_achat, prix_vente, stock_limite, stock_actuel, unite_mesure,
  laboratoire, forme_pharmaceutique, dosage, is_active,
  famille_id, rayon_id, dci_id, categorie_tarification_id,
  taux_tva, quantite_stock, niveau_detail, quantite_unites_details_source
)
```

utiliser une insertion basée sur les vraies colonnes actuelles, avec remappage des FK :
```sql
INSERT INTO produits (
  id, tenant_id, libelle_produit, code_cip,
  prix_achat, prix_vente_ht, prix_vente_ttc, tva, centime_additionnel,
  stock_limite, stock_faible, niveau_detail, is_active,
  famille_id, rayon_id, forme_id, dci_id, classe_therapeutique_id,
  categorie_tarification_id, laboratoires_id, rayon_produit_id,
  taux_tva, taux_centime_additionnel, prescription_requise,
  code_barre_externe, scanner_config, stock_critique,
  conditions_conservation, ancien_code_cip,
  is_stupefiant, is_controlled_substance,
  quantite_unites_details_source,
  created_at, updated_at
)
SELECT ...
```

## Points importants de la nouvelle version
1. **Pré-générer `_map_produits`** (`old_id -> new_id`) avant insertion
2. **Mapper correctement les FK** :
   - `famille_id` via `_map_familles`
   - `rayon_id` et `rayon_produit_id` via `_map_rayons`
   - `forme_id` via `_map_formes`
   - `dci_id` via `_map_dci`
   - `classe_therapeutique_id` via `_map_classes`
   - `categorie_tarification_id` via `_map_categories`
   - `laboratoires_id` via `_map_labos`
3. **Conserver la logique source/détail**
   - garder `quantite_unites_details_source`
   - puis remettre `id_produit_source` via `_map_produits` après insertion, ou le calculer directement avec `_map_produits`
4. **Conserver les fixes déjà faits**
   - `classes_therapeutiques.systeme_anatomique`
   - colonnes réelles de `laboratoires`

## Pourquoi cette approche
C’est la bonne correction durable, car la fonction active a été réécrite à partir d’une version simplifiée devenue incompatible avec le schéma actuel. Il faut donc réaligner toute la section `produits`, pas seulement enlever `description`.

## Vérification attendue après correction
Après application de la migration :
1. relancer
```sql
SELECT clone_tenant_referential(
  'aaf036e4-8316-4ed7-af49-8bec87035550',
  'a63f0388-4ef0-45cd-a416-f54cda0fc244'
);
```
2. vérifier qu’il n’y a plus d’erreur `42703` sur `produits`
3. vérifier que les produits détails gardent bien leur lien `id_produit_source`

## Fichier à modifier
- nouvelle migration SQL dans `supabase/migrations/` pour `CREATE OR REPLACE FUNCTION clone_tenant_referential`
