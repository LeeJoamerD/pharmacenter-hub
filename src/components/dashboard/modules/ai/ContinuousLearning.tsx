import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  RefreshCw,
  Database,
  Target,
  TrendingUp,
  Activity,
  Settings,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  Eye,
  BarChart3,
  Clock,
  Award
} from 'lucide-react';

const ContinuousLearning = () => {
  const [isTraining, setIsTraining] = useState(false);

  // Statut des modèles d'apprentissage
  const [learningModels] = useState([
    {
      name: 'Prédiction Ventes',
      status: 'training',
      accuracy: 94.2,
      lastUpdate: '2025-01-05 10:30',
      nextTraining: '2025-01-06 02:00',
      dataPoints: 12450,
      epochs: 45,
      progress: 78
    },
    {
      name: 'Segmentation Clients',
      status: 'active',
      accuracy: 87.3,
      lastUpdate: '2025-01-04 22:15',
      nextTraining: '2025-01-07 02:00',
      dataPoints: 8900,
      epochs: 32,
      progress: 100
    },
    {
      name: 'Optimisation Prix',
      status: 'pending',
      accuracy: 89.1,
      lastUpdate: '2025-01-03 18:45',
      nextTraining: '2025-01-06 01:00',
      dataPoints: 15600,
      epochs: 28,
      progress: 0
    }
  ]);

  // Métriques d'amélioration continue
  const [improvementMetrics] = useState({
    totalModels: 8,
    activeTraining: 2,
    avgAccuracyGain: 2.8,
    dataProcessed: 45600,
    trainingHours: 127.5
  });

  // Feedback utilisateur
  const [userFeedback] = useState([
    {
      model: 'Recommandations Produits',
      feedback: 'positive',
      comment: 'Suggestions très pertinentes pour clients seniors',
      accuracy: 91,
      timestamp: '2025-01-05 14:20',
      user: 'Marie Dubois'
    },
    {
      model: 'Prévision Stock',
      feedback: 'mixed',
      comment: 'Bon pour produits OTC, moins précis pour saisonnier',
      accuracy: 78,
      timestamp: '2025-01-05 11:45',
      user: 'Jean Martin'
    },
    {
      model: 'Détection Anomalies',
      feedback: 'positive',
      comment: 'A détecté problème fournisseur avant nous',
      accuracy: 95,
      timestamp: '2025-01-05 09:30',
      user: 'Sarah Leroy'
    }
  ]);

  // Données d'entraînement
  const [trainingData] = useState([
    {
      dataset: 'Historique Ventes',
      records: 125000,
      quality: 94.5,
      lastUpdate: '2025-01-05',
      frequency: 'Quotidien',
      source: 'Système POS'
    },
    {
      dataset: 'Comportement Clients',
      records: 45000,
      quality: 87.2,
      lastUpdate: '2025-01-04',
      frequency: 'Hebdomadaire',
      source: 'Analytics Web'
    },
    {
      dataset: 'Données Météo',
      records: 8760,
      quality: 99.1,
      lastUpdate: '2025-01-05',
      frequency: 'Horaire',
      source: 'API Météo'
    },
    {
      dataset: 'Réseaux Sociaux',
      records: 23400,
      quality: 76.8,
      lastUpdate: '2025-01-05',
      frequency: 'Temps réel',
      source: 'API Social'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'training': return 'text-blue-600 bg-blue-50';
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFeedbackColor = (feedback: string) => {
    switch (feedback) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'mixed': return 'text-orange-600 bg-orange-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const startTraining = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Apprentissage Continu</h2>
          <p className="text-muted-foreground">
            Amélioration automatique des modèles IA par apprentissage machine
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuration ML
          </Button>
          <Button onClick={startTraining} disabled={isTraining}>
            {isTraining ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isTraining ? 'Entraînement...' : 'Former Modèles'}
          </Button>
        </div>
      </div>

      {/* Métriques d'apprentissage */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modèles Actifs</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{improvementMetrics.totalModels}</div>
            <p className="text-xs text-muted-foreground">
              En production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Formation</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{improvementMetrics.activeTraining}</div>
            <p className="text-xs text-muted-foreground">
              Modèles actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain Précision</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{improvementMetrics.avgAccuracyGain}%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne mensuelle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Données Traitées</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{improvementMetrics.dataProcessed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Points de données
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Formation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{improvementMetrics.trainingHours}h</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Modèles</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Entraînement des Modèles
              </CardTitle>
              <CardDescription>Statut et progression de l'apprentissage machine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningModels.map((model, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{model.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Précision: {model.accuracy}% • {model.dataPoints} points de données
                        </p>
                      </div>
                      <Badge className={getStatusColor(model.status)}>
                        {model.status === 'training' ? 'Formation' :
                         model.status === 'active' ? 'Actif' :
                         model.status === 'pending' ? 'En attente' : 'Erreur'}
                      </Badge>
                    </div>
                    
                    {model.status === 'training' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span>{model.progress}%</span>
                        </div>
                        <Progress value={model.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Époque {model.epochs} en cours
                        </p>
                      </div>
                    )}
                    
                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dernière mise à jour:</span>
                        <span className="font-medium ml-2">{model.lastUpdate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prochaine formation:</span>
                        <span className="font-medium ml-2">{model.nextTraining}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </Button>
                      {model.status !== 'training' && (
                        <Button size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Relancer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Retours Utilisateurs
              </CardTitle>
              <CardDescription>Feedback pour amélioration continue des modèles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userFeedback.map((feedback, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getFeedbackColor(feedback.feedback)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{feedback.model}</h4>
                        <p className="text-sm text-muted-foreground">
                          Par {feedback.user} • {feedback.timestamp}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getFeedbackColor(feedback.feedback)}>
                          {feedback.feedback === 'positive' ? 'Positif' :
                           feedback.feedback === 'mixed' ? 'Mitigé' : 'Négatif'}
                        </Badge>
                        <div className="text-sm mt-1">Précision: {feedback.accuracy}%</div>
                      </div>
                    </div>
                    
                    <p className="text-sm italic">"{feedback.comment}"</p>
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Intégrer Feedback
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Analyser Impact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sources de Données
              </CardTitle>
              <CardDescription>Gestion et qualité des données d'entraînement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {trainingData.map((dataset, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{dataset.dataset}</h4>
                      <Badge variant="outline">{dataset.frequency}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Enregistrements:</span>
                        <span className="font-medium">{dataset.records.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Qualité:</span>
                        <span className="font-medium">{dataset.quality}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <span className="font-medium">{dataset.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière MAJ:</span>
                        <span className="font-medium">{dataset.lastUpdate}</span>
                      </div>
                    </div>
                    
                    <Progress value={dataset.quality} className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance des Modèles
              </CardTitle>
              <CardDescription>Évolution des performances dans le temps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">91.2%</div>
                  <div className="text-sm text-green-700">Précision Moyenne</div>
                  <div className="text-xs text-muted-foreground">+2.8% ce mois</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">1.2s</div>
                  <div className="text-sm text-blue-700">Temps Réponse</div>
                  <div className="text-xs text-muted-foreground">-18% ce mois</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">97.3%</div>
                  <div className="text-sm text-purple-700">Disponibilité</div>
                  <div className="text-xs text-muted-foreground">Target: 95%</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">Recommandations d'Amélioration</h4>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Augmenter fréquence d'entraînement pour modèle saisonnier</li>
                  <li>• Enrichir données comportement clients jeunes</li>
                  <li>• Optimiser hyperparamètres modèle prédiction stock</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContinuousLearning;