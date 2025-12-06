import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Download,
  Clock,
  Award,
  XCircle
} from 'lucide-react';
import { useIntelligentDiagnostic } from '@/hooks/useIntelligentDiagnostic';
import InvestigateAnomalyDialog from './dialogs/InvestigateAnomalyDialog';
import AnalyzeBottleneckDialog from './dialogs/AnalyzeBottleneckDialog';
import ActionPlanDialog from './dialogs/ActionPlanDialog';
import DiagnosticReportDialog from './dialogs/DiagnosticReportDialog';
import type { Anomaly, Bottleneck } from '@/hooks/useIntelligentDiagnostic';

const IntelligentDiagnostic = () => {
  const {
    loading,
    diagnosticRunning,
    latestSession,
    anomalies,
    bottlenecks,
    runDiagnostic,
    investigateAnomaly,
    resolveAnomaly,
    dismissAnomaly,
    analyzeBottleneck,
    planAction,
    resolveBottleneck,
    getLastScanTime
  } = useIntelligentDiagnostic();

  // Dialog states
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [investigateDialogOpen, setInvestigateDialogOpen] = useState(false);
  const [selectedBottleneck, setSelectedBottleneck] = useState<Bottleneck | null>(null);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [actionPlanDialogOpen, setActionPlanDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Derived data
  const performanceAnalysis = latestSession ? {
    globalScore: latestSession.global_score,
    trends: [
      {
        category: 'Ventes',
        score: latestSession.sales_score,
        trend: latestSession.sales_trend,
        status: latestSession.sales_status,
        details: latestSession.sales_details || 'Performance ventes'
      },
      {
        category: 'Stock',
        score: latestSession.stock_score,
        trend: latestSession.stock_trend,
        status: latestSession.stock_status,
        details: latestSession.stock_details || 'Gestion du stock'
      },
      {
        category: 'Marge',
        score: latestSession.margin_score,
        trend: latestSession.margin_trend,
        status: latestSession.margin_status,
        details: latestSession.margin_details || 'Optimisation des marges'
      },
      {
        category: 'Clients',
        score: latestSession.customer_score,
        trend: latestSession.customer_trend,
        status: latestSession.customer_status,
        details: latestSession.customer_details || 'Fidélisation client'
      }
    ]
  } : {
    globalScore: 0,
    trends: []
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'attention': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAnomalyColor = (type: string) => {
    switch (type) {
      case 'critique': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Eye className="h-4 w-4 text-orange-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLevelBadge = (level: string) => {
    switch (level) {
      case 'excellent': return <Badge className="bg-green-50 text-green-600">Excellent</Badge>;
      case 'bon': return <Badge className="bg-blue-50 text-blue-600">Bon niveau</Badge>;
      case 'attention': return <Badge className="bg-orange-50 text-orange-600">Attention requise</Badge>;
      case 'critique': return <Badge className="bg-red-50 text-red-600">Critique</Badge>;
      default: return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const handleInvestigateClick = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setInvestigateDialogOpen(true);
  };

  const handleAnalyzeClick = (bottleneck: Bottleneck) => {
    setSelectedBottleneck(bottleneck);
    setAnalyzeDialogOpen(true);
  };

  const handlePlanActionClick = (bottleneck: Bottleneck) => {
    setSelectedBottleneck(bottleneck);
    setAnalyzeDialogOpen(true);
  };

  // Filter active items
  const activeAnomalies = anomalies.filter(a => a.status !== 'resolved' && a.status !== 'dismissed');
  const activeBottlenecks = bottlenecks.filter(b => b.status !== 'resolved');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Diagnostic Intelligent</h2>
          <p className="text-muted-foreground">
            Analyse automatisée de la performance et détection d'anomalies
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Dernière analyse: {getLastScanTime()}
          </div>
          <Button onClick={runDiagnostic} disabled={diagnosticRunning}>
            {diagnosticRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {diagnosticRunning ? 'Analyse en cours...' : 'Lancer Diagnostic'}
          </Button>
        </div>
      </div>

      {/* Score Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Score de Performance Globale
          </CardTitle>
          <CardDescription>Évaluation IA de la santé globale de votre pharmacie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-primary">
                {latestSession ? `${latestSession.global_score}/100` : '--/100'}
              </div>
              <p className="text-sm text-muted-foreground">Score d'excellence</p>
            </div>
            <div className="text-right">
              {latestSession ? getStatusLevelBadge(latestSession.status_level) : <Badge variant="secondary">Aucun diagnostic</Badge>}
              <p className="text-sm text-muted-foreground mt-2">
                Potentiel d'amélioration: {latestSession?.improvement_potential || '--'} points
              </p>
            </div>
          </div>
          <Progress value={performanceAnalysis.globalScore} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalies
            {activeAnomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2">{activeAnomalies.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bottlenecks">
            Goulots
            {activeBottlenecks.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeBottlenecks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse Performance par Secteur
              </CardTitle>
              <CardDescription>Évaluation détaillée de chaque domaine d'activité</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceAnalysis.trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun diagnostic disponible</p>
                  <p className="text-sm">Lancez un diagnostic pour voir l'analyse par secteur</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {performanceAnalysis.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trend.score}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div>
                          <h4 className="font-semibold">{trend.category}</h4>
                          <p className="text-sm text-muted-foreground">{trend.details}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(trend.status)}>
                          {trend.status === 'excellent' ? 'Excellent' :
                           trend.status === 'good' ? 'Bon' :
                           trend.status === 'warning' ? 'Attention' : 'Critique'}
                        </Badge>
                        <div className="text-sm font-medium mt-1">{trend.trend}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Détection d'Anomalies IA
              </CardTitle>
              <CardDescription>Patterns inhabituels identifiés automatiquement</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                  <p>Aucune anomalie détectée</p>
                  <p className="text-sm">Votre pharmacie fonctionne normalement</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className={`p-4 border rounded-lg ${getAnomalyColor(anomaly.type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {anomaly.type === 'critique' ? 'Critique' :
                             anomaly.type === 'warning' ? 'Attention' : 'Information'}
                          </Badge>
                          <span className="text-xs">Confiance: {anomaly.confidence}%</span>
                          {anomaly.status !== 'detected' && (
                            <Badge variant="secondary" className="text-xs">
                              {anomaly.status === 'investigating' ? 'Investigation' :
                               anomaly.status === 'resolved' ? 'Résolue' : 'Ignorée'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(anomaly.detected_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-2">{anomaly.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{anomaly.description}</p>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Suggestions d'action:</h5>
                        <ul className="space-y-1">
                          {anomaly.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1 h-1 bg-current rounded-full"></div>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <Progress value={anomaly.confidence} className="w-24 h-2" />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleInvestigateClick(anomaly)}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          {anomaly.status === 'detected' ? 'Investiguer' : 'Voir détails'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Goulots d'Étranglement
              </CardTitle>
              <CardDescription>Obstacles limitant la performance identifiés par l'IA</CardDescription>
            </CardHeader>
            <CardContent>
              {bottlenecks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun goulot d'étranglement identifié</p>
                  <p className="text-sm">Les processus fonctionnent de manière optimale</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bottlenecks.map((bottleneck) => (
                    <div key={bottleneck.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getSeverityIcon(bottleneck.severity)}
                          <div>
                            <h4 className="font-semibold">{bottleneck.area}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">Priorité {bottleneck.priority}</Badge>
                              <Badge className={`${
                                bottleneck.severity === 'high' ? 'bg-red-50 text-red-600' :
                                bottleneck.severity === 'medium' ? 'bg-orange-50 text-orange-600' :
                                'bg-green-50 text-green-600'
                              }`}>
                                {bottleneck.severity === 'high' ? 'Élevé' :
                                 bottleneck.severity === 'medium' ? 'Moyen' : 'Faible'}
                              </Badge>
                              {bottleneck.status !== 'identified' && (
                                <Badge variant="secondary">
                                  {bottleneck.status === 'analyzing' ? 'Analyse' :
                                   bottleneck.status === 'action_planned' ? 'Planifié' : 'Résolu'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{bottleneck.description}</p>
                      <p className="text-sm font-medium text-orange-600 mb-3">Impact: {bottleneck.impact}</p>
                      
                      {bottleneck.recommended_solution && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <h5 className="text-sm font-medium text-blue-800 mb-1">Solution recommandée:</h5>
                          <p className="text-sm text-blue-700">{bottleneck.recommended_solution}</p>
                        </div>
                      )}

                      {bottleneck.action_plan && (
                        <div className="bg-green-50 p-3 rounded border border-green-200 mt-2">
                          <h5 className="text-sm font-medium text-green-800 mb-1">Plan d'action:</h5>
                          <p className="text-sm text-green-700">{bottleneck.action_plan}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAnalyzeClick(bottleneck)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Analyser
                        </Button>
                        {bottleneck.status !== 'resolved' && (
                          <Button 
                            size="sm"
                            onClick={() => handlePlanActionClick(bottleneck)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Planifier Action
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analyse des Tendances
              </CardTitle>
              <CardDescription>Patterns et évolutions détectées par l'intelligence artificielle</CardDescription>
            </CardHeader>
            <CardContent>
              {!latestSession ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune analyse de tendances disponible</p>
                  <p className="text-sm">Lancez un diagnostic pour voir les tendances</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Tendances Positives</h4>
                      <ul className="space-y-2 text-sm text-green-700">
                        {latestSession.positive_trends.map((trend, index) => (
                          <li key={index}>• {trend.text}</li>
                        ))}
                        {latestSession.positive_trends.length === 0 && (
                          <li className="italic">Aucune tendance positive détectée</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                      <h4 className="font-semibold text-orange-800 mb-2">Points d'Attention</h4>
                      <ul className="space-y-2 text-sm text-orange-700">
                        {latestSession.attention_points.map((point, index) => (
                          <li key={index}>• {point.text}</li>
                        ))}
                        {latestSession.attention_points.length === 0 && (
                          <li className="italic">Aucun point d'attention</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-4">
                    <Button variant="outline" onClick={() => setReportDialogOpen(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter Rapport
                    </Button>
                    <Button onClick={() => setActionPlanDialogOpen(true)}>
                      <Target className="h-4 w-4 mr-2" />
                      Plan d'Action
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvestigateAnomalyDialog
        open={investigateDialogOpen}
        onOpenChange={setInvestigateDialogOpen}
        anomaly={selectedAnomaly}
        onInvestigate={investigateAnomaly}
        onResolve={resolveAnomaly}
        onDismiss={dismissAnomaly}
      />

      <AnalyzeBottleneckDialog
        open={analyzeDialogOpen}
        onOpenChange={setAnalyzeDialogOpen}
        bottleneck={selectedBottleneck}
        onAnalyze={analyzeBottleneck}
        onPlanAction={planAction}
        onResolve={resolveBottleneck}
      />

      <ActionPlanDialog
        open={actionPlanDialogOpen}
        onOpenChange={setActionPlanDialogOpen}
        bottlenecks={bottlenecks}
        pharmacyName="PharmaSoft"
      />

      <DiagnosticReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        session={latestSession}
        anomalies={anomalies}
        bottlenecks={bottlenecks}
        pharmacyName="PharmaSoft"
      />
    </div>
  );
};

export default IntelligentDiagnostic;
