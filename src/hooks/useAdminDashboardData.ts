import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { isThisMonth } from 'date-fns';

/**
 * Hook principal pour toutes les métriques du Dashboard Administration
 * Garantit l'isolation multi-tenant et la performance via requêtes parallèles
 */
export const useAdminDashboardData = () => {
  const { tenantId } = useTenant();

  // Métriques Personnel
  const personnelMetrics = useQuery({
    queryKey: ['admin-personnel-metrics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel')
        .select('id, role, is_active, created_at')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;

      return {
        total: data?.length || 0,
        actifs: data?.filter(p => p.is_active).length || 0,
        admins: data?.filter(p => p.role === 'Admin' || p.role === 'Pharmacien').length || 0,
        caissiers: data?.filter(p => p.role === 'Caissier').length || 0,
        preparateurs: data?.filter(p => p.role === 'Préparateur').length || 0,
        nouveaux_ce_mois: data?.filter(p => p.created_at && isThisMonth(new Date(p.created_at))).length || 0
      };
    },
    enabled: !!tenantId,
    staleTime: 60000, // 1 minute
  });

  // Métriques Partenaires
  const partenairesMetrics = useQuery({
    queryKey: ['admin-partenaires-metrics', tenantId],
    queryFn: async () => {
      const [fournisseurs, laboratoires] = await Promise.all([
        supabase.from('fournisseurs').select('id').eq('tenant_id', tenantId),
        supabase.from('laboratoires').select('id').eq('tenant_id', tenantId)
      ]);
      
      if (fournisseurs.error) throw fournisseurs.error;

      return {
        total: (fournisseurs.data?.length || 0) + (laboratoires.data?.length || 0),
        fournisseurs: fournisseurs.data?.length || 0,
        fournisseurs_actifs: fournisseurs.data?.length || 0, // Tous les fournisseurs comptent comme actifs
        laboratoires: laboratoires.data?.length || 0,
        assureurs: 0, // Pas de table assureurs pour le moment
        assureurs_actifs: 0
      };
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // Métriques Référentiel Produits
  const referentielMetrics = useQuery({
    queryKey: ['admin-referentiel-metrics', tenantId],
    queryFn: async () => {
      const [produits, dci, formes, classes] = await Promise.all([
        supabase.from('produits').select('id, is_active').eq('tenant_id', tenantId),
        supabase.from('dci').select('id').eq('tenant_id', tenantId),
        supabase.from('formes_galeniques').select('id').eq('tenant_id', tenantId),
        supabase.from('classes_therapeutiques').select('id').eq('tenant_id', tenantId)
      ]);
      
      if (produits.error) throw produits.error;

      return {
        total_produits: produits.data?.length || 0,
        produits_actifs: produits.data?.filter(p => p.is_active).length || 0,
        total_dci: dci.data?.length || 0,
        total_formes: formes.data?.length || 0,
        total_classes: classes.data?.length || 0
      };
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // Métriques Système
  const systemeMetrics = useQuery({
    queryKey: ['admin-systeme-metrics', tenantId],
    queryFn: async () => {
      const [documents, workflows, clients] = await Promise.all([
        supabase.from('documents').select('id, status').eq('tenant_id', tenantId),
        supabase
          .from('security_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('clients').select('id, statut').eq('tenant_id', tenantId)
      ]);
      
      if (documents.error) throw documents.error;

      return {
        documents_total: documents.data?.length || 0,
        documents_en_attente: documents.data?.filter(d => d.status === 'pending' || d.status === 'draft').length || 0,
        workflows_actifs: workflows.count || 0,
        clients_total: clients.data?.length || 0,
        clients_actifs: clients.data?.filter(c => c.statut === 'Actif').length || 0
      };
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  return {
    personnel: personnelMetrics.data,
    partenaires: partenairesMetrics.data,
    referentiel: referentielMetrics.data,
    systeme: systemeMetrics.data,
    isLoading: personnelMetrics.isLoading || partenairesMetrics.isLoading || referentielMetrics.isLoading || systemeMetrics.isLoading,
    error: personnelMetrics.error || partenairesMetrics.error || referentielMetrics.error || systemeMetrics.error,
    refetch: () => {
      personnelMetrics.refetch();
      partenairesMetrics.refetch();
      referentielMetrics.refetch();
      systemeMetrics.refetch();
    }
  };
};
