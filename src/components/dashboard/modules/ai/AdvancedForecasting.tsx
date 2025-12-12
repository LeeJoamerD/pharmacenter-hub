import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Calendar, 
  Package,
  DollarSign,
  Cloud,
  Activity,
  Target,
  AlertTriangle,
  Zap,
  Brain,
  Eye,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

import { useAdvancedForecasting } from '@/hooks/useAdvancedForecasting';
import StockPredictionDetailDialog from './dialogs/StockPredictionDetailDialog';
import AddFactorDialog from './dialogs/AddFactorDialog';
import ForecastExportDialog from './dialogs/ForecastExportDialog';
import type { StockPrediction, InfluentialFactor } from '@/hooks/useAdvancedForecasting';

const AdvancedForecasting = () => {
  const { formatAmount, getCurrencySymbol } = useCurrencyFormatting();
  const {
    loading,
    generating,
    models,
    selectedModel,
    setSelectedModel,
    salesForecast,
    stockPredictions,
    cashflowForecast,
    influentialFactors,
    metrics,
    latestForecast,
    generateForecast,
    loadAllData,
    createOrderFromPrediction,
    dismissPrediction,
    addFactor,
    updateFactor,
    deleteFactor,
    setDefaultModel
  } = useAdvancedForecasting();

  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [selectedPrediction, setSelectedPrediction] = useState<StockPrediction | null>(null);
  const [predictionDialogOpen, setPredictionDialogOpen] = useState(false);
  const [addFactorDialogOpen, setAddFactorDialogOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<InfluentialFactor | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleGenerateForecast = async () => {
    await generateForecast(selectedModel, parseInt(forecastPeriod));
  };

  const handleViewPrediction = (prediction: StockPrediction) => {
    setSelectedPrediction(prediction);
    setPredictionDialogOpen(true);
  };

  const handleEditFactor = (factor: InfluentialFactor) => {
    setEditingFactor(factor);
    setAddFactorDialogOpen(true);
  };

  const handleSaveFactor = async (factorData: Omit<InfluentialFactor, 'id'>) => {
    if (editingFactor) {
      await updateFactor(editingFactor.id, factorData);
      setEditingFactor(null);
    } else {
      await addFactor(factorData);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      case 'seasonal_peak': return <Activity className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const currentModel = models.find(m => m.model_code === selectedModel);
  const modelAccuracy = currentModel?.accuracy || metrics.default_accuracy;
  const modelName = currentModel?.display_name || 'Ensemble Methods';

  // Formater les données du graphique de ventes
  const salesChartData = salesForecast.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd/MM', { locale: fr })
  }));

  // Résumé des ventes
  const tomorrowForecast = salesForecast.find(s => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return s.date === format(tomorrow, 'yyyy-MM-dd');
  });
  const weekForecast = salesForecast
    .filter(s => s.actual === null)
    .slice(0, 7)
    .reduce((sum, s) => sum + s.predicted, 0);
  const avgConfidence = salesForecast.length > 0 
    ? Math.round(salesForecast.reduce((sum, s) => sum + s.confidence, 0) / salesForecast.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prévisions Avancées IA</h2>
          <p className="text-muted-foreground">
            Algorithmes de machine learning pour prédictions business
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.model_code} value={model.model_code}>
                  {model.display_name} - {model.accuracy}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="14">14 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="60">60 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setExportDialogOpen(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleGenerateForecast} disabled={generating}>
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {generating ? 'Génération...' : 'Générer Prévision'}
          </Button>
        </div>
      </div>

      {/* Métriques de Performance */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision Modèle</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {selectedModel.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prévisions Actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_forecasts}</div>
            <p className="text-xs text-muted-foreground">
              En cours de suivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.critical_alerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.critical_alerts}
            </div>
            <p className="text-xs text-muted-foreground">
              Ruptures prévues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Prévisionnel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatAmount(metrics.estimated_roi)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois estimé
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="cashflow">Trésorerie</TabsTrigger>
          <TabsTrigger value="factors">Facteurs</TabsTrigger>
        </TabsList>

        {/* Onglet Ventes */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Prévisions de Ventes
              </CardTitle>
              <CardDescription>
                Prédictions basées sur {modelName} avec {forecastPeriod} jours d'horizon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesForecast.length > 0 ? (
                <>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [formatAmount(value), '']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Ventes réelles"
                          connectNulls={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Prévisions"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 mt-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {tomorrowForecast ? formatAmount(tomorrowForecast.predicted) : '--'}
                      </div>
                      <div className="text-sm text-blue-700">Prévision demain</div>
                      <div className="text-xs text-muted-foreground">
                        Confiance: {tomorrowForecast?.confidence || '--'}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {avgConfidence}%
                      </div>
                      <div className="text-sm text-green-700">Confiance moyenne</div>
                      <div className="text-xs text-muted-foreground">Sur la période</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatAmount(weekForecast)}
                      </div>
                      <div className="text-sm text-orange-700">Prévision semaine</div>
                      <div className="text-xs text-muted-foreground">7 jours horizon</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune prévision disponible</p>
                  <p className="text-sm">Cliquez sur "Générer Prévision" pour créer des prédictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Stock */}
        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Prédictions Stock & Ruptures
              </CardTitle>
              <CardDescription>Algorithmes prédictifs pour optimisation stock</CardDescription>
            </CardHeader>
            <CardContent>
              {stockPredictions.length > 0 ? (
                <div className="space-y-4">
                  {stockPredictions.map((prediction) => (
                    <div key={prediction.id} className={`p-4 border rounded-lg ${getPriorityColor(prediction.priority)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getTrendIcon(prediction.trend)}
                          <div>
                            <h4 className="font-semibold">{prediction.product_name || 'Produit'}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">Stock: {prediction.current_stock}</Badge>
                              <Badge className={getPriorityColor(prediction.priority)}>
                                {prediction.priority === 'critical' ? 'Critique' :
                                 prediction.priority === 'medium' ? 'Moyen' : 'Faible'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {prediction.days_until_stockout} jours
                          </div>
                          <div className="text-sm text-muted-foreground">Avant rupture</div>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3 mb-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Demande prévue:</span>
                          <span className="font-medium ml-2">{prediction.predicted_demand_daily}/jour</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Commande suggérée:</span>
                          <span className="font-medium ml-2">{prediction.recommended_order_qty} unités</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Confiance:</span>
                          <span className="font-medium ml-2">{prediction.confidence}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Progress value={prediction.confidence} className="w-24 h-2" />
                        <div className="flex gap-2">
                          {prediction.recommended_order_qty > 0 && !prediction.order_created && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => createOrderFromPrediction(prediction.id)}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Commander
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewPrediction(prediction)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune prédiction de stock disponible</p>
                  <p className="text-sm">Générez une prévision pour voir les alertes de rupture</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Trésorerie */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prévisions Trésorerie
              </CardTitle>
              <CardDescription>Projections des flux financiers futurs</CardDescription>
            </CardHeader>
            <CardContent>
              {cashflowForecast.length > 0 ? (
                <>
                  <div className="h-80 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashflowForecast}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, '']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="inflow" 
                          stackId="1"
                          stroke="#10b981" 
                          fill="#10b981"
                          fillOpacity={0.6}
                          name="Entrées"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="outflow" 
                          stackId="2"
                          stroke="#ef4444" 
                          fill="#ef4444"
                          fillOpacity={0.6}
                          name="Sorties"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cumulative" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="Cumulé"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {cashflowForecast[cashflowForecast.length - 2]?.inflow.toLocaleString('fr-FR') || '--'} FCFA
                      </div>
                      <div className="text-sm text-green-700">Revenus prévus prochain mois</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {cashflowForecast[cashflowForecast.length - 2]?.outflow.toLocaleString('fr-FR') || '--'} FCFA
                      </div>
                      <div className="text-sm text-red-700">Dépenses prévues prochain mois</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {cashflowForecast[cashflowForecast.length - 1]?.cumulative.toLocaleString('fr-FR') || '--'} FCFA
                      </div>
                      <div className="text-sm text-blue-700">Trésorerie fin de période</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune prévision de trésorerie disponible</p>
                  <p className="text-sm">Générez une prévision pour voir les projections financières</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Facteurs */}
        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Facteurs Influents
                </CardTitle>
                <CardDescription>Analyse des variables impactant les prévisions</CardDescription>
              </div>
              <Button onClick={() => { setEditingFactor(null); setAddFactorDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {influentialFactors.length > 0 ? (
                <div className="space-y-4">
                  {influentialFactors.map((factor) => (
                    <div key={factor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold">{factor.influence_score}%</div>
                          <div className="text-xs text-muted-foreground">Impact</div>
                        </div>
                        <div>
                          <h4 className="font-semibold">{factor.factor_name}</h4>
                          <p className="text-sm text-muted-foreground">{factor.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={
                            factor.trend_type === 'positive' ? 'bg-green-50 text-green-600' :
                            factor.trend_type === 'negative' ? 'bg-red-50 text-red-600' :
                            factor.trend_type === 'spike' ? 'bg-orange-50 text-orange-600' :
                            'bg-blue-50 text-blue-600'
                          }>
                            {factor.trend_type}
                          </Badge>
                          <Progress value={factor.influence_score} className="w-16 h-2 mt-2" />
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEditFactor(factor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteFactor(factor.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun facteur influent configuré</p>
                  <p className="text-sm">Ajoutez des facteurs pour améliorer la précision des prévisions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StockPredictionDetailDialog
        open={predictionDialogOpen}
        onOpenChange={setPredictionDialogOpen}
        prediction={selectedPrediction}
        onCreateOrder={createOrderFromPrediction}
        onDismiss={dismissPrediction}
      />

      <AddFactorDialog
        open={addFactorDialogOpen}
        onOpenChange={(open) => {
          setAddFactorDialogOpen(open);
          if (!open) setEditingFactor(null);
        }}
        onSave={handleSaveFactor}
        editingFactor={editingFactor}
      />

      <ForecastExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        salesData={salesForecast}
        stockPredictions={stockPredictions}
        cashflowData={cashflowForecast}
        factors={influentialFactors}
        metrics={metrics}
        modelName={modelName}
      />
    </div>
  );
};

export default AdvancedForecasting;
