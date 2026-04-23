

## Plan d'implémentation — Articles manquants du module Assistant IA

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Assistant IA** couvre tous les sous-modules réellement exposés dans `AssistantIAModule.tsx` :

```text
Assistant IA
├── Tableau de bord IA (AIDashboard)
├── Chat IA conversationnel (ConversationalAI)
├── Diagnostic intelligent (IntelligentDiagnostic)
├── Recommandations stratégiques (StrategicRecommendations)
├── Prévisions avancées (AdvancedForecasting)
├── Analyse de sentiment (SentimentAnalysis)
├── Vision par ordinateur (ComputerVision)
├── Expert Pharma (PharmaceuticalExpert)
├── Expert Comptable (AccountingExpert)
├── Business Intelligence IA (AIBusinessIntelligence)
├── Apprentissage continu (ContinuousLearning)
├── Automatisation (AIAutomation)
├── Stocks IA (AIStockManagement)
├── Intégrations IA (AIIntegrations)
└── Configuration IA (AIConfiguration)
```

Format identique aux modules précédents : structure stricte `GuideArticle` (`id, title, objective, location, audience, intro, steps, callouts, bestPractices, faq, related, keywords`).

Fichier à enrichir : `src/components/help/guide/content/assistant.ts`

Aucun changement UI : intégration automatique via `registry.ts`.

---

## 1. État actuel

Le guide ne contient que **1 article** : `assistant-bi-pharma`.
Il sera conservé, enrichi et replacé.

---

## 2. Organisation cible (15 sections)

```text
Assistant IA
├── Pilotage IA
├── Chat conversationnel
├── Diagnostic intelligent
├── Recommandations stratégiques
├── Prévisions avancées
├── Analyse de sentiment
├── Vision par ordinateur
├── Expert Pharmaceutique
├── Expert Comptable
├── Business Intelligence IA
├── Apprentissage continu
├── Automatisation IA
├── Stocks IA
├── Intégrations IA
└── Configuration IA
```

---

## 3. Convention des identifiants

Préfixe : `assistant-`

Exemples : `assistant-dashboard-vue-ensemble`, `assistant-chat-conversation`, `assistant-vision-reconnaissance`, `assistant-config-modeles`.

---

## 4. Articles à créer ou enrichir (~70 articles)

### A. Pilotage IA — AIDashboard (4 articles)

1. `assistant-dashboard-vue-ensemble` — KPI IA globaux, statut des modules, visibilité.
2. `assistant-dashboard-modules` — Naviguer parmi les 14 modules IA.
3. `assistant-dashboard-activite` — Activité récente, dernières inférences.
4. `assistant-dashboard-sante-ia` — Santé des modèles, latence, taux d'erreur.

**Callouts :** Info — visibilité contrôlée par `useDashboardVisibility`.

---

### B. Chat conversationnel — ConversationalAI (5 articles)

5. `assistant-chat-vue-ensemble` — Présentation du Chat IA.
6. `assistant-chat-conversation` — Onglet **Chat** : poser une question, historique, suggestions.
7. `assistant-chat-modeles` — Onglet **Modèles** : choisir le modèle IA (Gemini, etc.).
8. `assistant-chat-insights` — Onglet **Insights** issus des conversations.
9. `assistant-chat-parametres` — Onglet **Settings** (température, max tokens, system prompt).

**Callouts :** Info — Edge Function `network-ai-chat` avec validation JWT et isolation tenant. Warning — réponses à relire dans leur contexte métier.

---

### C. Diagnostic intelligent — IntelligentDiagnostic (5 articles)

10. `assistant-diagnostic-vue-ensemble` — Vue d'ensemble du diagnostic système.
11. `assistant-diagnostic-performance` — Onglet **Performance**.
12. `assistant-diagnostic-anomalies` — Onglet **Anomalies** détectées.
13. `assistant-diagnostic-bottlenecks` — Onglet **Goulots d'étranglement**.
14. `assistant-diagnostic-tendances` — Onglet **Tendances**.

---

### D. Recommandations stratégiques — StrategicRecommendations (3 articles)

15. `assistant-recommandations-vue-ensemble` — Recommandations IA actionnables.
16. `assistant-recommandations-facteurs` — Onglet **Facteurs Clés**.
17. `assistant-recommandations-actions` — Onglet **Plan d'Action**.

---

### E. Prévisions avancées — AdvancedForecasting (5 articles)

18. `assistant-previsions-vue-ensemble` — Prévisions IA multi-domaines.
19. `assistant-previsions-ventes` — Onglet **Ventes**.
20. `assistant-previsions-stock` — Onglet **Stock**.
21. `assistant-previsions-tresorerie` — Onglet **Trésorerie**.
22. `assistant-previsions-facteurs` — Onglet **Facteurs** d'influence.

**Callouts :** Info — les prévisions complètent l'analyse humaine, ne remplacent pas la décision pharmacien.

---

### F. Analyse de sentiment — SentimentAnalysis (5 articles)

23. `assistant-sentiment-vue-ensemble` — Vue d'ensemble.
24. `assistant-sentiment-feedback` — Onglet **Retours** clients.
25. `assistant-sentiment-categories` — Onglet **Catégories** de sentiments.
26. `assistant-sentiment-mots-cles` — Onglet **Mots-clés** identifiés.
27. `assistant-sentiment-analyseur` — Onglet **Analyseur** texte libre.

---

### G. Vision par ordinateur — ComputerVision (4 articles)

28. `assistant-vision-reconnaissance` — Onglet **Reconnaissance** produits.
29. `assistant-vision-etageres` — Onglet **Étagères** (analyse linéaire).
30. `assistant-vision-controle-qualite` — Onglet **Contrôle Qualité**.
31. `assistant-vision-traitement-lot` — Onglet **Traitement Lot** (batch).

**Callouts :** Warning — la reconnaissance image complète mais ne remplace pas le contrôle pharmacien.

---

### H. Expert Pharmaceutique — PharmaceuticalExpert (5 articles)

32. `assistant-pharma-base-medicaments` — Onglet **Base Médicaments**.
33. `assistant-pharma-interactions` — Onglet **Interactions** médicamenteuses.
34. `assistant-pharma-recommandations` — Onglet **Recommandations** thérapeutiques.
35. `assistant-pharma-pharmacovigilance` — Onglet **Pharmacovigilance**.
36. `assistant-pharma-conformite` — Onglet **Conformité** réglementaire.

**Callouts :** Warning — l'expert pharma ne se substitue pas à la responsabilité du pharmacien.

---

### I. Expert Comptable — AccountingExpert (5 articles)

37. `assistant-comptable-plan-comptable` — Onglet **Plan Comptable** (assistance).
38. `assistant-comptable-ecritures` — Onglet **Écritures** (suggestion automatique).
39. `assistant-comptable-anomalies` — Onglet **Anomalies** détectées.
40. `assistant-comptable-fiscal` — Onglet **Fiscal** (assistance G10 Congo).
41. `assistant-comptable-optimisation` — Onglet **Optimisation** comptable.

**Callouts :** Info — alignement strict SYSCOHADA 2025 Congo.

---

### J. Business Intelligence IA — AIBusinessIntelligence (4 articles)

42. `assistant-bi-pharma` — **Enrichir l'article existant** : Assistant BI et Pharma.
43. `assistant-bi-predictif` — Onglet **Prédictif**.
44. `assistant-bi-patterns` — Onglet **Patterns** de comportement.
45. `assistant-bi-segmentation` — Onglet **Segmentation** clientèle.
46. `assistant-bi-optimisation` — Onglet **Optimisation** business.

---

### K. Apprentissage continu — ContinuousLearning (4 articles)

47. `assistant-apprentissage-modeles` — Onglet **Modèles** entraînés.
48. `assistant-apprentissage-feedback` — Onglet **Feedback** utilisateur.
49. `assistant-apprentissage-donnees` — Onglet **Données** d'entraînement.
50. `assistant-apprentissage-performance` — Onglet **Performance** des modèles.

---

### L. Automatisation IA — AIAutomation (4 articles)

51. `assistant-automatisation-workflows` — Onglet **Workflows** IA.
52. `assistant-automatisation-executions` — Onglet **Exécutions** historiques.
53. `assistant-automatisation-templates` — Onglet **Templates** de workflows.
54. `assistant-automatisation-config` — Onglet **Configuration** des automatisations.

---

### M. Stocks IA — AIStockManagement (5 articles)

55. `assistant-stocks-vue-ensemble` — Onglet **Vue d'ensemble**.
56. `assistant-stocks-predictions` — Onglet **Prédictions** de rupture.
57. `assistant-stocks-optimisation` — Onglet **Optimisation** des niveaux.
58. `assistant-stocks-alertes` — Onglet **Alertes IA** stock.
59. `assistant-stocks-config` — Onglet **Configuration** moteur IA stock.

**Callouts :** Info — convention `libelle_produit` respectée, données filtrées par tenant.

---

### N. Intégrations IA — AIIntegrations (4 articles)

60. `assistant-integrations-connecteurs` — Onglet **Connecteurs IA** (providers).
61. `assistant-integrations-sources` — Onglet **Sources de Données**.
62. `assistant-integrations-webhooks` — Onglet **Webhooks**.
63. `assistant-integrations-logs` — Onglet **Logs & Monitoring**.

---

### O. Configuration IA — AIConfiguration (5 articles)

64. `assistant-config-vue-ensemble` — Présentation de la configuration IA.
65. `assistant-config-modeles` — Gestion des modèles (`ai_models`, identifier, max_tokens, temperature).
66. `assistant-config-system-prompts` — Gestion des system prompts par modèle.
67. `assistant-config-permissions` — Permissions et accès au module.
68. `assistant-config-cles-api` — Clés API et secrets (LOVABLE_API_KEY).

**Callouts :** Warning — les clés API restent côté serveur (Edge Functions). Info — JWT obligatoire et isolation tenant strict.

---

## 5. Règles métier intégrées

- **Edge Functions IA** : validation JWT obligatoire + isolation tenant (`network-ai-chat`).
- **Modèles** : `ai_models` table avec `model_identifier`, `system_prompt`, `max_tokens`, `temperature`.
- **Lovable AI Gateway** : modèle par défaut `google/gemini-2.5-flash`.
- **Multi-tenant/RLS** : conversations isolées par `tenant_id`.
- **Visibilité dashboard** : `useDashboardVisibility` (permission `dashboard.view`).
- **Convention produits** : `libelle_produit`.
- **Pharma** : recommandations à valider par le pharmacien.
- **Comptable** : alignement SYSCOHADA 2025 Congo.
- **Stocks IA** : prévisions complètent les seuils Min/Max manuels.
- **Quota** : gestion 429 (rate limit) et 402 (crédits insuffisants).
- **Localisation** : textes via `useLanguage`.

---

## 6. Maillage des articles liés

```text
assistant-dashboard-vue-ensemble
→ assistant-chat-vue-ensemble
→ assistant-config-vue-ensemble

assistant-chat-conversation
→ assistant-chat-modeles
→ assistant-config-system-prompts

assistant-pharma-interactions
→ assistant-pharma-pharmacovigilance
→ rapports-reglementaires-pharmacovigilance

assistant-comptable-fiscal
→ comptabilite-fiscal-declaration-g10
→ assistant-comptable-anomalies

assistant-stocks-predictions
→ stock-alertes-rupture
→ assistant-previsions-stock

assistant-previsions-ventes
→ ventes-analytics-vue-ensemble
→ rapports-bi-predictif

assistant-vision-reconnaissance
→ stock-inventaire-mobile
→ assistant-vision-controle-qualite

assistant-config-cles-api
→ assistant-integrations-connecteurs
→ administration-securite-secrets
```

---

## 7. Étapes d'implémentation

### Étape 1 — Restructuration
Modifier `src/components/help/guide/content/assistant.ts` : créer les 15 sections cibles, replacer et enrichir l'article existant `assistant-bi-pharma`.

### Étape 2 — Articles cœur
Pilotage, Chat, Diagnostic, Recommandations, Prévisions (22 articles).

### Étape 3 — Articles métiers spécialisés
Sentiment, Vision, Expert Pharma, Expert Comptable, BI IA (23 articles).

### Étape 4 — Articles techniques
Apprentissage, Automatisation, Stocks IA, Intégrations, Configuration (23 articles).

### Étape 5 — Mots-clés (3 à 5 par article)
```text
IA, dashboard, KPI, modules
chat, conversation, modèle, prompt
diagnostic, anomalie, performance, tendance
recommandation, action, facteur
prévision, ventes, stock, trésorerie
sentiment, feedback, mot-clé
vision, reconnaissance, étagère, qualité
pharma, interaction, pharmacovigilance, conformité
comptable, écriture, fiscal, SYSCOHADA
BI, prédictif, segmentation, pattern
apprentissage, modèle, feedback, donnée
automatisation, workflow, template
stock IA, rupture, optimisation
intégration, connecteur, webhook, log
configuration, API, prompt, permission
```

### Étape 6 — Vérifications
1. Build TypeScript/Vite.
2. Conformité stricte au type `GuideArticle`.
3. 15 sections affichées dans la sidebar.
4. Recherche full-text fonctionnelle.
5. Liens `related[]` opérationnels (y compris cross-module : Comptabilité, Stock, Rapports).
6. Cohérence des `location` avec onglets réels (`AssistantIAModule.tsx` switch).
7. Pas de doublons d'identifiants.
8. Article `assistant-bi-pharma` enrichi (pas perdu).

---

## Résultat attendu

Le module **Assistant IA** passera de **1 à environ 70 articles structurés**, couvrant l'intégralité des 15 sous-modules exposés : pilotage, chat, diagnostic, recommandations, prévisions, sentiment, vision, expert pharma, expert comptable, BI IA, apprentissage, automatisation, stocks IA, intégrations et configuration.

Le guide deviendra une documentation complète pour pharmaciens, gestionnaires, comptables, administrateurs et data analysts PharmaSoft utilisant les fonctionnalités IA.

