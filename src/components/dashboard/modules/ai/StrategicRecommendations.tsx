import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Lightbulb, 
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  priority: number;
  estimatedROI: string;
  timeframe: string;
  effort: 'low' | 'medium' | 'high';
  status: 'new' | 'in-progress' | 'implemented' | 'rejected';
  factors: string[];
  actions: string[];
}

const StrategicRecommendations = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  const [recommendations] = useState<Recommendation[]>([
    {
      id: '1',
      category: 'Assortiment',
      title: 'Étendre la gamme produits bio',
      description: 'L\'IA a détecté une demande croissante (+34%) pour les produits biologiques. Recommandation d\'étendre la gamme actuelle.',
      impact: 'high',
      confidence: 92,
      priority: 1,
      estimatedROI: '+€8,500/mois',
      timeframe: '4-6 semaines',
      effort: 'medium',
      status: 'new',
      factors: [
        'Demande client en hausse de 34%',
        'Marges supérieures de 15%',
        'Concurrence limitée localement',
        'Tendance marché favorable'
      ],
      actions: [
        'Identifier fournisseurs bio certifiés',
        'Négocier conditions préférentielles',
        'Planifier espace de présentation',
        'Former équipe sur produits bio'
      ]
    },
    {
      id: '2',
      category: 'Pricing',
      title: 'Optimisation prix génériques',
      description: 'Opportunité d\'ajuster les prix de 12 médicaments génériques pour améliorer la marge sans impacter les ventes.',
      impact: 'medium',
      confidence: 87,
      priority: 2,
      estimatedROI: '+€2,800/mois',
      timeframe: '1-2 semaines',
      effort: 'low',
      status: 'new',
      factors: [
        'Élasticité prix faible sur génériques',
        'Concurrence moins agressive',
        'Marge actuellement sous-optimale',
        'Loyauté client élevée'
      ],
      actions: [
        'Analyser prix concurrence',
        'Tester ajustement progressif',
        'Monitorer impact ventes',
        'Communiquer valeur ajoutée'
      ]
    },
    {
      id: '3',
      category: 'Promotion',
      title: 'Campagne ciblée vitamines hiver',
      description: 'Lancement recommandé d\'une promotion vitamines D et C avec le pic saisonnier prévu dans 2 semaines.',
      impact: 'medium',
      confidence: 89,
      priority: 3,
      estimatedROI: '+€1,200/semaine',
      timeframe: '2 semaines',
      effort: 'low',
      status: 'new',
      factors: [
        'Pic saisonnier prévu',
        'Stock suffisant disponible',
        'Historique promotions réussies',
        'Météo favorable à la demande'
      ],
      actions: [
        'Préparer supports marketing',
        'Négocier remises fournisseurs',
        'Planifier mise en avant',
        'Coordonner communication'
      ]
    },
    {
      id: '4',
      category: 'Fidélisation',
      title: 'Programme personnalisé seniors',
      description: 'Créer un programme de fidélisation spécifique aux clients seniors qui représentent 67% du CA.',
      impact: 'high',
      confidence: 85,
      priority: 1,
      estimatedROI: '+€5,200/mois',
      timeframe: '6-8 semaines',
      effort: 'high',
      status: 'new',
      factors: [
        'Segment seniors = 67% du CA',
        'Fidélité actuellement moyenne',
        'Besoins spécifiques identifiés',
        'Concurrence peu différenciée'
      ],
      actions: [
        'Définir avantages exclusifs',
        'Mettre en place système points',
        'Former équipe service senior',
        'Créer communication adaptée'
      ]
    },
    {
      id: '5',
      category: 'Cross-selling',
      title: 'Vente croisée automédication',
      description: 'Opportunités de vente croisée identifiées entre prescriptions et conseils automédication.',
      impact: 'medium',
      confidence: 91,
      priority: 2,
      estimatedROI: '+€3,100/mois',
      timeframe: '3-4 semaines',
      effort: 'medium',
      status: 'new',
      factors: [
        'Patterns d\'achat identifiés',
        'Expertise équipe élevée',
        'Marge automédication attractive',
        'Satisfaction client préservée'
      ],
      actions: [
        'Former équipe aux associations',
        'Créer aide-mémoire conseil',
        'Mettre en place alertes système',
        'Suivre taux de conversion'
      ]
    }
  ]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-50 text-red-600';
      case 'medium': return 'bg-orange-50 text-orange-600';
      case 'low': return 'bg-green-50 text-green-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'implemented': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedCategory === 'all' || rec.category.toLowerCase() === selectedCategory
  );

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    switch (sortBy) {
      case 'priority': return a.priority - b.priority;
      case 'impact': 
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      case 'confidence': return b.confidence - a.confidence;
      default: return 0;
    }
  });

  const handleImplement = (id: string) => {
    console.log('Implémenter recommandation:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejeter recommandation:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recommandations Stratégiques IA</h2>
          <p className="text-muted-foreground">
            Suggestions d'optimisation personnalisées basées sur l'analyse de vos données
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Toutes catégories</option>
            <option value="assortiment">Assortiment</option>
            <option value="pricing">Pricing</option>
            <option value="promotion">Promotion</option>
            <option value="fidélisation">Fidélisation</option>
            <option value="cross-selling">Cross-selling</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="priority">Par priorité</option>
            <option value="impact">Par impact</option>
            <option value="confidence">Par confiance</option>
          </select>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              {recommendations.filter(r => r.status === 'new').length} nouvelles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Potentiel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€21,8K</div>
            <p className="text-xs text-muted-foreground">
              Par mois estimé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance Moy.</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88.8%</div>
            <p className="text-xs text-muted-foreground">
              Fiabilité IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implémentées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des recommandations */}
      <div className="space-y-6">
        {sortedRecommendations.map((recommendation) => (
          <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(recommendation.status)}
                  <div>
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{recommendation.category}</Badge>
                      <Badge className={getImpactColor(recommendation.impact)}>
                        Impact {recommendation.impact === 'high' ? 'Élevé' : 
                                recommendation.impact === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                      <Badge className={getEffortColor(recommendation.effort)}>
                        Effort {recommendation.effort === 'high' ? 'Élevé' : 
                               recommendation.effort === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{recommendation.estimatedROI}</div>
                  <div className="text-sm text-muted-foreground">{recommendation.timeframe}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{recommendation.description}</p>
              
              {/* Métriques */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Priorité:</span>
                  <Badge variant="outline">#{recommendation.priority}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Confiance:</span>
                  <Progress value={recommendation.confidence} className="w-16 h-2" />
                  <span className="text-sm">{recommendation.confidence}%</span>
                </div>
              </div>

              <Tabs defaultValue="factors" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="factors">Facteurs Clés</TabsTrigger>
                  <TabsTrigger value="actions">Plan d'Action</TabsTrigger>
                </TabsList>
                
                <TabsContent value="factors" className="space-y-2">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Analyse IA - Facteurs déterminants:</h4>
                    <ul className="space-y-1">
                      {recommendation.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                          <BarChart3 className="h-3 w-3 mt-1 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-2">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Étapes recommandées:</h4>
                    <ul className="space-y-2">
                      {recommendation.actions.map((action, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleImplement(recommendation.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Implémenter
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleReject(recommendation.id)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4 mr-2" />
                    Analyser
                  </Button>
                  <Button size="sm" variant="ghost">
                    Programmer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedRecommendations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune recommandation</h3>
            <p className="text-muted-foreground">
              Aucune recommandation trouvée pour les filtres sélectionnés.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StrategicRecommendations;