

# Enrichissement du Referentiel Pharmacie via VIDAL

## Objectif

Enrichir les trois composants du module Referentiel (DCI, Classes therapeutiques, Formes galeniques) avec des fonctionnalites d'auto-completion et de synchronisation depuis l'API VIDAL.

---

## 1. Auto-completion VIDAL pour les DCI

### 1.1 Migration SQL : nouvelles colonnes dans `dci`

Ajouter des colonnes pour stocker les identifiants VIDAL et les donnees structurees :

```sql
ALTER TABLE public.dci
  ADD COLUMN IF NOT EXISTS vidal_substance_id integer,
  ADD COLUMN IF NOT EXISTS vidal_name text;
```

### 1.2 Edge Function : nouvelle action `search-substances`

Fichier : `supabase/functions/vidal-search/index.ts`

Ajouter l'action `search-substances` :
- Appelle `GET /rest/api/molecules/active-substances?q={query}` avec les credentials VIDAL
- Parse la reponse XML ATOM pour extraire : id, nom de la substance
- Pour chaque substance trouvee, appelle optionnellement `/rest/api/molecule/active-substance/{id}/vmps` pour recuperer les contre-indications et effets secondaires associes (via `/rest/api/vmp/{id}/contraindications` et `/rest/api/vmp/{id}/side-effects`)
- Retourne un tableau de substances avec leurs identifiants et informations

**Note** : Pour eviter trop d'appels API en cascade, l'enrichissement detaille (contre-indications, effets secondaires) sera disponible via un bouton "Enrichir depuis VIDAL" une fois la substance selectionnee, plutot qu'a chaque frappe de recherche.

Ajouter aussi une action `get-substance-details` :
- Appelle `/rest/api/molecule/active-substance/{id}` pour les infos de base
- Appelle `/rest/api/molecule/active-substance/{id}/vmps` pour lister les VMP
- Pour le premier VMP trouve, appelle `/rest/api/vmp/{vmpId}/contraindications` et `/rest/api/vmp/{vmpId}/side-effects`
- Parse et retourne les contre-indications et effets secondaires structures en texte

### 1.3 Fichier : `src/components/dashboard/modules/referentiel/DCIManager.tsx`

Modifications du formulaire d'ajout/edition :
- Ajouter un champ de recherche VIDAL au-dessus du champ "Nom de la DCI" avec un bouton "Rechercher dans VIDAL"
- Quand l'utilisateur tape et lance la recherche : appeler l'edge function `vidal-search` avec action `search-substances`
- Afficher les resultats dans une liste deroulante sous le champ de recherche
- Quand une substance est selectionnee :
  - Pre-remplir `nom_dci` avec le nom VIDAL
  - Stocker `vidal_substance_id`
- Ajouter un bouton "Enrichir depuis VIDAL" visible quand `vidal_substance_id` est present :
  - Appelle `get-substance-details` pour recuperer contre-indications et effets secondaires
  - Pre-remplit les champs `contre_indications` et `effets_secondaires` du formulaire

---

## 2. Classifications ATC et VIDAL pour les classes therapeutiques

### 2.1 Migration SQL : nouvelles colonnes dans `classes_therapeutiques`

```sql
ALTER TABLE public.classes_therapeutiques
  ADD COLUMN IF NOT EXISTS code_atc text,
  ADD COLUMN IF NOT EXISTS vidal_classification_id integer,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.classes_therapeutiques(id);
```

### 2.2 Edge Function : nouvelle action `search-atc`

Fichier : `supabase/functions/vidal-search/index.ts`

Ajouter l'action `search-atc` :
- Appelle `GET /rest/api/search?code={query}&filter=ATC_CLASSIFICATION` avec les credentials
- Parse la reponse XML pour extraire : id ATC VIDAL, code ATC, libelle
- Retourne le tableau des classifications trouvees

Ajouter aussi l'action `get-atc-children` :
- Appelle `GET /rest/api/atc-classification/{id}/children`
- Retourne les sous-niveaux de l'arborescence ATC
- Permet une navigation hierarchique

### 2.3 Fichier : `src/components/dashboard/modules/referentiel/TherapeuticClassManager.tsx`

Modifications :
- Ajouter un bouton "Importer depuis VIDAL (ATC)" dans l'en-tete
- Ouvre un dialog de recherche ATC :
  - Champ de saisie du code ou libelle ATC
  - Affiche les resultats avec code ATC et libelle
  - Bouton "Importer" pour chaque resultat : cree une classe therapeutique avec `code_atc`, `libelle_classe` (libelle ATC), `systeme_anatomique` deduit de la premiere lettre du code ATC (mapping A=Digestif, B=Sang, C=Cardiovasculaire, etc.)
- Afficher la colonne "Code ATC" dans le tableau existant
- Ajouter le champ `code_atc` au formulaire d'ajout/edition

---

## 3. Synchronisation des formes galeniques VIDAL

### 3.1 Migration SQL : nouvelle colonne dans `formes_galeniques`

```sql
ALTER TABLE public.formes_galeniques
  ADD COLUMN IF NOT EXISTS vidal_form_id integer;
```

### 3.2 Edge Function : nouvelle action `search-galenic-forms`

Fichier : `supabase/functions/vidal-search/index.ts`

Ajouter l'action `search-galenic-forms` :
- Appelle `GET /rest/api/galenic-forms?q={query}` (ou sans query pour lister toutes)
- Parse la reponse XML ATOM pour extraire : id, nom de la forme galenique
- Retourne le tableau des formes

### 3.3 Fichier : `src/components/dashboard/modules/referentiel/FormesManager.tsx`

Modifications :
- Ajouter un bouton "Synchroniser depuis VIDAL" dans l'en-tete de la carte
- Ouvre un dialog avec :
  - Champ de recherche optionnel pour filtrer les formes VIDAL
  - Tableau des formes VIDAL trouvees avec checkbox de selection
  - Indication si la forme existe deja localement (par comparaison de libelle)
  - Bouton "Importer les selectionnees" : cree les formes manquantes dans `formes_galeniques` avec le `vidal_form_id`
- Afficher un badge "VIDAL" a cote des formes synchronisees dans le tableau principal

---

## Section technique

### Mapping ATC systeme anatomique (premiere lettre)

```text
A -> Voies digestives et metabolisme
B -> Sang et organes hematopoietiques
C -> Systeme cardiovasculaire
D -> Medicaments dermatologiques
G -> Systeme genito-urinaire et hormones sexuelles
H -> Hormones systemiques (hors sexuelles)
J -> Anti-infectieux generaux a usage systemique
L -> Antineoplasiques et immunomodulateurs
M -> Systeme musculo-squelettique
N -> Systeme nerveux
P -> Antiparasitaires, insecticides et repulsifs
R -> Systeme respiratoire
S -> Organes sensoriels
V -> Divers
```

### Endpoints VIDAL utilises

```text
Substances (DCI) :
  GET /rest/api/molecules/active-substances?q={query}
  GET /rest/api/molecule/active-substance/{id}
  GET /rest/api/molecule/active-substance/{id}/vmps
  GET /rest/api/vmp/{id}/contraindications
  GET /rest/api/vmp/{id}/side-effects

Classifications ATC :
  GET /rest/api/search?code={code}&filter=ATC_CLASSIFICATION
  GET /rest/api/atc-classification/{id}/children

Formes galeniques :
  GET /rest/api/galenic-forms
  GET /rest/api/galenic-forms?q={query}
```

### Structure des reponses XML attendues (substances)

```xml
<entry>
  <id>vidal://molecule/active-substance/310</id>
  <title>Amoxicilline</title>
  <summary>Amoxicilline</summary>
</entry>
```

### Structure des reponses XML attendues (formes galeniques)

```xml
<entry>
  <id>vidal://galenic-form/47</id>
  <title>comprime pellicule</title>
</entry>
```

### Fichiers modifies

- `supabase/functions/vidal-search/index.ts` : 3 nouvelles actions (search-substances, get-substance-details, search-atc, get-atc-children, search-galenic-forms)
- `src/components/dashboard/modules/referentiel/DCIManager.tsx` : auto-completion VIDAL + enrichissement
- `src/components/dashboard/modules/referentiel/TherapeuticClassManager.tsx` : import ATC VIDAL
- `src/components/dashboard/modules/referentiel/FormesManager.tsx` : synchronisation formes VIDAL
- Migration SQL : nouvelles colonnes sur les 3 tables referentielles

