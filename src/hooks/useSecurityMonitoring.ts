import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface SecurityEvent {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: any;
  created_at: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
  tenant_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface SecurityMetrics {
  totalAttempts: number;
  deniedAttempts: number;
  suspiciousActivity: number;
  lastActivity: string | null;
  securityScore: number;
}

interface SecurityReport {
  id: string;
  tenant_id: string;
  created_by: string | null;
  type: 'quotidien' | 'hebdomadaire' | 'conformite';
  params: any;
  content: any;
  status: 'genere' | 'exporte' | 'erreur';
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TypeDistribution {
  [key: string]: number;
}

interface PatternCounters {
  repeated_attempts: number;
  cross_tenant: number;
  new_ip: number;
  suspicious_pattern: number;
}

type TimeRange = '24h' | '7d' | '30d';

export const useSecurityMonitoring = (selectedTimeRange: TimeRange = '24h') => {
  const { user, personnel } = useAuth();
  const location = useLocation();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAttempts: 0,
    deniedAttempts: 0,
    suspiciousActivity: 0,
    lastActivity: null,
    securityScore: 0
  });
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [severityDistribution, setSeverityDistribution] = useState<SeverityDistribution>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution>({});
  const [patternCounters, setPatternCounters] = useState<PatternCounters>({
    repeated_attempts: 0,
    cross_tenant: 0,
    new_ip: 0,
    suspicious_pattern: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculer la date de début selon la plage temporelle
  const getDateFromTimeRange = (timeRange: TimeRange): string => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  // Calculer le score de sécurité
  const calculateSecurityScore = (metrics: Omit<SecurityMetrics, 'securityScore'>): number => {
    let score = 100;
    
    // Réduire le score selon l'activité suspecte
    if (metrics.suspiciousActivity > 0) {
      score -= Math.min(metrics.suspiciousActivity * 10, 50);
    }
    
    // Réduire le score selon le ratio de tentatives refusées
    if (metrics.totalAttempts > 0) {
      const deniedRatio = metrics.deniedAttempts / metrics.totalAttempts;
      score -= deniedRatio * 30;
    }
    
    return Math.max(0, Math.round(score));
  };

  // Enregistrer l'activité de l'utilisateur
  const trackUserActivity = async (action: string, details?: any) => {
    if (!user || !personnel) return;

    try {
      await supabase.from('audit_logs').insert({
        tenant_id: personnel.tenant_id,
        user_id: user.id,
        personnel_id: personnel.id,
        action: `USER_ACTIVITY_${action.toUpperCase()}`,
        table_name: 'user_monitoring',
        new_values: {
          route: location.pathname,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          details: details || {}
        },
        status: 'logged'
      });
    } catch (error) {
      console.error('Erreur tracking activité:', error);
    }
  };

  // Détecter activité suspecte
  const detectSuspiciousActivity = async () => {
    if (!personnel) return;

    try {
      setIsLoading(true);
      // Appeler la fonction RPC pour détecter les patterns suspects
      const { error } = await supabase.rpc('detect_suspicious_patterns');
      
      if (error) {
        console.error('Erreur détection patterns suspects:', error);
        throw error;
      }

      // Recharger les événements et métriques après détection
      await Promise.all([
        loadSecurityEvents(),
        loadSecurityMetrics()
      ]);
    } catch (error) {
      console.error('Erreur détection activité suspecte:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les événements de sécurité avec filtre temporel
  const loadSecurityEvents = async (timeRange?: TimeRange) => {
    if (!personnel) return;

    try {
      setIsLoading(true);
      const startDate = getDateFromTimeRange(timeRange || selectedTimeRange);
      
      const { data } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const events = data as SecurityEvent[];
        setEvents(events);
        
        // Calculer les distributions
        calculateDistributions(events);
      }
    } catch (error) {
      console.error('Erreur chargement événements sécurité:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les distributions pour les onglets Analytics et Patterns
  const calculateDistributions = (events: SecurityEvent[]) => {
    // Distribution par sévérité
    const severity: SeverityDistribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    // Distribution par type
    const types: TypeDistribution = {};

    // Compteurs de patterns
    const patterns: PatternCounters = {
      repeated_attempts: 0,
      cross_tenant: 0,
      new_ip: 0,
      suspicious_pattern: 0
    };

    events.forEach(event => {
      // Distribution par sévérité
      if (event.severity in severity) {
        severity[event.severity as keyof SeverityDistribution]++;
      }

      // Distribution par type
      types[event.alert_type] = (types[event.alert_type] || 0) + 1;

      // Compteurs de patterns spécifiques
      switch (event.alert_type) {
        case 'repeated_login_attempts':
        case 'repeated_access_attempts':
          patterns.repeated_attempts++;
          break;
        case 'cross_tenant_violation':
        case 'cross_tenant_attempt':
          patterns.cross_tenant++;
          break;
        case 'new_ip_detected':
        case 'suspicious_ip':
          patterns.new_ip++;
          break;
        case 'suspicious_pattern_detected':
          patterns.suspicious_pattern++;
          break;
      }
    });

    setSeverityDistribution(severity);
    setTypeDistribution(types);
    setPatternCounters(patterns);
  };

  // Charger les métriques de sécurité avec filtre temporel
  const loadSecurityMetrics = async (timeRange?: TimeRange) => {
    if (!personnel) return;

    try {
      const startDate = getDateFromTimeRange(timeRange || selectedTimeRange);

      // Total des tentatives
      const { count: totalAttempts } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', startDate);

      // Tentatives refusées
      const { count: deniedAttempts } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', personnel.tenant_id)
        .like('action', '%DENIED%')
        .gte('created_at', startDate);

      // Activité suspecte
      const { count: suspiciousActivity } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', startDate);

      // Dernière activité
      const { data: lastActivity } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('tenant_id', personnel.tenant_id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const baseMetrics = {
        totalAttempts: totalAttempts || 0,
        deniedAttempts: deniedAttempts || 0,
        suspiciousActivity: suspiciousActivity || 0,
        lastActivity: lastActivity?.[0]?.created_at || null
      };

      const securityScore = calculateSecurityScore(baseMetrics);

      setMetrics({
        ...baseMetrics,
        securityScore
      });
    } catch (error) {
      console.error('Erreur chargement métriques sécurité:', error);
    }
  };

  // Charger les rapports de sécurité
  const loadSecurityReports = async () => {
    if (!personnel) return;

    try {
      const { data } = await supabase
        .from('security_reports')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setReports(data as SecurityReport[]);
      }
    } catch (error) {
      console.error('Erreur chargement rapports sécurité:', error);
    }
  };

  // Générer un rapport de sécurité
  const generateSecurityReport = async (reportType: SecurityReport['type']) => {
    if (!personnel) return;

    try {
      setIsLoading(true);
      
      const reportParams = {
        timeRange: selectedTimeRange,
        generatedAt: new Date().toISOString(),
        reportType
      };

      const reportContent = {
        metrics: {
          totalAttempts: metrics.totalAttempts,
          deniedAttempts: metrics.deniedAttempts,
          suspiciousActivity: metrics.suspiciousActivity,
          lastActivity: metrics.lastActivity,
          securityScore: metrics.securityScore
        },
        severityDistribution: {
          critical: severityDistribution.critical,
          high: severityDistribution.high,
          medium: severityDistribution.medium,
          low: severityDistribution.low
        },
        typeDistribution: { ...typeDistribution },
        patternCounters: {
          repeated_attempts: patternCounters.repeated_attempts,
          cross_tenant: patternCounters.cross_tenant,
          new_ip: patternCounters.new_ip,
          suspicious_pattern: patternCounters.suspicious_pattern
        },
        totalEvents: events.length,
        summary: {
          period: selectedTimeRange,
          criticalAlerts: severityDistribution.critical,
          highAlerts: severityDistribution.high,
          securityScore: metrics.securityScore
        }
      };

      const { data, error } = await supabase
        .from('security_reports')
        .insert({
          tenant_id: personnel.tenant_id,
          created_by: personnel.id,
          type: reportType,
          params: reportParams as any,
          content: reportContent as any,
          status: 'genere'
        })
        .select()
        .single();

      if (error) throw error;

      // Logger dans audit_logs
      await trackUserActivity('rapport_genere', {
        reportType,
        reportId: data.id
      });

      // Recharger la liste des rapports
      await loadSecurityReports();

      return data;
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Surveillance en temps réel
  useEffect(() => {
    if (!personnel || !isMonitoring) return;

    const channel = supabase.channel('security-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
          filter: `tenant_id=eq.${personnel.tenant_id}`
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          setEvents(prev => {
            const updated = [newEvent, ...prev.slice(0, 49)];
            calculateDistributions(updated);
            return updated;
          });
          loadSecurityMetrics(); // Recharger les métriques
        }
      )
      .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [personnel, isMonitoring]);

  // Tracking automatique des changements de route
  useEffect(() => {
    if (isMonitoring) {
      trackUserActivity('route_change', { 
        from: document.referrer,
        to: location.pathname 
      });
    }
  }, [location.pathname, isMonitoring]);

  // Chargement initial et mise à jour selon la plage temporelle
  useEffect(() => {
    if (personnel) {
      Promise.all([
        loadSecurityEvents(selectedTimeRange),
        loadSecurityMetrics(selectedTimeRange),
        loadSecurityReports()
      ]);
    }
  }, [personnel, selectedTimeRange, loadSecurityEvents, loadSecurityMetrics]);

  const startMonitoring = async () => {
    setIsMonitoring(true);
    await trackUserActivity('monitoring_started');
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);
    await trackUserActivity('monitoring_stopped');
  };

  return {
    // États
    events,
    metrics,
    reports,
    severityDistribution,
    typeDistribution,
    patternCounters,
    isMonitoring,
    isLoading,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    trackUserActivity,
    detectSuspiciousActivity,
    loadSecurityEvents,
    loadSecurityMetrics,
    loadSecurityReports,
    generateSecurityReport,
    
    // Rapports
    generateDailyReport: () => generateSecurityReport('quotidien'),
    generateWeeklyReport: () => generateSecurityReport('hebdomadaire'),
    generateComplianceReport: () => generateSecurityReport('conformite')
  };
};