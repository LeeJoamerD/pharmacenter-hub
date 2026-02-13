

# Enrichissement VIDAL : suppression des prix a l'import + indicateurs manquants + synchronisation periodique

## 1. Supprimer l'importation des prix

Actuellement, lors de l'import VIDAL, `prix_vente_reference` est rempli avec `publicPrice`. Ce champ ne doit plus etre modifie par VIDAL.

### Fichier : `src/components/platform-admin/GlobalCatalogVidalSearch.tsx`

- Retirer la ligne `prix_vente_reference: p.publicPrice || null` du mapping d'import (fonction `handleImport`)
- La colonne "Prix" reste affichee dans les resultats de recherche (a titre informatif) mais n'est plus importee dans le catalogue

### Fichier : `supabase/functions/vidal-search/index.ts`

- Conserver `publicPrice` dans la reponse de recherche (affichage informatif) mais il ne sera plus utilise cote import

---

## 2. Ajouter les indicateurs VIDAL manquants

### 2.1 Migration SQL : nouvelles colonnes dans `catalogue_global_produits`

```sql
ALTER TABLE public.catalogue_global_produits
  ADD COLUMN IF NOT EXISTS is_biosimilar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_doping boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_restricted_prescription boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tfr numeric,
  ADD COLUMN IF NOT EXISTS ucd_price numeric,
  ADD COLUMN IF NOT EXISTS drug_in_sport boolean DEFAULT false;
```

### 2.2 Fichier : `supabase/functions/vidal-search/index.ts`

Modifier `VidalPackage` et `parsePackageEntries` :

- Ajouter les champs : `isBiosimilar`, `isDoping`, `hasRestrictedPrescription`, `drugInSport`, `tfr`, `ucdPrice`
- Extraction des indicateurs VIDAL par ID :
  - ID 10 = Produit Dopant (`isDoping`)
  - ID 55 = Prescription restreinte (`hasRestrictedPrescription`)
  - ID 78 = Biosimilaires (`isBiosimilar`)
- Extraction des balises XML pour :
  - `<vidal:drugInSport>` (booleen)
  - `<vidal:tfr>` (tarif forfaitaire)
  - `<vidal:ucdPrice>` ou `<vidal:pricePerDose>`

Ajouter une nouvelle action `get-package-details` qui appelle `/rest/api/package/{id}` pour obtenir les informations detaillees (TFR, ucdPrice, prescription-conditions) non presentes dans le listing. Cette action sera appelee apres la recherche pour enrichir les resultats selectionnes.

### 2.3 Fichier : `src/components/platform-admin/GlobalCatalogVidalSearch.tsx`

- Ajouter les nouveaux champs a l'interface `VidalPackage`
- Mapper les nouveaux champs dans `handleImport` : `is_biosimilar`, `is_doping`, `has_restricted_prescription`, `tfr`, `ucd_price`, `drug_in_sport`
- Afficher les nouveaux badges dans la colonne "Indicateurs" : Biosimilaire, Dopant, Prescription restreinte

---

## 3. Synchronisation periodique (check-version)

### 3.1 Fichier : `supabase/functions/vidal-search/index.ts`

Ajouter l'action `check-version` :

- Appelle `GET /rest/api/version` avec les credentials
- Parse la reponse XML pour extraire `<vidal:weeklyDate>`, `<vidal:dailyDate>`, `<vidal:version>`
- Compare avec la derniere version connue stockee dans `platform_settings` (cle `VIDAL_LAST_VERSION`)
- Retourne : version actuelle, date, et si une mise a jour est disponible (`hasUpdate: boolean`)
- Si mise a jour detectee, met a jour `VIDAL_LAST_VERSION` dans `platform_settings`

### 3.2 Fichier : `src/components/platform-admin/GlobalCatalogVidalSearch.tsx`

Ajouter dans l'en-tete de la carte de recherche :

- Un bouton "Verifier mises a jour VIDAL" qui appelle l'action `check-version`
- Affichage d'un badge avec la version VIDAL courante et la date de derniere verification
- Si mise a jour detectee : afficher une alerte informative avec la nouvelle version et la date

### 3.3 Fichier : `src/components/platform-admin/GlobalCatalogManager.tsx`

- Ajouter un indicateur de version VIDAL visible dans l'en-tete du catalogue global (petit badge)

---

## Section technique

### Nouveaux indicateurs VIDAL - extraction XML

```text
Indicator ID 10  -> isDoping (Produit Dopant)
Indicator ID 55  -> hasRestrictedPrescription (Prescription restreinte)
Indicator ID 78  -> isBiosimilar (Biosimilaires)

Tag <vidal:drugInSport>true</vidal:drugInSport> -> drugInSport
Tag <vidal:tfr roundValue="X.XX"> -> tfr
Tag <vidal:pricePerDose roundValue="X.XX"> -> ucdPrice
```

### Action check-version - format reponse VIDAL

```xml
GET /rest/api/version
Response:
<vidal:weeklyDate format="yyyy-MM-dd">2025-02-10</vidal:weeklyDate>
<vidal:dailyDate format="yyyy-MM-dd">2025-02-13</vidal:dailyDate>
<vidal:version>2025.2.0</vidal:version>
```

### Mapping import modifie (sans prix)

```text
Avant:
  prix_vente_reference: p.publicPrice || null  // SUPPRIME

Apres:
  // Pas de prix importe
  is_biosimilar: p.isBiosimilar || false
  is_doping: p.isDoping || false
  has_restricted_prescription: p.hasRestrictedPrescription || false
  drug_in_sport: p.drugInSport || false
  tfr: p.tfr || null        // Informatif seulement, pas un prix de vente
  ucd_price: p.ucdPrice || null  // Informatif seulement, pas un prix de vente
```

Les champs `tfr` et `ucd_price` sont stockes a titre informatif/reglementaire (reference de remboursement) et ne modifient en aucun cas les prix de vente ou d'achat du catalogue.

