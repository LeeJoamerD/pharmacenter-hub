import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Target, 
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  BarChart3,
  Eye,
  Lightbulb
} from 'lucide-react';

const AIDashboard = () => {
  const [aiMetrics] = useState({
    modelsActive: 4,
    predictionsToday: 127,
    recommendationsGenerated: 23,
    accuracy: 92.3,
    processingTime: 1.2
  });

  const [activeModels] = useState([
    {
      name: 'Prévision Ventes',
      status: 'active',
      accuracy: 94.2,
      lastUpdate: '2025-01-05 14:30',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      name: 'Recommandations Produits',
      status: 'active',
      accuracy: 89.7,
      lastUpdate: '2025-01-05 12:15',
      icon: Target,
      color: 'text-green-600'
    },
    {
      name: 'Détection Anomalies',
      status: 'training',
      accuracy: 91.5,
      lastUpdate: '2025-01-05 10:45',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      name: 'Analyse Sentiment',
      status: 'active',
      accuracy: 87.3,
      lastUpdate: '2025-01-05 09:20',
      icon: Eye,
      color: 'text-purple-600'
    }
  ]);

  const [recentInsights] = useState([
    {
      type: 'Prédiction',
      title: 'Pic de ventes prévu',
      description: 'Hausse de 18% des ventes d\'antihistaminiques attendue cette semaine',
      confidence: 92,
      impact: 'high',
      timestamp: 'Il y a 15 minutes'
    },
    {
      type: 'Recommandation',
      title: 'Optimisation stock',
      description: 'Réduire stock Paracétamol 500mg de 15% pour optimiser rotation',
      confidence: 87,
      impact: 'medium',
      timestamp: 'Il y a 32 minutes'
    },
    {
      type: 'Anomalie',
      title: 'Pattern inhabituel détecté',
      description: 'Baisse soudaine des ventes de produits OTC le mardi',
      confidence: 94,
      impact: 'medium',
      timestamp: 'Il y a 1 heure'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'training': return 'text-blue-600 bg-blue-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assistant IA PharmaSoft</h2>
          <p className="text-muted-foreground">
            Intelligence artificielle pour optimiser votre pharmacie
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat IA
          </Button>
          <Button size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Diagnostic Auto
          </Button>
        </div>
      </div>

      {/* Métriques IA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modèles Actifs</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.modelsActive}</div>
            <p className="text-xs text-muted-foreground">
              +1 depuis hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prédictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.predictionsToday}</div>
            <p className="text-xs text-muted-foreground">
              Aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.recommendationsGenerated}</div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne globale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Réponse</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.processingTime}s</div>
            <p className="text-xs text-muted-foreground">
              Temps moyen
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* État des Modèles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              État des Modèles IA
            </CardTitle>
            <CardDescription>Performance et statut des modèles d'apprentissage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeModels.map((model, index) => {
                const IconComponent = model.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-50`}>
                        <IconComponent className={`h-4 w-4 ${model.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Précision: {model.accuracy}% • {model.lastUpdate}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(model.status)}>
                      {model.status === 'active' ? 'Actif' : 
                       model.status === 'training' ? 'Entraînement' : 'Inactif'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insights Récents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Insights IA Récents
            </CardTitle>
            <CardDescription>Dernières découvertes et recommandations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInsights.map((insight, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getImpactColor(insight.impact)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{insight.type}</Badge>
                      <span className="text-xs">Confiance: {insight.confidence}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
                  </div>
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  <Progress value={insight.confidence} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Actions Intelligentes Recommandées
          </CardTitle>
          <CardDescription>Actions prioritaires suggérées par l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Analyser Tendances</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Target className="h-5 w-5" />
              <span className="text-sm">Optimiser Stock</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">Consulter IA</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDashboard;