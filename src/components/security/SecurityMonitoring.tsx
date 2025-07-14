import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Clock, 
  User, 
  Database,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: any;
  created_at: string;
  resolved: boolean;
}

interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  crossTenantViolations: number;
  suspiciousPatterns: number;
  recentViolations: number;
}

export const SecurityMonitoring: React.FC = () => {
  const { pharmacy } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAlerts: 0,
    criticalAlerts: 0,
    crossTenantViolations: 0,
    suspiciousPatterns: 0,
    recentViolations: 0
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (pharmacy?.id) {
      loadSecurityData();
    }
  }, [pharmacy?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, pharmacy?.id]);

  const loadSecurityData = async () => {
    if (!pharmacy?.id) return;

    try {
      setLoading(true);

      // Charger les alertes de sécurité récentes
      const { data: alertsData } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (alertsData) {
        setAlerts(alertsData as SecurityAlert[]);

        // Calculer les métriques
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const newMetrics: SecurityMetrics = {
          totalAlerts: alertsData.length,
          criticalAlerts: alertsData.filter(a => a.severity === 'critical').length,
          crossTenantViolations: alertsData.filter(a => a.alert_type === 'cross_tenant_violation').length,
          suspiciousPatterns: alertsData.filter(a => a.alert_type === 'suspicious_pattern_detected').length,
          recentViolations: alertsData.filter(a => 
            new Date(a.created_at) > last24h && 
            a.alert_type === 'cross_tenant_violation'
          ).length
        };

        setMetrics(newMetrics);
      }

    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ resolved: true })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alerte résolue');
      loadSecurityData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erreur lors de la résolution de l\'alerte');
    }
  };

  const runSuspiciousPatternDetection = async () => {
    try {
      const { error } = await supabase.rpc('detect_suspicious_patterns');
      if (error) throw error;
      
      toast.success('Analyse des patterns suspects lancée');
      setTimeout(loadSecurityData, 2000); // Reload after 2 seconds
    } catch (error) {
      console.error('Error running pattern detection:', error);
      toast.error('Erreur lors de l\'analyse');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'cross_tenant_violation': return <Shield className="h-4 w-4" />;
      case 'suspicious_pattern_detected': return <TrendingUp className="h-4 w-4" />;
      case 'unauthorized_operation_attempt': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatAlertDescription = (alert: SecurityAlert) => {
    if (alert.metadata) {
      const meta = alert.metadata;
      if (alert.alert_type === 'cross_tenant_violation') {
        return `Tentative d'accès de ${meta.user_tenant || 'tenant inconnu'} vers ${meta.attempted_tenant || 'tenant inconnu'} sur la table ${meta.table || 'inconnue'}`;
      }
      if (alert.alert_type === 'suspicious_pattern_detected') {
        return `${meta.violation_count || 0} violations détectées en ${meta.time_window || 'période inconnue'}`;
      }
    }
    return alert.description;
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total alertes</p>
                <p className="text-lg font-bold">{metrics.totalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Critiques</p>
                <p className="text-lg font-bold text-red-600">{metrics.criticalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cross-tenant</p>
                <p className="text-lg font-bold">{metrics.crossTenantViolations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Patterns</p>
                <p className="text-lg font-bold">{metrics.suspiciousPatterns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">24h</p>
                <p className="text-lg font-bold">{metrics.recentViolations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Actions de sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadSecurityData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={runSuspiciousPatternDetection} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyser les patterns
            </Button>
            <Button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
            >
              <Clock className="h-4 w-4 mr-2" />
              {autoRefresh ? 'Arrêter' : 'Auto-actualisation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertes de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes de sécurité récentes
          </CardTitle>
          <CardDescription>
            Incidents de sécurité détectés dans votre pharmacie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune alerte de sécurité récente</p>
                <p className="text-sm text-muted-foreground">Votre système est sécurisé</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} ${alert.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertTypeIcon(alert.alert_type)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="default">Résolue</Badge>
                          )}
                        </div>
                        <p className="font-medium">{formatAlertDescription(alert)}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                          {alert.metadata?.user_role && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {alert.metadata.user_role}
                            </span>
                          )}
                          {alert.metadata?.table && (
                            <span className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {alert.metadata.table}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Résoudre
                      </Button>
                    )}
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};