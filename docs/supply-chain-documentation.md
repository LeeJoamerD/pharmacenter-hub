# Documentation - Module d'Approvisionnement

## Vue d'ensemble

Le module d'approvisionnement est un système complet de gestion des commandes fournisseurs, réceptions et suivi des livraisons. Il s'intègre parfaitement avec les modules de stock, comptabilité et clients pour offrir une solution complète de gestion pharmaceutique.

## Architecture

### Structure des composants

```
src/components/dashboard/modules/stock/
├── tabs/
│   └── StockApprovisionnementTab.tsx     # Composant principal
├── OrderList.tsx                         # Liste des commandes
├── OrderForm.tsx                         # Formulaire de commande
├── ReceptionForm.tsx                     # Formulaire de réception
├── SupplierManager.tsx                   # Gestion des fournisseurs
├── OrderTracking.tsx                     # Suivi des commandes
└── SupplyIntelligenceDashboard.tsx      # Dashboard intelligent
```

### Hooks et Services

```
src/hooks/
├── useSuppliers.ts                      # Gestion des fournisseurs
├── useSupplierOrders.ts                 # Gestion des commandes
├── useOrderLines.ts                     # Lignes de commande
├── useReceptions.ts                     # Réceptions
├── useOrderTracking.ts                  # Suivi des commandes
└── useTransporters.ts                   # Transporteurs

src/services/
├── orderCalculationService.ts           # Calculs de commandes
├── orderValidationService.ts            # Validation des commandes
├── receptionValidationService.ts        # Validation des réceptions
├── stockUpdateService.ts                # Mise à jour des stocks
├── supplyIntelligenceService.ts         # Intelligence d'approvisionnement
└── supplyReportsService.ts              # Rapports d'approvisionnement
```

## Fonctionnalités principales

### 1. Gestion des Commandes

#### Création de commandes
- Sélection du fournisseur
- Ajout de produits avec quantités et prix
- Calcul automatique des totaux
- Validation des règles métier
- Génération de numéros de commande uniques

#### Suivi des commandes
- États : Brouillon, Envoyée, Confirmée, Partielle, Livrée, Annulée
- Progression en temps réel
- Notifications automatiques
- Historique complet des modifications

### 2. Gestion des Réceptions

#### Processus de réception
- Scanner de codes-barres
- Contrôle qualité automatisé
- Gestion des lots et dates d'expiration
- Réconciliation automatique avec les commandes
- Mise à jour automatique des stocks

#### Validation des réceptions
- Vérification des quantités
- Contrôle de conformité
- Documentation des écarts
- Génération d'alertes

### 3. Gestion des Fournisseurs

#### Base de données fournisseurs
- Informations complètes (contact, adresse, conditions)
- Historique des commandes
- Évaluation des performances
- Gestion des contrats

#### Évaluation des performances
- Délais de livraison
- Qualité des produits
- Respect des commandes
- Calcul automatique des notes

### 4. Intelligence d'Approvisionnement

#### Recommandations automatiques
- Analyse des stocks faibles
- Suggestions de réapprovisionnement
- Optimisation des quantités
- Prévisions de demande

#### Alertes intelligentes
- Stocks critiques
- Retards de livraison
- Anomalies de prix
- Problèmes qualité

## Guide d'utilisation

### Création d'une commande

1. **Navigation** : Aller dans Stock > Approvisionnement > Commandes
2. **Nouveau** : Cliquer sur "Nouvelle Commande"
3. **Fournisseur** : Sélectionner un fournisseur existant
4. **Produits** : Rechercher et ajouter des produits
5. **Quantités** : Définir les quantités et prix
6. **Validation** : Vérifier les totaux et envoyer

### Réception de marchandises

1. **Sélection** : Choisir la commande à réceptionner
2. **Scanner** : Utiliser le scanner de codes-barres
3. **Contrôle** : Vérifier les quantités reçues
4. **Lots** : Saisir les numéros de lot et dates d'expiration
5. **Validation** : Confirmer la réception

### Suivi des commandes

1. **Tableau de bord** : Vue d'ensemble des commandes en cours
2. **Détails** : Cliquer sur une commande pour voir le détail
3. **Statut** : Suivre la progression en temps réel
4. **Actions** : Contacter le transporteur ou fournisseur

## Configuration

### Paramètres système

```typescript
// Configuration des seuils d'alerte
const ALERT_THRESHOLDS = {
  STOCK_LOW: 0.2,        // 20% du stock minimum
  STOCK_CRITICAL: 0.1,   // 10% du stock minimum
  DELAY_WARNING: 2,      // 2 jours de retard
  DELAY_CRITICAL: 7      // 7 jours de retard
};

// Configuration des calculs
const CALCULATION_SETTINGS = {
  TVA_RATE: 0.18,           // 18% TVA
  SAFETY_STOCK_RATIO: 0.25, // 25% de stock de sécurité
  REORDER_POINT_DAYS: 7     // Point de commande à 7 jours
};
```

### Base de données

#### Tables principales
- `fournisseurs` : Données des fournisseurs
- `commandes_fournisseurs` : Commandes
- `lignes_commande_fournisseur` : Lignes de commande
- `receptions_fournisseurs` : Réceptions
- `lots` : Gestion des lots

#### Relations
- Commande → Fournisseur (many-to-one)
- Commande → Lignes (one-to-many)
- Réception → Commande (many-to-one)
- Lot → Produit (many-to-one)

## Intégrations

### Module Stock
- Mise à jour automatique des niveaux de stock
- Gestion des mouvements de stock
- Alertes de rupture
- Valorisation des stocks

### Module Comptabilité
- Génération d'écritures comptables
- Gestion des factures fournisseurs
- Suivi des paiements
- Rapports financiers

### Module Clients
- Répercussion des prix d'achat
- Gestion des marges
- Disponibilité produits
- Historique des ventes

## Tests

### Tests unitaires
```bash
# Exécuter tous les tests
npm test

# Tests spécifiques au module
npm test -- --testPathPattern=supply

# Tests avec couverture
npm test -- --coverage
```

### Tests d'intégration
```bash
# Tests d'intégration complets
npm run test:integration

# Tests de performance
npm run test:performance
```

## Optimisations de performance

### Virtualisation des listes
- Utilisation de `react-window` pour les longues listes
- Rendu uniquement des éléments visibles
- Amélioration significative des performances

### Memoization
- `React.memo` pour les composants
- `useMemo` pour les calculs coûteux
- `useCallback` pour les fonctions

### Lazy loading
- Chargement à la demande des composants
- Pagination intelligente
- Cache des données fréquemment utilisées

## Surveillance des performances

### Métriques surveillées
- Temps de rendu des composants
- Durée des appels API
- Utilisation mémoire
- Tâches longues (>50ms)

### Outils de monitoring
```typescript
import { globalPerformanceMonitor } from '@/utils/performanceMonitoring';

// Mesurer une opération
const result = globalPerformanceMonitor.measureFunction('createOrder', () => {
  return createOrderLogic();
});

// Obtenir un rapport
const report = globalPerformanceMonitor.getPerformanceSummary();
```

## Débogage

### Logs structurés
```typescript
// Activation des logs de debug
localStorage.setItem('debug', 'supply:*');

// Logs dans le service
import debug from 'debug';
const log = debug('supply:orders');
log('Creating order', orderData);
```

### Outils de développement
- React Developer Tools
- Profiler React
- Network tab pour les API
- Performance tab pour l'analyse

## Sécurité

### Validation des données
- Validation côté client avec Zod
- Validation côté serveur (RLS Supabase)
- Sanitisation des entrées
- Protection CSRF

### Authentification
- JWT tokens
- Row Level Security (RLS)
- Isolation multi-tenant
- Audit trail complet

## API

### Endpoints principaux

```typescript
// Fournisseurs
GET    /api/suppliers          // Liste des fournisseurs
POST   /api/suppliers          // Créer un fournisseur
PUT    /api/suppliers/:id      // Modifier un fournisseur
DELETE /api/suppliers/:id      // Supprimer un fournisseur

// Commandes
GET    /api/orders            // Liste des commandes
POST   /api/orders            // Créer une commande
PUT    /api/orders/:id        // Modifier une commande
DELETE /api/orders/:id        // Supprimer une commande

// Réceptions
GET    /api/receptions        // Liste des réceptions
POST   /api/receptions        // Créer une réception
PUT    /api/receptions/:id    // Modifier une réception
```

### Format des données

```typescript
// Commande
interface Order {
  id: string;
  fournisseur_id: string;
  date_commande: string;
  statut: OrderStatus;
  lignes: OrderLine[];
  montant_total: number;
}

// Ligne de commande
interface OrderLine {
  produit_id: string;
  quantite_commandee: number;
  prix_achat_unitaire_attendu: number;
  montant_ligne: number;
}
```

## Maintenance

### Tâches récurrentes
- Nettoyage des logs anciens
- Archivage des commandes anciennes
- Mise à jour des performances fournisseurs
- Vérification de la cohérence des données

### Monitoring automatique
- Alertes de performance
- Détection d'anomalies
- Rapports d'utilisation
- Métriques métier

## Support

### Résolution de problèmes

**Problème : Commandes non synchronisées**
```typescript
// Vérifier la synchronisation
const orders = await supabase.from('commandes_fournisseurs').select('*');
console.log('Orders count:', orders.data?.length);

// Forcer la synchronisation
await orderService.syncOrders();
```

**Problème : Performance lente**
```typescript
// Analyser les performances
const report = globalPerformanceMonitor.getPerformanceSummary();
console.log('Performance report:', report);

// Optimiser les requêtes
const optimizedQuery = supabase
  .from('commandes_fournisseurs')
  .select('id, statut, fournisseur:fournisseurs(nom)')
  .limit(50);
```

### Contacts
- Équipe technique : tech@pharmacy.com
- Support utilisateur : support@pharmacy.com
- Documentation : docs.pharmacy.com

---

*Documentation mise à jour le : 2024-12-10*
*Version du module : 1.0.0*
*Compatibilité : React 18+, TypeScript 5+*