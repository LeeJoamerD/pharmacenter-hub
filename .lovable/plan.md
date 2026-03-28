

# Audit des données mockées dans l'application

## Résumé

Après analyse complète du code source, voici les composants et services qui utilisent encore des **données hardcodées ou simulées** au lieu de requêtes vers la base de données.

---

## Composants/Services 100% mockés (priorité haute)

### 1. `src/hooks/useSalesMetrics.ts`
- **Statut** : Entièrement mocké, aucun import Supabase
- **Impact** : Hook non utilisé — remplacé par `useSalesMetricsDB.ts` dans tous les composants. **Fichier mort, à supprimer.**

### 2. `src/components/dashboard/modules/sales/SalesAnalytics.tsx`
- **Statut** : Entièrement mocké (monthlyData, weeklyData, paymentMethodData, topProductsData hardcodés)
- **Impact** : Non utilisé — remplacé par `SalesAnalyticsConnected.tsx`. **Fichier mort, à supprimer.**

### 3. `src/components/dashboard/modules/sales/ReturnsExchanges.tsx`
- **Statut** : Données mockées (mockTransactions, mockReturns hardcodés)
- **Impact** : Non utilisé — remplacé par `ReturnsExchangesConnected.tsx`. **Fichier mort, à supprimer.**

### 4. `src/services/supplyAnalyticsService.ts`
- **Statut** : **4 méthodes entièrement simulées** sans aucune requête DB
  - `getSupplierPerformance()` → retourne 1 fournisseur fictif
  - `getDeliveryAnalytics()` → retourne 6 mois de données aléatoires (`Math.random()`)
  - `getQualityMetrics()` → taux d'acceptation fixe à 92, données aléatoires
  - `getSupplyKPIs()` → valeurs hardcodées (1 250 000, 12 fournisseurs, etc.)
- **Impact** : Utilisé activement via `useSupplyAnalytics` → affiché dans `SupplyDashboard.tsx` (module Stock/Approvisionnement avancé)

### 5. `src/services/supplyChainAutomationService.ts`
- **Statut** : **3 méthodes simulées**
  - `generateStockAlerts()` → retourne 1 alerte fictive "Paracétamol 500mg"
  - `calculateSupplyNeeds()` → retourne 1 besoin fictif
  - `checkLateDeliveries()` → retourne tableau vide
- **Impact** : Utilisé via `useSupplyAutomation` → affiché dans `SupplyDashboard.tsx`

---

## Composants avec données partiellement simulées (priorité moyenne)

### 6. `src/services/RotationAnalysisService.ts` (ligne 186)
- **Problème** : Le champ `evolution` est calculé avec `Math.random() * 20 - 10` au lieu d'une comparaison avec la période précédente
- **Impact** : L'évolution affichée dans l'analyse de rotation est fausse à chaque chargement

### 7. `src/services/AIReportsService.ts` (lignes 387-390)
- **Problème** : Les tendances (accuracyTrend, predictionsTrend, fpTrend, timeTrend) sont générées avec `Math.random()` au lieu de calculs réels
- **Impact** : Les tendances dans les rapports IA sont fictives

### 8. `src/components/dashboard/modules/chat/NetworkMetrics.tsx` (ligne 75)
- **Problème** : `avgLatency` utilise un fallback `Math.random() * 30 + 25` quand pas de données réelles
- **Impact** : La latence réseau affichée peut être fictive

### 9. `src/hooks/useHeroMetrics.ts`
- **Statut** : Fallback mocké (`MOCK_DATA`) quand pas de tenant connecté — comportement intentionnel et acceptable

### 10. `src/hooks/useBackupSettings.ts` (ligne 212)
- **Problème** : La taille du backup est simulée avec `Math.random() * 1000 + 100`
- **Impact mineur** : La taille affichée dans l'historique des backups est fictive

---

## Fichiers utilitaires de test (à ignorer)
- `src/utils/posTestHelpers.ts` — helpers de test, usage normal de `Math.random()`
- `src/components/platform-admin/PerformanceTestSuite.tsx` — suite de tests, mock attendu

---

## Recommandation

**Action immédiate** : Supprimer les 3 fichiers morts (points 1, 2, 3) pour nettoyer le codebase.

**Action prioritaire** : Connecter à la DB les services `supplyAnalyticsService.ts` et `supplyChainAutomationService.ts` (points 4, 5) — ils alimentent un dashboard utilisé activement.

**Action secondaire** : Corriger les valeurs `Math.random()` dans RotationAnalysisService, AIReportsService et NetworkMetrics (points 6, 7, 8).

Souhaitez-vous que j'implémente ces corrections ? Si oui, par quel groupe souhaitez-vous commencer ?

