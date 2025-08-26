import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BackupRun {
  id: string;
  tenant_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  type: string;
  size_mb: number | null;
  storage_target: string | null;
  triggered_by: string | null;
  configuration: any;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  personnel?: {
    noms: string;
    prenoms: string;
  } | null;
}

export interface BackupFilters {
  status: string[];
  type: string[];
  dateRange: [Date | null, Date | null];
  search: string;
  showArchived: boolean;
}

export const useBackupRuns = () => {
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<BackupFilters>({
    status: [],
    type: [],
    dateRange: [null, null],
    search: '',
    showArchived: false
  });
  
  const { toast } = useToast();

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('network_backup_runs')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      if (filters.type.length > 0) {
        query = query.in('type', filters.type);
      }
      
      if (!filters.showArchived) {
        query = query.eq('is_archived', false);
      }
      
      if (filters.dateRange[0]) {
        query = query.gte('started_at', filters.dateRange[0].toISOString());
      }
      
      if (filters.dateRange[1]) {
        query = query.lte('started_at', filters.dateRange[1].toISOString());
      }
      
      if (filters.search) {
        query = query.or(`storage_target.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Enrich data with personnel names
      const enrichedData = await Promise.all((data || []).map(async (run) => {
        if (run.triggered_by) {
          try {
            const { data: personnel } = await supabase
              .from('personnel')
              .select('noms, prenoms')
              .eq('id', run.triggered_by)
              .single();
            
            return { ...run, personnel };
          } catch {
            return { ...run, personnel: null };
          }
        }
        return { ...run, personnel: null };
      }));

      setRuns(enrichedData as BackupRun[]);
      setTotal(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des exécutions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des sauvegardes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, toast]);

  const updateFilters = useCallback((newFilters: Partial<BackupFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const archive = useCallback(async (id: string, archived: boolean) => {
    try {
      const { error } = await supabase
        .from('network_backup_runs')
        .update({ is_archived: archived })
        .eq('id', id);

      if (error) throw error;

      await loadRuns();
      
      toast({
        title: archived ? "Exécution archivée" : "Exécution désarchivée",
        description: `L'exécution a été ${archived ? 'archivée' : 'désarchivée'} avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut d'archivage.",
        variant: "destructive",
      });
    }
  }, [loadRuns, toast]);

  const cancel = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('network_backup_runs')
        .update({ status: 'canceled' })
        .eq('id', id)
        .eq('status', 'running'); // Only cancel running backups

      if (error) throw error;

      await loadRuns();
      
      toast({
        title: "Sauvegarde annulée",
        description: "L'exécution a été annulée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'exécution.",
        variant: "destructive",
      });
    }
  }, [loadRuns, toast]);

  const relaunch = useCallback(async (originalRun: BackupRun) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      // Get current personnel info
      const { data: personnel } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      const newRun = {
        tenant_id: originalRun.tenant_id,
        status: 'running' as const,
        type: originalRun.type,
        storage_target: originalRun.storage_target,
        triggered_by: personnel?.id,
        configuration: originalRun.configuration
      };

      const { data, error } = await supabase
        .from('network_backup_runs')
        .insert(newRun)
        .select()
        .single();

      if (error) throw error;

      // Simulate backup completion
      setTimeout(async () => {
        await supabase
          .from('network_backup_runs')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            size_mb: Math.round(Math.random() * 1000 + 100)
          })
          .eq('id', data.id);
          
        await loadRuns();
      }, 3000);

      await loadRuns();
      
      toast({
        title: "Sauvegarde relancée",
        description: `Nouvelle sauvegarde ${originalRun.type} initiée avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la relance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de relancer la sauvegarde.",
        variant: "destructive",
      });
    }
  }, [loadRuns, toast]);

  const getMetrics = useCallback(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recent = runs.filter(run => new Date(run.started_at) >= sevenDaysAgo);
    const recentSuccess = recent.filter(run => run.status === 'success').length;
    const recentFailed = recent.filter(run => run.status === 'failed').length;
    const lastRun = runs.find(run => run.completed_at);

    return {
      totalRuns: runs.length,
      recentSuccess,
      recentFailed,
      lastRun: lastRun ? new Date(lastRun.completed_at!) : null
    };
  }, [runs]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  return {
    runs,
    loading,
    total,
    page,
    pageSize,
    filters,
    metrics: getMetrics(),
    setPage,
    updateFilters,
    refresh: loadRuns,
    archive,
    cancel,
    relaunch
  };
};