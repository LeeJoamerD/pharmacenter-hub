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
  Network,
  Plus,
  Lightbulb,
  X
} from 'lucide-react';
import { useNetworkAdvancedAnalytics } from '@/hooks/useNetworkAdvancedAnalytics';
import AnalyticsInsightDialog from './dialogs/AnalyticsInsightDialog';
import AnalyticsExportDialog from './dialogs/AnalyticsExportDialog';
import { toast } from 'sonner';

const NetworkAdvancedAnalytics = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const {
    loading,
    metrics,
    insights,
    heatmapData,
    timeSeriesData,
    activityDistribution,
    collaborationStats,
    loadMetrics,
    loadInsights,
    loadHeatmapData,
    loadTimeSeriesData,
    loadActivityDistribution,
    loadCollaborationStats,
    refreshAllData,
    applyInsight,
    dismissInsight,
    generateInsights
  } = useNetworkAdvancedAnalytics();

  // Charger les données au montage et lors du changement de période
  useEffect(() => {
    loadAllData();
  }, [selectedTimeframe]);

  const loadAllData = async () => {
    await Promise.all([
      loadMetrics(selectedTimeframe),
      loadInsights(),
      loadHeatmapData(),
      loadTimeSeriesData(selectedTimeframe),
      loadActivityDistribution(),
      loadCollaborationStats()
    ]);
  };

  const handleRefresh = async () => {
    toast.info('Actualisation des données...');
    await refreshAllData(selectedTimeframe);
    toast.success('Données actualisées');
  };

  const handleApplyInsight = async (insightId: string) => {
    await applyInsight(insightId);
    toast.success('Insight appliqué avec succès');
  };

  const handleDismissInsight = async (insightId: string) => {
    await dismissInsight(insightId);
    toast.success('Insight ignoré');
  };

  const handleGenerateInsights = async () => {
    toast.info('Génération des insights en cours...');
    await generateInsights();
    toast.success('Nouveaux insights générés');
  };

  const handleViewInsightDetails = (insight: any) => {
    setSelectedInsight(insight);
    setInsightDialogOpen(true);
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

  const getImpactBadgeVariant = (impact: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (impact) {
      case 'positive': return 'default';
      case 'negative': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading && metrics.length === 0) {
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
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setExportDialogOpen(true)}>
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
                {typeof metric.value === 'number' ? metric.value.toLocaleString('fr-FR') : metric.value}
                {metric.unit && <span className="text-sm font-normal ml-1">{metric.unit}</span>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${
                  metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% vs période précédente
                </p>
                {metric.target && (
                  <div className="text-xs text-muted-foreground">
                    Cible: {metric.target}{metric.unit}
                  </div>
                )}
              </div>
              {metric.target && (
                <Progress 
                  value={Math.min((metric.value / metric.target) * 100, 100)} 
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
                  {timeSeriesData.length > 0 ? (
                    timeSeriesData.slice(-5).map((data, index) => (
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <LineChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune donnée temporelle disponible</p>
                    </div>
                  )}
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
                  {activityDistribution.length > 0 ? (
                    activityDistribution.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: activity.color || 'hsl(var(--primary))' }}
                          ></div>
                          <span className="text-sm">{activity.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={activity.percentage} className="w-20 h-2" />
                          <span className="font-medium text-sm w-12 text-right">{activity.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
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
                    </>
                  )}
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
                {metrics
                  .filter(m => m.category === 'performance' || m.category === 'efficiency')
                  .map((metric) => (
                    <div key={metric.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{metric.name}</h4>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {typeof metric.value === 'number' ? metric.value.toLocaleString('fr-FR') : metric.value}
                        {metric.unit && <span className="text-sm font-normal ml-1">{metric.unit}</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% vs période précédente
                      </div>
                      {metric.target && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progression</span>
                            <span>{Math.round(Math.min((metric.value / metric.target) * 100, 100))}%</span>
                          </div>
                          <Progress value={Math.min((metric.value / metric.target) * 100, 100)} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                {metrics.filter(m => m.category === 'performance' || m.category === 'efficiency').length === 0 && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune métrique de performance disponible</p>
                  </div>
                )}
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
                      {collaborationStats.activeProjects && collaborationStats.activeProjects.length > 0 ? (
                        collaborationStats.activeProjects.slice(0, 5).map((project: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm truncate flex-1 mr-2">{project.name}</span>
                            <Badge variant="secondary">{project.participant_count || project.participants} officines</Badge>
                          </div>
                        ))
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Engagement par officine</h4>
                    <div className="space-y-3">
                      {collaborationStats.pharmacyEngagement && collaborationStats.pharmacyEngagement.length > 0 ? (
                        collaborationStats.pharmacyEngagement.slice(0, 5).map((pharmacy: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm truncate flex-1 mr-2">{pharmacy.name}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={pharmacy.engagement_score} className="w-16 h-2" />
                              <span className="text-xs w-10 text-right">{pharmacy.engagement_score.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune donnée d'engagement</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Tendances de collaboration</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        (collaborationStats.trends?.new_collaborations || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(collaborationStats.trends?.new_collaborations || 0) >= 0 ? '+' : ''}
                        {collaborationStats.trends?.new_collaborations?.toFixed(0) || 23}%
                      </div>
                      <div className="text-sm text-muted-foreground">Nouvelles collaborations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {collaborationStats.trends?.completion_rate?.toFixed(0) || 87}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taux de completion</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {collaborationStats.trends?.average_satisfaction?.toFixed(1) || '4.2'}/5
                      </div>
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
                {heatmapData.length > 0 ? (
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
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucune donnée de carte de chaleur</p>
                    <p className="text-sm">Les données seront disponibles une fois les pharmacies actives</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Insights et Recommandations
                </CardTitle>
                <CardDescription>
                  Analyses intelligentes et recommandations d'optimisation
                </CardDescription>
              </div>
              <Button onClick={handleGenerateInsights} variant="outline" size="sm">
                <Lightbulb className="h-4 w-4 mr-2" />
                Générer des insights
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight) => (
                    <div key={insight.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getImpactIcon(insight.impact)}
                          <div>
                            <h4 className="font-medium">{insight.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {insight.type}
                              </Badge>
                              <Badge variant={getImpactBadgeVariant(insight.impact)} className="text-xs">
                                {insight.impact === 'positive' ? 'Positif' : 
                                 insight.impact === 'negative' ? 'Négatif' : 'Neutre'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className={`font-medium ${
                            insight.metric_change > 0 ? 'text-green-600' : 
                            insight.metric_change < 0 ? 'text-red-600' : ''
                          }`}>
                            {insight.metric_change > 0 ? '+' : ''}{insight.metric_change.toFixed(1)}%
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
                          <span className="text-sm">
                            {insight.pharmacies_involved?.length || 0} officines concernées
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewInsightDetails(insight)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          {!insight.is_applied && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDismissInsight(insight.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleApplyInsight(insight.id)}
                              >
                                <Award className="h-4 w-4 mr-2" />
                                Appliquer
                              </Button>
                            </>
                          )}
                          {insight.is_applied && (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Appliqué
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucun insight disponible</p>
                    <p className="text-sm mb-4">Cliquez sur "Générer des insights" pour analyser les données du réseau</p>
                    <Button onClick={handleGenerateInsights}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Générer des insights
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AnalyticsInsightDialog
        open={insightDialogOpen}
        onOpenChange={setInsightDialogOpen}
        insight={selectedInsight}
        onApply={handleApplyInsight}
        onDismiss={handleDismissInsight}
      />

      <AnalyticsExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        metrics={metrics}
        insights={insights}
        heatmapData={heatmapData}
        timeSeriesData={timeSeriesData}
        timeframe={selectedTimeframe}
      />
    </div>
  );
};

export default NetworkAdvancedAnalytics;
