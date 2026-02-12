# Manuel d'intégration API REST VIDAL Sécurisation

> Ce document est la propriété exclusive de VIDAL et ne peut être ni reproduit, ni communiqué à un tiers sans l'autorisation préalable de VIDAL.

---

## Historique des versions

**REV_01** – 18/11/2025

- Dans §5 *Cas particulier : LPPR*, ajout :
  > « On peut également accéder aux présentations inscrites sur la LPPR à partir d'un package : `/rest/api/package/{packID}/lppr` ou `rest/api/package/282216?aggregate=LPPR`. Ces points d'API permettent d'afficher les liens Package-LPPR actifs. »

- §8.1.6 *Substitution pour un médicament biosimilaire*, ajout :
  > « Lors de la dispensation, seuls certains groupes biosimilaires peuvent être substituables par le pharmacien d'officine (arrêté paru le 14/04/2022). Cette information est portée par un attribut de type booléen au niveau du groupe biosimilaire : `<vidal:substituable>true</vidal:substituable>` »

---

## Sommaire

1. [Objectifs du document](#1-objectifs-du-document)
2. [Contenu du Référentiel VIDAL](#2-contenu-du-référentiel-vidal)
3. [Généralités sur le fonctionnement des API VIDAL](#3-généralités-sur-le-fonctionnement-des-api-vidal)
4. [Chapitre 1 : Implémentation du Référentiel VIDAL](#4-chapitre-1--implémentation-du-référentiel-vidal)
5. [Cas particulier : LPPR](#5-cas-particulier--lppr)
6. [Cas particulier : Le Référentiel Prescriptible](#6-cas-particulier--le-référentiel-prescriptible)
7. [Cas d'usages métiers](#7-cas-dusages-métiers)
8. [Substitutions et équivalences](#8-substitutions-et-équivalences)
9. [Chapitre 2 : Structuration du dossier patient](#9-chapitre-2--structuration-du-dossier-patient)
10. [Chapitre 3 : Sécurisation de l'ordonnance](#10-chapitre-3--sécurisation-de-lordonnance)
11. [Chapitre 4 : Services complémentaires](#11-chapitre-4--services-complémentaires)

---

## 1. Objectifs du document

Ce document est un manuel d'intégration des API VIDAL REST. Les API VIDAL sont divisées en deux grandes familles :

- **Les API VIDAL Référentiel** : accès au référentiel VIDAL, en consultation.
- **Les API VIDAL Sécurisation** : dispositif médical permettant la sécurisation d'une ordonnance.

Ce manuel est complété par :
- Les Release Notes des différentes versions des API diffusées sur le site éditeurs.
- Le Manuel d'intégration Posologie complexe API REST et SOAP diffusé sur le site éditeurs.

---

## 2. Contenu du Référentiel VIDAL

### 2.1. Concepts du médicament

La Base de Données médicamenteuse (BDM) VIDAL met à disposition le médicament sous 4 formes différentes.

#### 2.1.1. La spécialité pharmaceutique = PRODUCT

Un médicament de composition déterminée préparé à l'avance et ayant une dénomination particulière.

Composée de : nom commercial + substance(s) active(s) + dosage + forme galénique + voie d'administration.

**Exemple** : ASPEGIC 500 mg pdre p sol buv en sachet-dose

- **Synonymes** : produit, product
- **Codification** : Code CIS sur 8 caractères, identifiant Product interne VIDAL (productId)
- **Utilisation** : Unité la plus adaptée au milieu libéral

> **Nota** : L'AMM est délivrée pour une spécialité pharmaceutique, les informations thérapeutiques doivent être portées par la spécialité.

#### 2.1.2. La présentation = PACKAGE

Conditionnement spécifique d'une spécialité (ex. boîte de 20 comprimés).

**Exemple** : ASPEGIC 500 mg Pdr sol buv en sachet-dose 30Sach

- **Synonymes** : package, pack
- **Codification** : Codes CIP sur 7 et 13 caractères, identifiant package interne VIDAL (packId)
- **Utilisation** : Unité la plus adaptée à la dispensation en officine

#### 2.1.3. L'Unité Commune de Dispensation = UCD

La plus petite unité intègre utilisée pour la dispensation dans les établissements de soins (T2A).

**Exemple** : ASPEGIC 500 MG BUV SACH

- **Codification** : Codes UCD sur 7 et 13 caractères, identifiant UCD interne VIDAL (ucdId)
- **Utilisation** : Spécifique au milieu hospitalier

#### 2.1.4. La spécialité virtuelle = DC = VMP

Abstraction englobant toutes les spécialités ayant même(s) substance(s), même(s) dosage(s), même forme et même voie.

**Exemple** : acide acétylsalicylique (sel de lysine) * 500 mg ; voie orale ; pdre p sol buv sach

- **Synonymes** : Groupe DC, VMP (Virtual Medical Product), Common Name Group
- **Codification** : Code MedicaBase sur 10 caractères, identifiant interne VIDAL (commonNameGroupId)
- **Utilisation** : Prescription en DCI

> **Nota** : VIDAL indexe de l'information directement au niveau de la spécialité virtuelle pour permettre une sécurisation de la prescription en DC sans passer par les spécialités pharmaceutiques.

#### 2.1.5. Le Prescriptible

Objet scientifique virtuel optimisant la prescription en DC. Le prescriptible (DC + modalité d'administration) est rattaché à un ensemble d'objets logistiques interchangeables (grappes d'UCD).

Avantages :
- **Prescripteur** : raisonnement simplifié, livret thérapeutique stable
- **Pharmacien** : souplesse de substitution au sein de la grappe d'UCD
- **Infirmier** : traçabilité de l'administration, sécurisation du choix d'UCD

**Exemple** :
- Prescriptible : Prednisone PO
- Alias : Prednisone [CORTANCYL] PO
- Grappes d'UCD : CORTANCYL 1MG CPR, CORTANCYL 5MG CPR, CORTANCYL 20MG CPR, etc.

- **Codification** : identifiant interne VIDAL (id)

### 2.2. Dispositifs médicaux et LPPR

Environ 109 000 présentations de DM. La totalité des DM remboursables (LPPR) est incluse avec informations économiques et administratives structurées.

### 2.3. Parapharmacie (dermo cosmétique)

Environ 28 000 présentations.

### 2.4. Diététique et nutrition

Environ 22 500 présentations.

### 2.5. Vétérinaire

Environ 5 400 présentations.

### 2.6. Homéopathie

Environ 39 000 présentations.

### 2.7. VIDAL Recos

Recommandations thérapeutiques : 175 fiches pratiques et 240 arbres décisionnels. Révisées régulièrement (HAS, ANSM, INCa, sociétés savantes).

---

## 3. Généralités sur le fonctionnement des API VIDAL

Les API sont accessibles pour :
- Spécialités / Codes CIS
- UCD / codes UCD
- Présentations / codes CIP
- Dénominations Communes
- Substances

**Sortie au format XML ATOM** (pas de JSON).

Chaque entité VIDAL est identifiée par un couple **type + identifiant** indissociables :

```xml
<id>vidal://package/288128</id>
<vidal:drugId>116314</vidal:drugId>
<vidal:type>PRODUCT</vidal:type>
```

### Fonctions disponibles

**Recherche** : par libellé, code, indication, classification

**Informations médicament** : administratives/financières, galénique, thérapeutiques structurées, prescription/délivrance, conservation, surveillances, incompatibilités, posologies, SMR/ASMR

**Classifications** : ATC, thérapeutique VIDAL, EPHMRA, Saumon, SEMP

**Documents** : MONO, SAUMON, VDF, MONO_SUPP, RCP, FIT, PGR, BUM, RTU, ALD, AVIS, INFO_SHEET, RAPPE

**Dossier patient** : allergies, indications, aide au codage CIM-10, rétro-codage

**Analyse de prescription** : interactions, contre-indications, posologies, allergies, surdosages, redondances

**Substitution** : générique, ATC, indication, biosimilaire, groupe DC

**Outils recommandés** : POSTMAN, SOAPUI

---

## 4. Chapitre 1 : Implémentation du Référentiel VIDAL

### 4.1. Récupérer les informations des versions VIDAL

```
GET /rest/api/version
```

```xml
<vidal:monthlyDate format="yyyy-MM-dd">2018-12-17</vidal:monthlyDate>
<vidal:weeklyDate format="yyyy-MM-dd">2019-01-14</vidal:weeklyDate>
<vidal:dailyDate format="yyyy-MM-dd">2019-01-15</vidal:dailyDate>
<vidal:version>2019.1.0</vidal:version>
```

### 4.2. Modalités de recherche rapides sur les API

Recherche à partir de 3 caractères. Trois modalités :

**« L'un des mots commence par »** (par défaut) :
```
rest/api/products?q=para
```

**« L'un des mots contient »** (avec `$$`) :
```
rest/api/product?q=$topro$
```

**« Commence par »** (recherche rapide) :
```
/rest/api/search?q=xxx&filter=xxx
/rest/api/search?code=xxx&filter=xxx
```

**Paramètres** :
- `q` : libellé recherché
- `code` : CIP13, UCD13, EAN, CIP7, UCD7, CIS, LPPR, EPHMRA, ATC, CIM10, MEDICABASE
- `filter` : product, ucd, package, molecule, atc_classification, vidal_classification, indication, indication_group, vmp, lppr, ephmra, pds, cim10

**Recherche agrégée** :
```
/rest/api/search-aggregation/all-packages?q=doliprane
```

### 4.3. Rechercher un médicament

#### 4.3.1. Recherche par libellé

```
/rest/api/products?q=amoxi&start-page=1&page-size=25
/rest/api/packages?q=amoxi&start-page=1&page-size=25
/rest/api/ucds?q=amoxi&start-page=1&page-size=25
/rest/api/prescribables?q=amoxicilline
```

Liens depuis un Package :
```
/rest/api/package/id/larger-packs
/rest/api/package/id/units
/rest/api/package/id/routes
/rest/api/package/id/indicators
/rest/api/package/id/indications
/rest/api/package/id/side-effects
/rest/api/package/id/alds
/rest/api/package/id/documents
```

#### 4.3.2. Recherche par code

```
/rest/api/search?q=&code=60234100&filter=product     (CIS)
/rest/api/search?q=&code=3400930471722&filter=package (CIP)
/rest/api/search?q=&code=9239091&filter=ucd           (UCD)
```

#### 4.3.3. Recherche par substance

```
/rest/api/molecules/active-substances?q=Amox
/rest/api/molecule/active-substance/310/products
/rest/api/molecule/active-substance/310/vmps
```

#### 4.3.4. Recherche par libellé d'une DC (VMP)

```
/rest/api/vmps?q=parox&page=1&page-size=25
```

Liens depuis un VMP :
```
/rest/api/vmp/id/products
/rest/api/vmp/id/atc-classification
/rest/api/vmp/id/molecules
/rest/api/vmp/id/units
/rest/api/vmp/id/contraindications
/rest/api/vmp/id/physico-chemical-interactions
/rest/api/vmp/id/routes
/rest/api/vmp/id/indicators
/rest/api/vmp/id/indications
/rest/api/vmp/id/side-effects
/rest/api/vmp/id/alds
```

#### 4.3.5. Rechercher un médicament pour une indication

```
/rest/api/indications?q=Cystite
/rest/api/indication/3366/products
/rest/api/indication/3366/vmps
/rest/api/indication-group/355/products?start-page=8&page-size=25
```

#### 4.3.6. Rechercher un médicament par indicateur

```
/rest/api/products/indicators?indicators=15&indicators=62&indicators=63&operator=OR&start-page=1&page-size=125
```

**Liste complète des indicateurs** :

| ID | Nom |
|----|-----|
| 1 | Médicament dérivé du sang |
| 2 | Antibiotiques |
| 3 | Anticancéreux |
| 4 | Anticancéreux avec précautions |
| 5 | Anticoagulant |
| 6 | Antivitamine K |
| 7 | Buvable |
| 8 | Oxygénothérapie |
| 9 | Per Os |
| 10 | Produit Dopant |
| 11 | Produits Psy |
| 12 | Psychotrope |
| 13 | Sécable |
| 14 | Solutés |
| 15 | Stupéfiants et assimilés stupéfiants |
| 16 | Traitement local et autres |
| 17 | Vaccin |
| 18 | Voie Aérosolthérapie |
| 19 | Voie cutanée |
| 20 | Voie Injectable |
| 21 | Voie ophtalmique |
| 22 | Voie transdermique |
| 23 | Produits diététiques |
| 24 | Reconstitué |
| 25 | Solvant de reconstitution associé |
| 26 | Âge |
| 27 | Poids |
| 28 | Grossesse |
| 29 | Allaitement |
| 30 | Rénal |
| 31 | Sexe |
| 32 | Ordonnancier |
| 33 | Ordonnancier + registre comptable des stupéfiants |
| 34 | Registre des produits dérivés du sang |
| 35 | Ordonnancier + registre des produits dérivés du sang |
| 36 | Taille |
| 37 | Stabilis |
| 54 | Médicament à surveillance renforcée |
| 55 | Existence d'une prescription restreinte |
| 56 | Anxiolytique |
| 57 | Hypnotique |
| 58 | Iodure de potassium |
| 59 | Médicament contraception d'urgence |
| 60 | Photosensible |
| 61 | Médicament destiné à l'IVG |
| 62 | Assimilés stupéfiants |
| 63 | Stupéfiants |
| 64 | Médicament d'exception |
| 65 | Tranches d'âge hétérogènes |
| 66 | Excipients à effet notoire hétérogènes |
| 67 | Dispositifs d'administration hétérogènes |
| 68 | Présentations hétérogènes |
| 69 | Indications hétérogènes |
| 70 | Perfusion à domicile |
| 71 | Prescriptible par Infirmier(ère) |
| 72 | Prescriptible par Kinésithérapeute |
| 73 | Prescriptible par Podologue |
| 74 | Prescriptible par Sage-Femme |
| 75 | Prescriptible par Vétérinaire |
| 76 | Non prescriptibles |
| 77 | Écotaxe |
| 78 | Biosimilaires |
| 79 | Médicament spécifique |
| 80 | Médicament sérialisable |
| 81 | Médicament avec Indication LES |
| 82 | Médicament contraceptif |
| 83 | Perfusion |
| 84 | Dose imprécise |
| 85 | Ne pas écraser |
| 86 | Médicament réglementé |
| 87 | Dispenser le Conditionnement |
| 88 | Dispenser Sans Fractionnement |
| 89 | Jeter le reliquat |
| 90 | Témoin nécessaire |
| 91 | Administrer dans les temps |
| 92 | Administrable directement |
| 93 | Dispensation adaptée en officine |
| 94 | Réserve Hospitalière |
| 95 | Médicament à risque |
| 96 | Médicament dangereux pour le manipulateur |
| 97 | Nutrition parentérale |
| 98 | Médicament de la liste de référence des groupes biologiques similaires |
| 99 | Médicament hors T2A |
| 100 | Médicament Rétrocession |
| 101 | Médicament à marge thérapeutique étroite (MTE) |
| 102 | Nutrition entérale |
| 103 | Médicament de diagnostic hospitalier |
| 105 | Médicament non substituable |
| 106 | Médicament à risque pour les patients atteints de maladies chroniques |
| 107 | Médicament avec indication AAC |
| 108 | Médicament avec indication AAP |
| 109 | Médicament avec indication CPC |
| 110 | Médicament avec indication SSR |
| 111 | Médicament en Rupture de stock |
| 112 | Médicament en Tension d'approvisionnement |
| 113 | Médicament en Arrêt de commercialisation |
| 114 | Médicament en Remise à disposition |
| 116 | Médicament écrasable |
| 117 | Médicament non écrasable |
| 118 | Médicament ouvrable |
| 119 | Médicament non ouvrable |
| 120 | Poudre injectable |
| 121 | Accompagnement prescription analogue GLP1 |
| 122 | Dispensation à l'unité |
| 123 | Primo délivrance limitée à 7 jours |

#### 4.3.7. Rechercher par forme et couleur

```
/rest/api/products/form-color?form=pill&color=blue
```

Formes : PASTILLE, PILL, GUM, CAPSULE, GEL. Couleurs : YELLOW, RED, ORANGE, BEIGE, BROWN, WHITE, GREEN, GREY, BLUE, PURPLE, PINK, COLORLESS, BLACK.

### 4.4. Accéder à l'information d'un médicament

#### 4.4.1. Durée de présence et gestion des ID

Présentations conservées 5 ans après fin de commercialisation. API de substitution d'identifiants :

```
GET /rest/api/substitutes?uri=vidal://package/797037
GET /rest/api/substitutes?uri=vidal://product/96
```

Retour : `<vidal:currentDrugId>`, `<vidal:drugType>`, libellé, dates de commercialisation.

#### 4.4.2. Informations de description

##### 4.4.2.1. Type de produit (`itemType`)

VIDAL, DIETETIC, VETERINARY, NON_PHARMACEUTICAL, ACCESSORY, MISCELLANEOUS, HOMEOPATHIC, BALNEOLOGY

##### 4.4.2.2. Statut de commercialisation (`marketStatus`)

NEW, AVAILABLE, DELETED, DELETED_ONEYEAR, PHARMACO, PHARMACO_ONEYEAR

##### 4.4.2.3. Lieu de dispensation (`dispensationPlace`)

PHARMACY, HOPITAL

##### 4.4.2.4. Libellé adapté à l'ordonnance

- Product/Package/UCD : utiliser `<summary type="text">`
- VMP : vérifier `regulatoryGenericPrescription` (true = prescriptible en VMP)

##### 4.4.2.5. Produits non sécurisés

`safetyAlert = false` → produit non sécurisé, afficher un avertissement.

#### 4.4.3. Informations administratives et réglementaires

##### 4.4.3.1. Restrictions de prescription

```
/rest/api/product/{id}/prescription-conditions
/rest/api/package/{id}/prescription-conditions
```

##### 4.4.3.2. Information dopant

Attribut `drugInSport` (booléen).

##### 4.4.3.3. Stupéfiants

Indicateurs 62 (assimilés) et 63 (stupéfiants) via `/rest/api/product/{id}/indicators`.

##### 4.4.3.4. Risques conduite

Via indicateurs et sécurisation (sous-type VIGILANCE).

##### 4.4.3.5. Agrément aux collectivités

Sous-type COLLECTIVITY_AGREMENT dans la sécurisation.

##### 4.4.3.6. Génériques/Référent

```xml
<vidal:genericType name="REFERENT">Référent</vidal:genericType>
<vidal:genericType name="GENERIC">Générique</vidal:genericType>
```

##### 4.4.3.7. Gamme de prix UCD

`minUCDRangePrice` / `maxUcdRangePrice` (product), `pricePerDose` / `ucdPrice` (package).

##### 4.4.3.8. Prix et remboursement

```
/rest/api/product/id → refundRate, minUcdRangePrice, maxUcdRangePrice
/rest/api/package/id → publicPrice, refundingBase, refundRate, tfr, pricePerDose
```

##### 4.4.3.9. Indications LES MCO

Indicateur 81. API : `/rest/api/indication-les`, `/rest/api/product/{id}/indications?type=LES`, etc.

##### 4.4.3.10. Indications LES SSR

Indicateur 110. API : `/rest/api/indication-ssr`, `/rest/api/product/{id}/indications?type=SSR`, etc.

#### 4.4.4. Informations de galénique

##### 4.4.4.1. Forme galénique

```
/rest/api/galenic-forms
/rest/api/galenic-form/{id}
```

##### 4.4.4.2. Sécabilité

`divisibility` : true, 1 (non-divisible), 2 (par 2), 4 (par 4), null. Indicateur 13.

##### 4.4.4.3. Écrasable / Ouvrable

Indicateurs 116 (écrasable), 117 (non écrasable), 118 (ouvrable), 119 (non ouvrable).

##### 4.4.4.4. Composition

```
/rest/api/product/{id}/molecules
/rest/api/product/{id}/molecules/active-excipients
/rest/api/vmp/{id}/molecules
```

##### 4.4.4.5. Voies

```
/rest/api/product/{id}/routes
/rest/api/routes
```

Ranking : `<vidal:ranking>0</vidal:ranking>` (0 = premier rang)
AMM : `<vidal:outOfSPC>false</vidal:outOfSPC>` / Hors AMM : `true`

#### 4.4.5. Informations thérapeutiques structurées

##### 4.4.5.1. Indications

```
/rest/api/product/{id}/indications
```

##### 4.4.5.2. Effets indésirables

```
/rest/api/product/{id}/side-effects
/rest/api/package/{id}/side-effects
/rest/api/ucd/{id}/side-effects
/rest/api/vmp/{id}/side-effects
```

##### 4.4.5.3. Contre-indications

```
/rest/api/product/{id}/contraindications
/rest/api/vmp/{id}/contraindications
```

#### 4.4.6. ALD d'une spécialité

```
/rest/api/product/{id}/alds
```

#### 4.4.7. Conservation et conditionnement

##### 4.4.7.1. Conservation (Package uniquement)

```
/rest/api/package/{id}?aggregate=STORAGE
```

##### 4.4.7.2. Conditionnement

```
/rest/api/package/{id}?aggregate=CONTAINER
```

#### 4.4.8. Classifications

```
/rest/api/search?code=N05CD06&filter=ATC_CLASSIFICATION
/rest/api/atc-classification/{id}/products
/rest/api/atc-classification/{id}/children
/rest/api/vidal-classification/{id}/children
```

#### 4.4.9. Documents

```
/rest/api/product/{id}/documents/opt?type=MONO
/rest/api/product/{id}/recos
```

#### 4.4.10. Actualités thérapeutiques

```
/rest/news
/rest/news/product/{id}
/rest/news/molecule/{id}
/rest/news/{id}
/rest/news/{id}/products
```

Sources : ANSM, HAS, EMA, Ministère, Légifrance, HCSP, Laboratoires, Grossistes.

---

## 5. Cas particulier : LPPR

La LPPR définit les produits dont le coût sera pris en charge par l'Assurance maladie.

```
/rest/api/search?q=XXXX&filter=LPPR           (par libellé)
/rest/api/search?code=XXXXXXX&filter=LPPR     (par code)
/rest/api/package/{packID}/lppr                (liens Package-LPPR actifs)
/rest/api/package/{id}?aggregate=LPPR
/rest/api/package/{id}?aggregate=LPPR_HISTORY  (historique)
/rest/api/package/{id}/lppr?withHistory=true
```

---

## 6. Cas particulier : Le Référentiel Prescriptible

### 6.1.1. Rechercher un Prescriptible

```
/rest/api/prescribable/{id}
/rest/api/prescribables?q=amoxicilline
```

Retourne : ID, Name, IsValid, StartDate, Alias.

### 6.1.2. Informations remontées

```
/rest/api/prescribable/X/routes
/rest/api/prescribable/X/ucds
/rest/api/prescribable/X/units
/rest/api/prescribable/X/vmps
/rest/api/prescribable/X/ucdvs
```

### 6.1.3. Sécuriser avec le Prescriptible

```xml
<prescription-line>
  <drug>vidal://prescribable/5387</drug>
  <dose>5</dose>
  <unitId>57</unitId>
  <duration>3</duration>
  <durationType>DAY</durationType>
  <frequencyType>PER_DAY</frequencyType>
</prescription-line>
```

---

## 7. Cas d'usages métiers

### 7.1.1. Éléments patient nécessaires à la sécurisation

Indicateurs patient (26=Âge, 27=Poids, 28=Grossesse, 29=Allaitement, 30=Rénal) via `/rest/api/product/{id}/indicators`.

### 7.1.2. Identifier les stupéfiants

Indicateurs 15, 62 et 63.

### 7.1.3. Posologies de l'AMM

```
POST /rest/api/product/{id}/posology-descriptors
POST /rest/api/vmp/{id}/posology-descriptors
```

### 7.1.4. Motifs de prescription

Les indications d'un médicament permettent de proposer des motifs au prescripteur.

---

## 8. Substitutions et équivalences

### 8.1.1. Substitution stricte (même VMP)

```
/rest/api/vmp/{vmpId}/products
```

### 8.1.2. Substitution par classe ATC

```
/rest/api/product/{id}/atc-classification
/rest/api/atc-classification/{atcId}/products
```

### 8.1.3. Substitution par indication

```
/rest/api/indication/{indicationId}/products
```

### 8.1.4. Substitution au sein d'un groupe générique

```
/rest/api/product/{id}/generic-group
/rest/api/generic-group/{id}/products
```

### 8.1.5. Substitution au sein d'un groupe hybride (2023.10.17)

```
/rest/api/product/{id}/hybrid-group
/rest/api/hybrid-group/{id}/products
```

### 8.1.6. Substitution biosimilaire

```
/rest/api/product/{id}/biosimilar-group
/rest/api/biosimilar-group/{id}/products
```

Attribut `<vidal:substituable>true</vidal:substituable>` au niveau du groupe biosimilaire.

### 8.1.7. Équivalences étrangères

```
/rest/api/foreign-products?q=PARAPLATINE&country=TN
/rest/api/foreign-product/{id}/products
/rest/api/product/{id}/foreign-products
/rest/api/product/{id}/foreign-products&countryCode=TN
```

---

## 9. Chapitre 2 : Structuration du dossier patient

### 9.1. Les allergies

#### 9.1.1. Les allergies VIDAL

Deux référentiels complémentaires :
- **Molécule** : substances actives (plus précis)
- **Allergy** : classes d'allergie (« hypersensibilité à... »)

#### 9.1.2. Saisir une allergie structurée

```
/rest/api/allergies?q=penicilline
```

Retourne des résultats ALLERGY et MOLECULE. Stocker l'identifiant et le référentiel d'origine.

#### 9.1.3. Classes d'allergies d'une spécialité

```
/rest/api/product/{id}/allergies
/rest/api/allergy/{id}/molecules
```

### 9.2. Les pathologies

#### 9.2.1. Pathologies dans le body patient

Balise `<pathology>`, valeurs CIM-10 :

```xml
<pathology>vidal://cim10/code/C22.1</pathology>
<pathology>vidal://cim10/1064</pathology>
```

**Insuffisance hépatique** : balise `<hepaticInsufficiency>` (NONE, MODERATE, SEVERE)

**Recherche CIM-10** :
```
/rest/api/pathologies?q=diabete&type=CIM10
/rest/api/search?code=E13.1&filter=CIM10
```

**CIM-10 via groupes d'indications** :
```
/rest/api/indications?q=HTA
/rest/api/indication-group/{id}/cim10s
```

#### 9.2.2. Affections longue durée (ALD)

```
/rest/api/alds?q=diabete
/rest/api/cim10/{id}/alds
/rest/api/product/{id}/alds
```

### 9.3. Gestion des codes non reconnus

Les codes allergie ou pathologie non reconnus sont ignorés dans la sécurisation sans erreur.

---

## 10. Chapitre 3 : Sécurisation de l'ordonnance

### 10.1. Le body patient

#### 10.1.1. Éléments du body

| Balise | Contenu | Obligatoire |
|--------|---------|-------------|
| `<dateOfBirth>` | Date de naissance (YYYY-MM-DD) | Oui |
| `<gender>` | MALE / FEMALE | Oui |
| `<weight>` | Poids en kg | Selon médicament |
| `<height>` | Taille en cm | Non |
| `<gestationalAge>` | Semaines d'aménorrhée | Non |
| `<breastFeedingStartDate>` | Date début allaitement | Non |
| `<creatin>` | Clairance créatinine (ml/min) | Non |
| `<serumCreatinine>` | Créatininémie (µmol/l) | Non |
| `<hepaticInsufficiency>` | NONE / MODERATE / SEVERE | Non |

**Calcul fonction rénale** (CKD-EPI) :
```
POST /rest/api/calculators/renal-function
```

#### 10.1.2. Ligne de prescription

##### Voies d'administration

```
/rest/api/product/{id}/routes
```

Ranking et filtrage AMM disponibles.

##### Unités sécurisées

```
/rest/api/product/{id}/units
```

##### Doses min/max (descripteur posologique)

```
POST /rest/api/product/{id}/posology-descriptors
```

#### 10.1.3. Analyse de l'ordonnance

##### Généralités

```
POST /rest/api/alerts/full?app_id=XXX&app_key=YYY          (structuré XML)
POST /rest/api/alerts/full/html?app_id=XXX&app_key=YYY     (HTML)
```

Content-type : text/xml

##### Body de sécurisation

```xml
<prescription-lines>
  <prescription-line>
    <drug>vidal://product/126988</drug>
    <dose>2.0</dose>
    <unitId>129</unitId>
    <duration>3</duration>
    <durationType>DAY</durationType>
    <frequencyType>PER_DAY</frequencyType>
    <routes>
      <route>vidal://route/38</route>
    </routes>
  </prescription-line>
</prescription-lines>
```

Identification du médicament :
- Méthode 1 : `<drugId>` + `<drugType>` (COMMON_NAME_GROUP, PRODUCT, PACK, UCD)
- Méthode 2 : `<drug>` avec URI (vidal://product/..., vidal://vmp/..., etc.)

##### Typologie des alertes

| Type d'alerte | Sous-types | Sévérité |
|---------------|-----------|----------|
| **DOSAGE** | OVERDOSE, UNDERDOSE, UNVERIFIABLE, NOT_CHECKED | LEVEL_4, LEVEL_3, LEVEL_2, INFO |
| **CONTRA_INDICATION** | ABSOLUTE, RELATIVE | LEVEL_4, LEVEL_3 |
| **PRECAUTION** | — | LEVEL_3 |
| **DRUG_INTERACTION** | TAKE_INTO_ACCOUNT, PRECAUTION, COMBINATION_NOT_RECOMMENDED, CONTRAINDICATION | LEVEL_1 à LEVEL_4 |
| **GAP** (Grossesse/Allaitement/Procréation) | CI, Précaution, Mise en garde | LEVEL_4 à LEVEL_2 |
| **SIDE_EFFECT** | — | INFO |
| **PHYSICO_CHEMICAL_INTERACTION** | VIDAL, STABILIS | LEVEL_1 à LEVEL_4 |
| **WARNING** | — | LEVEL_2 |
| **SURVEILLANCE** | — | INFO |
| **DISPENSING_RISK** | ACTIVE_INGREDIENT, AGE_RANGE, DEVICE, INDICATION, PRESENTATION | INFO |
| **REDUNDANT_ACTIVE_INGREDIENT** | — | LEVEL_4 |
| **SAME_DRUG** | — | LEVEL_4 |
| **INDICATOR** | COLLECTIVITY_AGREMENT, DOPING, GENERIC_GROUP, NARCOTIC, RESTRICTED_PRESCRIPTION, VIGILANCE | INFO |
| **HAS** (SAM) | — | LEVEL_4 |

**triggeredBy types** : AGE, GENDER, WEIGHT, PREGNANT, BREASTFEEDING, RENAL_FAILURE, PATHOLOGY, ALLERGY

**Balises à afficher a minima** : `<title>`, `<content>`, `<alertType>`, `<severity>`, `<triggeredBy>` ou `<subType>`, `<detail>`, `<source>`

### 10.1.4. Filtrer la synthèse HTML

```xml
<alert-types>
  <alert-type>CONTRA_INDICATION</alert-type>
  <alert-type>DRUG_INTERACTION</alert-type>
  <alert-type>DOSAGE</alert-type>
  <!-- ... autres types ... -->
</alert-types>
```

### 10.1.5. Calcul de coût

Estimation du coût d'une ligne de prescription.

### 10.1.6. Imputabilité d'un effet indésirable

Vérification de l'imputabilité d'un effet indésirable à un médicament.

---

## 11. Chapitre 4 : Services complémentaires

### 11.1. Prérequis navigateurs

Navigateurs modernes standard.

### 11.2. Prérequis installeur IHA

Installation locale des API (Instance Hébergée Auto).

### 11.3. Prérequis API ONLINE

Connexion internet + identifiants (app_id, app_key).

### 11.4. Informations sur les laboratoires

```
/rest/api/companies?q=XXX
/rest/api/company/{id}
```

### 11.5. Gestion des erreurs

Codes HTTP standard : 200 (succès), 400 (requête invalide), 401 (non autorisé), 403 (interdit), 404 (non trouvé), 500 (erreur serveur).

### 11.6. Agrégation des appels

```
/rest/api/product/{id}?aggregate=MONO,STORAGE
/rest/api/package/{id}?aggregate=CONTAINER,STORAGE
```

### 11.7. Conversion en dénomination commune

API de conversion d'une ordonnance en nom de marque vers la DC pour impression.

### 11.8. Fonctions de calcul (2023.10.7)

**Fonction rénale** :
```
POST /rest/api/calculators/renal-function
```

Entrées : dateOfBirth, gender, weight, creatin (ou serumCreatinine)

Retours : créatininémie (µmol/l), DFG (ml/min/1.73m²) par ethnie, méthode CKD-EPI, stade KDIGO

Conditions : créatininémie pour >15 ans (40-100 kg), DFG pour >18 ans.

**Surface corporelle** : formule Dubois & Dubois.

**IMC** : Poids (kg) / Taille² (m).

---

*Fin du Manuel d'intégration API REST VIDAL Sécurisation*
