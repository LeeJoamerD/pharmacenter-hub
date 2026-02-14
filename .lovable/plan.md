
# Fiche Produit Enrichie VIDAL

## Objectif

Ajouter un bouton "Consulter VIDAL" dans le catalogue produit (referentiel local et catalogue global) qui ouvre une fiche detaillee avec les donnees VIDAL en temps reel : indications, contre-indications, effets indesirables, conditions de prescription, monographie, conservation et indicateurs reglementaires.

---

## 1. Nouvelle action Edge Function : `get-product-info`

### Fichier : `supabase/functions/vidal-search/index.ts`

Ajouter l'action `get-product-info` qui effectue plusieurs appels API VIDAL en parallele pour un `productId` donne :

- `GET /rest/api/product/{id}` : informations generales (nom, forme, DCI, etc.)
- `GET /rest/api/product/{id}/indications` : liste des indications
- `GET /rest/api/product/{id}/contraindications` : contre-indications
- `GET /rest/api/product/{id}/side-effects` : effets indesirables
- `GET /rest/api/product/{id}/prescription-conditions` : conditions de prescription (stupefiants, liste I/II, etc.)
- `GET /rest/api/product/{id}/documents/opt?type=MONO` : lien vers la monographie VIDAL

Les reponses XML seront parsees pour extraire les titres/descriptions de chaque entry. Les indicateurs suivants seront extraits depuis la fiche produit principale :
- Stupefiants (indicator id 62/63)
- Ecrasable/secable (si disponibles dans les indicators)
- Photosensible (indicator id specifique)
- Conservation (tag `<vidal:storageCondition>`)

La reponse consolidee sera retournee en JSON.

---

## 2. Nouveau composant : `VidalProductSheet.tsx`

### Fichier : `src/components/shared/VidalProductSheet.tsx`

Composant dialog reutilisable affichant la fiche VIDAL d'un produit. Il prend en props :
- `open` / `onOpenChange` : controle du dialog
- `productId` : l'identifiant VIDAL du produit (number)
- `productName` : nom du produit (pour l'en-tete)

Le composant :
1. A l'ouverture, appelle l'edge function `vidal-search` avec action `get-product-info`
2. Affiche un loader pendant le chargement
3. Presente les donnees dans un dialog structure avec sections :
   - **Informations generales** : nom, DCI, forme, laboratoire
   - **Indications** : liste avec badges
   - **Contre-indications** : liste avec icones rouge
   - **Effets indesirables** : liste avec icones orange
   - **Conditions de prescription** : badges (Liste I, II, Stupefiant, etc.)
   - **Indicateurs** : badges pour chaque indicateur (ecrasable, secable, photosensible, dopant, biosimilaire...)
   - **Conservation** : conditions de stockage
   - **Monographie** : lien vers le document VIDAL si disponible

Le design sera similaire au `DrugDetailDialog.tsx` existant mais avec des donnees VIDAL reelles.

---

## 3. Integration dans le Catalogue Global

### Fichier : `src/components/platform-admin/GlobalCatalogTable.tsx`

- Ajouter un bouton "VIDAL" (icone Pill) dans la colonne Actions de chaque ligne produit, visible uniquement si le produit a un `vidal_product_id`
- Requiert d'ajouter `vidal_product_id` au `select` de la requete `fetchProducts`
- Au clic : ouvre le `VidalProductSheet` avec le `vidal_product_id` du produit

### Fichier : `src/components/platform-admin/GlobalCatalogTable.tsx` (interface)

- Ajouter `vidal_product_id: number | null` a l'interface `GlobalProduct`

---

## 4. Integration dans le Catalogue Referentiel (pharmacie)

### Fichier : `src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx`

- Ajouter un bouton "VIDAL" dans la colonne Actions de chaque ligne produit
- Le bouton fait une recherche dans `catalogue_global_produits` par `code_cip` pour recuperer le `vidal_product_id`
- Si trouve : ouvre le `VidalProductSheet`
- Si non trouve : affiche un toast indiquant que le produit n'est pas dans le catalogue VIDAL

---

## Section technique

### Endpoints VIDAL appeles par `get-product-info`

```text
GET /rest/api/product/{id}                         -> infos generales + indicateurs
GET /rest/api/product/{id}/indications             -> indications therapeutiques
GET /rest/api/product/{id}/contraindications       -> contre-indications
GET /rest/api/product/{id}/side-effects            -> effets indesirables
GET /rest/api/product/{id}/prescription-conditions -> conditions de prescription
GET /rest/api/product/{id}/documents/opt?type=MONO -> monographie
```

### Structure de la reponse consolidee

```text
{
  productId: number,
  name: string,
  company: string,
  activeSubstances: string,
  galenicalForm: string,
  indications: string[],
  contraindications: string[],
  sideEffects: string[],
  prescriptionConditions: string[],
  monographyUrl: string | null,
  storageCondition: string | null,
  indicators: {
    isNarcotic: boolean,
    isAssimilatedNarcotic: boolean,
    isCrushable: boolean,   // si disponible
    isScorable: boolean,    // si disponible
    isPhotosensitive: boolean,
    isDoping: boolean,
    isBiosimilar: boolean,
    hasRestrictedPrescription: boolean,
    safetyAlert: boolean
  }
}
```

### Resolution du productId depuis le catalogue local

Pour le catalogue referentiel (pharmacie), le `vidal_product_id` n'existe pas sur la table `produits`. La resolution se fait via :

```text
1. Lire le code_cip du produit local
2. Chercher dans catalogue_global_produits WHERE code_cip = {code_cip}
3. Recuperer vidal_product_id
4. Appeler get-product-info avec ce productId
```

### Fichiers modifies / crees

- `supabase/functions/vidal-search/index.ts` : nouvelle action `get-product-info`
- `src/components/shared/VidalProductSheet.tsx` : nouveau composant (dialog fiche VIDAL)
- `src/components/platform-admin/GlobalCatalogTable.tsx` : bouton VIDAL + champ vidal_product_id
- `src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx` : bouton VIDAL avec resolution code_cip

Aucune migration SQL n'est necessaire : les colonnes `vidal_product_id` et `vidal_package_id` existent deja dans `catalogue_global_produits`.
