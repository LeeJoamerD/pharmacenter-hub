import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Settings, 
  Eye, 
  Bell,
  Database,
  Network,
  Lock,
  Zap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  Target
} from 'lucide-react';
import { SecurityDashboard } from '@/components/dashboard/modules/parametres/SecurityDashboard';
import SecuritySurveillance from '@/components/dashboard/modules/parametres/SecuritySurveillance';
import SecurityNotifications from '@/components/dashboard/modules/parametres/SecurityNotifications';
import SecurityIncidents from '@/components/dashboard/modules/parametres/SecurityIncidents';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface SecurityModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'error';
  lastActivity: string;
  alerts: number;
  description: string;
}

interface SystemHealth {
  overall: number;
  modules: {
    authentication: number;
    monitoring: number;
    incidents: number;
    notifications: number;
    dataProtection: number;
  };
}

const SecuritySystemIntegration = () => {
  const [activeModule, setActiveModule] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 85,
    modules: {
      authentication: 92,
      monitoring: 88,
      incidents: 76,
      notifications: 95,
      dataProtection: 83
    }
  });

  const {
    events,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  } = useSecurityMonitoring();

  const { useTenantQueryWithCache } = useTenantQuery();

  // Récupérer les données de sécurité
  const { data: securityAlerts = [] } = useTenantQueryWithCache(
    ['security-alerts-integration'],
    'security_alerts',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 10 
    }
  );

  const { data: incidents = [] } = useTenantQueryWithCache(
    ['security-incidents-integration'],
    'security_incidents',
    '*',
    undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 5 
    }
  );

  const securityModules: SecurityModule[] = [
    {
      id: 'authentication',
      name: 'Authentification',
      icon: <Lock className="h-5 w-5" />,
      status: 'active',
      lastActivity: '2 min',
      alerts: 0,
      description: 'Gestion des connexions et politiques de mots de passe'
    },
    {
      id: 'monitoring',
      name: 'Surveillance',
      icon: <Eye className="h-5 w-5" />,
      status: isMonitoring ? 'active' : 'inactive',
      lastActivity: '30 sec',
      alerts: events.length,
      description: 'Monitoring temps réel et détection d\'anomalies'
    },
    {
      id: 'incidents',
      name: 'Incidents',
      icon: <AlertTriangle className="h-5 w-5" />,
      status: incidents.length > 0 ? 'error' : 'active',
      lastActivity: '5 min',
      alerts: incidents.filter((i: any) => i.status === 'open').length,
      description: 'Gestion et suivi des incidents de sécurité'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      status: 'active',
      lastActivity: '1 min',
      alerts: 0,
      description: 'Alertes automatiques et notifications'
    },
    {
      id: 'dataProtection',
      name: 'Protection Données',
      icon: <Database className="h-5 w-5" />,
      status: 'active',
      lastActivity: '10 min',
      alerts: 1,
      description: 'Chiffrement et contrôle d\'accès aux données'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const calculateOverallHealth = () => {
    const values = Object.values(systemHealth.modules);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const getThreatLevel = () => {
    const criticalAlerts = securityAlerts.filter((alert: any) => alert.severity === 'critical').length;
    const openIncidents = incidents.filter((i: any) => i.status === 'open').length;
    
    if (criticalAlerts > 2 || openIncidents > 3) return 'HIGH';
    if (criticalAlerts > 0 || openIncidents > 1) return 'MEDIUM';
    return 'LOW';
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    // Démarrer le monitoring automatiquement
    if (!isMonitoring) {
      startMonitoring();
    }
  }, []);

  const threatLevel = getThreatLevel();
  const overallHealth = calculateOverallHealth();

  return (
    <div className="space-y-6">
      {/* En-tête du système de sécurité intégré */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Système de Sécurité Intégré</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Centre de contrôle unifié pour la sécurité pharmaceutique
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getThreatLevelColor(threatLevel)}>
                Niveau de Menace: {threatLevel}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Santé Système</p>
                <p className="text-2xl font-bold">{overallHealth}%</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tableau de Bord
          </TabsTrigger>
          <TabsTrigger value="surveillance" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Surveillance
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Santé Globale</p>
                      <p className="text-2xl font-bold">{overallHealth}%</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <Progress value={overallHealth} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                      <p className="text-2xl font-bold">{securityAlerts.length}</p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5% cette semaine
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Incidents Ouverts</p>
                      <p className="text-2xl font-bold">
                        {incidents.filter((i: any) => i.status === 'open').length}
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Temps moyen de résolution: 2.3h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sessions Actives</p>
                      <p className="text-2xl font-bold">18</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pic à 13h45
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* État des modules */}
            <Card>
              <CardHeader>
                <CardTitle>État des Modules de Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {securityModules.map((module) => (
                    <Card key={module.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getStatusColor(module.status)} bg-current/10`}>
                              {module.icon}
                            </div>
                            <div>
                              <h4 className="font-medium">{module.name}</h4>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={getStatusColor(module.status)}>
                              {getStatusIcon(module.status)}
                            </div>
                            {module.alerts > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {module.alerts}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dernière activité</span>
                            <span>{module.lastActivity}</span>
                          </div>
                          <Progress 
                            value={systemHealth.modules[module.id as keyof typeof systemHealth.modules] || 75} 
                            className="mt-2 h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveModule('surveillance')}
                  >
                    <Eye className="h-6 w-6" />
                    Surveillance Temps Réel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveModule('incidents')}
                  >
                    <AlertTriangle className="h-6 w-6" />
                    Créer un Incident
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveModule('dashboard')}
                  >
                    <Settings className="h-6 w-6" />
                    Configuration
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveModule('reports')}
                  >
                    <FileText className="h-6 w-6" />
                    Générer Rapport
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alertes récentes */}
            {securityAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alertes Récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {securityAlerts.slice(0, 5).map((alert: any) => (
                      <Alert key={alert.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <div>
                            <strong>{alert.alert_type.replace(/_/g, ' ').toUpperCase()}</strong>
                            <p className="text-sm">{alert.description}</p>
                          </div>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="surveillance">
          <SecuritySurveillance />
        </TabsContent>

        <TabsContent value="incidents">
          <SecurityIncidents />
        </TabsContent>

        <TabsContent value="notifications">
          <SecurityNotifications />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rapports Automatisés</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Rapport Quotidien</h4>
                          <p className="text-sm text-muted-foreground">Synthèse sécuritaire des dernières 24h</p>
                        </div>
                        <Button size="sm">Générer</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Rapport Hebdomadaire</h4>
                          <p className="text-sm text-muted-foreground">Analyse des tendances sur 7 jours</p>
                        </div>
                        <Button size="sm">Générer</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Audit de Conformité</h4>
                          <p className="text-sm text-muted-foreground">Conformité réglementaire pharmaceutique</p>
                        </div>
                        <Button size="sm">Générer</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Métriques Système</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Sécurité Authentification</span>
                            <span>{systemHealth.modules.authentication}%</span>
                          </div>
                          <Progress value={systemHealth.modules.authentication} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Monitoring Actif</span>
                            <span>{systemHealth.modules.monitoring}%</span>
                          </div>
                          <Progress value={systemHealth.modules.monitoring} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Gestion Incidents</span>
                            <span>{systemHealth.modules.incidents}%</span>
                          </div>
                          <Progress value={systemHealth.modules.incidents} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Notifications</span>
                            <span>{systemHealth.modules.notifications}%</span>
                          </div>
                          <Progress value={systemHealth.modules.notifications} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Protection Données</span>
                            <span>{systemHealth.modules.dataProtection}%</span>
                          </div>
                          <Progress value={systemHealth.modules.dataProtection} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Système de Sécurité Intégré Actif</strong>
                    <p className="mt-1">
                      Tous les modules de sécurité sont opérationnels et surveillent activement votre infrastructure pharmaceutique. 
                      Les alertes automatiques et les rapports de conformité sont configurés selon les standards de l'industrie.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySystemIntegration;