# Guide de Tests - Module d'Approvisionnement

## Vue d'ensemble

Ce document décrit les stratégies de tests et les bonnes pratiques pour le module d'approvisionnement de la pharmacie.

## Structure des Tests

### Tests Unitaires

Les tests unitaires couvrent les composants individuels, hooks et services :

```
src/
├── hooks/
│   ├── useSuppliers.ts
│   └── __tests__/
│       └── useSuppliers.test.ts
├── services/
│   ├── orderValidationService.ts
│   └── __tests__/
│       └── orderValidationService.test.ts
└── components/
    └── __tests__/
        └── OrderList.test.tsx
```

### Tests d'Intégration

Les tests d'intégration vérifient l'interaction entre les modules :

```
src/tests/integration/
├── supplyChainFlow.test.ts
├── stockIntegration.test.ts
└── accountingIntegration.test.ts
```

### Tests de Performance

Les tests de performance mesurent les temps de réponse et l'utilisation des ressources :

```
src/tests/performance/
├── orderListPerformance.test.ts
├── virtualizedComponents.test.ts
└── memoryLeaks.test.ts
```

## Configuration des Tests

### Setup Jest (recommandé pour le futur)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Setup Testing Library

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock Supabase
global.mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }))
};
```

## Tests Manuels

En attendant la configuration Jest, effectuer des tests manuels :

### 1. Tests Fonctionnels par Onglet

#### Onglet "Liste des Commandes"
- [ ] Affichage de la liste des commandes
- [ ] Filtrage par statut, fournisseur, date
- [ ] Recherche textuelle
- [ ] Pagination/virtualisation pour grandes listes
- [ ] Actions sur les commandes (voir, modifier, supprimer)

#### Onglet "Commandes"
- [ ] Sélection d'un fournisseur
- [ ] Ajout de produits à la commande
- [ ] Calcul automatique des totaux
- [ ] Validation des quantités et prix
- [ ] Sauvegarde en brouillon
- [ ] Envoi de la commande

#### Onglet "Réceptions"
- [ ] Sélection d'une commande en attente
- [ ] Scanner de codes-barres (simulation)
- [ ] Saisie des quantités reçues/acceptées
- [ ] Gestion des lots et dates d'expiration
- [ ] Contrôle qualité
- [ ] Validation de la réception

#### Onglet "Fournisseurs"
- [ ] Liste des fournisseurs avec informations
- [ ] Création d'un nouveau fournisseur
- [ ] Modification des informations fournisseur
- [ ] Historique des commandes par fournisseur
- [ ] Évaluation des performances

#### Onglet "Suivi"
- [ ] Affichage du statut des commandes
- [ ] Progression en temps réel
- [ ] Informations transporteur
- [ ] Estimation de livraison
- [ ] Actions de suivi

### 2. Tests d'Intégration

#### Intégration Stock
1. Créer une réception de marchandises
2. Vérifier la mise à jour automatique du stock
3. Contrôler la création des lots
4. Valider les mouvements de stock

#### Intégration Comptabilité
1. Créer une commande fournisseur
2. Vérifier la génération d'écriture comptable
3. Réceptionner la marchandise
4. Contrôler la mise à jour des comptes

#### Intégration Clients
1. Modifier le prix d'achat d'un produit
2. Vérifier l'impact sur les prix de vente
3. Contrôler la disponibilité produit
4. Valider l'historique

### 3. Tests de Performance

#### Test de Charge
1. Créer 1000+ commandes fictives
2. Mesurer le temps d'affichage de la liste
3. Tester les filtres avec de gros volumes
4. Vérifier la fluidité du scroll

#### Test de Mémoire
1. Naviguer entre les onglets rapidement
2. Filtrer et rechercher intensivement
3. Surveiller l'usage mémoire dans DevTools
4. Détecter les fuites mémoire

#### Test de Responsivité
1. Tester sur différentes tailles d'écran
2. Vérifier l'adaptation mobile
3. Contrôler l'accessibilité
4. Valider les interactions tactiles

## Outils de Test

### Performance Monitoring

```typescript
// Utiliser les outils intégrés
import { globalPerformanceMonitor } from '@/utils/performanceMonitoring';

// Dans un composant
const { measureRender, getSummary } = usePerformanceMonitor();

useEffect(() => {
  const endMeasure = measureRender('OrderList');
  return endMeasure;
});

// Obtenir un rapport
const report = getSummary();
console.log('Performance report:', report);
```

### Monitoring Réseau

```typescript
// Surveiller les appels API
const { fetch } = useOptimizedFetch();

const loadOrders = async () => {
  const result = await fetch('orders', () => 
    supabase.from('commandes_fournisseurs').select('*')
  );
  return result;
};
```

### Debugging

```typescript
// Activer les logs de debug
localStorage.setItem('debug', 'supply:*');

// Dans le code
import debug from 'debug';
const log = debug('supply:orders');
log('Loading orders', { filters, page });
```

## Critères de Validation

### Performance
- [ ] Temps de chargement initial < 3s
- [ ] Temps de réponse des filtres < 500ms
- [ ] Rendu des listes virtualisées < 100ms
- [ ] Usage mémoire stable (pas de fuites)

### Fonctionnalité
- [ ] Toutes les opérations CRUD fonctionnent
- [ ] Les validations bloquent les données incorrectes
- [ ] Les calculs sont exacts
- [ ] Les intégrations sont cohérentes

### UX/UI
- [ ] Interface responsive sur tous les écrans
- [ ] Feedback visuel approprié (loading, erreurs)
- [ ] Navigation intuitive
- [ ] Accessibilité respectée

### Sécurité
- [ ] Isolation multi-tenant respectée
- [ ] Validation côté serveur en place
- [ ] Audit trail fonctionnel
- [ ] Permissions respectées

## Rapport de Tests

### Template de Rapport

```markdown
# Rapport de Tests - Module Approvisionnement

**Date :** [Date]
**Testeur :** [Nom]
**Version :** [Version]

## Résumé Exécutif
- Tests passés : X/Y
- Bugs critiques : X
- Bugs mineurs : X
- Recommandations : X

## Tests Fonctionnels
### Onglet Liste Commandes
- [x] Affichage liste ✅
- [x] Filtrage ✅
- [ ] Pagination ❌ (Bug #123)

### Performance
- Temps de chargement : Xms (cible: <3000ms)
- Usage mémoire : XMB (stable)
- Rendu liste : Xms (cible: <100ms)

## Bugs Identifiés
1. **Bug #123** - Pagination cassée avec >1000 items
   - Sévérité : Haute
   - Reproduction : [étapes]
   - Solution proposée : [solution]

## Recommandations
1. Optimiser la requête de chargement des commandes
2. Implémenter la virtualisation pour les grandes listes
3. Ajouter plus de tests automatisés
```

### Outils de Reporting

```typescript
// Générateur de rapport automatique
export const generateTestReport = () => {
  const performance = globalPerformanceMonitor.getPerformanceSummary();
  const memoryUsage = getMemoryUsage();
  
  return {
    timestamp: new Date().toISOString(),
    performance,
    memoryUsage,
    userAgent: navigator.userAgent,
    testResults: collectTestResults()
  };
};

// Export en JSON
const report = generateTestReport();
console.log('Test Report:', JSON.stringify(report, null, 2));
```

## Automatisation Future

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run performance tests
        run: npm run test:performance
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

### Tests E2E avec Playwright

```typescript
// e2e/supply-chain.spec.ts
import { test, expect } from '@playwright/test';

test('should create and track order', async ({ page }) => {
  await page.goto('/tableau-de-bord');
  await page.click('[data-testid="stock-menu"]');
  await page.click('[data-testid="approvisionnement-tab"]');
  
  // Créer une commande
  await page.click('[data-testid="new-order-btn"]');
  await page.selectOption('[data-testid="supplier-select"]', 'supplier-1');
  await page.fill('[data-testid="product-search"]', 'Paracétamol');
  // ...
  
  await expect(page.locator('[data-testid="order-created"]')).toBeVisible();
});
```

## Bonnes Pratiques

### Tests Unitaires
1. **Isolation** : Mocker toutes les dépendances externes
2. **Couverture** : Viser 80%+ de couverture de code
3. **Lisibilité** : Noms de tests descriptifs
4. **Maintenabilité** : Tests simples et focalisés

### Tests d'Intégration
1. **Scénarios réels** : Tester les flux utilisateur complets
2. **Données cohérentes** : Utiliser des jeux de données réalistes
3. **Cleanup** : Nettoyer après chaque test
4. **Parallélisation** : Tests indépendants

### Tests de Performance
1. **Métriques claires** : Définir des seuils précis
2. **Conditions constantes** : Environnement de test stable
3. **Monitoring continu** : Intégrer dans le pipeline
4. **Analyse tendances** : Suivre l'évolution

---

*Guide mis à jour le : 2024-12-10*
*Prochaine révision : 2025-01-10*