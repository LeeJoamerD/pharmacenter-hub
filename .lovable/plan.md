
# Plan d'implémentation - Section Géospatiale du Module Rapports

## Contexte et Analyse

### Etat actuel
Le composant `GeospatialReports.tsx` (562 lignes) affiche actuellement des **données mockées statiques** définies directement dans le composant :
- `geoMetrics` : 4 métriques géographiques (zones actives, couverture, zones optimales, livraisons)
- `geoAnalysis` : 4 zones d'analyse (Centre-Ville, Résidentiel, Industriel, Périphérie)
- `optimizedRoutes` : 3 routes de livraison
- `catchmentAreas` : 3 zones de chalandise
- Recommandations d'optimisation statiques

### Onglets existants
1. **Cartographie** - Placeholder pour carte interactive
2. **Zones** - Analyse par zones géographiques
3. **Routes** - Optimisation des routes de livraison
4. **Chalandise** - Zones de chalandise
5. **Optimisation** - Recommandations IA

### Données disponibles en base
- **pharmacies** : `quartier`, `arrondissement`, `city`, `region`, `pays`
- **clients** : `adresse` (texte libre, 184 clients existants)
- **ventes** : 408 ventes avec `montant_net`, `client_id`, `date_vente`
- **fournisseurs** : `adresse` pour les routes de livraison
- **receptions_fournisseurs** / **lots** : données logistiques

### Tables manquantes
Aucune table dédiée aux zones géographiques, routes de livraison, ou zones de chalandise n'existe actuellement. Il faudra créer les structures backend nécessaires.

---

## Phase 1 : Création du Backend (Tables et RPC)

### 1.1 Création des tables géospatiales

#### Table `geo_zones`
Stockage des zones géographiques configurées par tenant.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `zone_name` | text | Nom de la zone |
| `zone_type` | text | Type (centre-ville, résidentiel, industriel, périphérie) |
| `description` | text | Description |
| `color` | text | Couleur d'affichage |
| `is_active` | boolean | Zone active |
| `metadata` | jsonb | Données additionnelles |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Date MAJ |

#### Table `geo_zone_assignments`
Association clients/zones.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `zone_id` | uuid | FK vers geo_zones |
| `client_id` | uuid | FK vers clients |
| `assigned_at` | timestamptz | Date d'assignation |

#### Table `delivery_routes`
Routes de livraison configurées.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `route_name` | text | Nom de la route |
| `route_code` | text | Code (R001, R002...) |
| `description` | text | Description |
| `estimated_distance_km` | numeric | Distance estimée |
| `estimated_duration_min` | integer | Durée estimée (minutes) |
| `status` | text | Statut (active, inactive, en_cours) |
| `efficiency_score` | numeric | Score d'efficacité (%) |
| `is_active` | boolean | Route active |
| `metadata` | jsonb | Données additionnelles |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Date MAJ |

#### Table `delivery_route_stops`
Arrêts sur les routes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `route_id` | uuid | FK vers delivery_routes |
| `stop_order` | integer | Ordre de l'arrêt |
| `client_id` | uuid | FK vers clients (optionnel) |
| `fournisseur_id` | uuid | FK vers fournisseurs (optionnel) |
| `address` | text | Adresse de l'arrêt |
| `stop_type` | text | Type (pickup, delivery, both) |
| `estimated_time_min` | integer | Temps estimé à cet arrêt |
| `notes` | text | Notes |

#### Table `catchment_areas`
Zones de chalandise.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `area_name` | text | Nom de la zone |
| `area_type` | text | Type (premium, familiale, étudiante, autre) |
| `estimated_population` | integer | Population estimée |
| `penetration_rate` | numeric | Taux de pénétration (%) |
| `avg_basket` | numeric | Panier moyen |
| `competition_level` | text | Niveau concurrence (faible, moyenne, élevée) |
| `opportunity_level` | text | Opportunité (excellente, bonne, modérée) |
| `is_active` | boolean | Zone active |
| `metadata` | jsonb | Données additionnelles |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Date MAJ |

#### Table `geo_optimization_recommendations`
Recommandations d'optimisation géospatiale.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `recommendation_type` | text | Type (expansion, route, marketing, partnership) |
| `title` | text | Titre |
| `description` | text | Description |
| `impact_metric` | text | Métrique d'impact |
| `impact_value` | numeric | Valeur d'impact |
| `status` | text | Statut (pending, applied, dismissed) |
| `applied_at` | timestamptz | Date d'application |
| `created_at` | timestamptz | Date création |

### 1.2 RPC pour les calculs agrégés

#### RPC `get_geospatial_metrics`
Calcule les métriques globales : zones actives, couverture, zones optimales, livraisons.

#### RPC `get_zone_analysis`
Analyse par zone avec calculs de CA, nombre de clients, croissance.

#### RPC `get_catchment_statistics`
Statistiques des zones de chalandise avec taux de pénétration calculés.

---

## Phase 2 : Création du Service Backend

### Fichier : `src/services/GeospatialService.ts`

Service dédié aux opérations géospatiales :

```text
GeospatialService
├── getGeospatialMetrics(tenantId)
│   └── Retourne les 4 métriques principales avec variations
│
├── getZoneAnalysis(tenantId, filters?)
│   └── Analyse par zones avec CA, clients, croissance, densité
│
├── getDeliveryRoutes(tenantId, filters?)
│   └── Liste des routes avec métriques d'efficacité
│
├── getCatchmentAreas(tenantId)
│   └── Zones de chalandise avec statistiques
│
├── getOptimizationRecommendations(tenantId)
│   └── Recommandations d'optimisation
│
├── createZone(tenantId, data)
├── updateZone(tenantId, zoneId, data)
├── deleteZone(tenantId, zoneId)
│
├── createRoute(tenantId, data)
├── updateRoute(tenantId, routeId, data)
├── deleteRoute(tenantId, routeId)
│
├── createCatchmentArea(tenantId, data)
├── updateCatchmentArea(tenantId, areaId, data)
├── deleteCatchmentArea(tenantId, areaId)
│
├── assignClientToZone(tenantId, clientId, zoneId)
├── removeClientFromZone(tenantId, clientId, zoneId)
│
├── addRouteStop(tenantId, routeId, stopData)
├── updateRouteStop(tenantId, stopId, stopData)
├── removeRouteStop(tenantId, stopId)
│
└── calculateRouteEfficiency(tenantId, routeId)
```

### Gestion de la pagination (>1000 enregistrements)

Utilisation du pattern `batchQuery` existant dans `src/utils/queryHelpers.ts` pour toutes les requêtes potentiellement volumineuses :
- Traitement par lots de 100 IDs
- Utilisation de `range()` pour la pagination côté serveur

---

## Phase 3 : Création du Hook React

### Fichier : `src/hooks/useGeospatialReports.ts`

Hook principal avec React Query :

```text
useGeospatialReports
├── useGeospatialMetrics()
│   └── Données métriques avec cache 5min
│
├── useZoneAnalysis(filters?)
│   └── Données zones avec filtre région
│
├── useDeliveryRoutes(filters?)
│   └── Routes avec filtre statut
│
├── useCatchmentAreas()
│   └── Zones de chalandise
│
├── useOptimizationRecommendations()
│   └── Recommandations IA
│
├── Mutations CRUD
│   ├── useCreateZoneMutation()
│   ├── useUpdateZoneMutation()
│   ├── useDeleteZoneMutation()
│   ├── useCreateRouteMutation()
│   ├── useUpdateRouteMutation()
│   ├── useDeleteRouteMutation()
│   ├── useCreateCatchmentAreaMutation()
│   ├── useUpdateCatchmentAreaMutation()
│   └── useDeleteCatchmentAreaMutation()
│
└── Actions spéciales
    ├── useAssignClientToZoneMutation()
    ├── useAddRouteStopMutation()
    └── useApplyRecommendationMutation()
```

---

## Phase 4 : Refactoring du Composant Frontend

### 4.1 Structure des fichiers

```text
src/components/dashboard/modules/reports/geospatial/
├── GeospatialReports.tsx (composant principal refactoré)
├── components/
│   ├── GeospatialMetricsCards.tsx
│   ├── MappingTab.tsx
│   ├── ZonesTab.tsx
│   ├── RoutesTab.tsx
│   ├── CatchmentTab.tsx
│   ├── OptimizationTab.tsx
│   └── modals/
│       ├── ZoneFormModal.tsx
│       ├── RouteFormModal.tsx
│       ├── RouteStopModal.tsx
│       ├── CatchmentAreaModal.tsx
│       └── AssignClientModal.tsx
└── types/
    └── geospatial.types.ts
```

### 4.2 Modifications du composant principal

**GeospatialReports.tsx** :
- Remplacement des données mockées par le hook `useGeospatialReports`
- Ajout des états de chargement (Skeleton)
- Gestion des erreurs
- Intégration multi-tenant via `useTenant()`

### 4.3 Onglet Cartographie (MappingTab)

**Fonctionnalités** :
- Placeholder carte (déjà présent)
- Bouton "Couches" : affiche/masque les zones configurées
- Bouton "Filtres" : filtre par type de zone, période
- Sélecteur vue (Ventes, Densité, Croissance)
- Légende dynamique basée sur les vraies données

**Connexion données** :
- `useZoneAnalysis()` pour les statistiques par zone
- Affichage des zones avec code couleur basé sur le CA réel

### 4.4 Onglet Zones (ZonesTab)

**Fonctionnalités existantes à connecter** :
- Liste des zones avec métriques (clients, CA, croissance, densité, potentiel)
- Barre de progression basée sur la croissance réelle

**Ajouts** :
- Bouton "Ajouter Zone" → `ZoneFormModal`
- Actions par zone (modifier, supprimer, voir clients)
- Bouton "Assigner Clients" → `AssignClientModal`
- Filtre par type de zone
- Export des données zones

### 4.5 Onglet Routes (RoutesTab)

**Fonctionnalités existantes à connecter** :
- Liste des routes avec arrêts, distance, durée, efficacité, statut
- Badge statut (Active, En cours)
- Bouton œil pour voir les détails

**Ajouts** :
- Bouton "Ajouter Route" → `RouteFormModal`
- Gestion des arrêts → `RouteStopModal`
- Calcul automatique de l'efficacité
- Actions (modifier, désactiver, supprimer)

### 4.6 Onglet Chalandise (CatchmentTab)

**Fonctionnalités existantes à connecter** :
- Zones avec population, pénétration, panier moyen, concurrence
- Badge opportunité
- Barre de potentiel de croissance

**Ajouts** :
- Bouton "Ajouter Zone" → `CatchmentAreaModal`
- Calcul automatique du taux de pénétration (clients zone / population estimée)
- Actions CRUD

### 4.7 Onglet Optimisation (OptimizationTab)

**Fonctionnalités existantes à connecter** :
- Recommandations d'expansion, optimisation route, partenariats
- Projections ROI

**Ajouts** :
- Génération automatique de recommandations basées sur les données
- Bouton "Appliquer" pour marquer comme appliqué
- Bouton "Rejeter" pour ignorer
- Historique des recommandations appliquées

---

## Phase 5 : Fonctionnalités Globales

### 5.1 Filtres et Actions Globales

- **Sélecteur région** : Filtre toutes les données par `selectedRegion`
- **Bouton Exporter** : Export PDF/Excel des données géospatiales
- **Bouton Actualiser** : Rafraîchir toutes les données

### 5.2 Multi-tenant et Multi-localités

- Toutes les requêtes filtrées par `tenant_id`
- Support des paramètres régionaux via `useGlobalSystemSettings()`
- Formatage des montants selon la devise du tenant (FCFA par défaut)
- Respect des fuseaux horaires pour les dates

### 5.3 Intégration avec les paramètres système

- Lecture des configurations depuis `parametres_systeme`
- Paramètres spécifiques au module géospatial :
  - `geospatial_default_view` : Vue par défaut (ventes/densité/croissance)
  - `geospatial_zone_colors` : Palette de couleurs
  - `geospatial_efficiency_threshold` : Seuil d'efficacité des routes

---

## Phase 6 : Calculs et Algorithmes

### 6.1 Métriques calculées

| Métrique | Calcul |
|----------|--------|
| Zones Actives | COUNT(geo_zones WHERE is_active = true) |
| Couverture Géographique | (clients avec zone / total clients) * 100 |
| Zones Optimales | Zones avec CA > moyenne + 1 écart-type |
| Livraisons Actives | COUNT(routes actives) * moyenne arrêts par route |

### 6.2 Analyse par Zone

| Donnée | Calcul |
|--------|--------|
| Clients | COUNT(clients assignés à la zone) |
| CA | SUM(ventes.montant_net WHERE client in zone) |
| Croissance | ((CA période courante - CA période précédente) / CA période précédente) * 100 |
| Densité | Clients / Population estimée (Low/Medium/High) |
| Potentiel | Score basé sur croissance + marge progression |

### 6.3 Efficacité des Routes

```text
efficacité = (livraisons_réussies / livraisons_prévues) * 
             (temps_optimal / temps_réel) * 100
```

### 6.4 Taux de Pénétration Chalandise

```text
pénétration = (clients_zone / population_estimée) * 100
```

---

## Liste des fichiers à créer/modifier

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/services/GeospatialService.ts` | Service backend géospatial |
| `src/hooks/useGeospatialReports.ts` | Hook React Query principal |
| `src/types/geospatial.types.ts` | Types TypeScript |
| `src/components/.../geospatial/components/GeospatialMetricsCards.tsx` | Cartes métriques |
| `src/components/.../geospatial/components/MappingTab.tsx` | Onglet cartographie |
| `src/components/.../geospatial/components/ZonesTab.tsx` | Onglet zones |
| `src/components/.../geospatial/components/RoutesTab.tsx` | Onglet routes |
| `src/components/.../geospatial/components/CatchmentTab.tsx` | Onglet chalandise |
| `src/components/.../geospatial/components/OptimizationTab.tsx` | Onglet optimisation |
| `src/components/.../geospatial/components/modals/ZoneFormModal.tsx` | Modal création/édition zone |
| `src/components/.../geospatial/components/modals/RouteFormModal.tsx` | Modal création/édition route |
| `src/components/.../geospatial/components/modals/RouteStopModal.tsx` | Modal gestion arrêts |
| `src/components/.../geospatial/components/modals/CatchmentAreaModal.tsx` | Modal zone chalandise |
| `src/components/.../geospatial/components/modals/AssignClientModal.tsx` | Modal assignation client |

### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/.../geospatial/GeospatialReports.tsx` | Refactoring complet avec données réelles |

### Migrations SQL

| Migration | Description |
|-----------|-------------|
| `create_geo_zones_table` | Table zones géographiques |
| `create_geo_zone_assignments_table` | Assignations clients/zones |
| `create_delivery_routes_table` | Table routes livraison |
| `create_delivery_route_stops_table` | Arrêts des routes |
| `create_catchment_areas_table` | Zones de chalandise |
| `create_geo_optimization_recommendations_table` | Recommandations |
| `create_geospatial_rpc_functions` | Fonctions RPC calculs |
| `add_rls_geospatial_tables` | Politiques RLS multi-tenant |

---

## Ordre d'exécution recommandé

1. **Migrations SQL** - Créer les tables et RPC
2. **Service GeospatialService** - Logique backend
3. **Hook useGeospatialReports** - Intégration React Query
4. **Types TypeScript** - Typage complet
5. **Composants modaux** - Formulaires CRUD
6. **Composants onglets** - UI par onglet
7. **Composant principal** - Intégration finale
8. **Tests fonctionnels** - Validation E2E

---

## Garanties de qualité

- Aucune suppression de fonctionnalité UI existante
- Tous les boutons, filtres et tableaux connectés aux données réelles
- Gestion complète des états de chargement
- Gestion des erreurs avec messages utilisateur
- Multi-tenant strict avec RLS
- Pagination pour volumes >1000 enregistrements
- Formatage régional (devise, dates) via paramètres système
