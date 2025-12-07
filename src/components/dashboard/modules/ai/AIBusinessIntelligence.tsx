import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Target,
  TrendingUp,
  Users,
  Zap,
  Eye,
  Activity,
  Lightbulb,
  RefreshCw,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Award,
  Cpu,
  MessageSquare,
  Plus
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { BIConfigDialog } from './dialogs/BIConfigDialog';
import { PredictionDetailDialog } from './dialogs/PredictionDetailDialog';
import { PatternDetailDialog } from './dialogs/PatternDetailDialog';
import { SegmentDetailDialog } from './dialogs/SegmentDetailDialog';
import { OptimizationDetailDialog } from './dialogs/OptimizationDetailDialog';
import { AIBIConsultationDialog } from './dialogs/AIBIConsultationDialog';
import { toast } from 'sonner';

const AIBusinessIntelligence = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState('predictive');
  
  // Hook principal avec données réelles
  const {
    metrics,
    predictions,
    patterns,
    segments,
    processOptimizations,
    config,
    loading,
    loadMetrics,
    loadPredictions,
    loadPatterns,
    loadSegments,
    loadProcessOptimizations,
    loadConfig,
    runFullAnalysis,
    runPredictiveAnalysis,
    discoverPatterns,
    exploitPattern,
    deletePattern,
    createSegment,
    updateSegment,
    deleteSegment,
    implementOptimization,
    rejectOptimization,
    saveConfig,
    exportReport,
    consultAI
  } = useBusinessIntelligence();

  const { formatAmount } = useCurrencyFormatting();

  // États pour les dialogs
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false);
  const [consultationType, setConsultationType] = useState<'predictive' | 'pattern_discovery' | 'segmentation' | 'optimization'>('predictive');
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [selectedOptimization, setSelectedOptimization] = useState<any>(null);

  // Charger les données au montage
  useEffect(() => {
    loadMetrics();
    loadPredictions();
    loadPatterns();
    loadSegments();
    loadProcessOptimizations();
    loadConfig();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      await runFullAnalysis();
      toast.success('Analyse complète terminée');
    } catch (error) {
      toast.error('Erreur lors de l\'analyse');
    }
  };

  const handleExploitPattern = async (patternId: string) => {
    try {
      await exploitPattern(patternId);
      toast.success('Pattern marqué comme exploité');
    } catch (error) {
      toast.error('Erreur lors de l\'exploitation du pattern');
    }
  };

  const handleImplementOptimization = async (optimizationId: string) => {
    try {
      await implementOptimization(optimizationId);
      toast.success('Optimisation implémentée');
    } catch (error) {
      toast.error('Erreur lors de l\'implémentation');
    }
  };

  const handleExport = async (type: 'predictions' | 'patterns' | 'segments' | 'optimizations' | 'full', format: 'pdf' | 'excel') => {
    try {
      await exportReport(type, format);
      toast.success(`Export ${format.toUpperCase()} généré`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': 
      case 'Élevé': return 'text-red-600 bg-red-50';
      case 'medium':
      case 'Moyen': return 'text-orange-600 bg-orange-50';
      case 'low':
      case 'Faible': return 'text-blue-600 bg-blue-50';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
      case 'Facile': return 'bg-green-50 text-green-600';
      case 'medium':
      case 'Moyen': return 'bg-orange-50 text-orange-600';
      case 'hard':
      case 'Difficile': return 'bg-red-50 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Grouper les prédictions par segment pour l'affichage
  const groupedPredictions = predictions.reduce((acc, pred) => {
    const segment = pred.segment || 'Non classé';
    if (!acc[segment]) {
      acc[segment] = {
        segment,
        totalClients: 0,
        riskHigh: 0,
        riskMedium: 0,
        riskLow: 0,
        totalLTV: 0,
        predictions: []
      };
    }
    acc[segment].totalClients++;
    acc[segment].totalLTV += pred.predicted_value || 0;
    if (pred.risk_level === 'high') acc[segment].riskHigh++;
    else if (pred.risk_level === 'medium') acc[segment].riskMedium++;
    else acc[segment].riskLow++;
    acc[segment].predictions.push(pred);
    return acc;
  }, {} as Record<string, any>);

  const predictionSegments = Object.values(groupedPredictions).map((group: any) => ({
    ...group,
    averageLTV: group.totalClients > 0 ? Math.round(group.totalLTV / group.totalClients) : 0,
    retentionRate: group.totalClients > 0 
      ? Math.round((group.riskLow / group.totalClients) * 100 * 10) / 10 
      : 0
  }));

  // Préparer les données pour le PieChart des segments
  const segmentChartData = segments.map(seg => ({
    name: seg.segment_name,
    value: seg.size || 0,
    color: seg.color || '#6b7280'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence Avancée</h2>
          <p className="text-muted-foreground">
            IA pour insights business et optimisation des performances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="predictive">Analytics Prédictives</SelectItem>
              <SelectItem value="patterns">Découverte Patterns</SelectItem>
              <SelectItem value="segmentation">Segmentation Auto</SelectItem>
              <SelectItem value="optimization">Optimisation Processus</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setConsultationDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Consulter IA
          </Button>
          <Button variant="outline" onClick={() => handleExport('full', 'pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={() => setConfigDialogOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={handleRunAnalysis} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Analyse...' : 'Analyser'}
          </Button>
        </div>
      </div>

      {/* Métriques BI */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prédiction Attrition</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics?.churn_prediction?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Risque 30 jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Moyenne</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(metrics?.average_ltv || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur vie client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Best Action</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
              {metrics?.next_best_action || 'Aucune recommandation'}
            </div>
            <p className="text-xs text-muted-foreground">
              Recommandation IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Risque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (metrics?.risk_score || 0) < 30 ? 'text-green-600' : 
              (metrics?.risk_score || 0) < 60 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {metrics?.risk_score?.toFixed(1) || 0}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Risque business
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictive">Prédictif</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
        </TabsList>

        {/* Onglet Prédictif */}
        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Analytics Prédictives
                </CardTitle>
                <CardDescription>ML pour prédiction des comportements clients</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={runPredictiveAnalysis} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recalculer
              </Button>
            </CardHeader>
            <CardContent>
              {predictionSegments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune prédiction disponible.</p>
                  <p className="text-sm">Lancez une analyse pour générer des prédictions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {predictionSegments.map((prediction: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">{prediction.segment}</h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{prediction.retentionRate}%</div>
                          <div className="text-sm text-muted-foreground">Rétention</div>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-4 mb-4">
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-lg font-bold">{prediction.totalClients}</div>
                          <div className="text-xs text-muted-foreground">Total clients</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-600">{prediction.riskHigh}</div>
                          <div className="text-xs text-red-700">Risque élevé</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <div className="text-lg font-bold text-orange-600">{prediction.riskMedium}</div>
                          <div className="text-xs text-orange-700">Risque moyen</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">{prediction.riskLow}</div>
                          <div className="text-xs text-green-700">Risque faible</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-muted-foreground">LTV Moyenne: </span>
                          <span className="font-medium">{formatAmount(prediction.averageLTV)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedPrediction(prediction)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          <Button size="sm">
                            <Target className="h-4 w-4 mr-2" />
                            Cibler
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Patterns */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Découverte de Patterns
                </CardTitle>
                <CardDescription>Identification automatique de tendances cachées</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={discoverPatterns} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Découvrir
              </Button>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun pattern découvert.</p>
                  <p className="text-sm">Lancez une découverte pour identifier des tendances.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern, index) => (
                    <div key={pattern.id || index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{pattern.pattern_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(pattern.impact || 'medium')}>
                            {pattern.impact === 'high' ? 'Élevé' : 
                             pattern.impact === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                          <Badge variant="outline">{pattern.discovery_method || 'Auto'}</Badge>
                          {pattern.is_exploited && (
                            <Badge variant="secondary">Exploité</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3 mb-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Confiance:</span>
                          <span className="font-medium ml-2">{pattern.confidence?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Fréquence:</span>
                          <span className="font-medium ml-2">{pattern.frequency || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Actionnable:</span>
                          <span className="font-medium ml-2">
                            {pattern.is_actionable ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Progress value={pattern.confidence || 0} className="w-24 h-2" />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedPattern(pattern)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          {pattern.is_actionable && !pattern.is_exploited && (
                            <Button 
                              size="sm"
                              onClick={() => handleExploitPattern(pattern.id)}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Exploiter Pattern
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Segmentation */}
        <TabsContent value="segmentation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Segmentation Automatique
                  </CardTitle>
                  <CardDescription>Clustering ML des clients</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadSegments} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun segment défini.</p>
                  </div>
                ) : (
                  <>
                    <div className="h-64 w-full mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={segmentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                            nameKey="name"
                          >
                            {segmentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} clients`, 'Taille']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {segments.map((segment, index) => (
                        <div key={segment.id || index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: segment.color || '#6b7280' }}
                            ></div>
                            <span className="font-medium">{segment.segment_name}</span>
                          </div>
                          <span>{segment.size || 0} clients</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails Segments</CardTitle>
                <CardDescription>Caractéristiques et actions recommandées</CardDescription>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun segment à afficher.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {segments.map((segment, index) => (
                      <div 
                        key={segment.id || index} 
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedSegment(segment)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ backgroundColor: segment.color || '#6b7280' }}
                          ></div>
                          <h5 className="font-medium">{segment.segment_name}</h5>
                          <Badge variant="outline">{segment.size || 0}</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">CLV:</span>
                            <span className="font-medium ml-2">{formatAmount(segment.clv || 0)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Action:</span>
                            <span className="font-medium ml-2">{segment.next_action || 'Aucune'}</span>
                          </div>
                          {segment.characteristics && Array.isArray(segment.characteristics) && (
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground mb-1">Caractéristiques:</div>
                              <div className="flex flex-wrap gap-1">
                                {segment.characteristics.slice(0, 3).map((char: string, charIndex: number) => (
                                  <Badge key={charIndex} variant="secondary" className="text-xs">
                                    {char}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Optimisation */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Optimisation des Processus
                </CardTitle>
                <CardDescription>IA pour amélioration opérationnelle</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadProcessOptimizations} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              {processOptimizations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune optimisation suggérée.</p>
                  <p className="text-sm">Lancez une analyse pour générer des suggestions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processOptimizations.map((process, index) => (
                    <div key={process.id || index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">{process.process_name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            (process.improvement_percentage || 0) > 40 ? 'bg-green-50 text-green-600' :
                            (process.improvement_percentage || 0) > 25 ? 'bg-blue-50 text-blue-600' :
                            'bg-orange-50 text-orange-600'
                          }>
                            -{process.improvement_percentage || 0}%
                          </Badge>
                          {process.status === 'implemented' && (
                            <Badge variant="secondary">Implémenté</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-4 mb-4">
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-600">{process.current_time_minutes || 0}min</div>
                          <div className="text-xs text-red-700">Temps actuel</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">{process.optimized_time_minutes || 0}min</div>
                          <div className="text-xs text-green-700">Temps optimisé</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">{process.improvement_percentage || 0}%</div>
                          <div className="text-xs text-blue-700">Amélioration</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-sm font-bold text-purple-600">
                            {process.roi === 'high' ? 'Élevé' : 
                             process.roi === 'medium' ? 'Moyen' : 'Faible'}
                          </div>
                          <div className="text-xs text-purple-700">ROI estimé</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Difficulté:</span>
                          <Badge className={getDifficultyColor(process.difficulty || 'medium')}>
                            {process.difficulty === 'easy' ? 'Facile' : 
                             process.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedOptimization(process)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          {process.status !== 'implemented' && (
                            <Button 
                              size="sm"
                              onClick={() => handleImplementOptimization(process.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Implémenter
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BIConfigDialog 
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        config={config}
        onSave={saveConfig}
      />

      <PredictionDetailDialog
        open={!!selectedPrediction}
        onOpenChange={(open) => !open && setSelectedPrediction(null)}
        prediction={selectedPrediction}
      />

      <PatternDetailDialog
        open={!!selectedPattern}
        onOpenChange={(open) => !open && setSelectedPattern(null)}
        pattern={selectedPattern}
        onExploit={handleExploitPattern}
        onDelete={async (id) => {
          await deletePattern(id);
          setSelectedPattern(null);
        }}
      />

      <SegmentDetailDialog
        open={!!selectedSegment}
        onOpenChange={(open) => !open && setSelectedSegment(null)}
        segment={selectedSegment}
        onUpdate={updateSegment}
        onDelete={deleteSegment}
      />

      <OptimizationDetailDialog
        open={!!selectedOptimization}
        onOpenChange={(open) => !open && setSelectedOptimization(null)}
        optimization={selectedOptimization}
        onImplement={handleImplementOptimization}
        onReject={rejectOptimization}
      />

      <AIBIConsultationDialog
        open={consultationDialogOpen}
        onOpenChange={setConsultationDialogOpen}
        consultationType={consultationType}
        onConsult={consultAI}
      />
    </div>
  );
};

export default AIBusinessIntelligence;
