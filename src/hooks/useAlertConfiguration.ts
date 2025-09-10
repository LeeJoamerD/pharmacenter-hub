import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AlertRule {
  id: string;
  tenant_id: string;
  nom: string;
  type: 'stock_faible' | 'peremption' | 'rupture' | 'surstockage';
  condition: string;
  seuil: number;
  unite: string;
  actif: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    dashboard: boolean;
  };
  destinataires: string[];
  delaiAlerte: number; // en minutes
  created_at: string;
  updated_at: string;
}

export interface GlobalSettings {
  id: string;
  tenant_id: string;
  alertesActives: boolean;
  frequenceVerification: number; // en minutes
  retentionHistorique: number; // en jours
  emailServeur: string;
  smsProvider: string;
  created_at: string;
  updated_at: string;
}

export const useAlertConfiguration = () => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAlertRules = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_thresholds_by_category')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our AlertRule interface
      const transformedRules: AlertRule[] = (data || []).map(item => ({
        id: item.id,
        tenant_id: item.tenant_id,
        nom: `Alerte ${item.category}`,
        type: 'stock_faible', // Default type
        condition: `quantite <= ${item.threshold}`,
        seuil: item.threshold,
        unite: 'unités',
        actif: item.enabled,
        notifications: {
          email: true,
          sms: false,
          dashboard: true
        },
        destinataires: [],
        delaiAlerte: 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setAlertRules(transformedRules);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des règles';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      // Try to get existing settings
      const { data, error } = await supabase
        .from('parametres_systeme')
        .select('*')
        .eq('cle_parametre', 'alert_global_settings')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        const settings = JSON.parse(data.valeur_parametre || '{}');
        setGlobalSettings({
          id: data.id,
          tenant_id: data.tenant_id,
          alertesActives: settings.alertesActives || true,
          frequenceVerification: settings.frequenceVerification || 15,
          retentionHistorique: settings.retentionHistorique || 90,
          emailServeur: settings.emailServeur || '',
          smsProvider: settings.smsProvider || '',
          created_at: data.created_at,
          updated_at: data.updated_at
        });
      } else {
        // Create default settings
        setGlobalSettings({
          id: '',
          tenant_id: '',
          alertesActives: true,
          frequenceVerification: 15,
          retentionHistorique: 90,
          emailServeur: '',
          smsProvider: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des paramètres';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const saveGlobalSettings = async (settings: Partial<GlobalSettings>) => {
    try {
      if (!globalSettings) return;

      const updatedSettings = { ...globalSettings, ...settings };
      
      const { error } = await supabase
        .from('parametres_systeme')
        .upsert({
          tenant_id: updatedSettings.tenant_id,
          cle_parametre: 'alert_global_settings',
          valeur_parametre: JSON.stringify({
            alertesActives: updatedSettings.alertesActives,
            frequenceVerification: updatedSettings.frequenceVerification,
            retentionHistorique: updatedSettings.retentionHistorique,
            emailServeur: updatedSettings.emailServeur,
            smsProvider: updatedSettings.smsProvider
          }),
          description: 'Configuration globale des alertes'
        });

      if (error) throw error;

      setGlobalSettings(updatedSettings);
      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const createAlertRule = async (ruleData: Omit<AlertRule, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('alert_thresholds_by_category')
        .insert({
          category: ruleData.nom,
          threshold: ruleData.seuil,
          enabled: ruleData.actif
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAlertRules(); // Refresh the list
      toast({
        title: "Succès",
        description: "Règle d'alerte créée avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la règle';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateAlertRule = async (ruleId: string, updates: Partial<AlertRule>) => {
    try {
      const { error } = await supabase
        .from('alert_thresholds_by_category')
        .update({
          threshold: updates.seuil,
          enabled: updates.actif
        })
        .eq('id', ruleId);

      if (error) throw error;

      setAlertRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ));

      toast({
        title: "Succès",
        description: "Règle d'alerte mise à jour",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteAlertRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('alert_thresholds_by_category')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast({
        title: "Succès",
        description: "Règle d'alerte supprimée",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const toggleAlertRule = async (ruleId: string) => {
    const rule = alertRules.find(r => r.id === ruleId);
    if (rule) {
      await updateAlertRule(ruleId, { actif: !rule.actif });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAlertRules(),
        fetchGlobalSettings()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  return {
    alertRules,
    globalSettings,
    isLoading,
    error,
    actions: {
      createAlertRule,
      updateAlertRule,
      deleteAlertRule,
      toggleAlertRule,
      saveGlobalSettings,
      refetch: () => {
        fetchAlertRules();
        fetchGlobalSettings();
      }
    }
  };
};