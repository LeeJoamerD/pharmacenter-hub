
# Plan d'Implémentation - Section Réglementaire du Module Rapports

## 1. Analyse de l'Existant

### 1.1 Composant Frontend Actuel
Le composant `RegulatoryReports.tsx` (612 lignes) contient 5 onglets avec des données entièrement mockées:

| Onglet | Contenu | Source Actuelle |
|--------|---------|-----------------|
| Stupéfiants | Registre des substances contrôlées | Données mockées en dur |
| Traçabilité | Suivi des lots pharmaceutiques | Données mockées en dur |
| Pharmacovigilance | Effets indésirables | Données mockées en dur |
| Rapports | Rapports obligatoires | Données mockées en dur |
| Conformité | Audits et actions correctives | Données mockées en dur |

### 1.2 Hook Existant (Partiellement Implémenté)
`useRegulatoryReports.ts` existe mais:
- Utilise des colonnes inexistantes (`est_stupefiant`, `stock_total`)
- Retourne des données mockées en fallback
- Ne gère pas la pagination (limite 1000)
- Pharmacovigilance entièrement mockée

### 1.3 Tables Base de Données Disponibles

| Table | Usage | Colonnes Clés |
|-------|-------|---------------|
| `compliance_requirements` | Exigences réglementaires | category, title, priority_level, regulation_reference |
| `compliance_controls` | Contrôles de conformité | status, compliance_score, next_control_date |
| `compliance_actions` | Actions correctives | action_type, status, due_date |
| `compliance_metrics_history` | Historique métriques | metric_date, global_score |
| `audit_reports` | Rapports d'audit | report_type, status, period_start/end |
| `audit_logs` | Journal d'audit | action, table_name, old_values, new_values |
| `lots` | Lots produits | numero_lot, date_peremption, quantite_restante |
| `mouvements_lots` | Mouvements de lots | type_mouvement, quantite_mouvement |
| `reglementations` | Réglementations légales | nom_reglementation, autorite_competente |
| `rapports_comptables` | Rapports générés | type_rapport, date_debut, date_fin |

### 1.4 RPC Existantes
- `calculate_compliance_metrics(p_tenant_id)` - Calcul des métriques de conformité
- `run_pharma_compliance_check` - Vérification conformité pharmaceutique

---

## 2. Problèmes Identifiés

### 2.1 Erreurs de Schéma
```typescript
// ERREUR: Ces colonnes n'existent pas dans produits_with_stock
.eq('est_stupefiant', true)   // ❌ N'existe pas
.select('stock_total')         // ❌ Doit être stock_actuel
```

### 2.2 Absence de Table Pharmacovigilance
Aucune table `pharmacovigilance_reports` n'existe - les données sont entièrement mockées.

### 2.3 Pas de Marquage Stupéfiants
Le champ `is_stupefiant` n'existe pas sur les produits - nécessite une migration.

### 2.4 Pagination Non Gérée
Aucune boucle de pagination pour les requêtes > 1000 lignes.

---

## 3. Plan de Migration Base de Données

### 3.1 Migration 1: Champ Stupéfiant sur Produits
```sql
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS is_stupefiant BOOLEAN DEFAULT false;

ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS is_controlled_substance BOOLEAN DEFAULT false;

CREATE INDEX idx_produits_stupefiant ON public.produits(tenant_id, is_stupefiant) 
WHERE is_stupefiant = true;
```

### 3.2 Migration 2: Table Pharmacovigilance
```sql
CREATE TABLE public.pharmacovigilance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  produit_id UUID REFERENCES public.produits(id),
  patient_age INTEGER,
  patient_gender TEXT,
  effet_indesirable TEXT NOT NULL,
  gravite TEXT NOT NULL CHECK (gravite IN ('mineure', 'moderee', 'grave', 'fatale')),
  date_survenue DATE NOT NULL,
  date_declaration DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'declare_ansm', 'clos', 'suivi')),
  suivi_requis BOOLEAN DEFAULT false,
  notes TEXT,
  declared_by UUID REFERENCES public.personnel(id),
  ansm_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacovigilance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation pharmacovigilance"
ON public.pharmacovigilance_reports FOR ALL
USING (tenant_id = get_current_user_tenant_id());
```

### 3.3 Migration 3: Table Registre Stupéfiants (Mouvements)
```sql
CREATE TABLE public.narcotics_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  produit_id UUID NOT NULL REFERENCES public.produits(id),
  lot_id UUID REFERENCES public.lots(id),
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement', 'destruction')),
  quantite INTEGER NOT NULL,
  stock_avant INTEGER NOT NULL,
  stock_apres INTEGER NOT NULL,
  ordonnance_reference TEXT,
  prescripteur TEXT,
  patient_reference TEXT,
  agent_id UUID REFERENCES public.personnel(id),
  verified_by UUID REFERENCES public.personnel(id),
  verification_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.narcotics_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation narcotics"
ON public.narcotics_registry FOR ALL
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_narcotics_registry_produit ON public.narcotics_registry(tenant_id, produit_id);
CREATE INDEX idx_narcotics_registry_date ON public.narcotics_registry(tenant_id, created_at DESC);
```

### 3.4 Migration 4: Table Rapports Obligatoires
```sql
CREATE TABLE public.mandatory_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  type_rapport TEXT NOT NULL,
  frequence TEXT NOT NULL CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel', 'trimestriel', 'annuel', 'immediat')),
  autorite_destinataire TEXT NOT NULL,
  prochaine_echeance DATE NOT NULL,
  derniere_soumission DATE,
  statut TEXT NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'urgent', 'complete', 'en_retard')),
  responsable_id UUID REFERENCES public.personnel(id),
  progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
  contenu JSONB DEFAULT '{}',
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mandatory_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation mandatory_reports"
ON public.mandatory_reports FOR ALL
USING (tenant_id = get_current_user_tenant_id());
```

---

## 4. Structure des Nouveaux Fichiers

```text
src/
├── hooks/
│   └── useRegulatoryReports.ts          # REFACTORING COMPLET
├── services/
│   └── RegulatoryService.ts             # NOUVEAU - Service dédié
├── components/dashboard/modules/reports/regulatory/
│   ├── RegulatoryReports.tsx            # REFACTORING (connexion aux données réelles)
│   ├── tabs/
│   │   ├── NarcoticsTab.tsx             # NOUVEAU - Onglet Stupéfiants
│   │   ├── TraceabilityTab.tsx          # NOUVEAU - Onglet Traçabilité
│   │   ├── PharmacovigilanceTab.tsx     # NOUVEAU - Onglet Pharmacovigilance
│   │   ├── MandatoryReportsTab.tsx      # NOUVEAU - Onglet Rapports
│   │   └── ComplianceTab.tsx            # NOUVEAU - Onglet Conformité
│   ├── dialogs/
│   │   ├── AddNarcoticMovementDialog.tsx    # NOUVEAU
│   │   ├── AddPharmacovigilanceDialog.tsx   # NOUVEAU
│   │   ├── AddMandatoryReportDialog.tsx     # NOUVEAU
│   │   ├── AddComplianceActionDialog.tsx    # NOUVEAU
│   │   └── ExportRegulatoryDialog.tsx       # NOUVEAU
│   └── components/
│       ├── RegulatoryMetricsCards.tsx   # NOUVEAU
│       ├── NarcoticsTable.tsx           # NOUVEAU
│       └── ComplianceAuditCard.tsx      # NOUVEAU
```

---

## 5. Implémentation Détaillée

### 5.1 RegulatoryService.ts (Nouveau)

```typescript
class RegulatoryService {
  // === STUPÉFIANTS ===
  async getNarcoticProducts(tenantId: string): Promise<NarcoticProduct[]>
  async getNarcoticMovements(tenantId: string, productId?: string): Promise<NarcoticMovement[]>
  async addNarcoticMovement(movement: CreateNarcoticMovement): Promise<void>
  async verifyNarcoticEntry(entryId: string, verifierId: string): Promise<void>
  
  // === TRAÇABILITÉ ===
  async getTrackedLots(tenantId: string, filters?: LotFilters): Promise<TrackedLot[]>
  async getLotMovementHistory(lotId: string): Promise<LotMovement[]>
  
  // === PHARMACOVIGILANCE ===
  async getPharmacovigilanceReports(tenantId: string): Promise<PharmacovigilanceReport[]>
  async createPharmacovigilanceReport(report: CreatePharmacovigilance): Promise<void>
  async updatePharmacovigilanceStatus(id: string, status: string): Promise<void>
  
  // === RAPPORTS OBLIGATOIRES ===
  async getMandatoryReports(tenantId: string): Promise<MandatoryReport[]>
  async createMandatoryReport(report: CreateMandatoryReport): Promise<void>
  async updateReportProgress(id: string, progress: number): Promise<void>
  async submitReport(id: string): Promise<void>
  
  // === CONFORMITÉ ===
  async getComplianceMetrics(tenantId: string): Promise<ComplianceMetrics>
  async getAuditHistory(tenantId: string): Promise<AuditEntry[]>
  async getComplianceActions(tenantId: string): Promise<ComplianceAction[]>
  async createComplianceAction(action: CreateComplianceAction): Promise<void>
  
  // === EXPORT ===
  async exportNarcoticsRegister(tenantId: string, period: DateRange): Promise<Blob>
  async exportComplianceReport(tenantId: string): Promise<Blob>
  async exportAuditTrail(tenantId: string, period: DateRange): Promise<Blob>
  
  // === PAGINATION ===
  private async fetchAllWithPagination<T>(table: string, tenantId: string, filters?: any): Promise<T[]>
}
```

### 5.2 useRegulatoryReports.ts (Refactoring Complet)

```typescript
export const useRegulatoryReports = (period: DatePeriod = 'month') => {
  const { currentTenant, tenantId } = useTenant();
  
  // MÉTRIQUES DE CONFORMITÉ (données réelles)
  const complianceMetricsQuery = useQuery({
    queryKey: ['regulatory-metrics', tenantId, period],
    queryFn: async () => {
      // Appeler RPC calculate_compliance_metrics
      // Compter lots tracés (pagination)
      // Compter rapports complétés
      // Calculer alertes actives
    },
    enabled: !!tenantId
  });
  
  // REGISTRE STUPÉFIANTS (données réelles avec pagination)
  const narcoticsQuery = useQuery({
    queryKey: ['narcotics-registry', tenantId, period],
    queryFn: async () => {
      // 1. Récupérer produits avec is_stupefiant = true
      // 2. Pour chaque produit, calculer stock via lots
      // 3. Récupérer mouvements depuis narcotics_registry
      // 4. Pagination complète (while hasMore)
    },
    enabled: !!tenantId
  });
  
  // TRAÇABILITÉ (données réelles avec pagination)
  const traceabilityQuery = useQuery({
    queryKey: ['traceability', tenantId, period],
    queryFn: async () => {
      // Pagination sur table lots avec jointures
    },
    enabled: !!tenantId
  });
  
  // PHARMACOVIGILANCE (nouvelle table)
  const pharmacovigilanceQuery = useQuery({
    queryKey: ['pharmacovigilance', tenantId, period],
    queryFn: () => regulatoryService.getPharmacovigilanceReports(tenantId!),
    enabled: !!tenantId
  });
  
  // RAPPORTS OBLIGATOIRES (nouvelle table)
  const mandatoryReportsQuery = useQuery({
    queryKey: ['mandatory-reports', tenantId],
    queryFn: () => regulatoryService.getMandatoryReports(tenantId!),
    enabled: !!tenantId
  });
  
  // AUDITS ET CONFORMITÉ
  const complianceQuery = useQuery({
    queryKey: ['compliance-audits', tenantId],
    queryFn: async () => {
      // Données depuis audit_reports + compliance_controls + compliance_actions
    },
    enabled: !!tenantId
  });
  
  // MUTATIONS
  const addNarcoticMovementMutation = useMutation({...});
  const addPharmacovigilanceMutation = useMutation({...});
  const updateReportProgressMutation = useMutation({...});
  const addComplianceActionMutation = useMutation({...});
  
  return {
    // Données
    metrics, narcotics, traceability, pharmacovigilance, mandatoryReports, complianceData,
    // États
    isLoading, error,
    // Actions
    addNarcoticMovement, addPharmacovigilance, updateReportProgress, addComplianceAction,
    // Export
    exportNarcotics, exportCompliance, exportAudit,
    // Refresh
    refetch
  };
};
```

### 5.3 Composants Onglets (Nouveaux)

#### NarcoticsTab.tsx
- Tableau des produits stupéfiants avec stock temps réel
- Historique des mouvements par produit
- Bouton "Ajouter mouvement" (entrée/sortie/destruction)
- Filtres: période, produit, type mouvement
- Export PDF du registre
- Indicateurs visuels de conformité

#### TraceabilityTab.tsx
- Liste des lots avec jointure produits/fournisseurs
- Statuts: Active, Expirée, Rappelée
- Progression des ventes (barre de progression)
- Filtres: statut, fournisseur, date péremption
- Lien vers détails lot

#### PharmacovigilanceTab.tsx
- Liste des déclarations d'effets indésirables
- Formulaire de création (dialog)
- Gravité avec code couleur (Mineure, Modérée, Grave)
- Indicateur "Suivi requis"
- Boutons: Déclarer ANSM, Clore, Marquer suivi

#### MandatoryReportsTab.tsx
- Liste des rapports obligatoires avec échéances
- Barre de progression par rapport
- Boutons: Voir, Soumettre
- Création de nouveaux rapports programmés
- Filtres: statut, fréquence, responsable

#### ComplianceTab.tsx
- Historique des audits (audit_reports)
- Actions correctives en cours (compliance_actions)
- Score de conformité global
- Bouton ajouter action corrective

### 5.4 Dialogs (Nouveaux)

#### AddNarcoticMovementDialog.tsx
```typescript
interface NarcoticMovementFormData {
  produit_id: string;
  lot_id?: string;
  type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'destruction';
  quantite: number;
  ordonnance_reference?: string;
  prescripteur?: string;
  notes?: string;
}
```

#### AddPharmacovigilanceDialog.tsx
```typescript
interface PharmacovigilanceFormData {
  produit_id: string;
  patient_age?: number;
  patient_gender?: 'M' | 'F';
  effet_indesirable: string;
  gravite: 'mineure' | 'moderee' | 'grave';
  date_survenue: Date;
  suivi_requis: boolean;
  notes?: string;
}
```

---

## 6. Gestion Multi-Tenant et Multi-Localités

### 6.1 Contexte Tenant
```typescript
const { currentTenant, tenantId } = useTenant();
// Toutes les requêtes filtrent par tenant_id
```

### 6.2 Filtrage par Localité (si applicable)
```typescript
// Récupérer paramètres localités depuis parametres_systeme
const { data: localites } = await supabase
  .from('parametres_systeme')
  .select('valeur')
  .eq('tenant_id', tenantId)
  .eq('categorie', 'localites')
  .single();
```

### 6.3 RLS Automatique
Toutes les nouvelles tables utilisent la policy standard:
```sql
USING (tenant_id = get_current_user_tenant_id())
```

---

## 7. Gestion de la Pagination (Limite 1000)

### 7.1 Pattern Standard
```typescript
const fetchAllWithPagination = async <T>(
  table: string, 
  tenantId: string,
  select: string,
  filters?: Record<string, any>
): Promise<T[]> => {
  let allData: T[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from(table)
      .select(select)
      .eq('tenant_id', tenantId)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    // Appliquer filtres
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
};
```

### 7.2 Application aux Requêtes
- Lots pour traçabilité: pagination complète
- Mouvements stupéfiants: pagination complète
- Produits stupéfiants: pagination complète

---

## 8. Fonctionnalités CRUD Complètes

### 8.1 Stupéfiants
| Action | Implémentation |
|--------|----------------|
| **Afficher** | Liste paginée avec calcul stock temps réel |
| **Ajouter mouvement** | Dialog avec validation quantité |
| **Vérifier** | Bouton "Vérifier" avec signature agent |
| **Exporter** | PDF du registre avec horodatage |

### 8.2 Pharmacovigilance
| Action | Implémentation |
|--------|----------------|
| **Afficher** | Liste avec filtres gravité/statut |
| **Créer** | Dialog formulaire complet |
| **Mettre à jour** | Changement statut (En cours → Déclaré) |
| **Supprimer** | Soft delete (champ is_active) |

### 8.3 Rapports Obligatoires
| Action | Implémentation |
|--------|----------------|
| **Afficher** | Liste avec échéances |
| **Créer** | Dialog avec fréquence et responsable |
| **Modifier** | Mise à jour progression |
| **Soumettre** | Action avec confirmation |

### 8.4 Conformité
| Action | Implémentation |
|--------|----------------|
| **Afficher audits** | Historique depuis audit_reports |
| **Ajouter action** | Dialog action corrective |
| **Mettre à jour** | Changement statut action |

---

## 9. Export et Impression

### 9.1 Registre Stupéfiants (PDF)
- En-tête: Pharmacie, période, numéro registre
- Tableau: Produit, Date, Type, Quantité, Stock, Référence, Agent
- Pied: Signature, date génération

### 9.2 Rapport Conformité (CSV/PDF)
- Métriques globales
- Liste exigences par statut
- Actions correctives en cours

### 9.3 Journal d'Audit (PDF)
- Sélection période
- Actions par table/utilisateur
- Horodatage précis

---

## 10. Ordre d'Implémentation

### Phase 1: Migrations Base de Données
1. Migration: Ajouter champ `is_stupefiant` sur produits
2. Migration: Créer table `pharmacovigilance_reports`
3. Migration: Créer table `narcotics_registry`
4. Migration: Créer table `mandatory_reports`

### Phase 2: Service et Hook
5. Créer `RegulatoryService.ts`
6. Refactoriser `useRegulatoryReports.ts`

### Phase 3: Composants Onglets
7. Créer `NarcoticsTab.tsx`
8. Créer `TraceabilityTab.tsx`
9. Créer `PharmacovigilanceTab.tsx`
10. Créer `MandatoryReportsTab.tsx`
11. Créer `ComplianceTab.tsx`

### Phase 4: Dialogs et Actions
12. Créer `AddNarcoticMovementDialog.tsx`
13. Créer `AddPharmacovigilanceDialog.tsx`
14. Créer `AddMandatoryReportDialog.tsx`
15. Créer `ExportRegulatoryDialog.tsx`

### Phase 5: Refactoring Principal
16. Refactoriser `RegulatoryReports.tsx` pour utiliser les nouveaux composants
17. Connecter toutes les données réelles
18. Implémenter exports PDF

### Phase 6: Tests et Validation
19. Vérifier toutes les fonctionnalités CRUD
20. Tester pagination > 1000 enregistrements
21. Valider multi-tenant
22. Tester exports

---

## 11. Fichiers Impactés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx_regulatory_tables.sql` | CRÉER |
| `src/services/RegulatoryService.ts` | CRÉER |
| `src/hooks/useRegulatoryReports.ts` | REFACTORISER |
| `src/components/.../regulatory/RegulatoryReports.tsx` | REFACTORISER |
| `src/components/.../regulatory/tabs/NarcoticsTab.tsx` | CRÉER |
| `src/components/.../regulatory/tabs/TraceabilityTab.tsx` | CRÉER |
| `src/components/.../regulatory/tabs/PharmacovigilanceTab.tsx` | CRÉER |
| `src/components/.../regulatory/tabs/MandatoryReportsTab.tsx` | CRÉER |
| `src/components/.../regulatory/tabs/ComplianceTab.tsx` | CRÉER |
| `src/components/.../regulatory/dialogs/*.tsx` | CRÉER (4 fichiers) |
| `src/components/.../regulatory/components/*.tsx` | CRÉER (3 fichiers) |
| `src/integrations/supabase/types.ts` | GÉNÉRÉ AUTOMATIQUEMENT |

---

## 12. Points de Vigilance

### 12.1 Sécurité
- RLS activé sur toutes les nouvelles tables
- Isolation stricte par tenant_id
- Validation côté serveur des mouvements stupéfiants

### 12.2 Performance
- Pagination obligatoire pour toutes les listes
- Index sur colonnes fréquemment filtrées
- Utilisation des vues existantes quand possible

### 12.3 Conformité Réglementaire
- Horodatage précis sur tous les mouvements
- Traçabilité des agents (who did what)
- Archivage impossible à modifier (append-only pour stupéfiants)
