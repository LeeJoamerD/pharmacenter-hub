# Plan : Champs géographiques avec listes "sélectionnables avec ajout"

## Contexte de la base de données

La table `pharmacies` contient déjà toutes les colonnes nécessaires :
- `pays`, `region`, `departement`, `arrondissement`, `quartier`, `city`

Mais les UI actuels utilisent encore `region` comme s'il s'agissait du pays, et les champs Pays/Département/Arrondissement/Quartier sont soit absents, soit en saisie libre. Données existantes incohérentes (ex. Kinshasa avec `pays = "République du Congo"`).

## Stratégie : Combobox "créer-si-absent"

Pour chacun des 4 champs (pays, département, arrondissement, quartier), nous allons :
- Afficher un **Combobox** (Popover + Command de shadcn) avec recherche
- Lister les valeurs déjà connues (issues d'une table de référence)
- Si l'utilisateur tape une valeur **inexistante**, afficher en bas une option "+ Ajouter "<valeur>"" qui l'insère immédiatement dans la table de référence puis la sélectionne
- Hiérarchie respectée : Département filtré par Pays, Arrondissement par Département, Quartier par Arrondissement

## 1. Base de données

### Nouvelle table de référence `geo_locations` (globale, partagée par tous les tenants)
```text
id              uuid PK
type            enum('pays','departement','arrondissement','quartier')
nom             text
parent_id       uuid (FK self) -- département → pays, arrondissement → département, etc.
created_by      uuid (auth user, nullable pour les seeds)
created_at      timestamptz
UNIQUE (type, nom, parent_id)
```

- RLS : SELECT pour `authenticated`, INSERT pour `authenticated` (n'importe quel utilisateur connecté peut enrichir le référentiel), UPDATE/DELETE réservés à `is_platform_admin()`.
- Seed initial : "République du Congo", "République Démocratique du Congo", "Cameroun", "France", "Gabon", etc., et quelques départements connus (Brazzaville, Kinshasa…).

### Migration de données
- Pour chaque ligne de `pharmacies`, copier l'ancienne valeur `region` vers `pays` **uniquement si `pays` est vide ou aberrant** (ex. Kinshasa).
- Ne pas supprimer la colonne `region` : la marquer dépréciée mais la conserver pour compatibilité (utilisée par d'anciens rapports). Elle ne sera plus exposée dans l'UI.

## 2. Composant réutilisable

Créer `src/components/ui/CreatableCombobox.tsx` :
```text
props:
  value, onChange
  options: { value, label }[]
  onCreate(input) -> Promise<{ value, label }>
  placeholder, emptyLabel
```
Construit avec `Popover` + `Command` (déjà disponibles dans shadcn).

Et un hook `src/hooks/useGeoLocations.ts` :
- `usePays()`, `useDepartements(paysId)`, `useArrondissements(departementId)`, `useQuartiers(arrondissementId)`
- `createGeoLocation({ type, nom, parent_id })` qui insère dans `geo_locations` et invalide la query.

## 3. Mise à jour des écrans

### `/pharmacy-creation` (`src/components/pharmacy-registration/PharmacyInfoForm.tsx` + `src/pages/PharmacyCreation.tsx`)
- Remplacer le `Select` "Pays" hardcodé par `<CreatableCombobox>` branché sur `usePays()`.
- Idem pour Département, Arrondissement, Quartier (avec filtrage hiérarchique).
- Conserver `city` (Ville) en saisie libre — non demandé.
- Ne plus écrire `region: 'République du Congo'` en dur dans `PharmacyCreation.tsx` ligne 180-181.

### Module Paramètres → Général → Informations Pharmacie (`src/components/dashboard/modules/parametres/GeneralSettings.tsx`)
- Supprimer le champ "Région" (ligne 220-224).
- Ajouter 4 `<CreatableCombobox>` : Pays, Département, Arrondissement, Quartier, dans cet ordre, juste après "Adresse" et avant "Ville".
- `useSystemSettings.ts` : retirer `region` du payload de sauvegarde (ou le laisser intact mais ne plus l'exposer).

### Types
- `PharmacyRegistrationData` : retirer `region` (déjà absent), conserver `pays`, `departement`, `arrondissement`, `quartier`.
- `useSystemSettings.ts` interface `PharmacySettings` : marquer `region` deprecated.

## 4. Comportement « créer-si-absent »

Workflow utilisateur dans le combobox Pays :
1. L'utilisateur clique sur le champ → la liste des pays connus s'affiche
2. Il tape "Tchad"
3. Si "Tchad" existe → il apparaît dans la liste, il clique pour sélectionner
4. Si "Tchad" n'existe pas → en bas de la liste apparaît `+ Ajouter "Tchad"` ; un clic insère la ligne dans `geo_locations` et la sélectionne automatiquement

Idem pour Département (filtré par pays sélectionné), Arrondissement (filtré par département), Quartier (filtré par arrondissement).

## 5. Hors-scope (pour cette itération)

- Pas de modification de `region` dans la base : on la laisse comme colonne historique.
- Pas de réécriture massive des données existantes : seule la ligne Kinshasa sera corrigée (`pays = 'République Démocratique du Congo'`).
- Pas d'interface d'administration des `geo_locations` (ajout possible directement via les comboboxes ; la modération viendra plus tard si besoin).

## Fichiers impactés

**Nouveaux**
- `supabase/migrations/<ts>_geo_locations.sql`
- `src/components/ui/CreatableCombobox.tsx`
- `src/hooks/useGeoLocations.ts`

**Modifiés**
- `src/components/pharmacy-registration/PharmacyInfoForm.tsx`
- `src/pages/PharmacyCreation.tsx`
- `src/components/dashboard/modules/parametres/GeneralSettings.tsx`
- `src/hooks/useSystemSettings.ts`
- `src/types/pharmacy-registration.ts`

Confirme-moi pour que je passe à l'implémentation.
