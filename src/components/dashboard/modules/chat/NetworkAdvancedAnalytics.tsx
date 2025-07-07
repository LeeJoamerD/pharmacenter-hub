import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MessageSquare,
  Clock,
  Target,
  Zap,
  Globe,
  Database,
  PieChart,
  LineChart,
  BarChart3,
  Map,
  Calendar,
  Download,
  Share2,
  Filter,
  RefreshCw,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  Info,
  Award,
  Layers,
  Network
} from 'lucide-react';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  unit?: string;
  target?: number;
}

interface NetworkInsight {
  id: string;
  type: 'performance' | 'usage' | 'efficiency' | 'growth';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  pharmacies_involved: string[];
  metric_change: number;
}

interface HeatmapData {
  pharmacy_id: string;
  pharmacy_name: string;
  activity_score: number;
  collaboration_score: number;
  efficiency_score: number;
  overall_score: number;
}

interface TimeSeriesData {
  timestamp: string;
  messages: number;
  active_users: number;
  collaborations: number;
  response_time: number;
}

const NetworkAdvancedAnalytics = () => {
  const { pharmacies, loading } = useNetworkMessaging();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<NetworkInsight[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = () => {
    // Métriques analytiques
    const mockMetrics: AnalyticsMetric[] = [
      {
        id: '1',
        name: 'Messages échangés',
        value: 1247,
        change: 15.3,
        trend: 'up',
        category: 'communication',
        unit: 'messages',
        target: 1500
      },
      {
        id: '2',
        name: 'Temps de réponse moyen',
        value: 2.4,
        change: -8.7,
        trend: 'down',
        category: 'performance',
        unit: 'minutes',
        target: 3
      },
      {
        id: '3',
        name: 'Collaborations actives',
        value: 23,
        change: 21.1,
        trend: 'up',
        category: 'collaboration',
        unit: 'projets'
      },
      {
        id: '4',
        name: 'Taux d\'engagement',
        value: 87.2,
        change: 5.4,
        trend: 'up',
        category: 'engagement',
        unit: '%',
        target: 90
      },
      {
        id: '5',
        name: 'Efficacité réseau',
        value: 94.1,
        change: 2.8,
        trend: 'up',
        category: 'efficiency',
        unit: '%',
        target: 95
      },
      {
        id: '6',
        name: 'Utilisateurs actifs',
        value: 156,
        change: 12.7,
        trend: 'up',
        category: 'users',
        unit: 'utilisateurs'
      }
    ];

    // Insights analytiques
    const mockInsights: NetworkInsight[] = [
      {
        id: '1',
        type: 'performance',
        title: 'Amélioration significative du temps de réponse',
        description: 'Le temps de réponse moyen a diminué de 8.7% grâce à l\'optimisation des canaux de communication',
        impact: 'positive',
        confidence: 0.92,
        pharmacies_involved: ['pharmacy-1', 'pharmacy-2'],
        metric_change: -8.7
      },
      {
        id: '2',
        type: 'usage',
        title: 'Pic d\'utilisation en fin de journée',
        description: 'L\'activité réseau augmente de 40% entre 17h et 19h, optimal pour les communications urgentes',
        impact: 'neutral',
        confidence: 0.87,
        pharmacies_involved: ['pharmacy-1', 'pharmacy-2', 'pharmacy-3'],
        metric_change: 40
      },
      {
        id: '3',
        type: 'efficiency',
        title: 'Optimisation des collaborations',
        description: 'Les projets collaboratifs montrent une efficacité accrue de 25% avec les nouveaux outils',
        impact: 'positive',
        confidence: 0.95,
        pharmacies_involved: ['pharmacy-2', 'pharmacy-3'],
        metric_change: 25
      }
    ];

    // Données heatmap
    const mockHeatmapData: HeatmapData[] = pharmacies.map((pharmacy, index) => ({
      pharmacy_id: pharmacy.id,
      pharmacy_name: pharmacy.name,
      activity_score: 70 + Math.random() * 30,
      collaboration_score: 65 + Math.random() * 35,
      efficiency_score: 75 + Math.random() * 25,
      overall_score: 70 + Math.random() * 30
    }));

    // Données temporelles
    const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: 7 }, (_, i) => ({
      timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      messages: 150 + Math.floor(Math.random() * 100),
      active_users: 20 + Math.floor(Math.random() * 15),
      collaborations: 3 + Math.floor(Math.random() * 5),
      response_time: 2 + Math.random() * 2
    }));

    setMetrics(mockMetrics);
    setInsights(mockInsights);
    setHeatmapData(mockHeatmapData);
    setTimeSeriesData(mockTimeSeriesData);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-muted-foreground" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'neutral': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            Analytics Réseau Avancées
          </h1>
          <p className="text-muted-foreground">
            Analyses approfondies et intelligence business du réseau multi-officines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques clés */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.slice(0, 6).map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${
                  metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% vs période précédente
                </p>
                {metric.target && (
                  <div className="text-xs text-muted-foreground">
                    Cible: {metric.target}{metric.unit}
                  </div>
                )}
              </div>
              {metric.target && (
                <Progress 
                  value={(metric.value / metric.target) * 100} 
                  className="mt-2 h-2"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="heatmap">Carte de chaleur</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Évolution temporelle
                </CardTitle>
                <CardDescription>
                  Tendances clés sur la période sélectionnée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeSeriesData.slice(-3).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {new Date(data.timestamp).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.messages} messages • {data.active_users} utilisateurs
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{data.collaborations} projets</div>
                        <div className="text-xs text-muted-foreground">
                          {data.response_time.toFixed(1)}min réponse
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition des activités
                </CardTitle>
                <CardDescription>
                  Distribution des types d'interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm">Messages directs</span>
                    </div>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Collaborations</span>
                    </div>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Partage documents</span>
                    </div>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">IA Assistant</span>
                    </div>
                    <span className="font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Métriques de Performance
              </CardTitle>
              <CardDescription>
                Analyse détaillée des performances du réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {metrics.filter(m => m.category === 'performance' || m.category === 'efficiency').map((metric) => (
                  <div key={metric.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{metric.name}</h4>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {metric.value}{metric.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.change > 0 ? '+' : ''}{metric.change}% vs période précédente
                    </div>
                    {metric.target && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progression</span>
                          <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                        </div>
                        <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collaboration */}
        <TabsContent value="collaboration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Analytics de Collaboration
              </CardTitle>
              <CardDescription>
                Mesure de l'efficacité collaborative du réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Projets collaboratifs actifs</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Formation continue</span>
                        <Badge>3 officines</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Optimisation stocks</span>
                        <Badge>2 officines</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Audit qualité</span>
                        <Badge>4 officines</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Engagement par officine</h4>
                    <div className="space-y-3">
                      {pharmacies.slice(0, 3).map((pharmacy) => (
                        <div key={pharmacy.id} className="flex items-center justify-between">
                          <span className="text-sm">{pharmacy.name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={70 + Math.random() * 30} className="w-16 h-2" />
                            <span className="text-xs">{Math.round(70 + Math.random() * 30)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Tendances de collaboration</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+23%</div>
                      <div className="text-sm text-muted-foreground">Nouvelles collaborations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">87%</div>
                      <div className="text-sm text-muted-foreground">Taux de completion</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">4.2/5</div>
                      <div className="text-sm text-muted-foreground">Satisfaction moyenne</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carte de chaleur */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Carte de Chaleur du Réseau
              </CardTitle>
              <CardDescription>
                Visualisation des performances par officine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3">
                  {heatmapData.map((data) => (
                    <div key={data.pharmacy_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{data.pharmacy_name}</h4>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getScoreColor(data.overall_score)}`}></div>
                          <span className="text-sm font-medium">{data.overall_score.toFixed(1)}/100</span>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Activité</span>
                            <span>{data.activity_score.toFixed(1)}%</span>
                          </div>
                          <Progress value={data.activity_score} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Collaboration</span>
                            <span>{data.collaboration_score.toFixed(1)}%</span>
                          </div>
                          <Progress value={data.collaboration_score} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Efficacité</span>
                            <span>{data.efficiency_score.toFixed(1)}%</span>
                          </div>
                          <Progress value={data.efficiency_score} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Insights et Recommandations
              </CardTitle>
              <CardDescription>
                Analyses intelligentes et recommandations d'optimisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getImpactIcon(insight.impact)}
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {insight.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {insight.metric_change > 0 ? '+' : ''}{insight.metric_change}%
                        </div>
                        <div className="text-muted-foreground">
                          Confiance: {Math.round(insight.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{insight.pharmacies_involved.length} officines concernées</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                        <Button size="sm">
                          <Award className="h-4 w-4 mr-2" />
                          Appliquer
                        </Button>
                      </div>
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

export default NetworkAdvancedAnalytics;