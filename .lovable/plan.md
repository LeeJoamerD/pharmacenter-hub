

## Plan d'implémentation — Articles manquants du module Rapports

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Rapports** couvre toutes les fonctionnalités exposées dans l'application :

```text
Rapports
├── Tableau de bord Rapports
├── Rapports Ventes
├── Rapports Stock
├── Rapports Financiers
├── Rapports Clients
├── Business Intelligence (BI)
├── Rapports Réglementaires
├── Rapports Géospatial
├── Rapports Mobile
├── Rapports IA / Prédictif
├── Générateur de rapports
├── Rapports Comparatifs
└── Configuration des rapports
```

Format identique aux modules précédents : chaque article respecte strictement la structure `GuideArticle` (`id, title, objective, location, audience, intro, steps, callouts, bestPractices, faq, related, keywords`).

Fichier à enrichir :
```text
src/components/help/guide/content/rapports.ts
```

Aucun changement UI : les articles seront automatiquement intégrés via `registry.ts`.

---

## 1. État actuel

Le guide actuel ne contient que **2 articles** :
- `rapports-tableaux-bord`
- `rapports-stupefiants`

Ils seront conservés, enrichis et replacés.

---

## 2. Organisation cible (13 sections)

```text
Rapports
├── Pilotage et accueil Rapports
├── Rapports Ventes
├── Rapports Stock
├── Rapports Financiers
├── Rapports Clients
├── Business Intelligence
├── Rapports Réglementaires
├── Rapports Géospatial
├── Rapports Mobile
├── Rapports IA et Prédictif
├── Générateur de rapports
├── Rapports Comparatifs
└── Configuration des rapports
```

---

## 3. Convention des identifiants

Préfixe : `rapports-`

Exemples : `rapports-dashboard-vue-ensemble`, `rapports-ventes-evolution`, `rapports-bi-predictif`, `rapports-reglementaires-stupefiants`, `rapports-configuration-permissions`.

---

## 4. Articles à créer ou enrichir (~75 articles)

### A. Pilotage et accueil Rapports (5 articles)

1. `rapports-dashboard-vue-ensemble` — Comprendre l'accueil du module Rapports (KPI globaux, période, visibilité, masquage).
2. `rapports-dashboard-modules` — Naviguer parmi les 12 modules de rapports (compteurs dynamiques par module).
3. `rapports-dashboard-recents` — Consulter les rapports récents (statut, date, format, auteur).
4. `rapports-dashboard-favoris` — Gérer ses rapports favoris.
5. `rapports-dashboard-actualisation` — Actualiser les données et changer la période (jour/semaine/mois/trimestre/année).

**Callouts :** Info — visibilité contrôlée par `useDashboardVisibility`. Warning — la permission Dashboard masque par défaut.

---

### B. Rapports Ventes (6 articles)

6. `rapports-ventes-vue-ensemble` — KPI ventes (CA, transactions, panier moyen, clients uniques) et filtres période/catégorie.
7. `rapports-ventes-evolution` — Onglet **Évolution** : courbe ventes vs objectifs.
8. `rapports-ventes-produits` — Onglet **Produits** : top produits, marge, quantité.
9. `rapports-ventes-equipe` — Onglet **Équipe** : performance staff.
10. `rapports-ventes-categories` — Onglet **Catégories** : répartition par familles.
11. `rapports-ventes-export` — Exporter les rapports ventes (PDF/Excel).

---

### C. Rapports Stock (6 articles)

12. `rapports-stock-vue-ensemble` — KPI stock (valorisation, ruptures, péremptions, rotation).
13. `rapports-stock-niveaux` — Onglet **Niveaux Stock** par catégorie et statut.
14. `rapports-stock-alertes` — Onglet **Alertes** (critique, attention).
15. `rapports-stock-peremptions` — Onglet **Péremptions** (urgent/attention/normal).
16. `rapports-stock-mouvements` — Onglet **Mouvements** (entrées, sorties, valorisation).
17. `rapports-stock-export` — Export et impression des rapports stock.

---

### D. Rapports Financiers (7 articles)

18. `rapports-financier-vue-ensemble` — Vue financière OHADA.
19. `rapports-financier-bilan` — Onglet **Bilan**.
20. `rapports-financier-resultat` — Onglet **Compte de Résultat**.
21. `rapports-financier-flux` — Onglet **Flux de Trésorerie**.
22. `rapports-financier-ratios` — Onglet **Ratios**.
23. `rapports-financier-annexes` — Onglet **États Annexes**.
24. `rapports-financier-graphiques` — Onglet **Graphiques** financiers.

**Callouts :** Info — données alignées sur le module Comptabilité SYSCOHADA Congo.

---

### E. Rapports Clients (5 articles)

25. `rapports-clients-vue-ensemble` — Indicateurs clients globaux.
26. `rapports-clients-segmentation` — Onglet **Segmentation**.
27. `rapports-clients-comportement` — Onglet **Comportement**.
28. `rapports-clients-fidelisation` — Onglet **Fidélisation** (Bronze/Silver/Gold/Platinum).
29. `rapports-clients-assurances` — Onglet **Assurances** : suivi des couvertures et conventions.

---

### F. Business Intelligence (5 articles)

30. `rapports-bi-vue-ensemble` — Présentation du tableau BI.
31. `rapports-bi-dashboard` — Onglet **Dashboard** BI (KPI consolidés).
32. `rapports-bi-predictif` — Onglet **Prédictif** (tendances).
33. `rapports-bi-benchmarks` — Onglet **Benchmarks** comparatifs sectoriels.
34. `rapports-bi-alertes` — Onglet **Alertes** BI.

---

### G. Rapports Réglementaires (6 articles)

35. `rapports-reglementaires-vue-ensemble` — Pilotage réglementaire pharmacie.
36. `rapports-reglementaires-stupefiants` — Onglet **Stupéfiants** (enrichir l'existant : registre, audit immuable, calculs avant/après).
37. `rapports-reglementaires-tracabilite` — Onglet **Traçabilité** (lots, mouvements, sortie).
38. `rapports-reglementaires-pharmacovigilance` — Onglet **Pharmacovigilance** (déclarations).
39. `rapports-reglementaires-rapports-obligatoires` — Onglet **Rapports** obligatoires.
40. `rapports-reglementaires-conformite` — Onglet **Conformité** (score, contrôles).

**Callouts :** Warning — registre des stupéfiants immuable, piste d'audit obligatoire.

---

### H. Rapports Géospatial (6 articles)

41. `rapports-geospatial-vue-ensemble` — Vue géographique des activités.
42. `rapports-geospatial-cartographie` — Onglet **Cartographie**.
43. `rapports-geospatial-zones` — Onglet **Zones** de chalandise.
44. `rapports-geospatial-routes` — Onglet **Routes**.
45. `rapports-geospatial-chalandise` — Onglet **Chalandise** détaillée.
46. `rapports-geospatial-optimisation` — Onglet **Optimisation** itinéraires/zones.

---

### I. Rapports Mobile (4 articles)

47. `rapports-mobile-vue-ensemble` — KPI mobile (utilisateurs, sessions, consultations, notifications).
48. `rapports-mobile-notifications` — Notifications push KPI.
49. `rapports-mobile-synchronisation` — Modes online/offline et sync.
50. `rapports-mobile-configuration` — Réglages PWA (notifications, mode hors-ligne).

**Callouts :** Info — PWA priorise le POS et le cache de 30MB.

---

### J. Rapports IA et Prédictif (6 articles)

51. `rapports-ia-vue-ensemble` — Présentation des rapports IA.
52. `rapports-ia-predictions` — Onglet **Prédictions**.
53. `rapports-ia-temps-reel` — Onglet **Temps Réel**.
54. `rapports-ia-metriques-ml` — Onglet **Métriques ML**.
55. `rapports-ia-modeles` — Onglet **Modèles** déployés.
56. `rapports-ia-insights` — Onglet **Insights** stratégiques.

---

### K. Générateur de rapports (5 articles)

57. `rapports-generateur-vue-ensemble` — Construire un rapport personnalisé (Report Builder).
58. `rapports-generateur-source-donnees` — Choisir une source (Ventes, Stock, Clients, Personnel, Financier).
59. `rapports-generateur-champs-graphiques` — Sélectionner champs et configurer graphiques (bar/line/pie/table).
60. `rapports-generateur-prevoir-sauvegarder` — Aperçu, sauvegarde, exécution.
61. `rapports-generateur-export` — Export Manager (PDF/Excel/Image, options watermark, planification email).

**Callouts :** Info — le générateur respecte la convention `libelle_produit` pour les champs produits.

---

### L. Rapports Comparatifs (5 articles)

62. `rapports-comparatifs-vue-ensemble` — Comparer périodes et entités.
63. `rapports-comparatifs-temporel` — Onglet **Temporel**.
64. `rapports-comparatifs-categories` — Onglet **Catégories**.
65. `rapports-comparatifs-agents` — Onglet **Agents**.
66. `rapports-comparatifs-variance` — Onglet **Variance**.

---

### M. Configuration des rapports (8 articles)

67. `rapports-configuration-vue-ensemble` — Présentation du module Configuration.
68. `rapports-configuration-general` — Onglet **Général** (plage par défaut, formats, notifications, masquage).
69. `rapports-configuration-permissions` — Onglet **Droits d'accès**.
70. `rapports-configuration-automatisation` — Onglet **Automatisation** (planification).
71. `rapports-configuration-modeles` — Onglet **Modèles** réutilisables.
72. `rapports-configuration-connecteurs-bi` — Onglet **Connecteurs BI**.
73. `rapports-configuration-api` — Onglet **API Rapports**.
74. `rapports-configuration-archivage` — Onglet **Archivage** (rétention).

**Callouts :** Warning — la modification des permissions impacte l'accès au module Rapports complet (`reports.view`).

---

## 5. Règles métier intégrées

- **Visibilité dashboard** : protégée par `useDashboardVisibility` (permission `dashboard.view`).
- **Multi-tenant/RLS** : tous les rapports filtrés par tenant.
- **Convention produits** : `libelle_produit` (jamais `nom`).
- **Stupéfiants** : registre immuable, calculs avant/après, piste d'audit (mémoire `narcotics-registry-logic`).
- **Financier** : alignement strict avec module Comptabilité SYSCOHADA 2025 Congo.
- **Export PDF** : standard jsPDF/jspdf-autotable.
- **Mobile/PWA** : cache 30MB, priorité POS.
- **Arrondis FCFA** : `Math.round`.
- **Hooks Configuration** : `useReportSettings`, `useReportTemplates`, `useReportPermissions`, `useReportSchedules`, `useReportConnectors`, `useReportAPI`, `useReportArchiving`.
- **Localisation** : tous les textes via `useLanguage` (le guide est en français).

---

## 6. Maillage des articles liés

Exemples :
```text
rapports-dashboard-vue-ensemble
→ rapports-dashboard-modules
→ rapports-configuration-permissions

rapports-ventes-vue-ensemble
→ ventes-analytics-vue-ensemble
→ rapports-comparatifs-temporel

rapports-stock-peremptions
→ stock-alertes-peremption
→ stock-lots-expirations

rapports-financier-bilan
→ comptabilite-rapports-bilan
→ comptabilite-fiscal-declaration-g10

rapports-reglementaires-stupefiants
→ rapports-reglementaires-tracabilite
→ rapports-reglementaires-conformite

rapports-generateur-vue-ensemble
→ rapports-generateur-source-donnees
→ rapports-generateur-export

rapports-configuration-permissions
→ rapports-configuration-archivage
→ administration-utilisateurs-permissions
```

---

## 7. Étapes d'implémentation

### Étape 1 — Restructuration
Modifier `src/components/help/guide/content/rapports.ts` : créer les 13 sections cibles, replacer les 2 articles existants.

### Étape 2 — Articles cœur (modules opérationnels)
Pilotage, Ventes, Stock, Financier, Clients (29 articles).

### Étape 3 — Articles spécialisés
BI, Réglementaires, Géospatial, Mobile, IA (27 articles).

### Étape 4 — Articles outils
Générateur, Comparatifs, Configuration (18 articles).

### Étape 5 — Mots-clés et SEO recherche
3 à 5 keywords par article :
```text
dashboard, KPI, période, indicateur
ventes, évolution, produits, équipe, catégorie
stock, niveaux, alertes, péremption, mouvements
bilan, résultat, flux, ratios, OHADA
clients, segmentation, fidélité, assurance
BI, prédictif, benchmark, alerte
stupéfiants, traçabilité, pharmacovigilance, conformité
géospatial, zones, chalandise, routes
mobile, PWA, notifications, sync
IA, ML, prédictions, modèle, insight
générateur, source, champ, graphique
comparatif, temporel, variance, agent
configuration, permission, modèle, archivage
```

### Étape 6 — Vérifications
1. Build TypeScript/Vite.
2. Conformité stricte au type `GuideArticle`.
3. 13 sections affichées dans la sidebar.
4. Recherche full-text fonctionnelle.
5. Liens `related[]` opérationnels.
6. Cohérence des `location` avec onglets réels.
7. Pas de doublons d'identifiants.
8. Articles existants enrichis (pas perdus).

---

## Résultat attendu

Le module **Rapports** passera de **2 à environ 75 articles structurés**, couvrant l'intégralité des onglets exposés : pilotage, ventes, stock, financier, clients, BI, réglementaire, géospatial, mobile, IA, générateur, comparatifs, configuration.

Le guide deviendra une documentation utilisateur complète pour pharmaciens titulaires, gestionnaires, comptables, administrateurs et analystes BI PharmaSoft.

