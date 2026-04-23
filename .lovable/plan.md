

## Plan d'implémentation — Module Dashboard dans le Guide Utilisateur

### Objectif

Ajouter un nouveau module **Dashboard (Tableau de bord principal)** au Guide Utilisateur, positionné entre **Présentation de PharmaSoft** et **Administration**, couvrant l'intégralité des composants exposés dans `src/components/dashboard/DashboardHome.tsx`.

---

## 1. Analyse du Dashboard existant

D'après `DashboardHome.tsx`, le tableau de bord principal est composé de :

```text
DashboardHome
├── DashboardHeader (refresh + visibilité)
├── DashboardVisibilityToggle (gating permission dashboard.view)
├── Row 1 : SalesMetricsCards (KPI ventes du jour)
├── Row 2 : StockMetricsCards (KPI stock)
├── Row 3 : SalesTrendChart + CriticalAlertsList (péremptions)
├── Row 4 : TopProductsList + PaymentMethodsChart
├── Row 5 : ActiveSessionsCards (sessions de caisse actives)
├── Row 6 : CreditPromotionsSummary (crédits + promotions)
├── Row 7 : RecentActivitiesTimeline
├── Row 8 : VidalNewsWidget (alertes ANSM/HAS/EMA)
└── QuickActionsPanel (actions rapides)
```

---

## 2. Fichiers à créer / modifier

### Création
- `src/components/help/guide/content/dashboard.ts` — nouveau module guide

### Modification
- `src/components/help/guide/registry.ts` — insérer `dashboardModule` entre `presentationModule` et `administrationModule`

Aucun changement UI : `GuideHome` et la sidebar du guide listent automatiquement les modules via le `registry`.

---

## 3. Organisation cible (4 sections, ~14 articles)

```text
Dashboard (Accueil)
├── Pilotage et accès
│   ├── dashboard-vue-ensemble
│   ├── dashboard-actualiser
│   └── dashboard-visibilite-permission
├── Indicateurs clés (KPI)
│   ├── dashboard-kpi-ventes
│   ├── dashboard-kpi-stock
│   ├── dashboard-tendance-ventes
│   └── dashboard-modes-paiement
├── Suivi opérationnel
│   ├── dashboard-alertes-peremption
│   ├── dashboard-top-produits
│   ├── dashboard-sessions-actives
│   ├── dashboard-credits-promotions
│   └── dashboard-activites-recentes
└── Veille et actions
    ├── dashboard-actualites-vidal
    └── dashboard-actions-rapides
```

Chaque article suit la structure stricte `GuideArticle` (`id, title, objective, location, audience, intro, steps, callouts, bestPractices, faq, related, keywords`), identique aux modules précédents.

---

## 4. Définition du module

```ts
export const dashboardModule: GuideModule = {
  id: 'dashboard',
  title: 'Tableau de bord',
  tagline: "Pilotage temps réel de l'officine",
  description: "KPI ventes/stock, alertes, sessions, activités et actions rapides.",
  icon: LayoutDashboard,
  accent: 'primary',
  sections: [...]
};
```

---

## 5. Règles métier intégrées (mémoires applicables)

- **Visibilité** : `useDashboardVisibility` + permission `dashboard.view` (mémoire `dashboard-visibility-guard-unification`).
- **Multi-tenant** : toutes les données filtrées par `tenant_id` via `useDashboardData`.
- **Nommage produit** : `libelle_produit` (jamais `nom`) dans Top Produits et alertes.
- **Formatage zéro** : `fmtNum` doit préserver les zéros (`v != null`).
- **Régionalisation** : devise/format date via `parametres_systeme`.
- **VIDAL** : widget alimenté par Edge Function `vidal-news` (mémoire `news-widget-pharmacy-dashboard`).
- **Sessions actives** : alignées avec le cycle de clôture de caisse.
- **Localisation** : tous les libellés via `useLanguage`.

**Callouts récurrents :**
- Info — accès soumis à la permission `dashboard.view`.
- Warning — les alertes péremption complètent mais ne remplacent pas le contrôle physique des lots.
- Info — actualités VIDAL à titre informatif, vérifier la source officielle avant action.

---

## 6. Maillage `related[]` (cross-module)

```text
dashboard-kpi-ventes        → ventes-analytics-vue-ensemble, rapports-ventes-vue-ensemble
dashboard-kpi-stock         → stock-alertes-rupture, rapports-stock-vue-ensemble
dashboard-alertes-peremption→ stock-alertes-peremption, stock-lots-vue-ensemble
dashboard-sessions-actives  → ventes-caisse-cloture, comptabilite-tableau-bord
dashboard-credits-promotions→ ventes-credits-clients, ventes-promotions
dashboard-actualites-vidal  → assistant-pharma-pharmacovigilance
dashboard-actions-rapides   → presentation-navigation-modules
dashboard-visibilite-permission → parametres-utilisateurs-permissions-detail
```

---

## 7. Intégration dans `registry.ts`

Insertion ordonnée :

```ts
import { dashboardModule } from './content/dashboard';

export const guideModules: GuideModule[] = [
  presentationModule,
  dashboardModule,        // ← nouveau
  administrationModule,
  stockModule,
  ventesModule,
  comptabiliteModule,
  rapportsModule,
  assistantModule,
  chatModule,
  parametresModule,
];
```

Effet automatique :
- Apparition dans la sidebar du guide entre Présentation et Administration.
- Apparition dans `GuideHome` (cartes Modules + section "Démarrer ici").
- Indexation immédiate par `searchGuide` (full-text + mots-clés).

---

## 8. Mots-clés (3 à 5 par article)

```text
tableau de bord, accueil, KPI, pilotage
ventes, chiffre d'affaires, ticket moyen
stock, rupture, péremption, valorisation
tendance, graphique, évolution
paiement, espèces, mobile money
alerte, lot, expiration
top produits, best-sellers
session, caisse, ouverture
crédit, promotion, encours
activité, journal, temps réel
VIDAL, ANSM, alerte réglementaire
actions rapides, raccourci, navigation
permission, visibilité, dashboard.view
```

---

## 9. Étapes d'implémentation

### Étape 1 — Création du contenu
Créer `src/components/help/guide/content/dashboard.ts` avec les 4 sections et ~14 articles via la factory `make` (pattern identique aux autres modules).

### Étape 2 — Enregistrement
Mettre à jour `src/components/help/guide/registry.ts` pour insérer `dashboardModule` à la position 2 (après Présentation, avant Administration).

### Étape 3 — Vérifications
1. Build TypeScript/Vite OK.
2. Conformité stricte au type `GuideArticle` et `GuideModule`.
3. Module visible dans `GuideHome` (carte + Démarrer ici).
4. Navigation dans la sidebar fonctionnelle.
5. Recherche full-text retourne les nouveaux articles.
6. Liens `related[]` cohérents (cross-module).
7. Pas de doublons d'identifiants.
8. `location` aligné avec `Accueil > Tableau de bord`.

---

## Résultat attendu

Le Guide Utilisateur intégrera un module **Tableau de bord** complet (~14 articles structurés en 4 sections), positionné entre Présentation de PharmaSoft et Administration, documentant l'intégralité du Dashboard principal : KPI ventes/stock, graphiques, alertes péremption, sessions de caisse, crédits/promotions, activités récentes, actualités VIDAL et actions rapides.

