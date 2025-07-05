import React, { useState } from 'react';
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
  BarChart3,
  Lightbulb,
  RefreshCw,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Award,
  Cpu
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const AIBusinessIntelligence = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState('predictive');
  const [isProcessing, setIsProcessing] = useState(false);

  // Analytics prédictives
  const [predictiveMetrics] = useState({
    churnPrediction: 12.5,
    lifetimeValue: 1850,
    nextBestAction: 'Promotion vitamines',
    riskScore: 23.1
  });

  // Prédiction d'attrition client
  const [churnPredictions] = useState([
    {
      segment: 'Clients Premium',
      totalClients: 234,
      riskHigh: 8,
      riskMedium: 23,
      riskLow: 203,
      averageLTV: 2450,
      retentionRate: 94.2
    },
    {
      segment: 'Clients Réguliers',
      totalClients: 856,
      riskHigh: 45,
      riskMedium: 128,
      riskLow: 683,
      averageLTV: 1200,
      retentionRate: 87.3
    },
    {
      segment: 'Nouveaux Clients',
      totalClients: 312,
      riskHigh: 67,
      riskMedium: 89,
      riskLow: 156,
      averageLTV: 450,
      retentionRate: 72.1
    }
  ]);

  // Découverte de patterns
  const [discoveredPatterns] = useState([
    {
      pattern: 'Corrélation Météo-Ventes',
      description: 'Ventes OTC +15% lors de chutes température >5°C',
      confidence: 89.2,
      frequency: 'Saisonnière',
      impact: 'Moyen',
      actionable: true,
      discovery: 'Automatique'
    },
    {
      pattern: 'Comportement Clients Seniors',
      description: 'Achats groupés vitamines + compléments le mardi matin',
      confidence: 92.1,
      frequency: 'Hebdomadaire',
      impact: 'Élevé',
      actionable: true,
      discovery: 'ML Learning'
    },
    {
      pattern: 'Cross-selling Antibiotiques',
      description: 'Probiotiques vendus avec antibios dans 78% des cas',
      confidence: 85.6,
      frequency: 'Continue',
      impact: 'Élevé',
      actionable: true,
      discovery: 'Association Rules'
    },
    {
      pattern: 'Saisonnalité Parapharmacie',
      description: 'Produits solaires: pic 6 semaines avant été',
      confidence: 94.7,
      frequency: 'Annuelle',
      impact: 'Élevé',
      actionable: true,
      discovery: 'Time Series'
    }
  ]);

  // Segmentation automatique
  const [autoSegmentation] = useState([
    {
      segment: 'Hyper-fidèles',
      size: 156,
      characteristics: ['Fréquence >2/mois', 'Panier >50€', 'Ancienneté >2ans'],
      clv: 2890,
      nextAction: 'Programme VIP',
      color: '#10b981'
    },
    {
      segment: 'Opportunistes',
      size: 423,
      characteristics: ['Sensible promo', 'Achats irréguliers', 'Panier variable'],
      clv: 890,
      nextAction: 'Ciblage promotionnel',
      color: '#3b82f6'
    },
    {
      segment: 'Fonctionnels',
      size: 678,
      characteristics: ['Prescription uniquement', 'Régularité', 'Peu parapharmacie'],
      clv: 1200,
      nextAction: 'Conseil personnalisé',
      color: '#f59e0b'
    },
    {
      segment: 'À Risque',
      size: 89,
      characteristics: ['Baisse fréquence', 'Panier réduit', 'Dernière visite >3mois'],
      clv: 450,
      nextAction: 'Campagne réactivation',
      color: '#ef4444'
    }
  ]);

  // Optimisation processus
  const [processOptimization] = useState([
    {
      process: 'Réception Commandes',
      currentTime: 45,
      optimizedTime: 28,
      improvement: 38,
      difficulty: 'Facile',
      roi: 'Élevé'
    },
    {
      process: 'Conseil Client',
      currentTime: 12,
      optimizedTime: 8,
      improvement: 33,
      difficulty: 'Moyen',
      roi: 'Moyen'
    },
    {
      process: 'Inventaire Partiel',
      currentTime: 120,
      optimizedTime: 65,
      improvement: 46,
      difficulty: 'Difficile',
      roi: 'Élevé'
    }
  ]);

  const runAnalysis = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Élevé': return 'text-red-600 bg-red-50';
      case 'Moyen': return 'text-orange-600 bg-orange-50';
      case 'Faible': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

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
        <div className="flex items-center gap-4">
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
          <Button onClick={runAnalysis} disabled={isProcessing}>
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Analyse...' : 'Analyser'}
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
            <div className="text-2xl font-bold text-orange-600">{predictiveMetrics.churnPrediction}%</div>
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
            <div className="text-2xl font-bold">€{predictiveMetrics.lifetimeValue}</div>
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
            <div className="text-sm font-bold">{predictiveMetrics.nextBestAction}</div>
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
            <div className="text-2xl font-bold text-green-600">{predictiveMetrics.riskScore}/100</div>
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

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Analytics Prédictives
              </CardTitle>
              <CardDescription>ML pour prédiction des comportements clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {churnPredictions.map((prediction, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">{prediction.segment}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{prediction.retentionRate}%</div>
                        <div className="text-sm text-muted-foreground">Rétention</div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
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
                        <span className="font-medium">€{prediction.averageLTV}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Découverte de Patterns
              </CardTitle>
              <CardDescription>Identification automatique de tendances cachées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discoveredPatterns.map((pattern, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{pattern.pattern}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getImpactColor(pattern.impact)}>
                          {pattern.impact}
                        </Badge>
                        <Badge variant="outline">{pattern.discovery}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3 mb-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Confiance:</span>
                        <span className="font-medium ml-2">{pattern.confidence}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Fréquence:</span>
                        <span className="font-medium ml-2">{pattern.frequency}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Actionnable:</span>
                        <span className="font-medium ml-2">
                          {pattern.actionable ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Progress value={pattern.confidence} className="w-24 h-2" />
                      {pattern.actionable && (
                        <Button size="sm">
                          <Zap className="h-4 w-4 mr-2" />
                          Exploiter Pattern
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segmentation Automatique
                </CardTitle>
                <CardDescription>Clustering ML des clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={autoSegmentation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="size"
                      >
                        {autoSegmentation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {autoSegmentation.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <span className="font-medium">{segment.segment}</span>
                      </div>
                      <span>{segment.size} clients</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails Segments</CardTitle>
                <CardDescription>Caractéristiques et actions recommandées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {autoSegmentation.map((segment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <h5 className="font-medium">{segment.segment}</h5>
                        <Badge variant="outline">{segment.size}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">CLV:</span>
                          <span className="font-medium ml-2">€{segment.clv}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Action:</span>
                          <span className="font-medium ml-2">{segment.nextAction}</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground mb-1">Caractéristiques:</div>
                          <div className="flex flex-wrap gap-1">
                            {segment.characteristics.map((char, charIndex) => (
                              <Badge key={charIndex} variant="secondary" className="text-xs">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Optimisation des Processus
              </CardTitle>
              <CardDescription>IA pour amélioration opérationnelle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processOptimization.map((process, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">{process.process}</h4>
                      <Badge className={
                        process.improvement > 40 ? 'bg-green-50 text-green-600' :
                        process.improvement > 25 ? 'bg-blue-50 text-blue-600' :
                        'bg-orange-50 text-orange-600'
                      }>
                        -{process.improvement}%
                      </Badge>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">{process.currentTime}min</div>
                        <div className="text-xs text-red-700">Temps actuel</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{process.optimizedTime}min</div>
                        <div className="text-xs text-green-700">Temps optimisé</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{process.improvement}%</div>
                        <div className="text-xs text-blue-700">Amélioration</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-sm font-bold text-purple-600">{process.roi}</div>
                        <div className="text-xs text-purple-700">ROI estimé</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Difficulté:</span>
                        <Badge className={
                          process.difficulty === 'Facile' ? 'bg-green-50 text-green-600' :
                          process.difficulty === 'Moyen' ? 'bg-orange-50 text-orange-600' :
                          'bg-red-50 text-red-600'
                        }>
                          {process.difficulty}
                        </Badge>
                      </div>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Implémenter
                      </Button>
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

export default AIBusinessIntelligence;