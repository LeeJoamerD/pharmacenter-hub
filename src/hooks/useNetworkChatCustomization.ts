import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserPreferences {
  id: string;
  tenant_id: string;
  user_id: string;
  theme_id: string;
  font_size: number;
  language: string;
  layout_compact: boolean;
  animations_enabled: boolean;
  auto_save: boolean;
  display_quality: 'low' | 'medium' | 'high';
  device_mode: 'desktop' | 'tablet' | 'mobile';
  high_contrast: boolean;
  keyboard_focus: boolean;
  screen_reader: boolean;
  reduced_motion: boolean;
  connection_timeout: number;
  auto_retry: boolean;
  max_retries: number;
  offline_mode: boolean;
  is_network_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  tenant_id: string;
  user_id: string;
  notification_type: 'direct_messages' | 'network_mentions' | 'system_alerts' | 'collaborations';
  name: string;
  description: string | null;
  enabled: boolean;
  sound: boolean;
  popup: boolean;
  email: boolean;
  priority: number;
  is_network_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomizationTheme {
  id: string;
  tenant_id: string | null;
  theme_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  preview_class: string | null;
  is_default: boolean;
  is_network_shared: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomizationMetrics {
  total_users_with_preferences: number;
  most_used_theme: string;
  notifications_enabled_count: number;
  accessibility_features_active: number;
  available_themes: number;
}

const DEFAULT_NOTIFICATION_TYPES = [
  { type: 'direct_messages', name: 'Messages directs', description: 'Notifications pour les messages privés' },
  { type: 'network_mentions', name: 'Mentions réseau', description: 'Quand vous êtes mentionné dans une conversation' },
  { type: 'system_alerts', name: 'Alertes système', description: 'Notifications système importantes' },
  { type: 'collaborations', name: 'Collaborations', description: 'Invitations et mises à jour de projets' }
];

export const useNetworkChatCustomization = () => {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Get current user context
  useEffect(() => {
    const fetchUserContext = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('personnel')
          .select('id, tenant_id')
          .eq('user_id', user.id)
          .limit(1);
        
        const personnel = data?.[0];
        
        if (personnel) {
          setTenantId(personnel.tenant_id);
          setUserId(personnel.id);
        }
      }
    };
    fetchUserContext();
  }, []);

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useQuery({
    queryKey: ['network-user-preferences', tenantId, userId],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!tenantId || !userId) return null;
      
      const { data, error } = await supabase
        .from('network_user_preferences')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as UserPreferences | null;
    },
    enabled: !!tenantId && !!userId
  });

  // Fetch notification preferences
  const { data: notificationSettings, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['network-notification-preferences', tenantId, userId],
    queryFn: async () => {
      if (!tenantId || !userId) return [];
      
      const { data, error } = await supabase
        .from('network_notification_preferences')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return (data || []) as NotificationPreference[];
    },
    enabled: !!tenantId && !!userId
  });

  // Fetch themes
  const { data: themes, isLoading: themesLoading, refetch: refetchThemes } = useQuery({
    queryKey: ['network-customization-themes', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_customization_themes')
        .select('*')
        .or(`tenant_id.is.null,tenant_id.eq.${tenantId || ''},is_network_shared.eq.true`)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return (data || []) as CustomizationTheme[];
    },
    enabled: true
  });

  // Fetch metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['customization-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase.rpc('get_customization_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      return data as unknown as CustomizationMetrics;
    },
    enabled: !!tenantId
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<UserPreferences>) => {
      if (!tenantId || !userId) throw new Error('Context non disponible');
      
      const existingPrefs = preferences;
      
      if (existingPrefs) {
        const { error } = await supabase
          .from('network_user_preferences')
          .update(prefs as any)
          .eq('id', existingPrefs.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('network_user_preferences')
          .insert({
            tenant_id: tenantId,
            user_id: userId,
            ...prefs
          } as any);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['customization-metrics'] });
      toast.success('Préférences sauvegardées');
    },
    onError: (error) => {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
  });

  // Update notification setting mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('network_notification_preferences')
        .update({ [field]: value } as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-notification-preferences'] });
    }
  });

  // Initialize default notification settings
  const initializeNotifications = useCallback(async () => {
    if (!tenantId || !userId) return;
    
    // Check if settings exist
    const existingSettings = notificationSettings || [];
    const existingTypes = new Set(existingSettings.map(s => s.notification_type));
    
    const missingTypes = DEFAULT_NOTIFICATION_TYPES.filter(t => !existingTypes.has(t.type as any));
    
    if (missingTypes.length > 0) {
      const newSettings = missingTypes.map((t, index) => ({
        tenant_id: tenantId,
        user_id: userId,
        notification_type: t.type,
        name: t.name,
        description: t.description,
        enabled: true,
        sound: true,
        popup: true,
        email: false,
        priority: index
      }));
      
      const { error } = await supabase
        .from('network_notification_preferences')
        .insert(newSettings as any);
      
      if (error) {
        console.error('Error initializing notifications:', error);
      } else {
        refetchNotifications();
      }
    }
  }, [tenantId, userId, notificationSettings, refetchNotifications]);

  // Initialize notifications on load
  useEffect(() => {
    if (tenantId && userId && notificationSettings !== undefined) {
      initializeNotifications();
    }
  }, [tenantId, userId, notificationSettings, initializeNotifications]);

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (theme: Partial<CustomizationTheme>) => {
      if (!tenantId || !userId) throw new Error('Context non disponible');
      
      const { error } = await supabase
        .from('network_customization_themes')
        .insert({
          tenant_id: tenantId,
          created_by: userId,
          ...theme
        } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-customization-themes'] });
      toast.success('Thème créé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du thème');
      console.error(error);
    }
  });

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase
        .from('network_customization_themes')
        .delete()
        .eq('id', themeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-customization-themes'] });
      toast.success('Thème supprimé');
    }
  });

  // Save all settings
  const saveAllSettings = async (settings: {
    preferences: Partial<UserPreferences>;
    notifications?: NotificationPreference[];
  }) => {
    setSaving(true);
    try {
      await savePreferencesMutation.mutateAsync(settings.preferences);
      toast.success('Tous les paramètres ont été sauvegardés');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Reset all settings
  const resetAllSettings = async () => {
    if (!tenantId || !userId) return;
    
    setSaving(true);
    try {
      // Reset preferences to defaults
      const defaultPrefs = {
        theme_id: 'default',
        font_size: 14,
        language: 'fr',
        layout_compact: false,
        animations_enabled: true,
        auto_save: true,
        display_quality: 'high',
        device_mode: 'desktop',
        high_contrast: false,
        keyboard_focus: true,
        screen_reader: false,
        reduced_motion: false,
        connection_timeout: 30,
        auto_retry: true,
        max_retries: 3,
        offline_mode: false
      };
      
      await savePreferencesMutation.mutateAsync(defaultPrefs as any);
      
      // Reset notification settings
      const { error } = await supabase
        .from('network_notification_preferences')
        .update({ enabled: true, sound: true, popup: true, email: false } as any)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      refetchNotifications();
      toast.success('Paramètres réinitialisés');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Export settings
  const exportSettings = useCallback((): Blob => {
    const exportData = {
      preferences,
      notificationSettings,
      exportedAt: new Date().toISOString()
    };
    
    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  }, [preferences, notificationSettings]);

  // Import settings
  const importSettings = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.preferences) {
        const { id, tenant_id, user_id, created_at, updated_at, ...importPrefs } = data.preferences;
        await savePreferencesMutation.mutateAsync(importPrefs);
      }
      
      toast.success('Paramètres importés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'import des paramètres');
      console.error(error);
    }
  };

  // Clear local cache
  const clearLocalCache = () => {
    localStorage.removeItem('network-chat-preferences');
    localStorage.removeItem('network-chat-theme');
    toast.success('Cache local vidé');
  };

  // Update notification setting
  const updateNotificationSetting = (id: string, field: string, value: boolean) => {
    updateNotificationMutation.mutate({ id, field, value });
  };

  // Refresh all data
  const refreshAllData = () => {
    refetchPreferences();
    refetchNotifications();
    refetchThemes();
    refetchMetrics();
  };

  return {
    // State
    loading: preferencesLoading || notificationsLoading || themesLoading,
    saving,
    tenantId,
    userId,
    
    // Data
    preferences,
    notificationSettings: notificationSettings || [],
    themes: themes || [],
    metrics,
    
    // Mutations
    savePreferences: savePreferencesMutation.mutate,
    updateNotificationSetting,
    createTheme: createThemeMutation.mutate,
    deleteTheme: deleteThemeMutation.mutate,
    
    // Actions
    saveAllSettings,
    resetAllSettings,
    exportSettings,
    importSettings,
    clearLocalCache,
    refreshAllData
  };
};
