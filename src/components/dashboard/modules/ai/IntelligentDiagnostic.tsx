import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const IntelligentDiagnostic = () => {
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [lastScanTime] = useState('2025-01-05 14:30');

  // Analyses de performance
  const [performanceAnalysis] = useState({
    globalScore: 78,
    trends: [
      {
        category: 'Ventes',
        score: 85,
        trend: '+12%',
        status: 'good',
        details: 'Performance au-dessus de la moyenne sectorielle'
      },
      {
        category: 'Stock',
        score: 72,
        trend: '-5%',
        status: 'warning',
        details: 'Rotation stock plus lente que optimal'
      },
      {
        category: 'Marge',
        score: 91,
        trend: '+18%',
        status: 'excellent',
        details: 'Optimisation des marges très efficace'
      },
      {
        category: 'Clients',
        score: 65,
        trend: '-8%',
        status: 'attention',
        details: 'Fidélisation en baisse, action requise'
      }
    ]
  });

  // Détection d'anomalies
  const [anomalies] = useState([
    {
      type: 'critique',
      title: 'Chute soudaine des ventes OTC',
      description: 'Baisse de 35% des ventes de produits sans ordonnance depuis 3 jours',
      impact: 'high',
      confidence: 94,
      suggestions: [
        'Vérifier stratégie merchandising',
        'Analyser concurrence locale',
        'Réviser politique de prix'
      ],
      detectedAt: '2025-01-05 12:45'
    },
    {
      type: 'warning',
      title: 'Pattern inhabituel - Vitamines',
      description: 'Pics de vente de vitamine D uniquement les mardis',
      impact: 'medium',
      confidence: 87,
      suggestions: [
        'Optimiser stock mardi',
        'Analyser cause du pattern',
        'Ajuster planning personnel'
      ],
      detectedAt: '2025-01-05 10:20'
    },
    {
      type: 'info',
      title: 'Opportunité détectée',
      description: 'Demande croissante de produits bio non satisfaite',
      impact: 'medium',
      confidence: 79,
      suggestions: [
        'Étendre gamme bio',
        'Négocier nouveaux fournisseurs',
        'Campagne promotion bio'
      ],
      detectedAt: '2025-01-05 09:15'
    }
  ]);

  // Goulots d'étranglement
  const [bottlenecks] = useState([
    {
      area: 'Approvisionnement',
      severity: 'high',
      description: 'Délais fournisseur Laboratoire X trop longs',
      impact: '15% des ruptures de stock',
      solution: 'Diversifier fournisseurs ou négocier SLA',
      priority: 1
    },
    {
      area: 'Point de Vente',
      severity: 'medium',
      description: 'Temps d\'attente client pic 12h-14h',
      impact: 'Satisfaction client -12%',
      solution: 'Optimiser planning ou ajouter caisse temporaire',
      priority: 2
    },
    {
      area: 'Gestion Stock',
      severity: 'medium',
      description: 'Inventaire manuel chronophage',
      impact: '8h/semaine mobilisées',
      solution: 'Implémentation RFID ou scanning mobile',
      priority: 3
    }
  ]);

  const runDiagnostic = async () => {
    setDiagnosticRunning(true);
    // Simulation diagnostic en cours
    setTimeout(() => {
      setDiagnosticRunning(false);
    }, 3000);
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
            Dernière analyse: {lastScanTime}
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
              <div className="text-4xl font-bold text-primary">{performanceAnalysis.globalScore}/100</div>
              <p className="text-sm text-muted-foreground">Score d'excellence</p>
            </div>
            <div className="text-right">
              <Badge className="bg-blue-50 text-blue-600 mb-2">Bon niveau</Badge>
              <p className="text-sm text-muted-foreground">Potentiel d'amélioration: 22 points</p>
            </div>
          </div>
          <Progress value={performanceAnalysis.globalScore} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="bottlenecks">Goulots</TabsTrigger>
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
              <div className="space-y-4">
                {anomalies.map((anomaly, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getAnomalyColor(anomaly.type)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {anomaly.type === 'critique' ? 'Critique' :
                           anomaly.type === 'warning' ? 'Attention' : 'Information'}
                        </Badge>
                        <span className="text-xs">Confiance: {anomaly.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {anomaly.detectedAt}
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
                      <Button size="sm" variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Investiguer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="p-4 border rounded-lg">
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
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{bottleneck.description}</p>
                    <p className="text-sm font-medium text-orange-600 mb-3">Impact: {bottleneck.impact}</p>
                    
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <h5 className="text-sm font-medium text-blue-800 mb-1">Solution recommandée:</h5>
                      <p className="text-sm text-blue-700">{bottleneck.solution}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Analyser
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Planifier Action
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Tendances Positives</h4>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li>• Croissance ventes parapharmacie +15%</li>
                    <li>• Amélioration marge brute +3.2%</li>
                    <li>• Réduction gaspillage -12%</li>
                    <li>• Fidélisation client âgé stable</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">Points d'Attention</h4>
                  <ul className="space-y-2 text-sm text-orange-700">
                    <li>• Baisse achat clients jeunes -8%</li>
                    <li>• Rotation stock homéopathie lente</li>
                    <li>• Saisonnalité plus marquée</li>
                    <li>• Concurrence e-commerce croissante</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter Rapport
                </Button>
                <Button>
                  <Target className="h-4 w-4 mr-2" />
                  Plan d'Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentDiagnostic;