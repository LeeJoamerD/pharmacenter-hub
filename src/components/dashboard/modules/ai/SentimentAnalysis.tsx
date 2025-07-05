import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  MessageCircle,
  Heart,
  Frown,
  Smile, 
  Meh,
  TrendingUp,
  AlertTriangle,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Brain,
  Zap,
  Clock,
  Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

const SentimentAnalysis = () => {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Données d'analyse de sentiment globale
  const [sentimentOverview] = useState({
    globalScore: 4.2,
    totalReviews: 1247,
    positiveRate: 78,
    neutralRate: 15,
    negativeRate: 7,
    trend: '+0.3'
  });

  // Distribution des sentiments
  const [sentimentDistribution] = useState([
    { name: 'Très Positif', value: 45, color: '#10b981', count: 562 },
    { name: 'Positif', value: 33, color: '#34d399', count: 411 },
    { name: 'Neutre', value: 15, color: '#6b7280', count: 187 },
    { name: 'Négatif', value: 5, color: '#f59e0b', count: 62 },
    { name: 'Très Négatif', value: 2, color: '#ef4444', count: 25 }
  ]);

  // Évolution temporelle du sentiment
  const [sentimentTrend] = useState([
    { date: '2025-01-01', positive: 72, neutral: 18, negative: 10, score: 4.1 },
    { date: '2025-01-02', positive: 75, neutral: 16, negative: 9, score: 4.2 },
    { date: '2025-01-03', positive: 78, neutral: 15, negative: 7, score: 4.3 },
    { date: '2025-01-04', positive: 76, neutral: 17, negative: 7, score: 4.2 },
    { date: '2025-01-05', positive: 78, neutral: 15, negative: 7, score: 4.2 }
  ]);

  // Retours clients récents avec analyse
  const [customerFeedback] = useState([
    {
      id: 1,
      text: "Excellent service, pharmacien très compétent et à l'écoute. Conseils précieux pour ma prescription.",
      sentiment: 'very_positive',
      score: 0.95,
      emotions: ['satisfaction', 'confiance', 'gratitude'],
      category: 'service',
      date: '2025-01-05 14:30',
      source: 'Google Reviews'
    },
    {
      id: 2,
      text: "Attente un peu longue mais personnel professionnel. Produits toujours disponibles.",
      sentiment: 'positive',
      score: 0.72,
      emotions: ['patience', 'satisfaction'],
      category: 'service',
      date: '2025-01-05 12:15',
      source: 'Facebook'
    },
    {
      id: 3,
      text: "Prix corrects, bonne gamme de produits bio. Juste dommage que ce soit fermé le dimanche.",
      sentiment: 'neutral',
      score: 0.58,
      emotions: ['satisfaction', 'déception'],
      category: 'horaires',
      date: '2025-01-05 10:45',
      source: 'Enquête'
    },
    {
      id: 4,
      text: "Problème avec ma commande en ligne, pas reçu de notification. Service client à améliorer.",
      sentiment: 'negative',
      score: 0.25,
      emotions: ['frustration', 'déception'],
      category: 'digital',
      date: '2025-01-04 16:20',
      source: 'Email'
    }
  ]);

  // Analyse par catégorie
  const [categoryAnalysis] = useState([
    { category: 'Service Client', score: 4.5, volume: 456, trend: '+0.2' },
    { category: 'Produits', score: 4.3, volume: 332, trend: '+0.1' },
    { category: 'Prix', score: 3.8, volume: 278, trend: '-0.1' },
    { category: 'Conseil Pharmaceutique', score: 4.7, volume: 234, trend: '+0.4' },
    { category: 'Horaires', score: 3.2, volume: 156, trend: '0.0' },
    { category: 'Digital/Site', score: 3.5, volume: 89, trend: '+0.3' }
  ]);

  // Mots-clés fréquents
  const [keywordAnalysis] = useState([
    { word: 'professionnel', sentiment: 'positive', frequency: 89, impact: 'high' },
    { word: 'compétent', sentiment: 'positive', frequency: 76, impact: 'high' },
    { word: 'rapide', sentiment: 'positive', frequency: 65, impact: 'medium' },
    { word: 'cher', sentiment: 'negative', frequency: 43, impact: 'medium' },
    { word: 'attente', sentiment: 'negative', frequency: 38, impact: 'medium' },
    { word: 'conseil', sentiment: 'positive', frequency: 92, impact: 'high' },
    { word: 'disponible', sentiment: 'positive', frequency: 54, impact: 'medium' },
    { word: 'fermé', sentiment: 'negative', frequency: 29, impact: 'low' }
  ]);

  const analyzeSentiment = async () => {
    if (!textToAnalyze.trim()) return;
    
    setIsAnalyzing(true);
    // Simulation analyse NLP
    setTimeout(() => {
      setIsAnalyzing(false);
      // Ici on afficherait le résultat de l'analyse
    }, 2000);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'very_positive': return <Smile className="h-5 w-5 text-green-600" />;
      case 'positive': return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case 'neutral': return <Meh className="h-5 w-5 text-gray-500" />;
      case 'negative': return <ThumbsDown className="h-5 w-5 text-orange-500" />;
      case 'very_negative': return <Frown className="h-5 w-5 text-red-600" />;
      default: return <Eye className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'very_positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'positive': return 'text-green-500 bg-green-50 border-green-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'negative': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-green-500';
    if (score >= 3.5) return 'text-yellow-600';
    if (score >= 3.0) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyse de Sentiment IA</h2>
          <p className="text-muted-foreground">
            Traitement du langage naturel pour comprendre la satisfaction client
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Dernière analyse: Il y a 15 min
          </div>
          <Button size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Rapport Complet
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Global</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentimentOverview.globalScore}/5</div>
            <p className="text-xs text-green-600">
              {sentimentOverview.trend} vs hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis Total</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentimentOverview.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Analysés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positifs</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentimentOverview.positiveRate}%</div>
            <p className="text-xs text-muted-foreground">
              Sentiment positif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutres</CardTitle>
            <Meh className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{sentimentOverview.neutralRate}%</div>
            <p className="text-xs text-muted-foreground">
              Sentiment neutre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Négatifs</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sentimentOverview.negativeRate}%</div>
            <p className="text-xs text-muted-foreground">
              Sentiment négatif
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="feedback">Retours</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="analyzer">Analyseur</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Distribution des Sentiments
                </CardTitle>
                <CardDescription>Répartition des avis par sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-2 mt-4">
                  {sentimentDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.value}%</span>
                        <span className="text-muted-foreground">({item.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Évolution Sentiment
                </CardTitle>
                <CardDescription>Tendance du sentiment client dans le temps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="positive" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="neutral" 
                        stackId="1"
                        stroke="#6b7280" 
                        fill="#6b7280"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="negative" 
                        stackId="1"
                        stroke="#ef4444" 
                        fill="#ef4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Retours Clients Analysés
              </CardTitle>
              <CardDescription>Analyse automatique des commentaires par IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerFeedback.map((feedback) => (
                  <div key={feedback.id} className={`p-4 border rounded-lg ${getSentimentColor(feedback.sentiment)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSentimentIcon(feedback.sentiment)}
                        <div>
                          <Badge variant="outline">{feedback.source}</Badge>
                          <Badge className="ml-2" variant="outline">{feedback.category}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Score: {(feedback.score * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">{feedback.date}</div>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 italic">"{feedback.text}"</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {feedback.emotions.map((emotion, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {emotion}
                          </Badge>
                        ))}
                      </div>
                      <Progress value={feedback.score * 100} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse par Catégorie
              </CardTitle>
              <CardDescription>Performance du sentiment par domaine d'activité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryAnalysis.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                          {category.score}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">{category.category}</h4>
                        <p className="text-sm text-muted-foreground">{category.volume} avis analysés</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={category.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 
                                     category.trend.startsWith('-') ? 'bg-red-50 text-red-600' :
                                     'bg-gray-50 text-gray-600'}>
                        {category.trend}
                      </Badge>
                      <Progress value={category.score * 20} className="w-16 h-2 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Analyse des Mots-clés
              </CardTitle>
              <CardDescription>Mots les plus fréquents et leur impact sur le sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {keywordAnalysis.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        keyword.sentiment === 'positive' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {keyword.sentiment === 'positive' ? 
                          <ThumbsUp className="h-4 w-4 text-green-600" /> :
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <span className="font-medium">"{keyword.word}"</span>
                        <div className="text-xs text-muted-foreground">
                          {keyword.frequency} mentions
                        </div>
                      </div>
                    </div>
                    <Badge className={
                      keyword.impact === 'high' ? 'bg-red-50 text-red-600' :
                      keyword.impact === 'medium' ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }>
                      {keyword.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Analyseur de Sentiment en Temps Réel
              </CardTitle>
              <CardDescription>Testez l'analyse IA sur vos propres textes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Texte à analyser
                </label>
                <Textarea
                  placeholder="Saisissez un commentaire client, avis, ou feedback à analyser..."
                  value={textToAnalyze}
                  onChange={(e) => setTextToAnalyze(e.target.value)}
                  className="min-h-24"
                />
              </div>
              
              <Button 
                onClick={analyzeSentiment}
                disabled={!textToAnalyze.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyser le Sentiment
                  </>
                )}
              </Button>
              
              {/* Zone de résultat d'analyse - à implémenter */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Les résultats d'analyse apparaîtront ici
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SentimentAnalysis;