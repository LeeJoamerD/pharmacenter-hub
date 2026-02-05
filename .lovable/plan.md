
# Plan d'implémentation - Section IA/Prédictif du Module Rapports

## Contexte et Analyse

### État actuel du composant
Le composant `AIReports.tsx` (504 lignes) affiche actuellement des **données mockées statiques** définies directement dans le code :

**Données mockées identifiées :**
- `aiModels` (lignes 43-88) : 4 modèles IA statiques
- `aiPredictions` (lignes 91-128) : 4 prédictions statiques
- `mlMetrics` (lignes 131-136) : 4 métriques ML statiques
- `realTimeAnalyses` (lignes 139-172) : 4 analyses temps réel statiques
- Insights (lignes 434-451) : 3 insights statiques
- Qualité des données (lignes 466-493) : 4 métriques de qualité statiques

### Onglets existants
1. **Prédictions** - Prédictions IA avancées
2. **Temps Réel** - Analyses en temps réel
3. **Métriques ML** - Performance des modèles
4. **Modèles** - Gestion des modèles IA
5. **Insights** - Découvertes automatisées + Qualité des données

### Backend existant - Tables IA
| Table | Enregistrements | Utilisation |
|-------|----------------|-------------|
| `ai_models` | 3 | Modèles IA système |
| `ai_learning_models` | 0 | Modèles d'apprentissage |
| `ai_forecast_models` | 4 | Modèles de prévision |
| `ai_training_sessions` | 0 | Sessions d'entraînement |
| `ai_insights` | 0 | Insights automatisés |
| `ai_forecasts` | 0 | Prévisions générées |
| `ai_bi_predictions` | 0 | Prédictions BI |
| `ai_anomalies` | 0 | Anomalies détectées |
| `ai_stock_predictions` | 0 | Prédictions stock |
| `ai_learning_feedback` | 0 | Feedback utilisateur |
| `ai_bi_config` | - | Configuration BI |
| `ai_quality_controls` | - | Contrôles qualité |
| `ai_sentiment_analyses` | - | Analyses sentiment |

### Hooks existants
- `useAIReports` : Hook partiellement implémenté avec connexion à la base
- `useContinuousLearning` : Hook complet pour la gestion des modèles d'apprentissage

### Problème principal
Le composant `AIReports.tsx` **n'utilise PAS** le hook `useAIReports` existant et affiche des données mockées directement dans le code.

---

## Phase 1 : Amélioration du Hook useAIReports

### Fichier : `src/hooks/useAIReports.ts`

#### 1.1 Améliorer la récupération des modèles IA

Utiliser les tables `ai_models`, `ai_forecast_models` et `ai_learning_models` conjointement :

| Source | Données |
|--------|---------|
| `ai_forecast_models` | Modèles de prévision (LSTM, ARIMA, Prophet, Ensemble) |
| `ai_learning_models` | Modèles d'apprentissage |
| `ai_training_sessions` | Sessions d'entraînement en cours |

#### 1.2 Améliorer les prédictions

Agréger les données de :
- `ai_stock_predictions` : Prédictions de rupture stock
- `ai_bi_predictions` : Prédictions comportementales
- `ai_anomalies` : Anomalies détectées
- Calculs temps réel basés sur `produits`, `ventes`, `lots`

#### 1.3 Ajouter les métriques ML

Calculer depuis :
- `ai_training_sessions` : Précision moyenne, sessions complétées
- `ai_learning_feedback` : Taux de feedback positif
- `ai_quality_controls` : Précision des contrôles

#### 1.4 Ajouter les analyses temps réel

Utiliser :
- `ai_sentiment_analyses` : Analyse de sentiment client
- `ventes` : Flux client en temps réel
- `ai_anomalies` : Détection de fraude

#### 1.5 Ajouter qualité des données

Calculer dynamiquement :
- Complétude : % produits avec toutes les infos requises
- Cohérence : % données sans erreurs de format
- Fraîcheur : % données mises à jour récemment
- Précision : Score moyen des contrôles qualité

---

## Phase 2 : Ajout des Mutations au Hook

### Nouvelles fonctionnalités à ajouter

```text
useAIReports (amélioré)
├── Requêtes existantes (améliorées)
│   ├── aiModels → Multi-source (forecast + learning)
│   ├── predictions → Temps réel + historique
│   ├── mlMetrics → Calculés depuis sessions
│   ├── realTimeAnalyses → Sentiment + flux
│   └── insights → Table ai_insights + générés
│
├── Nouvelles requêtes
│   ├── useDataQualityMetrics() → Qualité des données
│   ├── useModelTrainingSessions() → Sessions en cours
│   └── useAIConfiguration() → Configuration auto-training
│
└── Mutations CRUD
    ├── useToggleModelStatus() → Activer/désactiver modèle
    ├── useStartModelTraining() → Démarrer entraînement
    ├── usePauseModelTraining() → Pause entraînement
    ├── useUpdateAIConfig() → Sauvegarder config
    ├── useApplyPrediction() → Appliquer recommandation
    └── useDismissPrediction() → Ignorer prédiction
```

---

## Phase 3 : Création de la table ai_data_quality_metrics

### Migration SQL

Créer une table pour stocker les métriques de qualité des données :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `tenant_id` | uuid | FK vers pharmacies |
| `metric_type` | text | Type (completude, coherence, fraicheur, precision) |
| `metric_value` | numeric | Valeur 0-100 |
| `calculated_at` | timestamptz | Date calcul |
| `details` | jsonb | Détails du calcul |

### RPC pour calcul automatique

Créer une fonction RPC `calculate_data_quality_metrics` qui :
1. Calcule la complétude des produits (% avec libelle, prix, catégorie)
2. Calcule la cohérence (% sans erreurs de format)
3. Calcule la fraîcheur (% mis à jour < 30 jours)
4. Calcule la précision (score moyen des contrôles)

---

## Phase 4 : Refactoring du Composant AIReports.tsx

### 4.1 Intégration du hook useAIReports

Remplacer toutes les données mockées par les données du hook :

| Données mockées | Remplacement |
|-----------------|--------------|
| `const aiModels = [...]` | `const { aiModels } = useAIReports()` |
| `const aiPredictions = [...]` | `const { predictions } = useAIReports()` |
| `const mlMetrics = [...]` | `const { mlMetrics } = useAIReports()` |
| `const realTimeAnalyses = [...]` | `const { realTimeAnalyses } = useAIReports()` |

### 4.2 Ajout des états de chargement

Pour chaque section :
- Skeleton pendant le chargement
- Message d'erreur si échec
- Empty state si aucune donnée

### 4.3 Connexion du Switch Auto-training

Le switch `autoTraining` (ligne 213) doit :
1. Lire la config depuis `ai_bi_config`
2. Sauvegarder les changements via mutation

### 4.4 Bouton Configuration

Le bouton "Configuration" (ligne 216-219) doit :
- Ouvrir un modal de configuration IA
- Permettre de modifier les paramètres d'entraînement

### 4.5 Onglet Prédictions - Boutons d'action

Chaque prédiction affiche un bouton recommandation (ligne 292-295) :
- Ajouter action "Appliquer" → Mettre à jour le statut
- Ajouter action "Ignorer" → Marquer comme ignorée

### 4.6 Onglet Temps Réel - Boutons Voir Détails

Les boutons "Voir Détails" (ligne 333-336) doivent :
- Ouvrir un modal avec le détail de l'analyse
- Afficher l'historique des scores

### 4.7 Onglet Modèles - Actions Play/Pause/Settings

Les boutons de gestion des modèles (lignes 407-412) doivent :
- **Play/Pause** : Démarrer ou arrêter l'entraînement
- **Settings** : Ouvrir un modal de configuration du modèle

### 4.8 Onglet Insights - Données réelles

Remplacer les insights statiques par les données de `ai_insights` :
- Corrélations détectées
- Patterns identifiés
- Anomalies détectées

### 4.9 Qualité des données - Calcul dynamique

Remplacer les valeurs statiques (94.5%, 91.2%, 88.7%, 92.8%) par :
- Calculs temps réel depuis les données du tenant
- Affichage des tendances

---

## Phase 5 : Création des Modaux

### 5.1 AIConfigurationModal.tsx

Modal de configuration globale IA :
- Auto-training ON/OFF
- Fréquence d'entraînement (quotidien/hebdomadaire/mensuel)
- Seuil de précision minimum
- Rétention des données
- Notifications

### 5.2 ModelSettingsModal.tsx

Modal de configuration par modèle :
- Nom et description
- Hyperparamètres
- Fréquence d'entraînement
- Données sources

### 5.3 PredictionDetailModal.tsx

Modal de détail d'une prédiction :
- Description complète
- Facteurs influençants
- Historique
- Actions disponibles

### 5.4 RealTimeAnalysisModal.tsx

Modal de détail d'une analyse temps réel :
- Score actuel
- Historique des 30 derniers jours
- Graphique de tendance
- Paramètres de seuil

---

## Phase 6 : Fonctionnalités Globales

### 6.1 Multi-tenant

Toutes les requêtes filtrées par `tenant_id` via `useTenant()`

### 6.2 Pagination (>1000 enregistrements)

Utilisation de `batchQuery` pour les requêtes volumineuses :
- `ai_training_sessions`
- `ai_insights`
- `ai_anomalies`

### 6.3 Rafraîchissement automatique

- Bouton "Actualiser" connecté à `refetch()`
- Auto-refresh toutes les 5 minutes pour temps réel

### 6.4 Export des données

Bouton export pour :
- Métriques ML au format PDF/Excel
- Historique des prédictions
- Rapport de qualité des données

---

## Calculs et Algorithmes

### Métriques de qualité calculées

| Métrique | Calcul |
|----------|--------|
| Complétude | `(produits avec libelle + prix + catégorie) / total * 100` |
| Cohérence | `(produits sans erreur format) / total * 100` |
| Fraîcheur | `(produits updated < 30j) / total * 100` |
| Précision | `AVG(ai_quality_controls.accuracy)` |

### Score de confiance des prédictions

Basé sur :
- Précision historique du modèle
- Quantité de données utilisées
- Récence des données

---

## Liste des fichiers à créer/modifier

### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useAIReports.ts` | Amélioration des requêtes + ajout mutations |
| `src/components/.../reports/ai/AIReports.tsx` | Intégration hook + états de chargement + actions |

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/components/.../reports/ai/modals/AIConfigurationModal.tsx` | Modal configuration globale |
| `src/components/.../reports/ai/modals/ModelSettingsModal.tsx` | Modal paramètres modèle |
| `src/components/.../reports/ai/modals/PredictionDetailModal.tsx` | Modal détail prédiction |
| `src/components/.../reports/ai/modals/RealTimeAnalysisModal.tsx` | Modal analyse temps réel |
| `src/services/AIReportsService.ts` | Service de calcul des métriques |

### Migration SQL

| Migration | Description |
|-----------|-------------|
| `create_ai_data_quality_metrics_table` | Table métriques qualité données |
| `create_calculate_data_quality_rpc` | RPC calcul qualité |

---

## Ordre d'exécution recommandé

1. **Migration SQL** - Créer la table `ai_data_quality_metrics` et RPC
2. **Service AIReportsService** - Logique de calcul des métriques
3. **Hook useAIReports** - Amélioration complète
4. **Modaux** - Création des 4 modaux
5. **Composant AIReports** - Intégration finale
6. **Tests fonctionnels** - Validation E2E

---

## Garanties de qualité

- Aucune suppression de fonctionnalité UI existante
- Tous les 5 onglets conservés et opérationnels
- Tous les boutons (Play/Pause/Settings/Voir Détails) fonctionnels
- Switch Auto-training connecté à la base
- Données de qualité calculées dynamiquement
- Multi-tenant strict avec filtrage `tenant_id`
- Pagination pour volumes >1000 enregistrements
- États de chargement (Skeleton) pour chaque section
- Gestion des erreurs avec messages utilisateur
