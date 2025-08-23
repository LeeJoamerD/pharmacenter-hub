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
}

export const useSecurityMonitoring = () => {
  const { user, personnel } = useAuth();
  const location = useLocation();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAttempts: 0,
    deniedAttempts: 0,
    suspiciousActivity: 0,
    lastActivity: null
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

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
      // Appeler la fonction RPC pour détecter les patterns suspects
      const { error } = await supabase.rpc('detect_suspicious_patterns');
      
      if (error) {
        console.error('Erreur détection patterns suspects:', error);
        return;
      }

      // Recharger les événements et métriques après détection
      await Promise.all([
        loadSecurityEvents(),
        loadSecurityMetrics()
      ]);
    } catch (error) {
      console.error('Erreur détection activité suspecte:', error);
    }
  };

  // Charger les événements de sécurité
  const loadSecurityEvents = async () => {
    if (!personnel) return;

    try {
      const { data } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setEvents(data as SecurityEvent[]);
      }
    } catch (error) {
      console.error('Erreur chargement événements sécurité:', error);
    }
  };

  // Charger les métriques de sécurité
  const loadSecurityMetrics = async () => {
    if (!personnel) return;

    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Total des tentatives
      const { count: totalAttempts } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', oneWeekAgo);

      // Tentatives refusées
      const { count: deniedAttempts } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', personnel.tenant_id)
        .like('action', '%DENIED%')
        .gte('created_at', oneWeekAgo);

      // Activité suspecte
      const { count: suspiciousActivity } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', oneWeekAgo);

      // Dernière activité
      const { data: lastActivity } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('tenant_id', personnel.tenant_id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setMetrics({
        totalAttempts: totalAttempts || 0,
        deniedAttempts: deniedAttempts || 0,
        suspiciousActivity: suspiciousActivity || 0,
        lastActivity: lastActivity?.[0]?.created_at || null
      });
    } catch (error) {
      console.error('Erreur chargement métriques sécurité:', error);
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
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
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

  // Chargement initial
  useEffect(() => {
    if (personnel) {
      loadSecurityEvents();
      loadSecurityMetrics();
    }
  }, [personnel]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    trackUserActivity('monitoring_started');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    trackUserActivity('monitoring_stopped');
  };

  return {
    events,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    trackUserActivity,
    detectSuspiciousActivity,
    loadSecurityEvents,
    loadSecurityMetrics
  };
};