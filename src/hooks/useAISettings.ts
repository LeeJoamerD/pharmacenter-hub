import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from './useTenantQuery';

export interface AISettings {
  autoLearning: boolean;
  confidenceThreshold: number;
  aiAuditEnabled: boolean;
  gdprCompliance: boolean;
  explainabilityEnabled: boolean;
  modelUpdateFrequency: string;
  dataRetentionDays: number;
  performanceMonitoring: boolean;
  alertNotifications: boolean;
}

export const useAISettings = () => {
  const { toast } = useToast();
  const { useTenantQueryWithCache } = useTenantQuery();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state for settings (only saved when explicitly called)
  const [localSettings, setLocalSettings] = useState<Partial<AISettings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Query for AI settings from network_admin_settings
  const { 
    data: rawSettings, 
    isLoading: loadingSettings, 
    refetch: refetchSettings 
  } = useTenantQueryWithCache(
    ['network-admin-settings', 'ai'],
    'network_admin_settings',
    '*',
    { setting_category: 'ai' },
    { orderBy: { column: 'created_at', ascending: true } }
  );

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

  function getSetting(key: string): string | undefined {
    return rawSettings?.find(s => s.setting_key === key)?.setting_value || undefined;
  }

  // Merge database settings with local changes
  const settings: AISettings = {
    autoLearning: localSettings.autoLearning ?? (getSetting('auto_learning') === 'true'),
    confidenceThreshold: localSettings.confidenceThreshold ?? parseInt(getSetting('confidence_threshold') || '85'),
    aiAuditEnabled: localSettings.aiAuditEnabled ?? (getSetting('ai_audit_enabled') !== 'false'),
    gdprCompliance: localSettings.gdprCompliance ?? (getSetting('gdpr_compliance') !== 'false'),
    explainabilityEnabled: localSettings.explainabilityEnabled ?? (getSetting('explainability_enabled') !== 'false'),
    modelUpdateFrequency: localSettings.modelUpdateFrequency ?? (getSetting('model_update_frequency') || 'weekly'),
    dataRetentionDays: localSettings.dataRetentionDays ?? parseInt(getSetting('data_retention_days') || '30'),
    performanceMonitoring: localSettings.performanceMonitoring ?? (getSetting('performance_monitoring') !== 'false'),
    alertNotifications: localSettings.alertNotifications ?? (getSetting('alert_notifications') !== 'false')
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
  const updateSetting = async (key: string, value: string | boolean | number) => {
    try {
      const tenantId = await getCurrentTenantId();
      const settingValue = value.toString();
      
      const { error } = await supabase
        .from('network_admin_settings')
        .upsert({
          tenant_id: tenantId,
          setting_category: 'ai',
          setting_key: key,
          setting_value: settingValue,
          setting_type: 'string'
        }, {
          onConflict: 'tenant_id,setting_category,setting_key'
        });

      if (error) throw error;
      refetchSettings();
    } catch (error) {
      console.error(`Error updating AI setting ${key}:`, error);
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
        // Convert camelCase to snake_case
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        return updateSetting(dbKey, value);
      });
      
      await Promise.all(promises);
      
      setLocalSettings({});
      setHasUnsavedChanges(false);
      
      toast({
        title: "Configuration IA sauvegardée",
        description: "Les paramètres d'intelligence artificielle ont été mis à jour.",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset local changes
  const resetChanges = () => {
    setLocalSettings({});
    setHasUnsavedChanges(false);
    toast({
      title: "Modifications annulées",
      description: "Les modifications non sauvegardées ont été annulées."
    });
  };

  return {
    settings,
    hasUnsavedChanges,
    isLoading: loadingSettings || isLoading,
    updateLocalSetting,
    updateSetting,
    saveAllSettings,
    resetChanges,
    refetchSettings
  };
};