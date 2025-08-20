import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTenantQuery } from './useTenantQuery';

// Types for network administration
export interface SystemComponent {
  id: string;
  name: string;
  type: 'server' | 'database' | 'chat' | 'cdn' | 'router' | 'firewall';
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  uptime_start: string;
  cpu_load: number;
  memory_usage: number;
  storage_usage: number;
  ip_address: string | null;
  port: number | null;
  description: string | null;
  configuration: any;
  last_check: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  id: string;
  setting_category: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityAsset {
  id: string;
  asset_name: string;
  asset_type: 'firewall' | 'antivirus' | 'encryption' | 'certificate' | 'key';
  status: 'active' | 'inactive' | 'expired' | 'warning';
  expiry_date: string | null;
  configuration: any;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface BackupJob {
  id: string;
  job_name: string;
  job_type: 'full' | 'incremental' | 'differential' | 'database' | 'files';
  schedule_type: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  schedule_time: string | null;
  schedule_days: number[] | null;
  target_path: string | null;
  retention_days: number;
  compression_enabled: boolean;
  encryption_enabled: boolean;
  last_run: string | null;
  last_status: 'success' | 'failed' | 'running' | 'pending' | null;
  last_size_mb: number | null;
  next_run: string | null;
  is_active: boolean;
  configuration: any;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  title: string;
  description: string | null;
  maintenance_type: 'planned' | 'emergency' | 'routine' | 'security';
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  affected_systems: string[];
  notification_sent: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPermissionSummary {
  id: string;
  pharmacy_name: string;
  user_count: number;
  admin_count: number;
  last_access: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'security_alert';
  user: string;
  pharmacy: string;
  ip_address: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

export const useNetworkAdministration = () => {
  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // System Components
  const { 
    data: systemComponents = [], 
    isLoading: componentsLoading,
    refetch: refetchComponents 
  } = useTenantQueryWithCache(
    ['network-system-components'],
    'network_system_components',
    '*',
    undefined,
    { orderBy: { column: 'name', ascending: true } }
  );

  const componentMutation = useTenantMutation(
    'network_system_components',
    'update',
    { invalidateQueries: ['network-system-components'] }
  );

  // Admin Settings
  const { 
    data: adminSettings = [], 
    isLoading: settingsLoading,
    refetch: refetchSettings 
  } = useTenantQueryWithCache(
    ['network-admin-settings'],
    'network_admin_settings',
    '*',
    undefined,
    { orderBy: { column: 'setting_category', ascending: true } }
  );

  const settingMutation = useTenantMutation(
    'network_admin_settings',
    'upsert',
    { invalidateQueries: ['network-admin-settings'] }
  );

  // Security Assets
  const { 
    data: securityAssets = [], 
    isLoading: securityLoading,
    refetch: refetchSecurity 
  } = useTenantQueryWithCache(
    ['network-security-assets'],
    'network_security_assets',
    '*',
    undefined,
    { orderBy: { column: 'asset_name', ascending: true } }
  );

  const securityMutation = useTenantMutation(
    'network_security_assets',
    'update',
    { invalidateQueries: ['network-security-assets'] }
  );

  // Backup Jobs
  const { 
    data: backupJobs = [], 
    isLoading: backupLoading,
    refetch: refetchBackups 
  } = useTenantQueryWithCache(
    ['network-backup-jobs'],
    'network_backup_jobs',
    '*',
    undefined,
    { orderBy: { column: 'job_name', ascending: true } }
  );

  const backupMutation = useTenantMutation(
    'network_backup_jobs',
    'insert',
    { invalidateQueries: ['network-backup-jobs'] }
  );

  // User Sessions and Logs (from existing tables)
  const { 
    data: userSessions = [],
    isLoading: sessionsLoading 
  } = useTenantQueryWithCache(
    ['user-sessions'],
    'user_sessions',
    `*,
     personnel:personnel_id(noms, prenoms, role)`,
    undefined,
    { orderBy: { column: 'created_at', ascending: false } }
  );

  const { 
    data: securityLogs = [],
    isLoading: logsLoading 
  } = useTenantQueryWithCache(
    ['security-alerts'],
    'security_alerts',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 50
    }
  );

  const { 
    data: auditLogs = [],
    isLoading: auditLoading 
  } = useTenantQueryWithCache(
    ['audit-logs'],
    'audit_logs',
    '*',
    undefined,
    {
      orderBy: { column: 'created_at', ascending: false },
      limit: 50
    }
  );

  // User Permissions Summary (from personnel and pharmacies)
  const { 
    data: userPermissions = [],
    isLoading: permissionsLoading 
  } = useTenantQueryWithCache(
    ['user-permissions-summary'],
    'pharmacies',
    `id,
     name,
     status,
     updated_at,
     personnel(id, role, is_active, updated_at)`,
    undefined,
    { orderBy: { column: 'name', ascending: true } }
  );

  // Helper functions
  const getUptime = (uptimeStart: string) => {
    const start = new Date(uptimeStart);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}j ${hours}h ${minutes}m`;
  };

  const transformUserPermissions = (pharmaciesData: any[]): UserPermissionSummary[] => {
    return pharmaciesData.map(pharmacy => {
      const personnel = pharmacy.personnel || [];
      const activePersonnel = personnel.filter((p: any) => p.is_active);
      const adminCount = activePersonnel.filter((p: any) => 
        ['Admin', 'Pharmacien'].includes(p.role)
      ).length;
      
      const lastAccess = personnel.length > 0 
        ? Math.max(...personnel.map((p: any) => new Date(p.updated_at).getTime()))
        : Date.now();

      return {
        id: pharmacy.id,
        pharmacy_name: pharmacy.name,
        user_count: activePersonnel.length,
        admin_count: adminCount,
        last_access: new Date(lastAccess).toISOString(),
        status: pharmacy.status === 'active' ? 'active' : 'inactive',
        permissions: ['read', 'write'] // Default permissions, could be enhanced
      };
    });
  };

  const transformSecurityLogs = (logs: any[]): SecurityLog[] => {
    return logs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      type: log.alert_type === 'login_attempt' ? 'login' : 'security_alert',
      user: log.user_id || 'Système',
      pharmacy: 'Global',
      ip_address: log.metadata?.ip_address || 'N/A',
      details: log.description || '',
      severity: log.severity as 'info' | 'warning' | 'error'
    }));
  };

  // CRUD Operations
  const updateSystemComponent = async (id: string, data: Partial<SystemComponent>) => {
    try {
      setLoading(true);
      const updateMutation = useTenantMutation(
        'network_system_components',
        'update',
        { invalidateQueries: ['network-system-components'] }
      );
      await updateMutation.mutateAsync({ id, ...data });
      toast({
        title: "Composant mis à jour",
        description: "Le composant système a été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le composant.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAdminSetting = async (category: string, key: string, value: string) => {
    try {
      setLoading(true);
      
      const existingSetting = adminSettings.find(
        s => s.setting_category === category && s.setting_key === key
      );

      const upsertMutation = useTenantMutation(
        'network_admin_settings',
        'upsert',
        { invalidateQueries: ['network-admin-settings'] }
      );

      if (existingSetting) {
        const updateMutation = useTenantMutation(
          'network_admin_settings',
          'update',
          { invalidateQueries: ['network-admin-settings'] }
        );
        await updateMutation.mutateAsync({ 
          id: existingSetting.id, 
          setting_value: value,
          updated_at: new Date().toISOString()
        });
      } else {
        await upsertMutation.mutateAsync({ 
          setting_category: category,
          setting_key: key,
          setting_value: value,
          setting_type: typeof value === 'number' ? 'number' : 'string'
        });
      }

      toast({
        title: "Paramètre mis à jour",
        description: "Le paramètre a été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackupJob = async (jobData: Partial<BackupJob>) => {
    try {
      setLoading(true);
      const insertMutation = useTenantMutation(
        'network_backup_jobs',
        'insert',
        { invalidateQueries: ['network-backup-jobs'] }
      );
      await insertMutation.mutateAsync({
        ...jobData,
        job_name: jobData.job_name || '',
        job_type: jobData.job_type || 'full'
      });
      toast({
        title: "Tâche de sauvegarde créée",
        description: "La tâche de sauvegarde a été créée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche de sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBackupJob = async (id: string, data: Partial<BackupJob>) => {
    try {
      setLoading(true);
      const updateMutation = useTenantMutation(
        'network_backup_jobs',
        'update',
        { invalidateQueries: ['network-backup-jobs'] }
      );
      await updateMutation.mutateAsync({ id, ...data });
      toast({
        title: "Tâche de sauvegarde mise à jour",
        description: "La tâche de sauvegarde a été mise à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche de sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSystemStatus = async () => {
    try {
      setLoading(true);
      await Promise.all([
        refetchComponents(),
        refetchSettings(),
        refetchSecurity(),
        refetchBackups()
      ]);
      toast({
        title: "Données actualisées",
        description: "Les données système ont été actualisées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get setting by category and key
  const getSetting = (category: string, key: string, defaultValue?: string) => {
    const setting = adminSettings.find(
      s => s.setting_category === category && s.setting_key === key
    );
    return setting?.setting_value || defaultValue || '';
  };

  // Check if maintenance mode is enabled
  useEffect(() => {
    const maintenanceSetting = getSetting('system', 'maintenance_mode');
    setMaintenanceMode(maintenanceSetting === 'true');
  }, [adminSettings]);

  const toggleMaintenanceMode = async () => {
    const newValue = !maintenanceMode;
    await updateAdminSetting('system', 'maintenance_mode', newValue.toString());
    setMaintenanceMode(newValue);
  };

  return {
    // Data
    systemComponents: systemComponents.map((component: any) => ({
      ...component,
      uptime: getUptime(component.uptime_start)
    })),
    adminSettings,
    securityAssets,
    backupJobs,
    userPermissions: transformUserPermissions(userPermissions),
    securityLogs: transformSecurityLogs([
      ...securityLogs,
      ...auditLogs.map(log => ({
        ...log,
        alert_type: 'audit_log',
        severity: 'info'
      }))
    ]),
    
    // State
    loading: loading || componentsLoading || settingsLoading || securityLoading || backupLoading,
    maintenanceMode,
    
    // Actions  
    updateSystemComponent,
    updateAdminSetting,
    createBackupJob,
    updateBackupJob,
    refreshSystemStatus,
    toggleMaintenanceMode,
    getSetting,
    
    // Utility
    getUptime
  };
};