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
        .select('role, is_active, created_at')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;

      return {
        total: data?.length || 0,
        actifs: data?.filter(p => p.is_active).length || 0,
        admins: data?.filter(p => p.role === 'Admin' || p.role === 'Pharmacien Titulaire' || p.role === 'Pharmacien Adjoint').length || 0,
        caissiers: data?.filter(p => p.role === 'Caissier').length || 0,
        preparateurs: data?.filter(p => p.role === 'Préparateur').length || 0,
        nouveaux_ce_mois: data?.filter(p => p.created_at && isThisMonth(new Date(p.created_at))).length || 0
      };
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // Métriques Partenaires
  const partenairesMetrics = useQuery({
    queryKey: ['admin-partenaires-metrics', tenantId],
    queryFn: async () => {
      const [fournisseurs, laboratoires] = await Promise.all([
        supabase
          .from('fournisseurs')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('laboratoires')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
      ]);
      
      if (fournisseurs.error) throw fournisseurs.error;
      if (laboratoires.error) throw laboratoires.error;

      return {
        total: (fournisseurs.count || 0) + (laboratoires.count || 0),
        fournisseurs: fournisseurs.count || 0,
        fournisseurs_actifs: fournisseurs.count || 0,
        laboratoires: laboratoires.count || 0,
        assureurs: 0,
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
      const [produitsTotal, produitsActifs, dci, formes, classes] = await Promise.all([
        supabase
          .from('produits_with_stock')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('produits_with_stock')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        supabase
          .from('dci')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('formes_galeniques')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('classes_therapeutiques')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
      ]);
      
      if (produitsTotal.error) throw produitsTotal.error;
      if (produitsActifs.error) throw produitsActifs.error;
      if (dci.error) throw dci.error;
      if (formes.error) throw formes.error;
      if (classes.error) throw classes.error;

      return {
        total_produits: produitsTotal.count || 0,
        produits_actifs: produitsActifs.count || 0,
        total_dci: dci.count || 0,
        total_formes: formes.count || 0,
        total_classes: classes.count || 0
      };
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // Métriques Système
  const systemeMetrics = useQuery({
    queryKey: ['admin-systeme-metrics', tenantId],
    queryFn: async () => {
      const [documentsTotal, documentsPending, workflows, clientsTotal, clientsActifs] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .in('status', ['pending', 'draft']),
        supabase
          .from('security_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('statut', 'Actif')
      ]);
      
      if (documentsTotal.error) throw documentsTotal.error;
      if (documentsPending.error) throw documentsPending.error;
      if (workflows.error) throw workflows.error;
      if (clientsTotal.error) throw clientsTotal.error;
      if (clientsActifs.error) throw clientsActifs.error;

      return {
        documents_total: documentsTotal.count || 0,
        documents_en_attente: documentsPending.count || 0,
        workflows_actifs: workflows.count || 0,
        clients_total: clientsTotal.count || 0,
        clients_actifs: clientsActifs.count || 0
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
