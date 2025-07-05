import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Brain,
  Eye,
  Settings,
  Plus,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  PieChart,
  LineChart,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Globe,
  Smartphone,
  Mail,
  Bell
} from 'lucide-react';

const BIDashboard = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('executive');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');

  // KPI Exécutifs
  const executiveKPIs = [
    {
      title: 'Performance Globale',
      value: '94.2%',
      change: '+2.8%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Croissance CA',
      value: '+18.5%',
      change: 'vs année N-1',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Efficacité Opérationnelle',
      value: '87.3%',
      change: '+1.2%',
      trend: 'up',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Score Prédictif',
      value: '8.7/10',
      change: '+0.3',
      trend: 'up',
      icon: Brain,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  // Widgets disponibles
  const availableWidgets = [
    { 
      id: 'sales-chart', 
      name: 'Graphique Ventes', 
      type: 'chart', 
      icon: BarChart3, 
      category: 'Ventes',
      active: true 
    },
    { 
      id: 'stock-alerts', 
      name: 'Alertes Stock', 
      type: 'alert', 
      icon: Package, 
      category: 'Stock',
      active: true 
    },
    { 
      id: 'customer-metrics', 
      name: 'Métriques Clients', 
      type: 'metric', 
      icon: Users, 
      category: 'Clients',
      active: true 
    },
    { 
      id: 'financial-summary', 
      name: 'Résumé Financier', 
      type: 'summary', 
      icon: DollarSign, 
      category: 'Financier',
      active: false 
    },
    { 
      id: 'performance-trends', 
      name: 'Tendances Performance', 
      type: 'trend', 
      icon: TrendingUp, 
      category: 'Analytics',
      active: true 
    },
    { 
      id: 'geo-analysis', 
      name: 'Analyse Géographique', 
      type: 'map', 
      icon: Globe, 
      category: 'Géospatial',
      active: false 
    }
  ];

  // Données analytiques avancées
  const predictiveInsights = [
    {
      type: 'Prévision',
      title: 'Rupture Stock Probable',
      description: 'Doliprane 1000mg - Stock critique prévu dans 3 jours',
      severity: 'high',
      confidence: 89,
      action: 'Commander 500 unités'
    },
    {
      type: 'Opportunité',
      title: 'Augmentation Demande Saisonnière',
      description: 'Produits anti-allergiques - Demande +35% prévue',
      severity: 'medium',
      confidence: 76,
      action: 'Ajuster stock préventif'
    },
    {
      type: 'Tendance',
      title: 'Comportement Client Émergent',
      description: 'Croissance parapharmacie bio +28% ce trimestre',
      severity: 'low',
      confidence: 82,
      action: 'Étendre assortiment bio'
    }
  ];

  // Benchmarks sectoriels
  const benchmarks = [
    { metric: 'Marge Brute', value: 31.8, sector: 28.5, status: 'excellent' },
    { metric: 'Rotation Stock', value: 8.2, sector: 6.8, status: 'excellent' },
    { metric: 'Satisfaction Client', value: 4.5, sector: 4.1, status: 'good' },
    { metric: 'Croissance CA', value: 18.5, sector: 12.3, status: 'excellent' },
    { metric: 'Efficacité Logistique', value: 94.2, sector: 89.7, status: 'excellent' }
  ];

  // Alertes intelligentes
  const intelligentAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Stock Critique',
      message: '12 produits en rupture imminente',
      timestamp: '2024-01-05 14:30',
      action: 'Voir détails'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Performance Vendeur',
      message: 'Objectifs non atteints pour 2 vendeurs',
      timestamp: '2024-01-05 12:15',
      action: 'Analyser'
    },
    {
      id: 3,
      type: 'info',
      title: 'Nouvelle Tendance',
      message: 'Augmentation ventes produits bio +25%',
      timestamp: '2024-01-05 10:45',
      action: 'Explorer'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBenchmarkStatus = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence</h2>
          <p className="text-muted-foreground">
            Tableaux de bord intelligents et analyses prédictives
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Select value={refreshInterval} onValueChange={setRefreshInterval}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1min</SelectItem>
              <SelectItem value="300">5min</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Exécutifs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {executiveKPIs.map((kpi, index) => {
          const IconComponent = kpi.icon;
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
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  {kpi.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="predictive">Prédictif</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Widget Ventes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Ventes
                </CardTitle>
                <CardDescription>Évolution des ventes en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">2.85M</p>
                    <p className="text-sm text-muted-foreground">FCFA aujourd'hui</p>
                  </div>
                  <div className="space-y-2">
                    <Progress value={78} className="h-2" />
                    <p className="text-xs text-muted-foreground">78% de l'objectif journalier</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="font-semibold">+18.5%</p>
                      <p className="text-muted-foreground">vs hier</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="font-semibold">147</p>
                      <p className="text-muted-foreground">transactions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Alertes Stock
                </CardTitle>
                <CardDescription>Surveillance des niveaux de stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stock Critique</span>
                    <Badge variant="destructive">23 produits</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Péremptions Proches</span>
                    <Badge variant="secondary">8 lots</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Commandes en Attente</span>
                    <Badge variant="outline">12 fournisseurs</Badge>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Activité Clients
                </CardTitle>
                <CardDescription>Indicateurs clients temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">1,547</p>
                    <p className="text-sm text-muted-foreground">clients actifs ce mois</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="font-semibold">28</p>
                      <p className="text-muted-foreground">nouveaux</p>
                    </div>
                    <div className="text-center p-2 bg-pink-50 rounded">
                      <p className="font-semibold">78.5%</p>
                      <p className="text-muted-foreground">fidélité</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Panier moyen</span>
                      <span className="font-medium">18,750 FCFA</span>
                    </div>
                    <Progress value={65} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Analyses Prédictives
              </CardTitle>
              <CardDescription>Insights générés par intelligence artificielle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(insight.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{insight.type}</Badge>
                          <span className="text-xs">Confiance: {insight.confidence}%</span>
                        </div>
                        <h4 className="font-semibold">{insight.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Action recommandée: {insight.action}</span>
                      <Button size="sm" variant="outline">
                        Appliquer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Benchmarks Sectoriels
              </CardTitle>
              <CardDescription>Comparaison avec les standards du marché pharmaceutique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarks.map((benchmark, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{benchmark.metric}</h4>
                      <Badge className={getBenchmarkStatus(benchmark.status)}>
                        {benchmark.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Votre Performance</p>
                        <p className="text-2xl font-bold text-blue-600">{benchmark.value}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Moyenne Secteur</p>
                        <p className="text-2xl font-bold text-gray-600">{benchmark.sector}%</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress 
                        value={(benchmark.value / benchmark.sector) * 50} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {((benchmark.value - benchmark.sector) / benchmark.sector * 100).toFixed(1)}% 
                        au-dessus de la moyenne
                      </p>
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
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes Intelligentes
              </CardTitle>
              <CardDescription>Notifications automatiques basées sur vos seuils</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {intelligentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Dashboard
              </CardTitle>
              <CardDescription>Personnalisez vos tableaux de bord et widgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Widgets Disponibles</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableWidgets.map((widget) => {
                      const IconComponent = widget.icon;
                      return (
                        <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5" />
                            <div>
                              <p className="font-medium">{widget.name}</p>
                              <p className="text-sm text-muted-foreground">{widget.category}</p>
                            </div>
                          </div>
                          <Switch checked={widget.active} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Widget Personnalisé
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BIDashboard;