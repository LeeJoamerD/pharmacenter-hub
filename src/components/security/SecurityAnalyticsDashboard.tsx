import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle,
  Activity,
  Users,
  Clock,
  Target,
  Eye,
  CheckCircle
} from 'lucide-react';

interface SecurityMetric {
  period: string;
  total_attempts: number;
  denied_attempts: number;
  suspicious_activity: number;
  alerts_count: number;
  resolved_incidents: number;
}

interface ThreatAnalysis {
  threat_type: string;
  count: number;
  severity_avg: number;
  trend: 'up' | 'down' | 'stable';
}

const SecurityAnalyticsDashboard = () => {
  const { personnel } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Couleurs pour les graphiques
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // Charger les métriques de sécurité
  const loadSecurityMetrics = async () => {
    if (!personnel) return;

    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Récupérer les données d'audit
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('created_at, action, status')
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', startDate.toISOString());

      // Récupérer les alertes de sécurité
      const { data: alertsData } = await supabase
        .from('security_alerts')
        .select('created_at, alert_type, severity, resolved')
        .eq('tenant_id', personnel.tenant_id)
        .gte('created_at', startDate.toISOString());

      // Traiter les données par jour
      const dailyMetrics: Record<string, SecurityMetric> = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        dailyMetrics[dateKey] = {
          period: dateKey,
          total_attempts: 0,
          denied_attempts: 0,
          suspicious_activity: 0,
          alerts_count: 0,
          resolved_incidents: 0
        };
      }

      // Traiter les logs d'audit
      auditData?.forEach(log => {
        const dateKey = log.created_at.split('T')[0];
        if (dailyMetrics[dateKey]) {
          dailyMetrics[dateKey].total_attempts++;
          if (log.action.includes('DENIED') || log.status === 'denied') {
            dailyMetrics[dateKey].denied_attempts++;
          }
        }
      });

      // Traiter les alertes
      alertsData?.forEach(alert => {
        const dateKey = alert.created_at.split('T')[0];
        if (dailyMetrics[dateKey]) {
          dailyMetrics[dateKey].alerts_count++;
          if (alert.alert_type.includes('suspicious')) {
            dailyMetrics[dateKey].suspicious_activity++;
          }
          if (alert.resolved) {
            dailyMetrics[dateKey].resolved_incidents++;
          }
        }
      });

      const metricsArray = Object.values(dailyMetrics)
        .sort((a, b) => a.period.localeCompare(b.period));

      setMetrics(metricsArray);

      // Analyser les types de menaces
      const threatCounts: Record<string, { count: number; severities: number[] }> = {};
      
      alertsData?.forEach(alert => {
        if (!threatCounts[alert.alert_type]) {
          threatCounts[alert.alert_type] = { count: 0, severities: [] };
        }
        threatCounts[alert.alert_type].count++;
        
        const severityScore = {
          'low': 1,
          'medium': 2,
          'high': 3,
          'critical': 4
        }[alert.severity] || 1;
        
        threatCounts[alert.alert_type].severities.push(severityScore);
      });

      const threatAnalysisData = Object.entries(threatCounts).map(([type, data]) => ({
        threat_type: type,
        count: data.count,
        severity_avg: data.severities.reduce((a, b) => a + b, 0) / data.severities.length,
        trend: 'stable' as const // Simplifié pour la démo
      }));

      setThreatAnalysis(threatAnalysisData);

    } catch (error) {
      console.error('Erreur chargement métriques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (personnel) {
      loadSecurityMetrics();
    }
  }, [personnel, timeRange]);

  // Calculer les totaux et tendances
  const totalAttempts = metrics.reduce((sum, m) => sum + m.total_attempts, 0);
  const totalDenied = metrics.reduce((sum, m) => sum + m.denied_attempts, 0);
  const totalAlerts = metrics.reduce((sum, m) => sum + m.alerts_count, 0);
  const successRate = totalAttempts > 0 ? ((totalAttempts - totalDenied) / totalAttempts * 100) : 100;

  // Données pour le graphique en secteurs
  const pieData = [
    { name: 'Accès Autorisés', value: totalAttempts - totalDenied },
    { name: 'Accès Refusés', value: totalDenied },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Analytiques de Sécurité
          </h2>
          <p className="text-muted-foreground">
            Analyse avancée des performances et tendances de sécurité
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
            </Button>
          ))}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de Sécurité
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {successRate.toFixed(1)}%
            </div>
            <Progress value={successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {totalAttempts - totalDenied} accès autorisés / {totalAttempts} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tentatives Bloquées
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalDenied}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totalDenied / totalAttempts) * 100 || 0).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes Générées
            </CardTitle>
            <Eye className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              Derniers {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Menaces Actives
            </CardTitle>
            <Target className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threatAnalysis.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Types de menaces détectés
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="threats">Analyse des Menaces</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activité de Sécurité</CardTitle>
                <CardDescription>
                  Évolution des tentatives d'accès et incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_attempts" 
                      stroke="#8884d8" 
                      name="Total tentatives"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="denied_attempts" 
                      stroke="#ff7300" 
                      name="Tentatives refusées"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="alerts_count" 
                      stroke="#82ca9d" 
                      name="Alertes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Accès</CardTitle>
                <CardDescription>
                  Distribution entre accès autorisés et refusés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Types de Menaces</CardTitle>
              <CardDescription>
                Classification et fréquence des menaces détectées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={threatAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="threat_type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Occurrences" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Menaces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {threatAnalysis
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((threat, index) => (
                      <div key={threat.threat_type} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{threat.threat_type}</p>
                          <p className="text-xs text-muted-foreground">
                            Sévérité moyenne: {threat.severity_avg.toFixed(1)}/4
                          </p>
                        </div>
                        <Badge variant="outline">
                          {threat.count} incidents
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances de Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Taux de résolution</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">85%</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Temps de réponse moyen</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">12min</span>
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Incidents critiques</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">3</span>
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Score de sécurité global</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">92/100</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Temps de Réponse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">12.3s</div>
                  <p className="text-sm text-muted-foreground">Temps moyen de détection</p>
                  <Progress value={85} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efficacité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">94%</div>
                  <p className="text-sm text-muted-foreground">Taux de détection</p>
                  <Progress value={94} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">89%</div>
                  <p className="text-sm text-muted-foreground">Incidents résolus</p>
                  <Progress value={89} className="mt-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Sécurité</CardTitle>
              <CardDescription>
                Génération et export de rapports détaillés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart className="h-6 w-6 mb-2" />
                  Rapport Mensuel
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  Audit de Sécurité
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Analyse des Incidents
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Rapport de Performance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAnalyticsDashboard;