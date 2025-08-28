import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportSchedule = {
  id?: string;
  schedule_type: 'cron' | 'daily' | 'weekly' | 'monthly';
  cron_expr?: string;
  time_of_day?: string;
  day_of_week?: number;
  day_of_month?: number;
  template_id?: string;
  report_key?: string;
  format: string;
  active: boolean;
  recipients: Array<{type: 'email' | 'role' | 'user', value: string}>;
  options: Record<string, any>;
  next_run_at?: string;
  last_run_at?: string;
};

export function useReportSchedules() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['report-schedules', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('report_schedules')
        .select(`
          *,
          template:template_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const upsertScheduleMutation = useMutation({
    mutationFn: async (schedule: ReportSchedule) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('report_schedules')
        .upsert({
          ...schedule,
          tenant_id: tenantId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast({
        title: 'Succès',
        description: 'Planification sauvegardée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la sauvegarde: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast({
        title: 'Succès',
        description: 'Planification supprimée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('report_schedules')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast({
        title: 'Succès',
        description: 'État de la planification mis à jour',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    upsertSchedule: upsertScheduleMutation.mutate,
    deleteSchedule: deleteScheduleMutation.mutate,
    toggleSchedule: toggleScheduleMutation.mutate,
    isMutating: upsertScheduleMutation.isPending || deleteScheduleMutation.isPending || toggleScheduleMutation.isPending,
  };
}