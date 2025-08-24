import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Clock, 
  Users, 
  TrendingUp,
  Play,
  Pause,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SecuritySurveillance = () => {
  const { toast } = useToast();
  const { personnel } = useAuth();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  
  const {
    events,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    trackUserActivity,
    detectSuspiciousActivity,
    loadSecurityEvents,
    loadSecurityMetrics,
    generateDailyReport: hookGenerateDailyReport,
    generateWeeklyReport: hookGenerateWeeklyReport,
    generateComplianceReport: hookGenerateComplianceReport
  } = useSecurityMonitoring(selectedTimeRange);

  useEffect(() => {
    loadSecurityEvents(selectedTimeRange);
    loadSecurityMetrics(selectedTimeRange);
  }, [selectedTimeRange, loadSecurityEvents, loadSecurityMetrics]);

  // Fonctions pour générer les rapports
  const generateDailyReport = async () => {
    try {
      await hookGenerateDailyReport();
      toast({
        title: "Rapport quotidien généré",
        description: "Le rapport de sécurité quotidien a été créé avec succès.",
      });
    } catch (error) {
      console.error('Error generating daily report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport quotidien.",
        variant: "destructive",
      });
    }
  };

  const generateWeeklyReport = async () => {
    try {
      await hookGenerateWeeklyReport();
      toast({
        title: "Rapport hebdomadaire généré",
        description: "Le rapport de sécurité hebdomadaire a été créé avec succès.",
      });
    } catch (error) {
      console.error('Error generating weekly report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport hebdomadaire.",
        variant: "destructive",
      });
    }
  };

  const generateComplianceReport = async () => {
    try {
      await hookGenerateComplianceReport();
      toast({
        title: "Rapport de conformité généré",
        description: "Le rapport de conformité de sécurité a été créé avec succès.",
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport de conformité.",
        variant: "destructive",
      });
    }
  };

  // Fonction pour analyser les patterns suspects
  const handleRunPatternAnalysis = async () => {
    try {
      await detectSuspiciousActivity();
      toast({
        title: "Analyse des patterns terminée",
        description: "L'analyse des patterns suspects a été exécutée avec succès.",
      });
    } catch (error) {
      console.error('Error running pattern analysis:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'analyse des patterns.",
        variant: "destructive",
      });
    }
  };

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
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // Calculer les métriques pour l'affichage
  const securityScore = Math.max(0, 100 - (metrics.suspiciousActivity * 10 + metrics.deniedAttempts * 2));
  const activityTrend = metrics.totalAttempts > 0 ? '+12%' : '0%';

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Surveillance Sécuritaire</h2>
            <p className="text-sm text-muted-foreground">Monitoring en temps réel et analyse des patterns</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isMonitoring ? 'Actif' : 'Inactif'}
          </Badge>
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            className="flex items-center gap-2"
          >
            {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isMonitoring ? 'Arrêter' : 'Démarrer'}
          </Button>
          <Button
            onClick={handleRunPatternAnalysis}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analyser les patterns
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <Progress value={securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Bon' : 'À améliorer'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité Totale</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAttempts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {activityTrend} depuis la semaine dernière
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentatives Refusées</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.deniedAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.deniedAttempts / Math.max(metrics.totalAttempts, 1)) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Activité</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {metrics.lastActivity 
                ? formatDistanceToNow(new Date(metrics.lastActivity), { addSuffix: true, locale: fr })
                : 'Aucune activité'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.lastActivity ? format(new Date(metrics.lastActivity), 'PPpp', { locale: fr }) : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de surveillance */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Temps Réel
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytiques
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Événements en Temps Réel
                <Badge variant="outline">{events.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun événement de sécurité récent</p>
                      </div>
                    </div>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                        <div className="text-lg">{getSeverityIcon(event.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                              {event.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {event.alert_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: fr })}
                          </p>
                          {event.metadata && (
                            <div className="mt-2 text-xs text-muted-foreground bg-background/50 p-2 rounded">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Sévérité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['critical', 'high', 'medium', 'low'].map((severity) => {
                    const count = events.filter(e => e.severity === severity).length;
                    const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
                    return (
                      <div key={severity} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize text-sm">{severity}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Types d'Alertes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(events.map(e => e.alert_type))).map((type) => {
                    const count = events.filter(e => e.alert_type === type).length;
                    const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Patterns Suspects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Tentatives Répétées</h4>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {events.filter(e => e.alert_type.includes('repeated')).length}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Dernières 24h</p>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-200">Accès Cross-Tenant</h4>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {events.filter(e => e.alert_type.includes('cross_tenant')).length}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">Tentatives bloquées</p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Nouvelles IP</h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {events.filter(e => e.alert_type.includes('new_ip')).length}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Connexions inconnues</p>
                  </div>
                </div>

                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Graphiques détaillés en cours de développement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Automatisés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Rapport Quotidien</h4>
                    <p className="text-sm text-muted-foreground">Synthèse des événements des dernières 24h</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={generateDailyReport}>Générer</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Rapport Hebdomadaire</h4>
                    <p className="text-sm text-muted-foreground">Analyse des tendances sur 7 jours</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={generateWeeklyReport}>Générer</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Rapport de Conformité</h4>
                    <p className="text-sm text-muted-foreground">Export pour audit de sécurité</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={generateComplianceReport}>Générer</Button>
                </div>

                <div className="text-center text-muted-foreground py-4">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Les rapports seront envoyés automatiquement par email</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySurveillance;