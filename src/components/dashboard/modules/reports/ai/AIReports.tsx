import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, Target, TrendingUp, AlertTriangle, BarChart3, Activity, Settings,
  Play, Pause, RefreshCw, Eye, CheckCircle, Clock, Users, Package,
  DollarSign, Lightbulb, Bot, Cpu, Database
} from 'lucide-react';
import { useAIReportsEnhanced } from '@/hooks/useAIReportsEnhanced';
import AIConfigurationModal from './modals/AIConfigurationModal';
import ModelSettingsModal from './modals/ModelSettingsModal';
import PredictionDetailModal from './modals/PredictionDetailModal';
import RealTimeAnalysisModal from './modals/RealTimeAnalysisModal';
import { AIModelDisplay, AIPredictionDisplay, RealTimeAnalysisDisplay } from '@/services/AIReportsService';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, AlertTriangle, Target, Package, Users, Brain, Bot, Activity, DollarSign
};

const AIReports = () => {
  const {
    aiModels, predictions, mlMetrics, realTimeAnalyses, insights, dataQuality, config,
    isLoading, isModelsLoading, isPredictionsLoading, isMetricsLoading, isRealTimeLoading, isInsightsLoading, isDataQualityLoading,
    toggleModelStatus, startTraining, updateConfig, applyPrediction, dismissPrediction, refetchAll
  } = useAIReportsEnhanced();

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelDisplay | undefined>();
  const [predictionDetailOpen, setPredictionDetailOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<AIPredictionDisplay | undefined>();
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<RealTimeAnalysisDisplay | undefined>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'training': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const handleModelSettings = (model: AIModelDisplay) => {
    setSelectedModel(model);
    setModelSettingsOpen(true);
  };

  const handlePredictionDetail = (prediction: AIPredictionDisplay) => {
    setSelectedPrediction(prediction);
    setPredictionDetailOpen(true);
  };

  const handleAnalysisDetail = (analysis: RealTimeAnalysisDisplay) => {
    setSelectedAnalysis(analysis);
    setAnalysisModalOpen(true);
  };

  const handleToggleAutoTraining = (checked: boolean) => {
    updateConfig({ autoTrainingEnabled: checked });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligence Artificielle</h2>
          <p className="text-muted-foreground">Analyses prédictives et machine learning avancé</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={config?.autoTrainingEnabled ?? true} 
              onCheckedChange={handleToggleAutoTraining} 
            />
            <span className="text-sm">Auto-training</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchAll()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfigModalOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Statut des Modèles IA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isModelsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : (
          aiModels.slice(0, 4).map((model) => {
            const IconComponent = ICON_MAP[model.icon] || TrendingUp;
            return (
              <Card key={model.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleModelSettings(model)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
                  <div className={`p-2 rounded-lg ${model.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${model.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{model.accuracy}%</div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge className={getStatusColor(model.status)}>{model.status}</Badge>
                    {getStatusIcon(model.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Dernière formation: {model.lastTrained}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="realtime">Temps Réel</TabsTrigger>
          <TabsTrigger value="metrics">Métriques ML</TabsTrigger>
          <TabsTrigger value="models">Modèles</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Prédictions IA Avancées</CardTitle>
              <CardDescription>Analyses prédictives générées par intelligence artificielle</CardDescription>
            </CardHeader>
            <CardContent>
              {isPredictionsLoading ? (
                <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : predictions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune prédiction disponible</p>
              ) : (
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <div key={prediction.id} className={`p-4 border rounded-lg ${getImpactColor(prediction.impact)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{prediction.type}</Badge>
                            <span className="text-xs font-medium">Confiance: {prediction.confidence}%</span>
                          </div>
                          <h4 className="font-semibold">{prediction.title}</h4>
                        </div>
                        <Badge className={getImpactColor(prediction.impact)}>{prediction.impact}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{prediction.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span>Échéance: {prediction.timeframe}</span>
                          <Progress value={prediction.confidence} className="w-20 h-2" />
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handlePredictionDetail(prediction)}>
                          <Lightbulb className="h-4 w-4 mr-2" />{prediction.recommendation.substring(0, 20)}...
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {isRealTimeLoading ? (
              Array(4).fill(0).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>)
            ) : (
              realTimeAnalyses.map((analysis) => {
                const IconComponent = ICON_MAP[analysis.icon] || Activity;
                return (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className={`h-5 w-5 ${analysis.color}`} />{analysis.title}
                      </CardTitle>
                      <CardDescription>Analyse en temps réel</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Statut Actuel</span>
                          <Badge className={analysis.color.includes('green') ? 'bg-green-100 text-green-800' : analysis.color.includes('blue') ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}>
                            {analysis.status}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold">{analysis.score}</p>
                          <p className="text-sm text-muted-foreground">{analysis.trend} vs période précédente</p>
                        </div>
                        <Button size="sm" className="w-full" variant="outline" onClick={() => handleAnalysisDetail(analysis)}>
                          <Eye className="h-4 w-4 mr-2" />Voir Détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Métriques Machine Learning</CardTitle>
              <CardDescription>Performance des modèles IA</CardDescription>
            </CardHeader>
            <CardContent>
              {isMetricsLoading ? (
                <div className="grid gap-4 md:grid-cols-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {mlMetrics.map((metric, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{metric.name}</h4>
                        <span className="text-sm text-green-600">{metric.trend}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
                      </div>
                      <div className="mt-2">
                        <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">Objectif: {metric.target}{metric.unit || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Gestion des Modèles IA</CardTitle>
              <CardDescription>Configuration et entraînement des modèles</CardDescription>
            </CardHeader>
            <CardContent>
              {isModelsLoading ? (
                <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  {aiModels.map((model) => {
                    const IconComponent = ICON_MAP[model.icon] || TrendingUp;
                    return (
                      <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${model.bgColor}`}>
                            <IconComponent className={`h-5 w-5 ${model.color}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{model.name}</h4>
                            <p className="text-sm text-muted-foreground">{model.type} • {model.accuracy}% précision</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(model.status)}>{model.status}</Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            const source = model.id.startsWith('default-') ? 'forecast' : 'learning';
                            if (model.status === 'training') {
                              toggleModelStatus({ modelId: model.id, source });
                            } else {
                              startTraining({ modelId: model.id });
                            }
                          }}>
                            {model.status === 'training' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleModelSettings(model)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />Insights Automatisés</CardTitle>
                <CardDescription>Découvertes générées par IA</CardDescription>
              </CardHeader>
              <CardContent>
                {isInsightsLoading ? (
                  <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div key={insight.id} className={`p-3 border rounded-lg ${insight.color}`}>
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Qualité des Données</CardTitle>
                <CardDescription>Évaluation automatique</CardDescription>
              </CardHeader>
              <CardContent>
                {isDataQualityLoading ? (
                  <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {dataQuality.map((metric) => (
                      <div key={metric.type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{metric.label}</span>
                          <span>{metric.value.toFixed(1)}%</span>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modaux */}
      <AIConfigurationModal 
        open={configModalOpen} 
        onOpenChange={setConfigModalOpen} 
        config={config} 
        onSave={updateConfig} 
      />
      <ModelSettingsModal 
        open={modelSettingsOpen} 
        onOpenChange={setModelSettingsOpen} 
        model={selectedModel}
        onStartTraining={(modelId, epochs) => startTraining({ modelId, epochs })}
        onToggleStatus={(modelId, source) => toggleModelStatus({ modelId, source })}
      />
      <PredictionDetailModal
        open={predictionDetailOpen}
        onOpenChange={setPredictionDetailOpen}
        prediction={selectedPrediction}
        onApply={(id, source) => applyPrediction({ predictionId: id, source })}
        onDismiss={(id, source) => dismissPrediction({ predictionId: id, source })}
      />
      <RealTimeAnalysisModal
        open={analysisModalOpen}
        onOpenChange={setAnalysisModalOpen}
        analysis={selectedAnalysis}
      />
    </div>
  );
};

export default AIReports;
