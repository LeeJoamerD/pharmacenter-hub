import React, { useState, useEffect } from 'react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Bell,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from "@/integrations/supabase/types";

type SecurityAlert = Database['public']['Tables']['security_alerts']['Row'];

const SecurityDashboard = () => {
  const { 
    events, 
    metrics, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring,
    loadSecurityEvents,
    loadSecurityMetrics 
  } = useSecurityMonitoring();
  
  const { personnel } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les alertes actives
  const loadActiveAlerts = async () => {
    if (!personnel) return;

    try {
      const { data: alertsData } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      const { data: incidentsData } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .in('severity', ['high', 'critical'])
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      setAlerts(alertsData || []);
      setActiveIncidents(incidentsData || []);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Résoudre une alerte
  const resolveAlert = async (alertId: string) => {
    if (!personnel) return;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: personnel.id
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alerte résolue",
        description: "L'alerte de sécurité a été marquée comme résolue."
      });

      loadActiveAlerts();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte.",
        variant: "destructive"
      });
    }
  };

  // Surveillance en temps réel des nouvelles alertes
  useEffect(() => {
    if (!personnel) return;

    const channel = supabase.channel('security-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
          filter: `tenant_id=eq.${personnel.tenant_id}`
        },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          
          // Notification toast pour les alertes critiques
          if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
            toast({
              title: "🚨 Alerte de sécurité",
              description: newAlert.description,
              variant: "destructive"
            });
          }
          
          loadActiveAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [personnel]);

  useEffect(() => {
    if (personnel) {
      loadActiveAlerts();
    }
  }, [personnel]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Eye className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statut monitoring */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Surveillance Sécurité
          </h2>
          <p className="text-muted-foreground">
            Monitoring en temps réel et gestion des incidents de sécurité
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={isMonitoring ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <Activity className={`h-3 w-3 ${isMonitoring ? 'animate-pulse' : ''}`} />
            {isMonitoring ? 'Actif' : 'Inactif'}
          </Badge>
          
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? 'Arrêter' : 'Démarrer'} le monitoring
          </Button>
        </div>
      </div>

      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Incidents Actifs
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {activeIncidents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Incidents non résolus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes Totales
            </CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Alertes non résolues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tentatives Refusées
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.deniedAttempts}
            </div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Activité Suspecte
            </CardTitle>
            <Eye className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.suspiciousActivity}
            </div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes critiques */}
      {activeIncidents.length > 0 && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>Incidents critiques détectés !</strong> {activeIncidents.length} incident(s) 
            nécessite(nt) une attention immédiate.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList>
          <TabsTrigger value="alerts">Alertes Actives</TabsTrigger>
          <TabsTrigger value="incidents">Incidents Critiques</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Sécurité Non Résolues</CardTitle>
              <CardDescription>
                Toutes les alertes en attente de résolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Aucune alerte active. Système sécurisé.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {alert.alert_type}
                            </Badge>
                          </div>
                          <p className="font-medium mt-1">{alert.description}</p>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(alert.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => resolveAlert(alert.id)}
                        variant="outline"
                        size="sm"
                      >
                        Résoudre
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Incidents Critiques</CardTitle>
              <CardDescription>
                Incidents de haute priorité nécessitant une intervention immédiate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeIncidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Aucun incident critique. Système stable.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <Badge variant="destructive">
                              {incident.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">
                              {incident.alert_type}
                            </span>
                          </div>
                          <h4 className="font-semibold text-destructive mb-2">
                            {incident.description}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Détecté le {formatDate(incident.created_at)}
                          </p>
                          {incident.metadata && (
                            <details className="mt-2">
                              <summary className="text-sm cursor-pointer text-primary">
                                Détails techniques
                              </summary>
                              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                                {JSON.stringify(incident.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => resolveAlert(incident.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Résoudre Incident
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Événements</CardTitle>
              <CardDescription>
                Derniers événements de sécurité détectés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(event.severity)}
                      <div>
                        <p className="text-sm font-medium">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques d'Activité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total des tentatives</span>
                  <span className="font-bold">{metrics.totalAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tentatives refusées</span>
                  <span className="font-bold text-destructive">{metrics.deniedAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Activité suspecte</span>
                  <span className="font-bold text-secondary">{metrics.suspiciousActivity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taux de sécurité</span>
                  <span className="font-bold text-green-600">
                    {metrics.totalAttempts > 0 
                      ? ((metrics.totalAttempts - metrics.deniedAttempts) / metrics.totalAttempts * 100).toFixed(1)
                      : 100
                    }%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>État du Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Monitoring</span>
                  <Badge variant={isMonitoring ? "default" : "secondary"}>
                    {isMonitoring ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Dernière activité</span>
                  <span className="text-sm">
                    {metrics.lastActivity 
                      ? formatDate(metrics.lastActivity)
                      : 'Aucune'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Alertes actives</span>
                  <Badge variant={alerts.length > 0 ? "destructive" : "default"}>
                    {alerts.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;