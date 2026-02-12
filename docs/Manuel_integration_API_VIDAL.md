# Manuel d'intégration API VIDAL - Sécurisation

> Ce document est la propriété exclusive de VIDAL et ne peut être ni reproduit, ni communiqué à un tiers sans l'autorisation préalable de VIDAL.

---

## Historique des versions

| Révision | Date       | Résumé des modifications |
|----------|------------|--------------------------|
| REV_01   | 18/11/2025 | Dans §5 Cas particulier : LPPR, ajout : "On peut également: accéder aux présentations inscrites sur la LPPR à partir d'un package : /rest/api/package/{packID}/lppr ou rest/api/package/282216?aggregate=LPPR. Ces points d'API permettent d'afficher les liens Package-LPPR actifs". §8.1.6 Substitution pour un médicament biosimilaire / Prescription et délivrance des médicaments biosimilaires : ajout "Lors de la dispensation, seuls certains groupes biosimilaires peuvent être substituables par le pharmacien d'officine (arrêté paru le 14/04/2022). Cette information est portée par un attribut de type booléen au niveau du groupe biosimilaire : true" |

---

## SOMMAIRE

1. Objectifs du document
2. Contenu du Référentiel VIDAL
   1. Concepts du médicament
      1. La spécialité pharmaceutique = PRODUCT
      2. La présentation = PACKAGE
      3. L'Unité Commune de Dispensation = UCD
      4. La spécialité virtuelle = DC = VMP
      5. Le Prescriptible
   2. Dispositifs médicaux et LPPR
   3. Parapharmacie (dermo cosmétique)
   4. Diététique et nutrition
   5. Vétérinaire
   6. Homéopathie
   7. VIDAL Recos
3. Généralités sur le fonctionnement des API VIDAL
4. Chapitre 1 : Implémentation du Référentiel VIDAL
   1. Récupérer les informations des versions VIDAL
   2. Modalités de recherche rapides sur les API
   3. Rechercher un médicament à partir d'une propriété du médicament
      1. Recherche par libellé
      2. Recherche par code
      3. Recherche par substance
      4. Recherche par libellé d'une DC (synonyme : VMP ou Virtual Medical Product)
      5. Rechercher un médicament pour une indication
      6. Rechercher un médicament qui correspond à un indicateur
      7. Rechercher un médicament par rapport à sa forme et sa couleur (formes galéniques orales et sèches uniquement)
   4. Accéder à l'information d'un médicament
      1. Durée de présence des présentations dans la base VIDAL et gestion des ID
      2. Informations de description du médicament : interprétation du résultat d'une recherche
         1. Type de produit
         2. Statut de commercialisation
         3. Lieu de dispensation
         4. Libellé adapté à l'ordonnance et à l'ordonnance numérique (DC ou nom de marque)
         5. Produits non sécurisés
      3. Informations administratives et réglementaires
         1. Récupérer les restrictions de prescription
         2. Récupérer l'information dopant
         3. Récupérer l'information "stupéfiant" ou "assimilé stupéfiant"
         4. Récupérer les risques concernant la conduite
         5. Récupérer l'agrément aux collectivités
         6. Afficher les produits génériques/référent (nom de marque, nom de gamme, nom fantaisie)
         7. Récupérer la gamme de prix UCD
         8. Récupérer les prix des présentations et les bases de remboursement
         9. Les indications LES pour les médicaments hors GHS pour le MCO
         10. Les indications LES pour les médicaments hors GHS pour le SSR
      4. Informations de galénique : forme, composition, voies et divisibilité
         1. Forme galénique
         2. Sécabilité d'un comprimé
         3. Médicament écrasable ou ouvrable
         4. Composition
         5. Voies
      5. Informations thérapeutiques structurées : indications, contre-indications, interactions, effets indésirables
         1. Afficher les indications d'un médicament
         2. Afficher la liste des effets indésirables par médicament
         3. Afficher les contre-indications d'un médicament
      6. Afficher les affections de longue durée d'une spécialité
      7. Afficher les informations de conservation et de conditionnement
         1. Rechercher les informations de conservation (Package uniquement)
         2. Rechercher les informations de conditionnement (le contenant / contenu du Package)
      8. Explorer les classifications d'un médicament
         1. Rechercher les produits d'une classe ATC à partir du code de la classification ATC
         2. Rechercher les produits d'une classe ATC à partir de son libellé
         3. Afficher une classification et son arbre
      9. Rechercher les documents d'un médicament
         1. Récupérer la monographie d'un médicament
         2. Récupérer le SMR et l'ASMR
         3. Récupérer les VIDAL Recos liées à un produit
         4. Systèmes d'aide à la décision indexée par le médicament (SAM)
      10. Accéder aux actualités thérapeutiques VIDAL
5. Cas particulier : Liste des produits et prestations remboursables (LPPR)
6. Cas particulier : Le Référentiel Prescriptible
   1. Rechercher un Prescriptible
   2. Informations remontées par le Prescriptible
   3. Sécuriser la Prescription avec le Prescriptible
7. Cas d'usages métiers et exemples d'application aux exigences réglementaires
   1. Récupérer les éléments patient nécessaires à la sécurisation
   2. Identifier les stupéfiants et assimilés
   3. Récupérer les posologies de l'AMM
   4. Proposer des motifs de prescription en lien avec une prescription
8. Substitutions et équivalences
   1. Substitution stricte : au sein d'un même VMP
   2. Substitution par classe ATC
   3. Substitution par indication thérapeutique
   4. Substitution au sein d'un groupe générique
   5. Substitution au sein d'un groupe hybride - NEW version 2023.10.17
   6. Substitution pour un médicament biosimilaire
   7. Recherche d'équivalence étrangère
      1. Afficher les spécialités équivalentes à une spécialité étrangère
      2. Afficher les spécialités françaises équivalentes à l'aide du foreign-products_id
      3. Avec le productid d'une spécialité française retrouver toutes les équivalences étrangères
9. Chapitre 2 : Structuration du dossier patient
   1. Les allergies
      1. Les allergies VIDAL
      2. Saisir une allergie structurée
      3. Retrouver les classes d'allergies d'une spécialité
   2. Les pathologies
      1. Saisir une pathologie sur le profil patient
         1. Les pathologies dans le body patient
         2. L'insuffisance hépatique dans le body patient
         3. Saisie d'une pathologie CIM10 pour alimenter les antécédents patients
         4. Rechercher les codes CIM-10 à l'aide des groupes indications via des indications
      2. Saisir une affection longue durée (ALD) pour le patient
         1. Rechercher une affection longue durée par libellé
         2. Rechercher une affection longue durée par code
      3. À l'aide du CIM10_ID rechercher l'ALD correspondante
      4. Rechercher toutes les affections longues durées d'une spécialité
   3. Gestion des codes allergies ou pathologie non reconnus
10. Chapitre 3 : Implémentation des API VIDAL Sécurisation pour le contrôle de l'ordonnance
    1. Le body patient pour la sécurisation
       1. Les éléments du body
       2. Les éléments de la ligne de prescription
          1. Récupérer les voies d'administration
          2. Récupérer les unités sécurisées
          3. Récupérer les doses minimales et maximales avec le descripteur posologique
       3. L'analyse de l'ordonnance
          1. Généralités
          2. Les lignes de prescription du body de sécurisation
          3. Le résultat de la sécurisation en html
          4. Le résultat de la sécurisation en structuré
          5. L'analyse de l'ordonnance : typologie des alertes envoyées par la sécurisation
       4. Possibilité de filtrer la synthèse html V2 sur les alertes souhaitées par l'intégrateur
       5. Calcul de coût : obtenir le coût estimé d'une ligne de prescription
       6. Imputabilité d'un effet indésirable
11. Chapitre 4 : Services complémentaires API VIDAL
    1. Prérequis navigateurs
    2. Prérequis installeur IHA
    3. Prérequis API ONLINE
    4. Accéder à des informations sur les laboratoires
    5. Gestion des erreurs
    6. Possibilité d'agréger les appels
    7. Convertir les médicaments d'une ordonnance en dénomination commune pour l'impression
    8. Fonctions de calcul (2023.10.7)

---

## 2. Contenu du Référentiel VIDAL

### 2.1. Concepts du médicament

#### 2.1.1. La spécialité pharmaceutique = PRODUCT

La spécialité pharmaceutique est un médicament fini qui a obtenu une autorisation de mise sur le marché (AMM). La spécialité est composée d'un nom commercial + une ou plusieurs substances actives + le dosage de chaque substance active + une forme galénique + une voie d'administration.

Exemple : ASPEGIC 500 mg Pdr sol buv en sachet-dose

Synonymes : produit, product

Codification : Code CIS sur 8 caractères, identifiant Product interne VIDAL (productId).

Utilisation : La spécialité est l'unité la plus adaptée à l'utilisation en milieu libéral. En effet, elle contient suffisamment d'informations pour l'identification du produit, mais ne tient pas compte des informations de packaging (boîtage).

Nota : L'Autorisation de Mise sur le Marché (AMM) est délivrée pour une spécialité pharmaceutique, ce qui explique qu'en France, les informations thérapeutiques doivent être portées par la spécialité.

#### 2.1.2. La présentation = PACKAGE

La présentation est un conditionnement spécifique d'une spécialité (ex. : boîte de 20 comprimés, pour le Clamoxyl 500 gélules). Chaque spécialité dispose d'une ou plusieurs présentations.

Une présentation est composée de : Une spécialité pharmaceutique (un nom commercial + une ou plusieurs substances actives + le dosage de chaque substance active + une forme galénique + une voie d'administration) + un boîtage/conditionnement.

Exemple : ASPEGIC 500 mg Pdr sol buv en sachet-dose 30Sach

Synonymes : package, pack

Codification : Codes CIP sur 7 caractères et 13 caractères, identifiant package interne VIDAL (packId).

Utilisation : La présentation est l'unité la plus adaptée à la dispensation de médicament boîtes complètes, donc principalement en officine et quelques fois en milieu hospitalier.

#### 2.1.3. L'Unité Commune de Dispensation = UCD

L'unité commune de dispensation (UCD) caractérise la plus petite unité intègre utilisée pour la dispensation dans les établissements de soins (retenue comme norme d'échange dans le cadre de la tarification à l'activité ou T2A).

Une UCD est composée de : Une spécialité pharmaceutique (un nom commercial + une ou plusieurs substances actives + le dosage de chaque substance active + une forme galénique + une voie d'administration) + la plus petite unité de conditionnement possible.

Exemple : ASPEGIC 500 MG BUV SACH

Synonyme : UCD

Codification : Codes UCD sur 7 caractères et 13 caractères, identifiant UCD interne VIDAL (ucdId).

Utilisation : L'UCD est une unité spécifique au milieu hospitalier. Par certains aspects réglementaires, son utilisation est obligatoire dans certaines fonctions du circuit du médicament (T2A).

#### 2.1.4. La spécialité virtuelle = DC = VMP

La spécialité virtuelle est une abstraction de la spécialité pharmaceutique, elle englobe toutes les spécialités qui ont la (les) même(s) substance(s) active(s), au(x) même(s) dosage(s), avec une même forme galénique et une même voie d'administration.

Une spécialité virtuelle est composée de : Une ou plusieurs substances actives + le dosage de chaque substance active + une forme galénique + une voie d'administration.

Exemple : acide acétylsalicylique (sel de lysine) * 500 mg ; voie orale ; pdre p sol buv sach

Synonymes : Groupe DC, VMP (Virtual Medical Product), Common Name Group. La "prescription en DC" (dénomination commune) ou en DCI (dénomination commune internationale) font référence à la prescription en spécialité virtuelle, seule entité prescriptible du modèle VIDAL n'ayant pas de nom de marque.

#### 2.1.5. Le Prescriptible

Le Prescriptible est un objet scientifique qui regroupe des UCD homogènes du point de vue de la prescription et de l'administration. Il est composé de : DC + modalité d'administration.

| Prescriptible | UCD 1 | UCD 2 | UCD 3 |
|---------------|-------|-------|-------|
| DC + modalité d'administration | UCD 4 | UCD 5 | UCD n |

### 2.2. Dispositifs médicaux et LPPR

La base de données VIDAL contient des Dispositifs Médicaux pouvant être commercialisés en officine (environ 109 000 présentations en mai 2023).

Une partie des dispositifs médicaux sont remboursables (tout ou partie du dispositif). On parle alors de LPPR. Le référentiel VIDAL contient la totalité des DM remboursables. Pour ces éléments, VIDAL met à disposition des informations économiques et administratives structurées.

Exemple : VENOTRAIN ULCERTEC 46 Système de bas de contention compression veineuse forte naturel L court

### 2.3. Parapharmacie (dermo cosmétique)

Le Référentiel VIDAL contient des références de parapharmacies (environ 28 000 présentations en date du 3 mai 2023). Pour ces éléments, VIDAL met à disposition des informations économiques et administratives structurées.

Exemple : AVENE BODY Bme fondant hydratant Pot/250ml

### 2.4. Diététique et nutrition

Le référentiel VIDAL contient des références de diététique et nutrition (environ 22 500 présentations en date du 3 mai 2023). Pour ces éléments, VIDAL met à disposition des informations économiques et administratives structurées.

Exemple : ALOEVERA 2 NUTRI-PULPE IMMUNITÉ Boisson Bouteille/1l

### 2.5. Vétérinaire

Le référentiel VIDAL contient des références de produits vétérinaires (environ 5400 présentations en date du 3 mai 2023).

### 2.6. Homéopathie

Le référentiel VIDAL contient des références de produits homéopathiques (environ 39 000 présentations en date du 3 mai 2023).

### 2.7. VIDAL Recos

Les VIDAL Recos font partie du fond documentaire VIDAL : ce sont des recommandations thérapeutiques, sous forme de fiches pratiques de prise en charge thérapeutique (175 fiches) et d'arbres décisionnels (240 arbres). Les VIDAL Recos sont régulièrement révisées sur la base des dernières publications françaises et internationales, et correspondent à une synthèse des recommandations thérapeutiques de la HAS, de l'ANSM, de l'INCa et des sociétés savantes françaises et internationales.

---

## 3. Généralités sur le fonctionnement des API VIDAL

### Informations disponibles via les API

**Informations administratives et financières des médicaments :** prix, remboursements, hors GHS, rétrocession, etc.

**Informations sur le laboratoire**

**Informations de galénique :**
- composition
- forme
- voies
- dosage

**Informations thérapeutiques structurées :**
- Indications
- contre-indications

**Informations de prescription et délivrance :**
- prescription restreinte
- prescription initiale par un spécialiste (accompagnée du ou des spécialistes concernés)
- prescription par les sages-femmes
- réserve hospitalière

**Informations de conservation :**
- à conserver au réfrigérateur
- à conserver au congélateur
- délai d'utilisation après ouverture

**Surveillances liées à un médicament**

**Incompatibilités physico-chimiques**

**Interactions alimentaires**

**SMR/ASMR**

**Informations de prescription :**
- unités
- voies

**Posologies :** proposition de posologies minimales, maximales et usuelles en fonction des critères physiologiques du patient

**Exploration des classifications :**
- Classification ATC
- Classification thérapeutique VIDAL
- Classification EPHMRA
- Classification Saumon (Parapharmacie)
- Classification SEMP (PDS)

**Affichage des monographies VIDAL :**
FULL MONO : monographie VIDAL

**Affichage de contenu documentaires :**
- SAUMON : fiche saumon des produits de parapharmacie
- VDF : Fiche VIDAL grand public (VIDAL de la Famille)
- MONO_SUPP : Monographie des médicaments supprimés
- RCP : Résumé de Caractéristiques du Produit (hébergés sur le net)
- FIT : Fiche d'Information Thérapeutique des médicaments d'exception
- PGR : Plan de Gestion des Risques
- BUM : Fiche de Bon Usage du Médicament
- RTU : Recommandations Temporaires d'Utilisation (RTU)
- ALD : Affection de longue durée
- AVIS : Avis de la commission de transparence
- Fiche Conseil (INFO_SHEET) : Spécialité médicamenteuse avec des surveillances particulières.
- RAPPE : Rapport public d'évaluation

**Codage du dossier patient :**
- Accès aux référentiels d'allergie VIDAL
- Recherche d'indications et de groupes d'indications VIDAL (basés sur les indications AMM).
- Outil d'aide au codage : aide à la recherche de code CIM-10 basée sur l'utilisation des indications VIDAL et du réseau sémantique d'indications (50 000 termes)
- Exploration de la classification CIM-10
- Outil de rétro-codage : proposition de codes CIM-10 en fonction du traitement du patient.

**Analyse de prescription :**
- Détection des interactions médicamenteuses
- Détection des contre-interactions pathologiques (CIM-10)
- Détection des contre-interactions physiologiques (âge, poids, sexe, etc.)
- Effets indésirables
- Mise en garde et précautions d'emploi
- Détection des allergies
- Détection de surdosages
- Redondance de substance

**Substitution :**
- Substitution par groupe générique
- Substitution par groupe DC : même(s) substance(s) active(s), même dosage, même forme, même voie
- Substitution par classes ATC, pharmaco-thérapeutiques
- Substitution par indication
- Substitution au sein d'un groupe biosimilaire

### Outils recommandés

Bien que les appels aux méthodes de l'API se fassent dans le code source de votre application, nous vous recommandons d'utiliser des outils de requête REST simples qui vous aideront à comprendre et à tester le comportement de l'API VIDAL sans avoir à écrire de code.

- POSTMAN : http://www.getpostman.com/
- SOAPUI : http://sourceforge.net/projects/soapui/files/

---

## 4. Chapitre 1 : Implémentation du Référentiel VIDAL

### 4.1. Récupérer les informations des versions VIDAL

Use case : Récupérer le numéro de version et récupérer la date d'extraction des données.

Procédure : Interrogez `/rest/api/version`

Retour :

```xml
<author></author>
<id>vidal://version</id>
<updated>2019-01-15T00:00:00Z</updated>
<content>
  <vidal:monthlydate format="yyyy-MM-dd">2018-12-17</vidal:monthlydate>
  <vidal:weeklydate format="yyyy-MM-dd">2019-01-14</vidal:weeklydate>
  <vidal:dailydate format="yyyy-MM-dd">2019-01-15</vidal:dailydate>
  <vidalversion>2019.10</vidalversion>
  <vidal:buildnumber>4ade9e05fbee4bbe28f7971baba282246d167d05</vidal:buildnumber>
  <vidal:productline>zapi</vidal:productline>
</content>
```

Informations complémentaires :
- Le LAP permet d'afficher la date de l'édition installée de la base de données sur les médicaments (BdM).
- Les ordonnances doivent être typées avec la date de version de la sécurisation.

### 4.2. Modalités de recherche rapides sur les API

La recherche dans les APIs Vidal s'effectue à partir de 3 caractères saisis. La recherche peut se faire à plusieurs niveaux, chacun correspondant à un cas de figure bien précis :

#### Recherche de type "l'un des mots commence par"

Modalité de recherche par défaut. Cette recherche renvoie à tous les libellés dont l'un des mots commence par les premières lettres saisies :

```
rest/api/products?q=xxx
```

Cette recherche renvoie l'intégralité des attributs.

Exemple : `rest/api/products?q=para` renvoie :
- CLARIX ETAT GRIPPAL PARACETAMOL CHLORPHENAMINE VITAMINE C pdre p sol buv en sachet
- COQUELUSEDAL PARACETAMOL 100 mg suppos
- DOLIRHUME PARACETAMOL ET PSEUDOEPHEDRINE 500 mg/30 mg cp
- HUILE DE PARAFFINE COOPER sol buv en flacon
- PARACETAMOL ACCORD 500 mg cp efferv

#### Recherche de type "l'un des mots contient"

Cette modalité de recherche peut s'appliquer à toutes les méthodes. Lors de la recherche, entourez le libellé avec `$$` (`$libellé$`) pour effectuer une recherche de type "l'un des mots contient" :

```
rest/api/product?q=$xxx$
```

Cette recherche permet d'affiner les résultats renvoyés.

Exemple : `rest/api/product?q=$topro$` renvoie le KETOPROFENE.

#### Recherche de type "commence par"

Modalité de recherche rapide. Cette recherche permet de filtrer les informations en débutant la recherche par un libellé ou un code et d'exclure les libellés ou code qui contiennent les autres caractères recherchés.

Recherche d'un libellé :
```
/rest/api/search?q=xxx&filter=xxx
```

Recherche d'un code :
```
/rest/api/search?code=xxx&filter=xxx
```

**Paramètres :**
- `q` : libellé recherché
- `Code` : CIP13, UCD13, EAN, CIP 7, UCD7, CIS, LPPR, EPHMRA, ATC, CIM10, MEDICABASE
- `filter` : filtre termes de recherche (product, ucd, package, molecule, atc_classification, vidal_classification, indication, indication_group, vmp, lppr, ephmra, pds, cim10), insensible à la casse

NB : Ces paramètres sont cumulatifs et peuvent être répétés plusieurs fois chacun.

Cette modalité de recherche ne renvoie toutefois que des informations très succinctes selon la méthode :
- En product : libellé, ID, item type
- En package : libellé, ID, item type
- En UCD : libellé, ID
- En VMP : libellé, ID, indicator, RegulatoryGenericPrescription

Exemple :

```
/rest/api/search?q=Amox&filter=Product
```

Retour :
- PRODUCT AMOXIBACTIN 250 mg cp chien
- PRODUCT AMOXIBACTIN 50 mg cp chien chat
- PRODUCT AMOXIBACTIN 500 mg cp chien
- PRODUCT AMOXICILLINE ACIDE CLAVULANIQUE ZYDUS FRANCE 100 mg/12,5 mg/ml pdre p susp buv en flacon enfant
- etc.

#### Recherche agrégée (search-aggregation)

La méthode ci-dessous permet d'afficher toutes les présentations et leurs VMP associés, ainsi que les indicateurs associés à une entité :

```
/rest/api/search-aggregation/all-packages?q=doliprane
```

Cet appel en package permet d'afficher :
- les packages correspondants à la recherche, ainsi que certaines informations associées à ces packages (dont les indicateurs)
- les VMP attachés aux packages quand ils existent (pour les médicaments)

Cette utilisation est préconisée pour proposer des éléments à la prescription pour un prescripteur ou pour débuter l'alimentation du livret de l'établissement.

Exemple de retour :

```xml
<id>/rest/api/search-aggregation/all-packages?q=doliprane</id>
<updated>2023-04-18T00:00:00Z</updated>

<entry xmlns:vidal="http://api.vidal.net/-/spec/vidal-api/1.0/" vidal:categories="PACKAGE">
  <!-- DOLIPRANE 100 mg Pdr sol buv en sachet-dose 12Sach -->
  <category term="PACKAGE">
  <author><name>VIDAL</name></author>
  <id>vidal://package/11064</id>
  <updated>2023-04-18T00:00:00Z</updated>
  <content>
    <vidal:itemtype name="VIDAL">VIDAL</vidal:itemtype>
    <vidal:cip>3499833</vidal:cip>
    <vidal:cip13>3400934998331</vidal:cip13>
    <vidal:ucd7>9210928</vidal:ucd7>
    <vidal:ucd13>3400892109282</vidal:ucd13>
  </content>
  </category>
</entry>
```

### 4.3. Rechercher un médicament à partir d'une propriété du médicament

Nous préconisons d'utiliser ces méthodes pour récupérer de l'information sur un médicament.

#### 4.3.1. Recherche par libellé

Exemple : Le médecin saisit "amoxi" dans le champ de recherche.

**Etape 1 : rechercher le produit**

Si vous travaillez en Product :

Recherchez la saisie avec la méthode `/rest/api/products?q=amoxi` ou `/rest/api/products?q=amoxi&start-page=1&page-size=25` (1 page, 25 résultats par page). Nous obtenons toutes les spécialités correspondantes.

Par défaut, la recherche est de type "l'un des mots commence par". Il est possible d'affiner la recherche en se référant au paragraphe 2 Modalités de recherche du Chapitre 1 (recherche en l'un des mots contient, commence par ou aggregate).

**Liens actifs sur une recherche par spécialité :**

- `/rest/api/product/id`
- `/rest/api/product/id/packages`
- `/rest/api/product/id/molecules`
- `/rest/api/product/id/molecules/active-excipients`
- `/rest/api/product/id/recos`
- `/rest/api/product/id/foreign-products`
- `/rest/api/product/id/indications`
- `/rest/api/product/id/contraindications`
- `/rest/api/product/id/restricted-prescriptions`
- `/rest/api/product/id/pds`
- `/rest/api/product/id/ucds`
- `/rest/api/product/id/units`
- `/rest/api/product/id/food-interactions`
- `/rest/api/product/id/physico-chemical-interactions`
- `/rest/api/product/id/routes`
- `/rest/api/product/id/indicators`
- `/rest/api/product/id/side-effects`
- `/rest/api/product/id/alds`
- `/rest/api/product/id/documents`
- `/rest/api/product/id/documents/opt`
- `/rest/api/product/id/atc-classification`
- `/rest/api/product/id/smr-asmr`
- `/rest/api/product/id/smr-asmr.htm`
- `/rest/api/product/id/ald`
- `/rest/api/product/id/vidal-classification`
- `/rest/api/product-range/product-range_id`
- `/rest/api/product-range/product-range_id/products`

Exemple de retour pour AMOXICILLINE 500 mg gél (AMOXICILLINE EG) :

```
Author: VIDAL
ID: vidal://product/895
Dispensation Place: PHARMACY
Generic Type: Générique
Midwife: true
Drug in Sport: false
List: Liste 1
Refund Rate: 65%
Item Type: VIDAL
Market Status: Supprimé
Per Volume: 500mg
Safety Alert: true
Active Principles: amoxicilline trihydrate
AMM Type: AMM Française
On Market Date: 2000-07-03
Off Market Date: 2017-12-22
CIS: 67489979
Min UCD Range Price: 0.1275
Max UCD Range Price: 0.1275
Company: EG Labo
VMP: amoxicilline * 500 mg ; voie orale ; gél
```

Attention, tous les liens ne sont pas forcément actifs avec tous les produits.

Si vous travaillez en UCD :
- `/rest/api/ucd/id`
- `/rest/api/ucd/id/units`
- `/rest/api/ucd/id/routes`
- `/rest/api/ucd/id/indicators`
- `/rest/api/ucd/id/packages`
- `/rest/api/ucd/id/products`
- `/rest/api/ucd/id/side-effects`
- `/rest/api/product/productid`
- `/rest/api/vmp/vmpid`

Si vous travaillez en Prescriptible :

Recherchez la saisie avec la méthode `/rest/api/prescribables?q=amoxicilline`

**Etape 2 : Stocker la sélection de l'utilisateur**

Pour plus de facilité, stocker également son identifiant, et son Id. Stocker ces informations vous fera gagner du temps lors d'autres appels d'API.

**Informations complémentaires :**

Les API `&start-page=1&page-size=25` vous permettent d'obtenir des résultats paginés :
- `&start-page=1` = nombre de pages
- `&page_size=25` = nombre de résultats par page

Exemple : Bouton "suivant" `&start-page=2`, Bouton "précédent" `&start-page=1`

#### 4.3.2. Recherche par code

**Etape 1 : Rechercher la chaîne de caractères**

- Si vous travaillez en Product : `/rest/api/search?q=&code=60234100&filter=product` (code CIS product)
- Si vous travaillez en Package : `/rest/api/search?q=&code=3400930471722&filter=package` (code CIP = package)
- Si vous travaillez en UCD : `/rest/api/search?q=&code=9239091&filter=ucd` (code UCD = ucd)

**Etape 2 : Stocker la sélection de l'utilisateur**

**Informations complémentaires :**

Si vous travaillez en Package ou en UCD, les méthodes prennent aussi bien les codes à 7 caractères que les codes à 13 caractères.

**Paramètres :**
- `q` : termes de recherche (un des mots commence par, ou un des mots contient avec $$)
- `Code` : CIP13, UCD13, EAN, CIP 7, UCD7, CIS, LPPR, EPHMRA, ATC, CIM10, MEDICABASE
- `Filter` : type d'entité attendu (product, ucd, package, molécule, atc_classification, vidal_classification, indication, indication_group, vmp, lppr, ephmra, pds, cim10), non sensible à la casse

NB : Ces paramètres sont cumulatifs et peuvent être répétés plusieurs fois chacun.

#### 4.3.3. Recherche par substance

Exemple : L'utilisateur recherche les spécialités contenant de l'amoxicilline comme principe actif

**Etape 1 :**

Recherchez la chaîne de caractères avec l'API `/rest/api/molecules/active-substances?q=Amox`

Récupérer l'identifiant de la molécule sélectionnée par l'utilisateur. Dans l'exemple, plusieurs molécules sont proposées, je sélectionne l'amoxicilline de moleculeId = 310.

**Etape 2 :**

- Si vous travaillez en Product : interrogez `/rest/api/molecule/active-substance/310/products`
  Exemple : `/rest/api/molecule/active-substance/310/products?association-type=BOTH&start-page=1&page-size=25` ou `/rest/api/molecule/active-substance/moleculeId/products?association-type=ONLY&start-page=1&page-size=25`
- Si vous travaillez en Package : interrogez `/rest/api/molecule/active-substance/310/products` et affichez la totalité des résultats des PACKAGES correspondants (lien RELATED)
- Si vous travaillez en UCD : interrogez `/rest/api/molecule/active-substance/310/products` et affichez la totalité des résultats des UCD correspondants (lien RELATED)
- Si vous travaillez en VMP : interrogez `/rest/api/molecule/active-substance/310/vmps`

**Etape 3 :** Stocker la sélection de l'utilisateur

#### 4.3.4. Recherche par libellé d'une DC (VMP)

Exemple pour le VMP 2957 - AMOXICILLINE 500 mg gél :

```
Summary: amoxicilline * 500 mg ; voie orale ; gél
Active Principle: amoxicilline
Medica Base Name: Amoxicilline 500 mg gélule
Route: orale
Galenic Form: gélule
Regulatory Generic Prescription: true
```

```xml
<id>/rest/api/vmp/2957</id>
<updated>2018-12-17T00:00:00Z</updated>
```

Informations complémentaires : Vous pouvez utiliser les VMP (ou Common Name Group) comme n'importe quel autre médicament. Ils peuvent être prescrits et sécurisés. Son code interopérable est le code MedicaBase.

#### 4.3.5. Rechercher un médicament pour une indication

Exemple : Afficher les médicaments indiqués pour une Cystite.

**Etape 1 :**

Recherchez avec l'API `/rest/api/indications?q=Cystite`, récupérer l'identifiant de l'indication sélectionnée par l'utilisateur (Plusieurs indications sont possibles).

| vidal://indication/3366 | 3366 | Cystite aiguë non compliquée |
|-------------------------|------|-------------------------------|

**Etape 2 :**

- Si vous travaillez en Product : interrogez `/rest/api/indication/3366/products`
- Si vous travaillez en Package : interrogez `/rest/api/product/productid/packages` pour chaque productid
- Si vous travaillez en UCD : interrogez `/rest/api/product/Productid/ucds`
- Si vous travaillez en VMP : interrogez `/rest/api/indication/3366/vmps`

**Etape 3 :** Stocker la sélection de l'utilisateur.

Informations complémentaires : Éventuellement avec les groupes d'indications `/rest/api/indication-group/355/products?start-page=8&page-size=25`

#### 4.3.6. Rechercher un médicament qui correspond à un indicateur

Il est possible d'avoir une liste de médicaments qui répondent à une combinaison d'indicateurs :

- **AND** : spécialités ayant l'indicateur xxx ET l'indicateur yyy (uniquement)
- **OR** : spécialités ayant l'indicateur xxx OU l'indicateur yyy (union)

Exemple d'application : rechercher tous les médicaments de type antibiotique

**Vous travaillez en Product :**
```
/rest/api/products/indicators?indicators=xxx&operator=AND&start-page=1&page-size=25
/rest/api/products/indicators?indicators=xxx&indicators=yyy&operator=OR&start-page=1&page-size=25
```

**Vous travaillez en Package :**
```
/rest/api/packages/indicators?indicators=xxx&indicators=yyy&operator=AND ou OR..
```

**Vous travaillez en UCD :**
```
/rest/api/ucds/indicators?indicators=xxx&indicators=yyy&operator=AND ou OR..
```

**Vous travaillez en VMP :**
```
/rest/api/vmps/indicators?indicators=xxx&indicators=yyy&operator=AND ou OR..
```

Exemple : pour rechercher tous les produits stupéfiants, indicateurs 15, 62 et 63, en spécialité :
```
/rest/api/products/indicators?indicators=15&indicators=62&indicators=63&operator=OR&start-page=1&page-size=125
```

**Vous travaillez en Prescriptible :**

Il est possible de remonter à un indicateur ou à une combinaison d'indicateurs en remontant sur l'UCD, depuis le prescriptible. Après avoir recherché le prescriptible (`/rest/api/prescribables?q=amox`), rechercher les UCD rattachés (`/rest/api/prescribable/5387/ucds`). Stocker l'ID de l'UCD et rechercher les indicateurs en lien (`/rest/api/ucd/1899/indicators`).

##### Liste des indicateurs

| IndicatorId | Name |
|-------------|------|
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

##### Indicateurs supplémentaires (voies, produits, données patient, documents, médicaments, caractéristiques, prescriptions)

**Voies d'administration :** Voie Aérosolthérapie, Voie cutanée, Voie Injectable, Voie ophtalmique, Voie transdermique

**Produits :** Produits diététiques, Reconstitué, Solvant de reconstitution associé

**Données patient :** Age, Poids, Grossesse, Allaitement, Rénal, Sexe

**Documents :** Ordonnancier, Ordonnancier + registre comptable des stupéfiants, Registre des produits dérivés du sang, Ordonnancier + registre des produits dérivés du sang

**Autres informations :** Taille, Stabilis

**Médicaments :**
- Médicament à surveillance renforcée
- Existence d'une prescription restreinte
- Anxiolytique
- Hypnotique
- Iodure de potassium
- Médicament contraception d'urgence
- Photosensible
- Médicament destiné à l'IVG
- Assimilés stupéfiants
- Stupéfiants
- Médicament d'exception

**Caractéristiques :**
- Tranches d'âge hétérogènes
- Excipients à effet notoire hétérogènes
- Dispositifs d'administration hétérogènes
- Présentations hétérogènes
- Indications hétérogènes

**Prescriptions :**
- Perfusion à domicile
- Prescriptible par Infirmier(ère)
- Prescriptible par Kinésithérapeute
- Prescriptible par Podologue
- Prescriptible par Sage-Femme

##### Indicateurs numériques (75-122)

| ID | Name |
|----|------|
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
| 104 | Médicament DHSC (Espagne) |
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

#### 4.3.7. Rechercher un médicament par rapport à sa forme et sa couleur (formes galéniques orales et sèches uniquement)

L'appel est en GET (Local et internet) :
```
/rest/api/products/form-color?form=pill&color=blue
```

- `form` : les formes (PASTILLE, PILL, GUM, CAPSULE, GEL - la casse n'est pas prise en compte)
- `color` : les couleurs (YELLOW, RED, ORANGE, BEIGE, BROWN, WHITE, GREEN, GREY, BLUE, PURPLE, PINK, COLORLESS, BLACK - la casse n'est pas prise en compte)

Précisions :
- PASTILLE = pastille
- PILL = comprimé
- GUM = Gomme à mâcher
- CAPSULE = capsule
- GEL = gélule

En passant une forme de comprimé et une couleur, vous pouvez trouver une liste de spécialités correspondantes.

### 4.4. Accéder à l'information d'un médicament

#### 4.4.1. Durée de présence des présentations dans la base VIDAL et gestion des ID

Les présentations sont conservées 5 ans après la date de fin de commercialisation dans la base VIDAL. Certaines modifications concernant les spécialités peuvent amener Vidal à créer de nouveaux identifiants pour ces spécialités. Pour les partenaires qui stockent ces identifiants, cela peut poser un souci de continuité, par exemple lors de renouvellement de prescriptions. Cette version met à disposition une nouvelle API qui permet à partir d'un identifiant, de récupérer le nouvel identifiant associé à ce médicament.

Données d'entrées possibles pour l'API : `GET../rest/api/substitutes?..`

- package/id ou product/id sous forme d'uri
- une liste d'uri (package et/ou product)

Retour de l'API : rappel des données d'entrées. Pour chaque identifiant demandé en entrée, si un nouvel identifiant est lié :
- le nouvel identifiant `<vidal:currentdrugid>` et son type associé `<vidal:drugtype>`
- le libellé du médicament
- pour les packages uniquement : les dates de début et fin de commercialisation
- le lien vers le nouvel identifiant

Si l'ancien identifiant est supprimé depuis plus de 5 ans après sa date de fin de commercialisation, il n'est plus disponible dans la base de données Vidal et l'API ne retourne pas de résultat.

Si l'identifiant demandé ne fait pas l'objet d'une modification d'identifiant, l'API ne retourne pas de résultat.

**Exemples d'appel :**

Depuis un packageid :
```
/rest/api/substitutes?uri=vidal://package/797037
```
```xml
<id>vidal://package/797037</id>
<vidal:currentdrugid>869350</vidal:currentdrugid>
<vidal:drugtype name="PACK">PACK</vidal:drugtype>
<vidal:name>PHOTODERM KID SPF50+ Spray Fl/200ml</vidal:name>
<vidal:onmarketdate format="yyyy-MM-dd">2019-02-25</vidal:onmarketdate>
<vidal:offmarketdate format="yyyy-MM-dd">2021-01-01</vidal:offmarketdate>
```

Depuis un productid :
```
/rest/api/substitutes?uri=vidal://product/96
```
```xml
<id>vidal://product/96</id>
<vidal:currentdrugid>233266</vidal:currentdrugid>
<vidal:drugtype name="PRODUCT">PRODUCT</vidal:drugtype>
<vidal:name>ACEBUTOLOL MERCK 200 mg cp pellic</vidal:name>
```

Depuis une liste d'uri :
```
rest/api/substitutes?uri=vidal://product/63258&uri=vidal://package/36151
```

A titre informatif, voici des exemples de cas qui peuvent amener Vidal à créer de nouveaux identifiants :
- changement de nom de marque
- changement de nom de laboratoire dans les noms des médicaments génériques
- modification de la forme pharmaceutique
- modification du dosage

#### 4.4.2. Informations de description du médicament : interprétation du résultat d'une recherche

Si vous travaillez en Product : `/rest/api/products?q=` « Spécialités X » puis sélectionnez la spécialité.

Si vous travaillez en Package : `/rest/api/packages?q=` « Présentations X » puis sélectionnez la présentation.

Exemple pour `/rest/api/product?q=doliprane` puis sélection de DOLIPRANE 1000 mg cp :

```xml
<id>vidal://product/19649</id>
<vidal:id>19649</vidal:id>
<vidal:name>DOLIPRANE 1000 mg cp</vidal:name>
<vidal:horsghs>false</vidal:horsghs>
<vidal:midwife>true</vidal:midwife>
<vidal:druginsport>false</vidal:druginsport>
<vidal:retrocession>false</vidal:retrocession>
<vidal:itemtype name="VIDAL">VIDAL</vidal:itemtype>
<vidal:marketstatus name="AVAILABLE">Commercialisé</vidal:marketstatus>
<vidal:exceptional>false</vidal:exceptional>
<vidal:haspublisheddoc>true</vidal:haspublisheddoc>
<vidal:withoutprescription>true</vidal:withoutprescription>
<vidal:ammtype vidalId="20">AMM Française</vidal:ammtype>
<vidal:dispensationplace name="PHARMACY">PHARMACY</vidal:dispensationplace>
<vidal:becareful>false</vidal:becareful>
<vidal:refundrate name="_65" rate="65">65%</vidal:refundrate>
<vidal:bestdoctype name="MONO">MONO</vidal:bestdoctype>
<vidal:pervolume>1000mg</vidal:pervolume>
<vidal:safetyalert>true</vidal:safetyalert>
<vidal:activeprinciples>paracétamol</vidal:activeprinciples>
<vidal:onmarketdate format="yyyy-MM-dd">2002-12-23</vidal:onmarketdate>
<vidal:cis>60234100</vidal:cis>
<vidal:minucdrangeprice>0.145</vidal:minucdrangeprice>
<vidal:maxucdrangeprice>0.145</vidal:maxucdrangeprice>
<vidal:divisibility>1</vidal:divisibility>
<vidal:company type="OWNER" vidalId="5983">Opella Healthcare France SAS</vidal:company>
<vidal:vmp vidalId="3170">paracétamol * 1 g ; voie orale; cp</vidal:vmp>
<vidal:galenicform vidalId="59">comprimé</vidal:galenicform>
```

##### 4.4.2.1. Type de produit

L'attribut Itemtype d'un product ou d'un package permet de déterminer le type du produit dans la liste suivante :

- **VIDAL** : médicament à usage humain
- **DIETETIC** : produit de diététique
- **VETERINARY** : médicament, produit ou accessoire vétérinaire
- **NON_PHARMACEUTICAL** : produit d'hygiène-cosmétologie
- **ACCESSORY** : accessoires et DM
- **MISCELLANEOUS** : produits officinaux divisés, produits en vrac
- **HOMEOPATHIC** : SNC homéopathique (catalogues des souches)
- **BALNEOLOGY** : station ou produit de thermalisme

Pour limiter les résultats lors de la recherche sur des médicaments, nous vous recommandons d'automatiser le filtrage sur les Itemtype "VIDAL".

##### 4.4.2.2. Statut de commercialisation

L'attribut marketStatus d'un produit ou d'un pack vous donne son état de commercialisation :

Rechercher par Status : `/rest/api/products?status=`

Exemple retrouver les nouveaux produits du marché : `/rest/api/products?status=NEW`

- **NEW** : produit nouveau, mis sur le marché depuis moins d'1 an de date à date
- **AVAILABLE** : produit disponible, c'est-à-dire commercialisé
- **DELETED** : produit supprimé depuis plus de 5 ans de date à date
- **DELETED_ONEYEAR** : produit supprimé depuis moins d'1 an de date à date
- **PHARMACO** : produit supprimé pour pharmacovigilance depuis plus de 5 ans de date à date
- **PHARMACO_ONEYEAR** : produit supprimé pour pharmacovigilance depuis moins d'1 an de date à date

Les produits NEW et AVAILABLE sont disponibles à la vente. Les produits DELETED et DELETED_ONE_YEAR ne sont plus commercialisés mais les stocks restants peuvent être écoulés. Les produits PHARMACO et PHARMACO_ONE_YEAR sont supprimés pour pharmacovigilance, il n'est pas possible de les prescrire, de les dispenser ou de les administrer à un patient.

##### 4.4.2.3. Lieu de dispensation

L'attribut dispensationPlace d'un produit ou d'un pack permet de déterminer le lieu où le médicament peut être dispensé :

- **PHARMACY** : le médicament peut être trouvé dans une officine de ville
- **HOPITAL** : le médicament sera uniquement trouvé dans un centre de soins

Cette information ne doit pas être confondue avec la réserve hospitalière.

##### 4.4.2.4. Libellé adapté à l'ordonnance et à l'ordonnance numérique (DC ou nom de marque)

Depuis le 1er janvier 2015, la prescription en dénomination commune (DC) est obligatoire pour toutes les spécialités, le nom de marque de la spécialité devenant facultatif.

Des exceptions existent notamment pour l'ordonnance électronique. Dans certaines situations il n'est pas adapté de formuler une prescription de médicament à l'aide de sa Dénomination Commune et il est nécessaire de mentionner un nom de marque :

- Spécialités pharmaceutiques comportant plus de trois principes actifs
- Spécialités pharmaceutiques dont un principe actif ne peut pas être désigné par une dénomination commune
- Spécialités comportant des unités de prescription de composition différente
- Médicaments immunologiques de type allergène, vaccin, sérum, toxine
- Médicaments biologiques dont les biologiques similaires
- Médicaments dérivés du sang

Pour vos ordonnances :
- Si vous prescrivez en Product / package / UCD il faut utiliser le libellé VIDAL Summary Type
- Si vous prescrivez en VMP, il faut vérifier le statut de la balise Regulatory Generic Prescription :
  - `true` => vous pouvez prescrire en VMP et afficher le libellé VMP sur une ordonnance
  - `false` => il ne faut pas prescrire en VMP pour cette spécialité, il faut utiliser le libellé summary type pour les ordonnances

##### 4.4.2.5. Produits non sécurisés

Certains produits particuliers comme les médicaments qui bénéficient d'une AAC/AAP (Autorisation d'Accès Compassionnel, ou Autorisation d'Accès Précoce, anciennement ATU) ne sont pas sécurisés : aucune alerte n'est renvoyée par VIDAL.

L'attribut `safetyAlert`, disponible au niveau du product, vous indique si le produit est sécurisé.

Si `safetyAlert = false`, le produit n'est pas sécurisé. Il faut alors afficher le message suivant en haut de l'analyse d'ordonnance : « Attention : les produits suivants sont exclus de la sécurisation de la prescription ».

Pour déterminer la raison de l'absence de données de sécurisation :
- marketStatus est NEW : la raison est (produit nouveau)
- marketStatus est DELETED ou DELETED_ONEYEAR : la raison est (produit supprimé)
- marketStatus est PHARMACO ou PHARMACO_ONEYEAR : la raison est (produit supprimé pour pharmacovigilance)
- marketStatus est AVAILABLE et ammType est ATU_NOM : la raison est (ATU nominative)
- Autre cas : la raison est l'absence de données

#### 4.4.3. Informations administratives et réglementaires

##### 4.4.3.1. Récupérer les restrictions de prescription

Certains produits possèdent des restrictions de prescription : ces restrictions doivent être affichées au moment de la prescription car ce sont des informations réglementaires.

Exemples non exhaustifs :
- Durée de prescription limitée (ex: 28 jours maximum pour une prescription de Stilnox)
- Réservé à l'usage hospitalier = réserve hospitalière
- Prescription hospitalière : le médicament ne peut être prescrit que dans un établissement de soins
- Prescription initiale hospitalière : la prescription initiale doit se faire dans un centre de soins, le renouvellement peut se faire en ville

**Etape 1 :**
- Si vous travaillez en Product : `/rest/api/product/id/restricted-prescriptions`
- Si vous travaillez en Package : `/rest/api/product/id/restricted-prescriptions`
- Si vous travaillez en UCD : `/rest/api/product/id/restricted-prescriptions`
- Si vous travaillez en Prescriptible : interroger au préalable l'API pour retrouver l'UCD correspondante
- Si vous travaillez en VMP : passez par l'un des productId susceptibles d'être dispensé

**Etape 2 :** Restrictions de prescription possibles :

| ID | Libellé | Code remboursement |
|----|---------|-------------------|
| 11 | Réservé à l'usage hospitalier | RH |
| 12 | Prescription hospitalière | PH |
| 13 | Prescription initiale hospitalière | PIH |
| 14 | Prescription par spécialiste | PRS |
| 15 | Surveillance particulière | SP |
| 16 | Prescription initiale par spécialiste | PIRS |
| 17 | Prescription sur ordonnance sécurisée | PVOS |
| 18 | Prescription obligatoire du nom du pharmacien sur l'ordonnance | IONPO |
| 19 | Réservé à l'usage militaire | RM |
| 21 | Renouvellement non restreint | |
| 22 | Renouvellement uniquement par des spécialistes exerçant à l'Hôpital | |
| 23 | Renouvellement uniquement par des spécialistes de ville | |
| 24 | Renouvellement uniquement par des spécialistes (exerçant en Ville et/ou à l'Hôpital) | |
| 26 | Renouvellement possible sur ordonnance sécurisée | |
| 28 | Interdiction de renouvellement de la même prescription | |

**Autre méthode :** Lors de la sécurisation d'une ordonnance : `/rest/api/alerts/full?app_id=xxx&app_key=YYY`

Dans le retour de la sécurisation, balise `<INDICATOR>` sous type "RESTRICTED_PRESCRIPTION"

Différents sous types de la balise "INDICATOR" :
- **COLLECTIVITY_AGREMENT** : le médicament n'est PAS agréé aux collectivités
- **DOPING** : le médicament est dopant
- **GENERIC_GROUP** : le médicament est inscrit au répertoire des génériques
- **NARCOTIC** : le médicament est un stupéfiant ou assimilé
- **RESTRICTED_PRESCRIPTION** : le médicament possède au moins une restriction de prescription
- **VIGILANCE** : il existe une vigilance liée à la conduite pour ce médicament

Sévérité : INFO = Tous les indicateurs sont de niveau information.

##### 4.4.3.2. Récupérer l'information dopant

Exemple : Afficher le caractère dopant de l'EPREX.

- Si vous travaillez en Product : `/rest/api/product/id` - attribut `drugInSport` (true = dopant)
- Si vous travaillez en Package : `/rest/api/package/id` - attribut `drugInSport`
- Si vous travaillez en UCD : récupérez le product lié avec `/rest/api/product/id/ucds`
- Si vous travaillez en Prescriptible : interroger au préalable l'API pour retrouver l'UCD correspondante

Autre méthode : Dans le retour de la sécurisation, balise `<INDICATOR>` sous type "DOPING"

##### 4.4.3.3. Récupérer l'information "stupéfiant" ou "assimilé stupéfiant"

Exemple : Afficher l'information "Stupéfiant" pour le SUBUTEX 8 mg cp.

**Etape 1 :**
- En Product : `/rest/api/product/Id/indicators`
- En Package : `/rest/api/package/Id/indicators`
- En UCD : `/rest/api/ucd/Id/indicators`
- En Prescriptible : retrouver d'abord l'UCD correspondante
- En VMP : `/rest/api/vmp/Id/indicators`

**Etape 2 :** Les indicateurs [ID=15 ; Stupéfiants et assimilés stupéfiants], [ID=62 ; Assimilés stupéfiants] et [ID=63 ; Stupéfiants] indiquent que le produit est soumis à la réglementation sur les stupéfiants.

**Etape 3 :** Si l'indicateur stupéfiant est présent, il faut afficher une icône stupéfiant.

##### 4.4.3.4. Récupérer les risques concernant la conduite

Exemple : Afficher le risque concernant la conduite lié au LEXOMIL.

**Etape 1 :**
- En Product : `/rest/api/product/id` - attribut `vigilance`
- En Package : `/rest/api/package/id` - attribut `vigilance`
- En UCD : passez par le product ou le pack
- En Prescriptible : retrouver d'abord l'UCD

**Etape 2 :** Valeurs possibles de l'attribut vigilance :

| Valeur | Description |
|--------|-------------|
| VIGILANCE_0 | pas d'effet sur la vigilance |
| VIGILANCE_1 | vigilance de type "soyez prudent" |
| VIGILANCE_2 | vigilance de type "soyez très prudent" |
| VIGILANCE_3 | vigilance de type "attention, danger" |
| VIGILANCE_5 | vigilance de type "provisoire" |
| UNSPECIFIED | vigilance non définie |

**Etape 3 :** Afficher la vigilance ainsi que l'icône sur la ligne de prescription.

##### 4.4.3.5. Récupérer l'agrément aux collectivités

Exemple : Afficher l'agrément aux collectivités du NOCTAMIDE

L'agrément collectivités est une propriété du package. Un package est agréé aux collectivités si `communityAgreement = true`.

**Etape 1 :**
- En Package : `/rest/api/packages?q=noctamide` puis `/rest/api/package/25155`
- En Product : `/rest/api/products?q=XXX` puis `/rest/api/product/productid/packages`
- En UCD : `/rest/api/ucds?q=UCDXXX` puis `/rest/api/ucd/UCDid/packages`
- En Prescriptible : retrouver au préalable l'UCD correspondante

##### 4.4.3.6. Afficher les produits génériques/référent (nom de marque, nom de gamme, nom fantaisie)

Une spécialité générique d'une spécialité de référence est celle :
- qui a la même composition qualitative et quantitative en principe actif
- qui a la même forme pharmaceutique
- et dont la bioéquivalence avec la spécialité de référence est démontrée

L'attribut `GenericType` indique si c'est un médicament Référent (`<Référent>`) ou générique (`<Générique>`).

Exemple - Référent :
```xml
<vidal:generictype name="REFERENT">Référent</vidal:generictype>
```

Exemple - Générique :
```xml
<vidal:generictype name="GENERIC">Générique</vidal:generictype>
```

##### 4.4.3.7. Récupérer la gamme de prix UCD

- En Product : attributs `minUCDRangePrice` et `maxUcdRangePrice`
- En Package : attribut `pricePerDose` ou `UcdPrice`

##### 4.4.3.8. Récupérer les prix des présentations et les bases de remboursement

En Product : `/rest/api/product/id`
```xml
<vidal:refundrate name="_65">65%</vidal:refundrate>
<vidal:minucdrangeprice>0.145</vidal:minucdrangeprice>
<vidal:maxucdrangeprice>0.145</vidal:maxucdrangeprice>
```

En Package : `/rest/api/package/id`
```xml
<vidal:refundrate name="_65">65%</vidal:refundrate>
<vidal:ucdprice>0.145</vidal:ucdprice>
<vidal:refundingbase>1.16</vidal:refundingbase>
<vidal:publicprice>1.16</vidal:publicprice>
<vidal:tfr>false</vidal:tfr>
<vidal:priceperdose>0.145</vidal:priceperdose>
```

Signification des attributs :
- `publicPrice` : prix public TTC
- `refundingBase` : base de remboursement
- `refundingRate` : taux de remboursement
- `tfr` : booléen indiquant si la présentation possède un Tarif Forfaitaire de Remboursement

En UCD : `/rest/api/ucd/Id` (Prix uniquement)

##### 4.4.3.9. Les indications LES pour les médicaments hors GHS pour le MCO

Pour savoir si un médicament est soumis à la saisie d'indications LES :
```
/rest/api/{ucd ou package ou product}/{ID}/indicators
```

Si l'indicateur `vidalid="81"` (Médicament avec Indication LES) est présent.

API pour les indications LES MCO :
- `/rest/api/indication-les` - Afficher toutes les indications LES
- `/rest/api/indication-les/{id}` - Détail d'une indication LES
- `/rest/api/product/{id}/indications?type=LES` - Indications LES d'une spécialité
- `/rest/api/indications?codeLES=code` - Rechercher par code
- `/rest/api/vmp/{id}/indications?type=LES`
- `/rest/api/ucd/{id}/indications?type=LES`
- `/rest/api/package/{id}/indications?type=LES`
- `/rest/api/indication-les/{id}/vmps`
- `/rest/api/indication-les/{id}/ucds`
- `/rest/api/indication-les/{id}/packages`
- `/rest/api/indication-les/{id}/products`
- `/rest/api/product/{id}/indications?type=ATU` - Indications ATU

##### 4.4.3.10. Les indications LES pour les médicaments hors GHS pour le SSR

Si l'indicateur `vidalid="110"` (Médicament avec Indication SSR) est présent.

API pour les indications LES SSR :
- `/rest/api/indication-ssr` - Liste complète
- `/rest/api/indication-ssr/{id}` - Par ID
- `/rest/api/indications?codeSSR=code` - Par code
- `/rest/api/product/{id}/indications?type=SSR`
- `/rest/api/vmp/{id}/indications?type=SSR`
- `/rest/api/ucd/{id}/indications?type=SSR`
- `/rest/api/package/{id}/indications?type=SSR`
- `/rest/api/indication-ssr/{id}/vmps`
- `/rest/api/indication-ssr/{id}/ucds`
- `/rest/api/indication-ssr/{id}/packages`
- `/rest/api/indication-ssr/{id}/products`

#### 4.4.4. Informations de galénique : forme, composition, voies et divisibilité

##### 4.4.4.1. Forme galénique

- Toutes les formes galéniques : `/rest/api/galenic-forms`
- Détail d'une forme galénique : `/rest/api/galenic-form/{id}`
- Pour un Product / Package / UCD : attribut `<vidal:galenicform>`

##### 4.4.4.2. Sécabilité d'un comprimé

`/rest/api/package/{PackID}` - Balise : `<vidal:divisibility>`

Valeurs :
- `true` : "divisible"
- `1` : "non-divisible"
- `2` : "divisible par 2"
- `4` : "divisible par 4"
- `Nul` : absence de données

L'information est également portée par l'indicateur Sécable ID=13.

##### 4.4.4.3. Médicament écrasable ou ouvrable

Indicateurs sur le médicament :
- 116 : médicament écrasable
- 117 : médicament non écrasable
- 118 : médicament ouvrable
- 119 : médicament non ouvrable

##### 4.4.4.4. Composition

Composition complète :
- Product : `/rest/api/product/{PdtID}/molecules`
- Package : remonter au ProductID puis `/rest/api/product/{PdtID}/molecules`
- UCD : remonter au ProductID puis `/rest/api/product/{PdtID}/molecules`
- VMP : `/rest/api/vmp/{VMPID}/molecules`

Excipients actifs :
- Product : `/rest/api/product/{PdtID}/molecules/active-excipients`
- Package : remonter au ProductID
- UCD : remonter au ProductID

##### 4.4.4.5. Voies

Voies d'administration d'un médicament :
- Product : `/rest/api/product/{PdtID}/routes`
- Package : `/rest/api/package/{packID}/routes`
- UCD : `/rest/api/ucd/{UCDID}/routes`
- VMP : `/rest/api/vmp/{VMPID}/routes`

Toutes les voies d'administration : `/rest/api/routes`

Ordre d'affichage des voies : `<vidal:ranking>0</vidal:ranking>` (0 = premier rang)

Voies AMM ou hors AMM : `<vidal:outofspc>false</vidal:outofspc>` (false = AMM, true = hors AMM)

Les voies hors AMM correspondent à des pratiques terrain validées par les scientifiques VIDAL. Elles ne sont pas sécurisées : une alerte "posologie impossible à vérifier" sera déclenchée.

#### 4.4.5. Informations thérapeutiques structurées

##### 4.4.5.1. Afficher les indications d'un médicament

Les indications d'une spécialité sont disponibles avec : `/rest/api/product/product_id/indications`

Cet appel renvoie des indications (indications de l'AMM) et des groupes d'indications (regroupement d'indications de même famille). Les groupes d'indications sont utiles pour la gestion des antécédents : ils permettent d'identifier un antécédent CIM10 à partir d'un terme générique.

Préconisation VIDAL : proposer la saisie d'une indication de manière facultative, pour le prescripteur afin d'affiner les contrôles de sécurisation.

##### 4.4.5.2. Afficher la liste des effets indésirables par médicament

- `/rest/api/product/product_id/side-effects`
- `/rest/api/package/package_id/side-effects`
- `/rest/api/ucd/ucd_id/side-effects`
- `/rest/api/vmp/vmp_id/side-effects`

Chaque effet indésirable comporte son appareil et sa fréquence.

##### 4.4.5.3. Afficher les contre-indications d'un médicament

- `/rest/api/product/product_id/contraindications`
- `/rest/api/vmp/vmp_id/contraindications`

Use case : Utile par exemple pour vérifier si une spécialité peut être prescrite pour une femme qui allaite.

#### 4.4.6. Afficher les affections de longue durée d'une spécialité

Use case : le prescripteur veut vérifier si un médicament va être pris en charge à 100% dans le cadre d'une ALD du patient :
```
/rest/api/product/product_id/alds
```

#### 4.4.7. Afficher les informations de conservation et de conditionnement

##### 4.4.7.1. Rechercher les informations de conservation (Package uniquement)

Les API permettent d'afficher la durée de conservation, le type de conservation, la température Min/Max de conservation, si le produit peut être déballé oui/non, et les précautions de conservation. Disponible uniquement en package.

```
/rest/api/package/163556?aggregate=STORAGE
```

Exemple de retour :
```xml
<entry xmlns:vidal="http://api.vidal.net/-/spec/vidal-api/1.0/" vidal:categories="STORAGE">
  <category term="STORAGE">
    <id>vidal://storage/16355600001200062</id>
    <content>
      <vidal:id>16355600001200062</vidal:id>
      <vidal:storagemaxtemperature>8</vidal:storagemaxtemperature>
    </content>
  </category>
</entry>
```

##### 4.4.7.2. Rechercher les informations de conditionnement (le contenant / contenu du Package)

Quelques cas de figure :
- Pour le SINTROM : 3 plaquettes thermoformées de 10 comprimés (total 30)
- Pour le GRANOCYTE : 1 seringue pré-remplie avec solvant + 1 flacon de poudre
- La CARBOSYLANE : 2 plaquettes thermoformées, 12 gélules rouges et 12 bleues (24 doses)
- Le DAILY : 1 plaquette thermoformée, 5 cp roses, 6 cp blancs et 10 cp jaunes (21 total)

#### 4.4.8. Explorer les classifications d'un médicament

##### 4.4.8.1. Rechercher les produits d'une classe ATC à partir du code

Exemple : L'utilisateur recherche les produits de la classe N05CD

**Etape 1 :**
```
/rest/api/search?code=N05CD&filter=ATC_CLASSIFICATION
```

**Etape 2 :**
- En Product : `/rest/api/atc-classification/4595/products`
- En VMP : `/rest/api/atc-classification/4595/vmps`
- En Package : passer par le product puis `/rest/api/product/productid/packages`
- En UCD : passer par le product puis `/rest/api/product/Productid/ucds`

##### 4.4.8.2. Rechercher les produits d'une classe ATC à partir de son libellé

```
/rest/api/search?q=derive de la benzodiazepine&filter=atc_classification
```

Recherche par nom de molécule : `/rest/api/atc-classifications?q=AMOXICILLINE`

Pour obtenir les codes enfants : `/rest/api/atc-classification/4595/children`
Pour obtenir les molécules : `/rest/api/atc-classification/4595/molecules`
Pour obtenir la classification ATC complète : `/rest/api/atc-classification/all`

##### 4.4.8.3. Afficher une classification et son arbre

- Classification ATC d'une spécialité : `/rest/api/product/150144/atc-classification`
- Classification thérapeutique VIDAL : `/rest/api/product/150144/vidal-classification`
- Classification SAUMON (parapharmacie, package uniquement) : `/rest/api/package/732091/saumon-classification`
- Classification SFMG :
  - Recherche par nom : `rest/api/search?q=&filter=SFMG_CLASSIFICATION`
  - DUMP paginé : `rest/api/sfmg-classifications`
  - Recherche par nom paginé : `rest/api/sfmg-classifications?q=`
  - Accès direct par ID : `rest/api/sfmg-classification/{id}`
  - Recherche partout par nom : `rest/api/search?q={text}`

#### 4.4.9. Rechercher les documents d'un médicament

Types de documents disponibles :
- **FULL_MONO** : monographie VIDAL (présentation, spécialité ou UCD)
- **VMP_FR** : Fiche DCI (VMP)
- **SAUMON** : fiche saumon des produits de parapharmacie
- **VDF** : Fiche VIDAL grand public (VIDAL de la Famille)
- **MONO_SUPP** : Monographie des médicaments supprimés
- **RCP** : Résumé de Caractéristiques du Produit
- **FIT** : Fiche d'Information Thérapeutique des médicaments d'exception
- **PGR** : Plan de Gestion des Risques
- **BUM** : Fiche de Bon Usage du Médicament
- **RTU** : Recommandations Temporaires d'Utilisation
- **ALD** : Affection de longue durée
- **AVIS** : Avis de la commission de transparence
- **INFO_SHEET** : Fiche Conseil (spécialité avec surveillances particulières)
- **RAPPE** : Rapport public d'évaluation
- **SMR/ASMR** : service médical rendu / amélioration du service médical rendu

##### 4.4.9.1. Récupérer la monographie d'un médicament

- En Product : `/rest/api/product/10421/documents`
- En Package : `/rest/api/package/Packid/documents`
- En UCD : affichez le document du product

---

> **Note : Le PDF original comporte plus de 50 pages. Les sections suivantes (pages 51 à la fin) concernant le SMR/ASMR, les VIDAL Recos, les SAM, les actualités thérapeutiques, la LPPR, le Prescriptible, les cas d'usages métiers, les substitutions/équivalences, le dossier patient (allergies, pathologies, CIM-10, ALD), la sécurisation (body patient, lignes de prescription, analyse d'ordonnance, alertes, coût, imputabilité) et les services complémentaires n'ont pas pu être extraites par l'outil de parsing limité à 50 pages.**
>
> **Pour accéder à ces sections, il est recommandé de consulter directement le PDF original.**

---

*Document transcrit à partir du PDF "Manuel d'intégration API VIDAL - Sécurisation" pour référence interne.*
