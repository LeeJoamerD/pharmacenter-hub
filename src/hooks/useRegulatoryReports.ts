 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
 import { RegulatoryService, NarcoticProduct, NarcoticMovement, TrackedLot, PharmacovigilanceReport, MandatoryReport as MandatoryReportType, AuditEntry, ComplianceAction, ComplianceMetrics, CreateNarcoticMovement, CreatePharmacovigilance, CreateMandatoryReport } from '@/services/RegulatoryService';
 import { useToast } from '@/hooks/use-toast';

export interface ComplianceMetric {
  title: string;
  value: string;
  change: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  color: string;
  bgColor: string;
}

export interface NarcoticEntry {
  id: string;
  substance: string;
  stockInitial: number;
  entrees: number;
  sorties: number;
  stockFinal: number;
  statut: 'Conforme' | 'À vérifier' | 'Non conforme';
  derniereVerification: string;
}

export interface TraceabilityData {
  lot: string;
  medicament: string;
  fournisseur: string;
  dateReception: string;
  datePeremption: string;
  quantiteRecue: number;
  quantiteVendue: number;
  quantiteRestante: number;
  statutTrace: 'Active' | 'Expirée' | 'Rappelée';
}

export interface PharmacovigilanceEntry {
  id: string;
  medicament: string;
  effetIndesirable: string;
  gravite: 'Mineure' | 'Modérée' | 'Grave';
  patientAge: number;
  dateDeclaration: string;
  statut: string;
  suiviRequis: boolean;
}

export interface MandatoryReport {
  id: string;
  nom: string;
  frequence: string;
  prochaineEcheance: string;
  statut: 'Complété' | 'En cours' | 'Urgent' | 'Planifié';
  responsable: string;
  progression: number;
}

type DatePeriod = 'week' | 'month' | 'quarter' | 'year';

 export type { NarcoticProduct, NarcoticMovement, TrackedLot, PharmacovigilanceReport, AuditEntry, ComplianceAction };
 export type MandatoryReportData = MandatoryReportType;
 
export const useRegulatoryReports = (period: DatePeriod = 'month') => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
   const queryClient = useQueryClient();
   const { toast } = useToast();

  // Métriques de conformité
   const metricsQuery = useQuery({
    queryKey: ['regulatory-compliance', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
       return RegulatoryService.getComplianceMetrics(tenantId);
    },
    enabled: !!tenantId
  });

   // Produits stupéfiants
   const narcoticsProductsQuery = useQuery({
     queryKey: ['regulatory-narcotics-products', tenantId],
     queryFn: async () => {
      if (!tenantId) return [];
       return RegulatoryService.getNarcoticProducts(tenantId);
     },
     enabled: !!tenantId
   });

   // Mouvements stupéfiants
   const narcoticsMovementsQuery = useQuery({
     queryKey: ['regulatory-narcotics-movements', tenantId],
     queryFn: async () => {
       if (!tenantId) return [];
       return RegulatoryService.getNarcoticMovements(tenantId);
    },
    enabled: !!tenantId
  });

  // Traçabilité des lots
  const traceabilityQuery = useQuery({
    queryKey: ['regulatory-traceability', tenantId],
     queryFn: async () => {
      if (!tenantId) return [];
       return RegulatoryService.getTrackedLots(tenantId, 100);
    },
    enabled: !!tenantId
  });

  // Pharmacovigilance
  const pharmacovigilanceQuery = useQuery({
    queryKey: ['regulatory-pharmacovigilance', tenantId],
     queryFn: async () => {
       if (!tenantId) return [];
       return RegulatoryService.getPharmacovigilanceReports(tenantId);
    },
    enabled: !!tenantId
  });

  // Rapports obligatoires
  const mandatoryReportsQuery = useQuery({
    queryKey: ['regulatory-mandatory-reports', tenantId],
     queryFn: async () => {
      if (!tenantId) return [];
       return RegulatoryService.getMandatoryReports(tenantId);
     },
     enabled: !!tenantId
   });

   // Audits
   const auditsQuery = useQuery({
     queryKey: ['regulatory-audits', tenantId],
     queryFn: async () => {
       if (!tenantId) return [];
       return RegulatoryService.getAuditHistory(tenantId);
    },
    enabled: !!tenantId
  });

   // Actions de conformité
   const complianceActionsQuery = useQuery({
     queryKey: ['regulatory-compliance-actions', tenantId],
     queryFn: async () => {
       if (!tenantId) return [];
       return RegulatoryService.getComplianceActions(tenantId);
     },
     enabled: !!tenantId
   });
 
   // === MUTATIONS ===
 
   const addNarcoticMovementMutation = useMutation({
     mutationFn: (data: CreateNarcoticMovement) => RegulatoryService.addNarcoticMovement(data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-narcotics-movements'] });
       queryClient.invalidateQueries({ queryKey: ['regulatory-narcotics-products'] });
       toast({ title: 'Mouvement enregistré', description: 'Le mouvement de stupéfiant a été enregistré.' });
     },
     onError: (error: Error) => {
       toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
     }
   });
 
   const addPharmacovigilanceMutation = useMutation({
     mutationFn: (data: CreatePharmacovigilance) => RegulatoryService.createPharmacovigilanceReport(data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-pharmacovigilance'] });
       toast({ title: 'Déclaration créée', description: 'La déclaration de pharmacovigilance a été enregistrée.' });
     },
     onError: (error: Error) => {
       toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
     }
   });
 
   const updatePharmacovigilanceStatusMutation = useMutation({
     mutationFn: ({ id, statut, ansm_reference }: { id: string; statut: string; ansm_reference?: string }) => 
       RegulatoryService.updatePharmacovigilanceStatus(id, statut, ansm_reference),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-pharmacovigilance'] });
       toast({ title: 'Statut mis à jour', description: 'Le statut a été modifié avec succès.' });
     }
   });
 
   const deletePharmacovigilanceMutation = useMutation({
     mutationFn: (id: string) => RegulatoryService.deletePharmacovigilanceReport(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-pharmacovigilance'] });
       toast({ title: 'Supprimé', description: 'La déclaration a été supprimée.' });
     }
   });
 
   const addMandatoryReportMutation = useMutation({
     mutationFn: (data: CreateMandatoryReport) => RegulatoryService.createMandatoryReport(data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-mandatory-reports'] });
       toast({ title: 'Rapport créé', description: 'Le rapport obligatoire a été planifié.' });
     }
   });
 
   const updateReportProgressMutation = useMutation({
     mutationFn: ({ id, progression }: { id: string; progression: number }) => 
       RegulatoryService.updateReportProgress(id, progression),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-mandatory-reports'] });
     }
   });
 
   const submitReportMutation = useMutation({
     mutationFn: (id: string) => RegulatoryService.updateReportStatus(id, 'complete'),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-mandatory-reports'] });
       queryClient.invalidateQueries({ queryKey: ['regulatory-compliance'] });
       toast({ title: 'Rapport soumis', description: 'Le rapport a été marqué comme complété.' });
     }
   });
 
   const deleteMandatoryReportMutation = useMutation({
     mutationFn: (id: string) => RegulatoryService.deleteMandatoryReport(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-mandatory-reports'] });
       toast({ title: 'Supprimé', description: 'Le rapport a été supprimé.' });
     }
   });
 
   const addComplianceActionMutation = useMutation({
     mutationFn: ({ titre, description, echeance }: { titre: string; description: string; echeance?: string }) => 
       RegulatoryService.createComplianceAction(tenantId!, titre, description, echeance),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['regulatory-compliance-actions'] });
       toast({ title: 'Action créée', description: 'L\'action corrective a été enregistrée.' });
     }
   });
 
  // Construction des métriques de conformité
  const buildComplianceMetrics = (): ComplianceMetric[] => {
     const data = metricsQuery.data;
    if (!data) return [];

    return [
      {
        title: 'Conformité Globale',
         value: `${data.conformityRate}%`,
        change: '+2.1%',
        status: data.conformityRate >= 95 ? 'excellent' : data.conformityRate >= 85 ? 'good' : 'warning',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Rapports Obligatoires',
        value: `${data.rapportsCompletes}/${data.totalRapports}`,
        change: `${data.totalRapports - data.rapportsCompletes} en attente`,
        status: data.rapportsCompletes >= data.totalRapports - 1 ? 'excellent' : 'warning',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'Audits Réussis',
         value: `${data.auditsReussis}/${data.totalAudits}`,
         change: data.auditsReussis === data.totalAudits ? '100%' : `${Math.round((data.auditsReussis / data.totalAudits) * 100)}%`,
         status: data.auditsReussis >= data.totalAudits ? 'excellent' : 'warning',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Alertes Actives',
        value: data.alertesActives.toString(),
        change: '-2 vs hier',
        status: data.alertesActives <= 3 ? 'good' : 'warning',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    ];
  };

   const isLoading = metricsQuery.isLoading || narcoticsProductsQuery.isLoading || traceabilityQuery.isLoading;

  return {
     // Métriques
    complianceMetrics: buildComplianceMetrics(),
     metricsData: metricsQuery.data,
     
     // Données
     narcoticsProducts: narcoticsProductsQuery.data || [],
     narcoticsMovements: narcoticsMovementsQuery.data || [],
     traceability: traceabilityQuery.data || [] as TrackedLot[],
    pharmacovigilance: pharmacovigilanceQuery.data || [],
     mandatoryReports: mandatoryReportsQuery.data || [] as MandatoryReportType[],
     audits: auditsQuery.data || [],
     complianceActions: complianceActionsQuery.data || [],
     
     // États
    isLoading,
     error: metricsQuery.error as Error | null,
     
     // Mutations
     addNarcoticMovement: addNarcoticMovementMutation.mutate,
     addPharmacovigilance: addPharmacovigilanceMutation.mutate,
     updatePharmacovigilanceStatus: updatePharmacovigilanceStatusMutation.mutate,
     deletePharmacovigilance: deletePharmacovigilanceMutation.mutate,
     addMandatoryReport: addMandatoryReportMutation.mutate,
     updateReportProgress: updateReportProgressMutation.mutate,
     submitReport: submitReportMutation.mutate,
     deleteMandatoryReport: deleteMandatoryReportMutation.mutate,
     addComplianceAction: addComplianceActionMutation.mutate,
     
     // États mutations
     isAddingNarcoticMovement: addNarcoticMovementMutation.isPending,
     isAddingPharmacovigilance: addPharmacovigilanceMutation.isPending,
     isAddingMandatoryReport: addMandatoryReportMutation.isPending,
     
     // Refresh
    refetch: () => {
       metricsQuery.refetch();
       narcoticsProductsQuery.refetch();
       narcoticsMovementsQuery.refetch();
      traceabilityQuery.refetch();
      pharmacovigilanceQuery.refetch();
      mandatoryReportsQuery.refetch();
       auditsQuery.refetch();
       complianceActionsQuery.refetch();
    }
  };
};
