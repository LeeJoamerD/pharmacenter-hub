import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Package, AlertTriangle, TrendingUp, Settings, Download, RefreshCw,
  ShoppingCart, Tag, RotateCcw, CheckCircle, X, Eye, Zap, Target,
  BarChart3, PieChart, Clock, Banknote
} from 'lucide-react';
import { useAIStockManagement, type AIStockSuggestion } from '@/hooks/useAIStockManagement';
import type { StockPrediction } from '@/hooks/useAdvancedForecasting';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Dialogs
import AIStockPredictionDetailDialog from './dialogs/AIStockPredictionDetailDialog';
import AIStockSuggestionDialog from './dialogs/AIStockSuggestionDialog';
import AIStockAnalysisDialog from './dialogs/AIStockAnalysisDialog';
import AIStockConfigDialog from './dialogs/AIStockConfigDialog';

// Export utils
import { 
  exportPredictionsToPDF, 
  exportPredictionsToExcel,
  exportSuggestionsToPDF,
  exportSuggestionsToExcel,
  exportOptimizationReportPDF 
} from '@/utils/aiStockExportUtils';

const PRIORITY_COLORS = {
  critical: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e'
};

const AIStockManagement: React.FC = () => {
  const { formatAmount } = useCurrencyFormatting();
  const {
    loading,
    analyzing,
    metrics,
    predictions,
    suggestions,
    config,
    priorityFilter,
    setPriorityFilter,
    typeFilter,
    setTypeFilter,
    loadAllData,
    runAnalysis,
    createOrderFromPrediction,
    dismissPrediction,
    applySuggestion,
    ignoreSuggestion,
    saveConfig
  } = useAIStockManagement();

  // Dialog states
  const [selectedPrediction, setSelectedPrediction] = useState<StockPrediction | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIStockSuggestion | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Handle analysis
  const handleRunAnalysis = async () => {
    setShowAnalysisDialog(true);
    const result = await runAnalysis();
    setAnalysisResult(result);
  };

  // Prepare chart data
  const priorityDistributionData = [
    { name: 'Critique', value: metrics.priority_distribution.critical, color: PRIORITY_COLORS.critical },
    { name: 'Moyen', value: metrics.priority_distribution.medium, color: PRIORITY_COLORS.medium },
    { name: 'Faible', value: metrics.priority_distribution.low, color: PRIORITY_COLORS.low }
  ].filter(d => d.value > 0);

  const suggestionsByType = [
    { type: 'Réappro', count: suggestions.filter(s => s.type === 'reorder').length },
    { type: 'Promotion', count: suggestions.filter(s => s.type === 'promotion').length },
    { type: 'FIFO', count: suggestions.filter(s => s.type === 'fifo_correction').length }
  ];

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive/20 text-destructive',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    const labels: Record<string, string> = {
      critical: 'Critique',
      high: 'Élevée',
      medium: 'Moyen',
      low: 'Faible'
    };
    return <Badge className={colors[priority] || 'bg-muted'}>{labels[priority] || priority}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reorder': return <ShoppingCart className="h-4 w-4 text-primary" />;
      case 'promotion': return <Tag className="h-4 w-4 text-orange-500" />;
      case 'fifo_correction': return <RotateCcw className="h-4 w-4 text-destructive" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Gestion Intelligente des Stocks
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimisation et prédictions IA pour votre inventaire
          </p>
          {metrics.last_analysis_at && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Dernière analyse: {format(new Date(metrics.last_analysis_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button variant="outline" onClick={() => exportOptimizationReportPDF(metrics, predictions, suggestions)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleRunAnalysis} disabled={analyzing}>
            {analyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Analyser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Optimisation</p>
                <p className={`text-3xl font-bold ${
                  metrics.optimization_score >= 70 ? 'text-green-600' :
                  metrics.optimization_score >= 40 ? 'text-orange-500' : 'text-destructive'
                }`}>
                  {metrics.optimization_score}%
                </p>
              </div>
              <Target className="h-8 w-8 text-primary/20" />
            </div>
            <Progress value={metrics.optimization_score} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prédictions Actives</p>
                <p className="text-3xl font-bold">{metrics.active_predictions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes Critiques</p>
                <p className={`text-3xl font-bold ${metrics.critical_alerts > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {metrics.critical_alerts}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suggestions</p>
                <p className="text-3xl font-bold">{metrics.pending_suggestions}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Économies</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(metrics.total_savings)}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
          <TabsTrigger value="alerts">Alertes IA</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribution des Priorités
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priorityDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={priorityDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {priorityDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Aucune prédiction active
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggestions by Type Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Suggestions par Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={suggestionsByType}>
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{metrics.products_analyzed}</p>
                  <p className="text-sm text-muted-foreground">Produits analysés</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.expiring_products}</p>
                  <p className="text-sm text-muted-foreground">Expirations proches</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{metrics.low_stock_count}</p>
                  <p className="text-sm text-muted-foreground">Stock faible</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.fifo_violations}</p>
                  <p className="text-sm text-muted-foreground">Violations FIFO</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportPredictionsToExcel(predictions)}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPredictionsToPDF(predictions)}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Produit</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Stock</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Demande/jour</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Jours</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Priorité</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Confiance</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {predictions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Aucune prédiction. Lancez une analyse pour générer des prédictions.
                        </td>
                      </tr>
                    ) : (
                      predictions.map((prediction) => (
                        <tr key={prediction.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{prediction.product_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{prediction.product_code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{prediction.current_stock}</td>
                          <td className="px-4 py-3 text-center">{prediction.predicted_demand_daily?.toFixed(1) || 0}</td>
                          <td className={`px-4 py-3 text-center font-bold ${
                            prediction.days_until_stockout <= 3 ? 'text-destructive' :
                            prediction.days_until_stockout <= 7 ? 'text-orange-500' : ''
                          }`}>
                            {prediction.days_until_stockout}
                          </td>
                          <td className="px-4 py-3 text-center">{getPriorityBadge(prediction.priority)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={prediction.confidence} className="w-16 h-2" />
                              <span className="text-xs">{prediction.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setSelectedPrediction(prediction)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!prediction.order_created && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => createOrderFromPrediction(prediction.id)}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => dismissPrediction(prediction.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="reorder">Réapprovisionnement</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="fifo_correction">Correction FIFO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportSuggestionsToExcel(suggestions)}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportSuggestionsToPDF(suggestions)}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {suggestions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Aucune suggestion disponible. Lancez une analyse pour générer des suggestions.
              </Card>
            ) : (
              suggestions.map((suggestion, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          {getTypeIcon(suggestion.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{suggestion.product_name}</h3>
                          <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                          <div className="flex gap-2 mt-2">
                            {getPriorityBadge(suggestion.priority)}
                            <Badge variant="outline">
                              {suggestion.type === 'reorder' ? 'Réappro' : 
                               suggestion.type === 'promotion' ? 'Promotion' : 'FIFO'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Appliquer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Alertes Critiques
              </CardTitle>
              <CardDescription>
                Produits nécessitant une attention immédiate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.filter(p => p.priority === 'critical').length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">Aucune alerte critique</p>
                    <p className="text-sm">Votre stock est en bon état</p>
                  </div>
                ) : (
                  predictions
                    .filter(p => p.priority === 'critical')
                    .map((prediction) => (
                      <div 
                        key={prediction.id} 
                        className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-destructive">{prediction.product_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Stock: {prediction.current_stock} | 
                              Rupture dans {prediction.days_until_stockout} jours
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => createOrderFromPrediction(prediction.id)}
                            disabled={prediction.order_created}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {prediction.order_created ? 'Commandé' : `Commander ${prediction.recommended_order_qty}`}
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expiring products alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Produits à Péremption Proche
              </CardTitle>
              <CardDescription>
                Produits expirant dans les 30 prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.filter(s => s.type === 'promotion').length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>Aucun produit proche de la péremption</p>
                  </div>
                ) : (
                  suggestions
                    .filter(s => s.type === 'promotion')
                    .slice(0, 10)
                    .map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="p-3 border rounded-lg flex justify-between items-center hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{suggestion.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Lot: {suggestion.lot_number} | {suggestion.days_until_expiry} jours restants
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Promouvoir
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres d'Optimisation
              </CardTitle>
              <CardDescription>
                Configurez les seuils et l'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick settings display */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Horizon prédiction</p>
                  <p className="text-2xl font-bold">{config?.prediction_horizon_days || 30} jours</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Seuil confiance</p>
                  <p className="text-2xl font-bold">{config?.confidence_threshold || 70}%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Alerte critique</p>
                  <p className="text-2xl font-bold">{config?.critical_alert_days || 7} jours</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Auto-optimisation</p>
                  <p className="text-2xl font-bold">
                    {config?.auto_optimization_enabled ? 'Activée' : 'Désactivée'}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={() => setShowConfigDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Modifier la Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AIStockPredictionDetailDialog
        open={!!selectedPrediction}
        onOpenChange={(open) => !open && setSelectedPrediction(null)}
        prediction={selectedPrediction}
        onCreateOrder={createOrderFromPrediction}
        onDismiss={dismissPrediction}
      />

      <AIStockSuggestionDialog
        open={!!selectedSuggestion}
        onOpenChange={(open) => !open && setSelectedSuggestion(null)}
        suggestion={selectedSuggestion}
        onApply={applySuggestion}
        onIgnore={ignoreSuggestion}
      />

      <AIStockAnalysisDialog
        open={showAnalysisDialog}
        onOpenChange={setShowAnalysisDialog}
        result={analysisResult}
        analyzing={analyzing}
      />

      <AIStockConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        config={config}
        onSave={saveConfig}
      />
    </div>
  );
};

export default AIStockManagement;
