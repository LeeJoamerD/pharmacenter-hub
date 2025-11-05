import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PasswordPolicy {
  id?: string;
  tenant_id: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  max_age_days: number;
  remember_last_passwords: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  force_2fa_for_roles?: string[];
}

export interface TenantSecurityConfig {
  id?: string;
  tenant_id: string;
  allow_cross_tenant_read: boolean;
  allowed_source_tenants?: string[];
  security_level: string;
  auto_block_violations: boolean;
  max_violations_per_hour: number;
  notification_webhook?: string;
}

export interface SecurityLog {
  id: string;
  action: string;
  table_name?: string;
  user_id?: string;
  personnel_id?: string;
  ip_address?: string;
  user_agent?: string;
  status?: string;
  error_message?: string;
  created_at: string;
  old_values?: any;
  new_values?: any;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  securityConfig: TenantSecurityConfig;
  securityLogs: SecurityLog[];
  securityAlerts: SecurityAlert[];
}

export const useSecuritySettings = () => {
  const { pharmacy } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);

  const loadSecuritySettings = async () => {
    if (!pharmacy?.id) return;
    
    try {
      setLoading(true);
      
      // Charger la politique de mots de passe
      const { data: passwordPolicy, error: passwordError } = await supabase
        .from('password_policies')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .maybeSingle();

      if (passwordError) throw passwordError;

      // Charger la configuration de sécurité du tenant
      const { data: securityConfig, error: securityError } = await supabase
        .from('tenant_security_config')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .maybeSingle();

      if (securityError) throw securityError;

      // Charger les logs d'audit récents (30 derniers jours)
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      // Charger les alertes de sécurité récentes (non résolues)
      const { data: alerts, error: alertsError }: { data: any; error: any } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsError) throw alertsError;

      // Valeurs par défaut si aucune configuration n'existe
      const defaultPasswordPolicy: PasswordPolicy = {
        tenant_id: pharmacy.id,
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true,
        max_age_days: 90,
        remember_last_passwords: 5,
        max_failed_attempts: 3,
        lockout_duration_minutes: 15,
        session_timeout_minutes: 30,
        force_2fa_for_roles: ['Admin']
      };

      const defaultSecurityConfig: TenantSecurityConfig = {
        tenant_id: pharmacy.id,
        allow_cross_tenant_read: false,
        security_level: 'standard',
        auto_block_violations: true,
        max_violations_per_hour: 5
      };

      setSettings({
        passwordPolicy: passwordPolicy || defaultPasswordPolicy,
        securityConfig: securityConfig || defaultSecurityConfig,
        securityLogs: (auditLogs || []).map(log => ({
          ...log,
          ip_address: String(log.ip_address || 'N/A')
        })),
        securityAlerts: (alerts || []).map(alert => ({
          ...alert,
          resolved: !!alert.resolved_at
        }))
      });

    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de sécurité:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de sécurité.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePasswordPolicy = async (policy: Partial<PasswordPolicy>) => {
    if (!pharmacy?.id || !settings) return;

    try {
      setSaving(true);
      
      const updatedPolicy = { ...settings.passwordPolicy, ...policy };

      if (settings.passwordPolicy.id) {
        // Mettre à jour
        const { error } = await supabase
          .from('password_policies')
          .update(updatedPolicy)
          .eq('id', settings.passwordPolicy.id);

        if (error) throw error;
      } else {
        // Créer
        const { data, error } = await supabase
          .from('password_policies')
          .insert(updatedPolicy)
          .select()
          .single();

        if (error) throw error;
        updatedPolicy.id = data.id;
      }

      setSettings(prev => prev ? {
        ...prev,
        passwordPolicy: updatedPolicy
      } : null);

      toast({
        title: "Politique de mots de passe sauvegardée",
        description: "Les paramètres de sécurité ont été mis à jour.",
      });

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la politique de mots de passe.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSecurityConfig = async (config: Partial<TenantSecurityConfig>) => {
    if (!pharmacy?.id || !settings) return;

    try {
      setSaving(true);
      
      const updatedConfig = { ...settings.securityConfig, ...config };

      if (settings.securityConfig.id) {
        // Mettre à jour
        const { error } = await supabase
          .from('tenant_security_config')
          .update(updatedConfig)
          .eq('id', settings.securityConfig.id);

        if (error) throw error;
      } else {
        // Créer
        const { data, error } = await supabase
          .from('tenant_security_config')
          .insert(updatedConfig)
          .select()
          .single();

        if (error) throw error;
        updatedConfig.id = data.id;
      }

      setSettings(prev => prev ? {
        ...prev,
        securityConfig: updatedConfig
      } : null);

      toast({
        title: "Configuration de sécurité sauvegardée",
        description: "Les paramètres de sécurité avancés ont été mis à jour.",
      });

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration de sécurité.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!pharmacy?.id) return;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: pharmacy.id 
        })
        .eq('id', alertId);

      if (error) throw error;

      // Recharger les alertes
      await loadSecuritySettings();

      toast({
        title: "Alerte résolue",
        description: "L'alerte de sécurité a été marquée comme résolue.",
      });

    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSecuritySettings();
  }, [pharmacy?.id]);

  return {
    settings,
    loading,
    saving,
    savePasswordPolicy,
    saveSecurityConfig,
    resolveAlert,
    refetch: loadSecuritySettings,
  };
};