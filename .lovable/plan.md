

# Enrichissement du Catalogue Global via l'API VIDAL

## Objectif

Ajouter un nouvel onglet "Recherche VIDAL" dans le Catalogue Global (`/platform-admin/catalogue`) permettant de rechercher des produits dans la base VIDAL et de les importer directement dans la table `catalogue_global_produits`.

## Architecture

Le flux sera :

1. L'admin Platform saisit un terme de recherche dans l'onglet VIDAL
2. Le frontend appelle une Edge Function `vidal-search`
3. L'Edge Function lit les credentials VIDAL depuis `platform_settings` et interroge l'API VIDAL REST
4. Les resultats XML ATOM sont parses et retournes en JSON
5. L'admin selectionne les produits a importer
6. Les produits sont inseres/mis a jour dans `catalogue_global_produits`

## Modifications prevues

### 1. Edge Function : `supabase/functions/vidal-search/index.ts`

Proxy securise vers l'API VIDAL. Fonctionnalites :

- **Recherche par libelle** : `/rest/api/packages?q=xxx&start-page=1&page-size=25`
- **Recherche par code CIP** : `/rest/api/search?code=xxx&filter=package`
- **Detail d'un package** : `/rest/api/package/{id}` pour recuperer prix, forme galenique, composition, indicateurs

L'Edge Function :
- Lit `VIDAL_API_URL`, `VIDAL_APP_ID`, `VIDAL_APP_KEY` depuis la table `platform_settings`
- Cree le client Supabase avec le service role pour lire les settings
- Utilise l'authentification VIDAL (app_id + app_key en parametres de requete)
- Parse le XML ATOM retourne par VIDAL et le convertit en JSON
- Retourne les champs mappes : nom, code CIP, code CIS, forme galenique, laboratoire, DCI, prix, indicateurs, statut de commercialisation

Declaration dans `supabase/config.toml` :
```toml
[functions.vidal-search]
verify_jwt = false
```

### 2. Composant : `src/components/platform-admin/GlobalCatalogVidalSearch.tsx`

Interface de recherche VIDAL avec :

- Champ de recherche avec deux modes : par libelle ou par code CIP
- Bouton de recherche avec indicateur de chargement
- Tableau de resultats affichant : nom du produit, code CIP13, forme galenique, laboratoire, prix public, statut
- Checkbox de selection multiple
- Bouton "Importer la selection" qui insere les produits selectionnes dans `catalogue_global_produits` via upsert (conflit sur `code_cip`)
- Badge indiquant si un produit existe deja dans le catalogue
- Verification que les credentials VIDAL sont configurees, sinon affichage d'un message avec lien vers la page Configuration

### 3. Modification : `src/components/platform-admin/GlobalCatalogManager.tsx`

Ajout d'un 3eme onglet "Recherche VIDAL" avec l'icone Pill :

```
Liste des produits | Importer depuis Excel | Recherche VIDAL
```

Le nouvel onglet affiche le composant `GlobalCatalogVidalSearch`.

### 4. Migration SQL

Ajout de colonnes optionnelles a `catalogue_global_produits` pour stocker les donnees VIDAL :

| Colonne | Type | Description |
|---------|------|-------------|
| `vidal_product_id` | integer | ID VIDAL du Product (code interne) |
| `vidal_package_id` | integer | ID VIDAL du Package |
| `code_cis` | text | Code CIS sur 8 caracteres |
| `code_ucd` | text | Code UCD |
| `market_status` | text | Statut de commercialisation (AVAILABLE, DELETED...) |
| `refund_rate` | text | Taux de remboursement |
| `generic_type` | text | Type generique (REFERENT, GENERIC, null) |
| `is_narcotic` | boolean | Stupefiant (indicateur 63) |
| `is_assimilated_narcotic` | boolean | Assimile stupefiant (indicateur 62) |
| `safety_alert` | boolean | Produit securise ou non |
| `vidal_updated_at` | timestamptz | Date de derniere synchro VIDAL |

Ces colonnes sont toutes nullable, ce qui preserve la compatibilite avec les produits importes via Excel (qui n'auront pas ces donnees VIDAL).

## Mapping des donnees VIDAL vers le catalogue

| Champ VIDAL (XML) | Colonne catalogue |
|-------------------|-------------------|
| `<summary type="text">` | `libelle_produit` |
| Code CIP13 | `code_cip` |
| Code CIP7 | `ancien_code_cip` |
| `<vidal:company>` | `libelle_laboratoire` |
| `<vidal:activeSubstances>` | `libelle_dci` |
| `<vidal:galenicalForm>` | `libelle_forme` |
| `<vidal:atcClass>` | `libelle_classe_therapeutique` |
| `<publicPrice>` | `prix_vente_reference` |
| `refundRate` | `refund_rate` |
| `genericType` | `generic_type` |
| `marketStatus` | `market_status` |
| Indicateurs 62/63 | `is_narcotic` / `is_assimilated_narcotic` |

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/vidal-search/index.ts` | Creer |
| `supabase/config.toml` | Ajouter entry vidal-search |
| `src/components/platform-admin/GlobalCatalogVidalSearch.tsx` | Creer |
| `src/components/platform-admin/GlobalCatalogManager.tsx` | Modifier (ajout onglet) |
| Migration SQL | Ajouter colonnes VIDAL a catalogue_global_produits |

## Pre-requis

Les credentials VIDAL doivent etre configurees dans Platform Admin > Configuration > Base VIDAL (deja en place : `VIDAL_API_URL`, `VIDAL_APP_ID`, `VIDAL_APP_KEY`).

## Ce qui n'est PAS inclus

- Enrichissement automatique en masse (sera une evolution future)
- Fiche produit detaillee VIDAL (monographies, indications, effets indesirables)
- Substitutions generiques
- Securisation d'ordonnance (necessite module patient/prescription)

