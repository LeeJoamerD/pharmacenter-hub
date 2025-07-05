import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  BarChart3,
  Activity,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Users,
  Package,
  DollarSign,
  Calendar,
  LineChart,
  PieChart,
  Lightbulb,
  Bot,
  Cpu,
  Database
} from 'lucide-react';

const AIReports = () => {
  const [selectedModel, setSelectedModel] = useState('forecasting');
  const [autoTraining, setAutoTraining] = useState(true);
  const [modelStatus, setModelStatus] = useState('active');

  // Modèles IA disponibles
  const aiModels = [
    {
      id: 'forecasting',
      name: 'Prévision des Ventes',
      type: 'Prédictif',
      accuracy: 92.5,
      status: 'active',
      lastTrained: '2024-01-05',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'anomaly',
      name: 'Détection d\'Anomalies',
      type: 'Classification',
      accuracy: 89.3,
      status: 'active',
      lastTrained: '2024-01-04',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'demand',
      name: 'Prédiction Demande',
      type: 'Régression',
      accuracy: 87.8,
      status: 'training',
      lastTrained: '2024-01-03',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'optimization',
      name: 'Optimisation Stock',
      type: 'Optimisation',
      accuracy: 94.1,
      status: 'active',
      lastTrained: '2024-01-05',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  // Prévisions IA
  const aiPredictions = [
    {
      type: 'Ventes',
      title: 'Pic de Ventes Prévu',
      description: 'Augmentation de 28% des ventes d\'antihistaminiques la semaine prochaine',
      confidence: 92.5,
      impact: 'high',
      timeframe: '7 jours',
      recommendation: 'Augmenter stock de 25%'
    },
    {
      type: 'Stock',
      title: 'Rupture Probable',
      description: 'Stock Doliprane 1000mg insuffisant dans 4 jours',
      confidence: 89.3,
      impact: 'critical',
      timeframe: '4 jours',
      recommendation: 'Commande urgente 500 unités'
    },
    {
      type: 'Saisonnier',
      title: 'Tendance Saisonnière',
      description: 'Demande produits dermatologiques +15% ce mois',
      confidence: 87.8,
      impact: 'medium',
      timeframe: '30 jours',
      recommendation: 'Optimiser assortiment'
    },
    {
      type: 'Client',
      title: 'Comportement Client',
      description: 'Segment seniors: préférence marques premium',
      confidence: 91.2,
      impact: 'medium',
      timeframe: 'Ongoing',
      recommendation: 'Ajuster stratégie pricing'
    }
  ];

  // Métriques ML
  const mlMetrics = [
    { name: 'Précision Globale', value: 91.2, target: 90, trend: '+2.3%' },
    { name: 'Prédictions Correctes', value: 1847, target: 1800, trend: '+5.1%' },
    { name: 'Faux Positifs', value: 23, target: 30, trend: '-12.5%' },
    { name: 'Temps Traitement', value: 145, target: 200, trend: '-18.2%', unit: 'ms' }
  ];

  // Analyses en temps réel
  const realTimeAnalyses = [
    {
      title: 'Analyse de Sentiment Client',
      status: 'Positif',
      score: 4.2,
      trend: '+0.3',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Optimisation Pricing',
      status: 'Optimal',
      score: 93.5,
      trend: '+1.8%',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Prévision Flux Client',
      status: 'Pic Attendu',
      score: 156,
      trend: '+23%',
      icon: Activity,
      color: 'text-orange-600'
    },
    {
      title: 'Détection Fraude',
      status: 'Normal',
      score: 0.02,
      trend: '-0.01%',
      icon: AlertTriangle,
      color: 'text-green-600'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'training': return 'text-blue-600 bg-blue-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'training': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligence Artificielle</h2>
          <p className="text-muted-foreground">
            Analyses prédictives et machine learning avancé
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoTraining} onCheckedChange={setAutoTraining} />
            <span className="text-sm">Auto-training</span>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Statut des Modèles IA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {aiModels.map((model) => {
          const IconComponent = model.icon;
          return (
            <Card key={model.id} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
                <div className={`p-2 rounded-lg ${model.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${model.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{model.accuracy}%</div>
                <div className="flex items-center justify-between mt-2">
                  <Badge className={getStatusColor(model.status)}>
                    {model.status}
                  </Badge>
                  {getStatusIcon(model.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière formation: {model.lastTrained}
                </p>
              </CardContent>
            </Card>
          );
        })}
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
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Prédictions IA Avancées
              </CardTitle>
              <CardDescription>Analyses prédictives générées par intelligence artificielle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiPredictions.map((prediction, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getImpactColor(prediction.impact)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{prediction.type}</Badge>
                          <span className="text-xs font-medium">Confiance: {prediction.confidence}%</span>
                        </div>
                        <h4 className="font-semibold">{prediction.title}</h4>
                      </div>
                      <Badge className={getImpactColor(prediction.impact)}>
                        {prediction.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{prediction.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span>Échéance: {prediction.timeframe}</span>
                        <Progress value={prediction.confidence} className="w-20 h-2" />
                      </div>
                      <Button size="sm" variant="outline">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        {prediction.recommendation}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {realTimeAnalyses.map((analysis, index) => {
              const IconComponent = analysis.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className={`h-5 w-5 ${analysis.color}`} />
                      {analysis.title}
                    </CardTitle>
                    <CardDescription>Analyse en temps réel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Statut Actuel</span>
                        <Badge className={analysis.color.includes('green') ? 'bg-green-50 text-green-600' : 
                                       analysis.color.includes('blue') ? 'bg-blue-50 text-blue-600' :
                                       'bg-orange-50 text-orange-600'}>
                          {analysis.status}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{analysis.score}</p>
                        <p className="text-sm text-muted-foreground">
                          {analysis.trend} vs période précédente
                        </p>
                      </div>
                      <Button size="sm" className="w-full" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métriques Machine Learning
              </CardTitle>
              <CardDescription>Performance des modèles IA</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Objectif: {metric.target}{metric.unit || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Gestion des Modèles IA
              </CardTitle>
              <CardDescription>Configuration et entraînement des modèles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiModels.map((model) => {
                  const IconComponent = model.icon;
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
                        <Badge className={getStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          {model.status === 'training' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Insights Automatisés
                </CardTitle>
                <CardDescription>Découvertes générées par IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium">Corrélation Détectée</p>
                    <p className="text-xs text-muted-foreground">
                      Ventes vitamine D corrélées aux prévisions météo (-0.78)
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium">Pattern Identifié</p>
                    <p className="text-xs text-muted-foreground">
                      Pics de ventes récurrents les mardis (+15% moyenne)
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium">Anomalie Bénigne</p>
                    <p className="text-xs text-muted-foreground">
                      Segment jeunes: hausse parapharmacie bio (+42%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Qualité des Données
                </CardTitle>
                <CardDescription>Évaluation automatique</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Complétude</span>
                      <span>94.5%</span>
                    </div>
                    <Progress value={94.5} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cohérence</span>
                      <span>91.2%</span>
                    </div>
                    <Progress value={91.2} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fraîcheur</span>
                      <span>88.7%</span>
                    </div>
                    <Progress value={88.7} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Précision</span>
                      <span>92.8%</span>
                    </div>
                    <Progress value={92.8} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIReports;