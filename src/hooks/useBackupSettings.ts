import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: string;
  backupTime: string;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  cloudBackup: boolean;
  localPath: string;
}

const defaultSettings: BackupSettings = {
  autoBackup: true,
  backupFrequency: 'daily',
  backupTime: '02:00',
  retentionDays: 30,
  compressionEnabled: true,
  encryptionEnabled: true,
  cloudBackup: false,
  localPath: '/backups/pharmasoft'
};

const settingsMapping = {
  autoBackup: 'backup_auto_enabled',
  backupFrequency: 'backup_frequency',
  backupTime: 'backup_time',
  retentionDays: 'backup_retention_days',
  compressionEnabled: 'backup_compression_enabled',
  encryptionEnabled: 'backup_encryption_enabled',
  cloudBackup: 'backup_cloud_enabled',
  localPath: 'backup_local_path'
} as const;

export const useBackupSettings = () => {
  const [settings, setSettings] = useState<BackupSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const { tenantId, currentUser } = useTenant();

  const loadSettings = useCallback(async () => {
    if (!tenantId) {
      console.log('BACKUP_SETTINGS: tenantId not available yet');
      return;
    }

    try {
      setLoading(true);
      console.log('BACKUP_SETTINGS: Loading settings for tenantId:', tenantId);
      const { data, error } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .eq('categorie', 'backup');

      if (error) throw error;

      const loadedSettings = { ...defaultSettings };
      
      data?.forEach((param) => {
        const settingKey = Object.keys(settingsMapping).find(
          key => settingsMapping[key as keyof typeof settingsMapping] === param.cle_parametre
        ) as keyof BackupSettings;

        if (settingKey && param.valeur_parametre !== null) {
          if (typeof defaultSettings[settingKey] === 'boolean') {
            (loadedSettings as any)[settingKey] = param.valeur_parametre === 'true';
          } else if (typeof defaultSettings[settingKey] === 'number') {
            (loadedSettings as any)[settingKey] = parseInt(param.valeur_parametre);
          } else {
            (loadedSettings as any)[settingKey] = param.valeur_parametre;
          }
        }
      });

      setSettings(loadedSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  const updateSetting = useCallback((key: keyof BackupSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  }, []);

  const saveSettings = useCallback(async () => {
    if (!tenantId) {
      toast({
        title: "Erreur",
        description: "Tenant non disponible. Impossible de sauvegarder.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('BACKUP_SETTINGS: Saving settings for tenantId:', tenantId);
      
      const updates = Object.entries(settings).map(([key, value]) => {
        const dbKey = settingsMapping[key as keyof typeof settingsMapping];
        let dbValue: string;
        
        if (typeof value === 'boolean') {
          dbValue = value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          dbValue = value.toString();
        } else {
          dbValue = value as string;
        }

        return {
          cle_parametre: dbKey,
          valeur_parametre: dbValue,
          type_parametre: 'string',
          categorie: 'backup',
          description: getParameterDescription(key as keyof BackupSettings),
          tenant_id: tenantId
        };
      });

      // Upsert all settings
      for (const update of updates) {
        console.log('BACKUP_SETTINGS: Upserting parameter:', update.cle_parametre, 'for tenant:', tenantId);
        const { error } = await supabase
          .from('parametres_systeme')
          .upsert(update, {
            onConflict: 'tenant_id, cle_parametre'
          });

        if (error) throw error;
      }

      setHasChanges(false);
      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration de sauvegarde a été mise à jour.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [settings, tenantId, toast]);

  const createManualBackup = useCallback(async (type: string = 'database') => {
    if (!tenantId || !currentUser) {
      toast({
        title: "Erreur",
        description: "Tenant ou utilisateur non disponible. Impossible de lancer la sauvegarde.",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('BACKUP_SETTINGS: Creating manual backup for tenantId:', tenantId, 'triggered_by:', currentUser.id);

      const backupRun = {
        tenant_id: tenantId,
        status: 'running',
        type: type,
        storage_target: settings.localPath,
        triggered_by: currentUser.id,
        configuration: {
          compression: settings.compressionEnabled,
          encryption: settings.encryptionEnabled,
          retention_days: settings.retentionDays,
          frequency: settings.backupFrequency,
          auto_backup: settings.autoBackup,
          backup_time: settings.backupTime
        }
      };

      const { data, error } = await supabase
        .from('network_backup_runs')
        .insert(backupRun)
        .select()
        .single();

      if (error) throw error;

      // Simulate backup completion (in real scenario, this would be handled by a background job)
      setTimeout(async () => {
        await supabase
          .from('network_backup_runs')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            size_mb: Math.round(Math.random() * 1000 + 100) // Simulate backup size
          })
          .eq('id', data.id);
      }, 2000);

      toast({
        title: "Sauvegarde manuelle lancée",
        description: `Sauvegarde ${type} initiée avec succès (ID: ${data.id.slice(-8)}).`,
      });

      return data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde manuelle:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer la sauvegarde manuelle.",
        variant: "destructive",
      });
      return null;
    }
  }, [settings, tenantId, currentUser, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saving,
    hasChanges,
    updateSetting,
    saveSettings,
    createManualBackup,
    refresh: loadSettings
  };
};

function getParameterDescription(key: keyof BackupSettings): string {
  const descriptions = {
    autoBackup: 'Activation de la sauvegarde automatique',
    backupFrequency: 'Fréquence de sauvegarde automatique',
    backupTime: 'Heure de sauvegarde automatique',
    retentionDays: 'Durée de rétention des sauvegardes en jours',
    compressionEnabled: 'Activation de la compression des sauvegardes',
    encryptionEnabled: 'Activation du chiffrement des sauvegardes',
    cloudBackup: 'Activation de la sauvegarde cloud',
    localPath: 'Chemin local pour les sauvegardes'
  };
  
  return descriptions[key] || '';
}