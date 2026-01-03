import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, BarChart3, TrendingUp, Zap, Brain, Eye, RefreshCw, Package, Users, Bell, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { useBIDashboard } from '@/hooks/useBIDashboard';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

const BIDashboard = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const { executiveKPIs, salesWidget, stockWidget, customerWidget, predictiveInsights, alerts, benchmarks, isLoading, refetch } = useBIDashboard();
  const { formatAmount } = useCurrencyFormatting();

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = { Target, TrendingUp, Zap, Brain };
    return icons[iconName] || Target;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence</h2>
          <p className="text-muted-foreground">Tableaux de bord intelligents et analyses prédictives</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs Exécutifs */}
      <div className="grid gap-4 md:grid-cols-4">
        {executiveKPIs.map((kpi, index) => {
          const IconComponent = getIconComponent(kpi.icon);
          return (
            <Card key={index} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />{kpi.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="predictive">Prédictif</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Performance Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                {salesWidget && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{formatAmount(salesWidget.todaySales)}</p>
                      <p className="text-sm text-muted-foreground">aujourd'hui</p>
                    </div>
                    <Progress value={salesWidget.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{salesWidget.progress.toFixed(0)}% de l'objectif • {salesWidget.transactions} transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Alertes Stock</CardTitle>
              </CardHeader>
              <CardContent>
                {stockWidget && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stock Critique</span>
                      <Badge variant="destructive">{stockWidget.criticalCount} produits</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Péremptions Proches</span>
                      <Badge variant="secondary">{stockWidget.expiringCount} lots</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Commandes en Attente</span>
                      <Badge variant="outline">{stockWidget.pendingOrders}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Activité Clients</CardTitle>
              </CardHeader>
              <CardContent>
                {customerWidget && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{customerWidget.activeClients}</p>
                      <p className="text-sm text-muted-foreground">clients actifs</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="font-semibold">{customerWidget.newClients}</p>
                        <p className="text-muted-foreground">nouveaux</p>
                      </div>
                      <div className="text-center p-2 bg-pink-50 rounded">
                        <p className="font-semibold">{customerWidget.loyaltyRate.toFixed(1)}%</p>
                        <p className="text-muted-foreground">fidélité</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Analyses Prédictives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(insight.severity)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{insight.type}</Badge>
                      <span className="text-xs">Confiance: {insight.confidence}%</span>
                    </div>
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <Button size="sm" variant="outline" className="mt-2">{insight.action}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Benchmarks Sectoriels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarks.map((b, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{b.metric}</h4>
                      <Badge className={b.status === 'excellent' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}>{b.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Votre Performance</p>
                        <p className="text-2xl font-bold text-blue-600">{b.value}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Moyenne Secteur</p>
                        <p className="text-2xl font-bold text-gray-600">{b.sector}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Alertes Intelligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 border-l-4 rounded-lg ${
                    alert.type === 'critical' ? 'border-l-red-500 bg-red-50/30' :
                    alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50/30' :
                    'border-l-blue-500 bg-blue-50/30'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {alert.type === 'critical' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                         alert.type === 'warning' ? <Clock className="h-4 w-4 text-yellow-600" /> :
                         <CheckCircle className="h-4 w-4 text-blue-600" />}
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">{alert.action}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BIDashboard;
