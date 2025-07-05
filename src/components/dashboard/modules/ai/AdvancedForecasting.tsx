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
  BarChart3,
  LineChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Eye,
  RefreshCw
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdvancedForecasting = () => {
  const [selectedModel, setSelectedModel] = useState('lstm');
  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);

  // Données de prévisions de ventes
  const [salesForecastData] = useState([
    { date: '2025-01-06', actual: 2800, predicted: 2750, confidence: 85 },
    { date: '2025-01-07', actual: 3200, predicted: 3100, confidence: 87 },
    { date: '2025-01-08', actual: 2900, predicted: 2950, confidence: 82 },
    { date: '2025-01-09', actual: null, predicted: 3350, confidence: 89 },
    { date: '2025-01-10', actual: null, predicted: 3200, confidence: 86 },
    { date: '2025-01-11', actual: null, predicted: 2950, confidence: 84 },
    { date: '2025-01-12', actual: null, predicted: 3100, confidence: 88 },
    { date: '2025-01-13', actual: null, predicted: 3450, confidence: 91 },
    { date: '2025-01-14', actual: null, predicted: 3600, confidence: 85 },
    { date: '2025-01-15', actual: null, predicted: 3300, confidence: 83 }
  ]);

  // Prévisions de stock
  const [stockPredictions] = useState([
    {
      product: 'Doliprane 1000mg',
      currentStock: 150,
      predictedDemand: 45,
      daysUntilStockout: 3,
      recommendedOrder: 200,
      confidence: 94,
      trend: 'increasing',
      priority: 'critical'
    },
    {
      product: 'Vitamine D 1000UI',
      currentStock: 80,
      predictedDemand: 12,
      daysUntilStockout: 7,
      recommendedOrder: 100,
      confidence: 87,
      trend: 'stable',
      priority: 'medium'
    },
    {
      product: 'Masques FFP2',
      currentStock: 500,
      predictedDemand: 25,
      daysUntilStockout: 20,
      recommendedOrder: 0,
      confidence: 76,
      trend: 'decreasing',
      priority: 'low'
    },
    {
      product: 'Antihistaminique',
      currentStock: 75,
      predictedDemand: 38,
      daysUntilStockout: 2,
      recommendedOrder: 150,
      confidence: 91,
      trend: 'seasonal_peak',
      priority: 'critical'
    }
  ]);

  // Prévisions de trésorerie
  const [cashflowForecast] = useState([
    { month: 'Jan 2025', inflow: 45000, outflow: 38000, net: 7000, cumulative: 15000 },
    { month: 'Fév 2025', inflow: 48000, outflow: 41000, net: 7000, cumulative: 22000 },
    { month: 'Mar 2025', inflow: 52000, outflow: 43000, net: 9000, cumulative: 31000 },
    { month: 'Avr 2025', inflow: 49000, outflow: 40000, net: 9000, cumulative: 40000 },
    { month: 'Mai 2025', inflow: 51000, outflow: 42000, net: 9000, cumulative: 49000 },
    { month: 'Jun 2025', inflow: 47000, outflow: 39000, net: 8000, cumulative: 57000 }
  ]);

  // Modèles IA disponibles
  const [models] = useState([
    {
      id: 'lstm',
      name: 'LSTM Neural Network',
      accuracy: 92.5,
      description: 'Réseau de neurones pour séries temporelles complexes',
      bestFor: 'Patterns complexes, saisonnalité'
    },
    {
      id: 'arima',
      name: 'ARIMA Autorégressif',
      accuracy: 87.3,
      description: 'Modèle statistique classique',
      bestFor: 'Tendances linéaires, données stationnaires'
    },
    {
      id: 'prophet',
      name: 'Facebook Prophet',
      accuracy: 89.1,
      description: 'Optimisé pour données business',
      bestFor: 'Événements spéciaux, anomalies'
    },
    {
      id: 'ensemble',
      name: 'Ensemble Methods',
      accuracy: 94.7,
      description: 'Combinaison de plusieurs modèles',
      bestFor: 'Précision maximale'
    }
  ]);

  // Facteurs influents
  const [influentialFactors] = useState([
    { factor: 'Météo', influence: 78, trend: 'positive', description: 'Température et humidité affectent ventes OTC' },
    { factor: 'Saisonnalité', influence: 85, trend: 'cyclical', description: 'Patterns saisonniers récurrents' },
    { factor: 'Événements locaux', influence: 62, trend: 'variable', description: 'Festivals, événements sportifs' },
    { factor: 'Épidémies', influence: 91, trend: 'spike', description: 'Grippes, gastro-entérites' },
    { factor: 'Promotions', influence: 45, trend: 'controlled', description: 'Campagnes marketing planifiées' }
  ]);

  const generateForecast = async () => {
    setIsGenerating(true);
    // Simulation génération prévision
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
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
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} - {model.accuracy}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateForecast} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Génération...' : 'Générer Prévision'}
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
            <div className="text-2xl font-bold">
              {models.find(m => m.id === selectedModel)?.accuracy}%
            </div>
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
            <div className="text-2xl font-bold">12</div>
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
            <div className="text-2xl font-bold text-red-600">2</div>
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
            <div className="text-2xl font-bold text-green-600">+€3.2K</div>
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

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Prévisions de Ventes
              </CardTitle>
              <CardDescription>
                Prédictions basées sur {selectedModel.toUpperCase()} avec {forecastPeriod} jours d'horizon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={salesForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Ventes réelles"
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
                  <div className="text-2xl font-bold text-blue-600">€3,350</div>
                  <div className="text-sm text-blue-700">Prévision demain</div>
                  <div className="text-xs text-muted-foreground">Confiance: 89%</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+12%</div>
                  <div className="text-sm text-green-700">vs semaine dernière</div>
                  <div className="text-xs text-muted-foreground">Tendance positive</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">€22.1K</div>
                  <div className="text-sm text-orange-700">Prévision semaine</div>
                  <div className="text-xs text-muted-foreground">7 jours horizon</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="space-y-4">
                {stockPredictions.map((prediction, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getPriorityColor(prediction.priority)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(prediction.trend)}
                        <div>
                          <h4 className="font-semibold">{prediction.product}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">Stock: {prediction.currentStock}</Badge>
                            <Badge className={getPriorityColor(prediction.priority)}>
                              {prediction.priority === 'critical' ? 'Critique' :
                               prediction.priority === 'medium' ? 'Moyen' : 'Faible'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {prediction.daysUntilStockout} jours
                        </div>
                        <div className="text-sm text-muted-foreground">Avant rupture</div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3 mb-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Demande prévue:</span>
                        <span className="font-medium ml-2">{prediction.predictedDemand}/jour</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Commande suggérée:</span>
                        <span className="font-medium ml-2">{prediction.recommendedOrder} unités</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Confiance:</span>
                        <span className="font-medium ml-2">{prediction.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Progress value={prediction.confidence} className="w-24 h-2" />
                      <div className="flex gap-2">
                        {prediction.recommendedOrder > 0 && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Package className="h-4 w-4 mr-2" />
                            Commander
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="h-80 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
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
                  <div className="text-2xl font-bold text-green-600">€51K</div>
                  <div className="text-sm text-green-700">Revenus prévus Mai</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">€42K</div>
                  <div className="text-sm text-red-700">Dépenses prévues Mai</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">€57K</div>
                  <div className="text-sm text-blue-700">Trésorerie fin Juin</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Facteurs Influents
              </CardTitle>
              <CardDescription>Analyse des variables impactant les prévisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {influentialFactors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">{factor.influence}%</div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">{factor.factor}</h4>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        factor.trend === 'positive' ? 'bg-green-50 text-green-600' :
                        factor.trend === 'negative' ? 'bg-red-50 text-red-600' :
                        factor.trend === 'spike' ? 'bg-orange-50 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }>
                        {factor.trend}
                      </Badge>
                      <Progress value={factor.influence} className="w-16 h-2 mt-2" />
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

export default AdvancedForecasting;