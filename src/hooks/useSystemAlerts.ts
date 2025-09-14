import { useState, useEffect } from 'react';
import { useTenantQuery } from './useTenantQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { AlertTriangle, Shield, Clock, Activity, Info, CheckCircle } from 'lucide-react';

export interface SystemAlert {
  id: string;
  tenant_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  metadata?: Record<string, any>;
}

export interface SecurityIncident {
  id: string;
  tenant_id: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  affected_systems?: string[];
  metadata?: Record<string, any>;
}

export interface CombinedAlert {
  id: string;
  type: 'security_alert' | 'security_incident' | 'stock_alert' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  time: string;
  status: string;
  icon: any;
  iconColor: string;
  metadata?: Record<string, any>;
}

export const useSystemAlerts = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const [combinedAlerts, setCombinedAlerts] = useState<CombinedAlert[]>([]);

  // Récupérer les alertes de sécurité
  const { 
    data: securityAlerts = [], 
    isLoading: alertsLoading,
    refetch: refetchAlerts 
  } = useTenantQueryWithCache(
    ['security-alerts'],
    'security_alerts',
    `
      id, tenant_id, alert_type, severity, title, description, 
      status, created_at, updated_at, resolved_at, resolved_by, metadata
    `,
    { status: ['open', 'in_progress'] }, // Seulement les alertes non résolues
    {
      enabled: !!tenantId,
      orderBy: { column: 'created_at', ascending: false },
    }
  );

  // Récupérer les incidents de sécurité
  const { 
    data: securityIncidents = [], 
    isLoading: incidentsLoading,
    refetch: refetchIncidents 
  } = useTenantQueryWithCache(
    ['security-incidents'],
    'security_incidents',
    `
      id, tenant_id, incident_type, severity, title, description, 
      status, impact_level, created_at, updated_at, resolved_at, 
      resolved_by, affected_systems, metadata
    `,
    { status: ['open', 'investigating'] }, // Seulement les incidents non résolus
    {
      enabled: !!tenantId,
      orderBy: { column: 'created_at', ascending: false },
    }
  );

  // Transformer et combiner les alertes
  useEffect(() => {
    const transformedAlerts: CombinedAlert[] = [];

    // Transformer les alertes de sécurité
    securityAlerts.forEach((alert: any) => {
      const iconConfig = getIconConfig(alert.alert_type, alert.severity);
      transformedAlerts.push({
        id: alert.id,
        type: 'security_alert',
        severity: alert.severity,
        title: alert.title,
        message: alert.description,
        time: formatTimeAgo(alert.created_at),
        status: alert.status,
        icon: iconConfig.icon,
        iconColor: iconConfig.color,
        metadata: {
          ...alert.metadata,
          alert_type: alert.alert_type,
          resolved_by: alert.resolved_by,
          resolved_at: alert.resolved_at
        }
      });
    });

    // Transformer les incidents de sécurité
    securityIncidents.forEach((incident: any) => {
      const iconConfig = getIconConfig(incident.incident_type, incident.severity);
      transformedAlerts.push({
        id: incident.id,
        type: 'security_incident',
        severity: incident.severity,
        title: incident.title,
        message: incident.description,
        time: formatTimeAgo(incident.created_at),
        status: incident.status,
        icon: iconConfig.icon,
        iconColor: iconConfig.color,
        metadata: {
          ...incident.metadata,
          incident_type: incident.incident_type,
          impact_level: incident.impact_level,
          affected_systems: incident.affected_systems,
          resolved_by: incident.resolved_by,
          resolved_at: incident.resolved_at
        }
      });
    });

    // Trier par date (plus récent en premier)
    transformedAlerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    setCombinedAlerts(transformedAlerts);
  }, [securityAlerts, securityIncidents]);

  // Fonctions utilitaires
  const getIconConfig = (type: string, severity: string) => {
    const severityColors = {
      critical: 'text-red-600',
      high: 'text-orange-600',  
      medium: 'text-yellow-600',
      low: 'text-blue-600'
    };

    const typeIcons = {
      'unauthorized_access': Shield,
      'suspicious_activity': AlertTriangle,
      'system_error': Activity,
      'data_breach': Shield,
      'performance_issue': Clock,
      'security_violation': AlertTriangle,
      'access_denied': Shield,
      'default': Info
    };

    return {
      icon: typeIcons[type as keyof typeof typeIcons] || typeIcons.default,
      color: severityColors[severity as keyof typeof severityColors] || severityColors.low
    };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Mutations pour résoudre les alertes
  const resolveSecurityAlertMutation = useTenantMutation('security_alerts', 'update', {
    onSuccess: () => {
      toast.success('Alerte résolue avec succès');
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resolveSecurityIncidentMutation = useTenantMutation('security_incidents', 'update', {
    onSuccess: () => {
      toast.success('Incident résolu avec succès');
      queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Actions
  const resolveAlert = async (alertId: string, type: 'security_alert' | 'security_incident', notes?: string) => {
    try {
      const updateData = {
        id: alertId,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        metadata: { resolution_notes: notes }
      };

      if (type === 'security_alert') {
        resolveSecurityAlertMutation.mutate(updateData);
      } else {
        resolveSecurityIncidentMutation.mutate(updateData);
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string, type: 'security_alert' | 'security_incident') => {
    try {
      const updateData = {
        id: alertId,
        status: type === 'security_alert' ? 'in_progress' : 'investigating',
      };

      if (type === 'security_alert') {
        resolveSecurityAlertMutation.mutate(updateData);
      } else {
        resolveSecurityIncidentMutation.mutate(updateData);
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Statistiques
  const getAlertStats = () => {
    const stats = {
      total: combinedAlerts.length,
      critical: combinedAlerts.filter(a => a.severity === 'critical').length,
      high: combinedAlerts.filter(a => a.severity === 'high').length,  
      medium: combinedAlerts.filter(a => a.severity === 'medium').length,
      low: combinedAlerts.filter(a => a.severity === 'low').length,
      byType: {
        security_alerts: combinedAlerts.filter(a => a.type === 'security_alert').length,
        security_incidents: combinedAlerts.filter(a => a.type === 'security_incident').length,
        stock_alerts: 0, // Pour compatibilité
        system_alerts: 0  // Pour compatibilité
      }
    };

    return stats;
  };

  return {
    // Data
    alerts: combinedAlerts,
    securityAlerts,
    securityIncidents,
    
    // Loading states
    isLoading: alertsLoading || incidentsLoading,
    isResolving: resolveSecurityAlertMutation.isPending || resolveSecurityIncidentMutation.isPending,
    
    // Actions
    resolveAlert,
    acknowledgeAlert,
    refetch: () => {
      refetchAlerts();
      refetchIncidents();
    },
    
    // Utilities
    getSeverityColor,
    getIconConfig,
    formatTimeAgo,
    getAlertStats,
  };
};