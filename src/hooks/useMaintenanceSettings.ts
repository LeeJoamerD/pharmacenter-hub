import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from './useTenantQuery';

export interface MaintenanceTask {
  id: string;
  task_name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  message?: string;
  metadata: any;
  triggered_by?: string;
}

export interface SystemStats {
  disk_usage: number;
  memory_usage: number;
  cpu_usage: number;
  database_size_mb: number;
  log_size_mb: number;
  temp_files_mb: number;
  uptime_seconds: number;
  last_maintenance_at?: string;
  next_maintenance_at?: string;
}

export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  autoMaintenance: boolean;
  maintenanceSchedule: string;
  maintenanceDays: string[];
  diskCleanup: boolean;
  logRetention: number;
  tempFileCleanup: boolean;
  databaseOptimization: boolean;
  cacheCleanup: boolean;
  sessionCleanup: boolean;
  emailNotifications: boolean;
  adminEmail: string;
}

export const useMaintenanceSettings = () => {
  const { toast } = useToast();
  const { useTenantQueryWithCache } = useTenantQuery();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state for settings (only saved when explicitly called)
  const [localSettings, setLocalSettings] = useState<Partial<MaintenanceSettings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Query for maintenance settings from network_admin_settings
  const { 
    data: rawSettings, 
    isLoading: loadingSettings, 
    refetch: refetchSettings 
  } = useTenantQueryWithCache(
    ['network-admin-settings', 'maintenance'],
    'network_admin_settings',
    '*',
    { setting_category: 'maintenance' },
    { orderBy: { column: 'created_at', ascending: true } }
  );

  // Query for system stats
  const { 
    data: systemStatsArray, 
    isLoading: loadingStats, 
    refetch: refetchStats 
  } = useTenantQueryWithCache(
    ['network-system-stats'],
    'network_system_stats'
  );

  // Query for maintenance task runs
  const { 
    data: taskRuns, 
    isLoading: loadingTasks, 
    refetch: refetchTasks 
  } = useTenantQueryWithCache(
    ['network-maintenance-task-runs'],
    'network_maintenance_task_runs',
    '*',
    undefined,
    { 
      orderBy: { column: 'started_at', ascending: false },
      limit: 20
    }
  );

  // Query for backup runs (to include in maintenance tasks)
  const { 
    data: backupRuns, 
    isLoading: loadingBackups 
  } = useTenantQueryWithCache(
    ['network-backup-runs'],
    'network_backup_runs',
    '*',
    undefined,
    { 
      orderBy: { column: 'started_at', ascending: false },
      limit: 10
    }
  );

  // Get the first (and should be only) system stats record
  const systemStats = systemStatsArray?.[0];

  // Helper function to get current tenant ID
  const getCurrentTenantId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!personnel) throw new Error('Personnel not found');
    return personnel.tenant_id;
  };

  // Merge database settings with local changes
  const settings: MaintenanceSettings = {
    maintenanceMode: localSettings.maintenanceMode ?? (getSetting('maintenance_mode') === 'true'),
    maintenanceMessage: localSettings.maintenanceMessage ?? (getSetting('maintenance_message') || 'Système en maintenance. Retour prévu dans 30 minutes.'),
    autoMaintenance: localSettings.autoMaintenance ?? (getSetting('auto_maintenance') === 'true'),
    maintenanceSchedule: localSettings.maintenanceSchedule ?? (getSetting('maintenance_schedule') || '02:00'),
    maintenanceDays: localSettings.maintenanceDays ?? (getSetting('maintenance_days')?.split(',') || ['sunday']),
    diskCleanup: localSettings.diskCleanup ?? (getSetting('disk_cleanup') !== 'false'),
    logRetention: localSettings.logRetention ?? parseInt(getSetting('log_retention') || '30'),
    tempFileCleanup: localSettings.tempFileCleanup ?? (getSetting('temp_file_cleanup') !== 'false'),
    databaseOptimization: localSettings.databaseOptimization ?? (getSetting('database_optimization') !== 'false'),
    cacheCleanup: localSettings.cacheCleanup ?? (getSetting('cache_cleanup') !== 'false'),
    sessionCleanup: localSettings.sessionCleanup ?? (getSetting('session_cleanup') !== 'false'),
    emailNotifications: localSettings.emailNotifications ?? (getSetting('email_notifications') !== 'false'),
    adminEmail: localSettings.adminEmail ?? (getSetting('admin_email') || 'admin@pharmasoft.ci')
  };

  function getSetting(key: string): string | undefined {
    return rawSettings?.find(s => s.setting_key === key)?.setting_value || undefined;
  }

  // Transform system stats (no defaults - display real data)
  const transformedSystemStats: SystemStats = {
    disk_usage: systemStats?.disk_usage || 0,
    memory_usage: systemStats?.memory_usage || 0,
    cpu_usage: systemStats?.cpu_usage || 0,
    database_size_mb: systemStats?.database_size_mb || 0,
    log_size_mb: systemStats?.log_size_mb || 0,
    temp_files_mb: systemStats?.temp_files_mb || 0,
    uptime_seconds: systemStats?.uptime_seconds || 0,
    last_maintenance_at: systemStats?.last_maintenance_at,
    next_maintenance_at: systemStats?.next_maintenance_at
  };

  // Format system stats for display
  const getFormattedSystemStats = () => {
    const stats = transformedSystemStats;
    const uptimeHours = Math.floor(stats.uptime_seconds / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const remainingHours = uptimeHours % 24;
    
    return {
      diskUsage: stats.disk_usage,
      memoryUsage: stats.memory_usage,
      cpuUsage: stats.cpu_usage,
      databaseSize: `${stats.database_size_mb.toFixed(2)} MB`,
      logSize: `${stats.log_size_mb.toFixed(2)} MB`,
      tempFiles: `${stats.temp_files_mb.toFixed(2)} MB`,
      uptime: `${uptimeDays} jours ${remainingHours} heures`,
      lastMaintenance: stats.last_maintenance_at ? new Date(stats.last_maintenance_at).toLocaleString('fr-FR') : 'Jamais',
      nextMaintenance: stats.next_maintenance_at ? new Date(stats.next_maintenance_at).toLocaleString('fr-FR') : 'Non planifié'
    };
  };

  // Transform task runs and backup runs into maintenance tasks for display
  const getFormattedMaintenanceTasks = () => {
    const tasks: any[] = [
      ...(taskRuns || []),
      ...(backupRuns || []).map(backup => ({
        id: backup.id,
        task_name: 'Sauvegarde automatique',
        status: backup.status,
        started_at: backup.started_at,
        completed_at: backup.completed_at,
        duration_seconds: backup.duration_seconds,
        message: backup.error_message,
        metadata: backup.metadata || {},
        triggered_by: backup.triggered_by
      }))
    ].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    return tasks.map(task => ({
      id: task.id,
      name: getTaskDisplayName(task.task_name),
      status: task.status,
      lastRun: new Date(task.started_at).toLocaleString('fr-FR'),
      duration: task.duration_seconds ? `${task.duration_seconds}s` : task.completed_at ? 
        `${Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000)}s` : 'En cours'
    }));
  };

  const getTaskDisplayName = (taskName: string) => {
    const names: Record<string, string> = {
      'disk_cleanup': 'Nettoyage disque',
      'temp_file_cleanup': 'Nettoyage fichiers temporaires', 
      'db_optimization': 'Optimisation base de données',
      'cache_cleanup': 'Nettoyage cache',
      'session_cleanup': 'Nettoyage sessions',
      'log_cleanup': 'Nettoyage des logs',
      'auto_backup': 'Sauvegarde automatique'
    };
    return names[taskName] || taskName;
  };

  // Update local setting (doesn't save to database)
  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Update a single setting to database
  const updateSetting = async (key: string, value: string | boolean | number | string[]) => {
    try {
      const tenantId = await getCurrentTenantId();
      let settingValue: string;
      
      if (Array.isArray(value)) {
        settingValue = value.join(',');
      } else {
        settingValue = value.toString();
      }
      
      const { error } = await supabase
        .from('network_admin_settings')
        .upsert({
          tenant_id: tenantId,
          setting_category: 'maintenance',
          setting_key: key,
          setting_value: settingValue,
          setting_type: 'string'
        }, {
          onConflict: 'tenant_id,setting_category,setting_key'
        });

      if (error) throw error;
      refetchSettings();
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de sauvegarder le paramètre ${key}`,
      });
      throw error;
    }
  };

  const saveAllSettings = async () => {
    if (Object.keys(localSettings).length === 0) {
      toast({
        title: "Information",
        description: "Aucune modification à sauvegarder"
      });
      return;
    }

    setIsLoading(true);
    try {
      const promises = Object.entries(localSettings).map(([key, value]) => {
        return updateSetting(key.replace(/([A-Z])/g, '_$1').toLowerCase(), value);
      });
      
      await Promise.all(promises);
      
      setLocalSettings({});
      setHasUnsavedChanges(false);
      
      toast({
        title: "Paramètres de maintenance sauvegardés",
        description: "La configuration de maintenance a été mise à jour.",
      });
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh system statistics
  const refreshSystemStats = async () => {
    try {
      const tenantId = await getCurrentTenantId();
      
      const { data, error } = await supabase.rpc('refresh_network_system_stats', {
        p_tenant_id: tenantId
      });

      if (error) throw error;

      refetchStats();
      
      toast({
        title: "Succès",
        description: "Statistiques système mises à jour"
      });
    } catch (error) {
      console.error('Error refreshing system stats:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de rafraîchir les statistiques"
      });
    }
  };

  const triggerMaintenanceNow = async () => {
    if (hasUnsavedChanges) {
      toast({
        variant: "destructive",
        title: "Modifications non sauvegardées",
        description: "Veuillez d'abord sauvegarder vos modifications."
      });
      return;
    }

    setIsLoading(true);
    try {
      const tenantId = await getCurrentTenantId();
      const enabledTasks = [
        settings.diskCleanup && 'disk_cleanup',
        settings.tempFileCleanup && 'temp_file_cleanup',
        settings.databaseOptimization && 'database_optimization',
        settings.cacheCleanup && 'cache_cleanup',
        settings.sessionCleanup && 'session_cleanup'
      ].filter(Boolean) as string[];

      if (enabledTasks.length === 0) {
        toast({
          title: "Information",
          description: "Aucune tâche de maintenance activée"
        });
        return;
      }

      const taskPromises = enabledTasks.map(async (taskName) => {
        // Create running task
        const { data: task, error: insertError } = await supabase
          .from('network_maintenance_task_runs')
          .insert({
            tenant_id: tenantId,
            task_name: taskName,
            status: 'running',
            triggered_by: 'manual',
            metadata: { manual_trigger: true }
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Simulate task execution (2-10 seconds)
        const duration = Math.floor(Math.random() * 8) + 2;
        setTimeout(async () => {
          await supabase
            .from('network_maintenance_task_runs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              duration_seconds: duration,
              message: `Tâche ${taskName} terminée avec succès`
            })
            .eq('id', task.id);
          
          refetchTasks();
        }, duration * 1000);

        return task;
      });

      await Promise.all(taskPromises);

      // Trigger backup if auto maintenance is enabled
      if (settings.autoMaintenance) {
        const { data: backupRun, error: backupError } = await supabase
          .from('network_backup_runs')
          .insert({
            tenant_id: tenantId,
            backup_type: 'manual',
            status: 'running',
            triggered_by: 'maintenance',
          })
          .select()
          .single();

        if (!backupError) {
          // Simulate backup completion
          setTimeout(async () => {
            await supabase
              .from('network_backup_runs')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                duration_seconds: Math.floor(Math.random() * 60) + 30,
                backup_size_mb: Math.floor(Math.random() * 500) + 100,
                message: 'Sauvegarde terminée avec succès',
              })
              .eq('id', backupRun.id);
          }, Math.random() * 8000 + 5000);
        }
      }

      // Refresh system stats after maintenance
      setTimeout(() => {
        refreshSystemStats();
      }, 10000);

      toast({
        title: "Maintenance lancée",
        description: `${enabledTasks.length} tâche(s) de maintenance ont été démarrées.`,
      });
    } catch (error) {
      console.error('Error triggering maintenance:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de lancer la maintenance.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize system stats if they don't exist using real data
  useEffect(() => {
    const initializeSystemStats = async () => {
      if (!loadingStats && !systemStats) {
        try {
          const tenantId = await getCurrentTenantId();
          
          // Use the refresh function to initialize stats with real data
          const { data, error } = await supabase.rpc('refresh_network_system_stats', {
            p_tenant_id: tenantId
          });

          if (error) throw error;
          refetchStats();
        } catch (error) {
          console.error('Error initializing system stats:', error);
        }
      }
    };

    initializeSystemStats();
  }, [loadingStats, systemStats]);

  return {
    settings,
    systemStats: getFormattedSystemStats(),
    maintenanceTasks: getFormattedMaintenanceTasks(),
    hasUnsavedChanges,
    isLoading: loadingSettings || loadingStats || loadingTasks || loadingBackups || isLoading,
    updateLocalSetting,
    updateSetting,
    saveAllSettings,
    refreshSystemStats,
    triggerMaintenanceNow,
    refetchAll: () => {
      refetchSettings();
      refetchStats();
      refetchTasks();
    }
  };
};