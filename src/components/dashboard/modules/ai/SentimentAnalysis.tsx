import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  MessageCircle,
  Smile, 
  Meh,
  TrendingUp,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Brain,
  Zap,
  Clock,
  Activity,
  RefreshCw,
  Plus,
  FileText,
  Frown,
  Trash2,
  Save
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useSentimentAnalysis, type SentimentAnalysis as SentimentAnalysisType, type SentimentKeyword } from '@/hooks/useSentimentAnalysis';
import { useTenant } from '@/contexts/TenantContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AddFeedbackDialog from './dialogs/AddFeedbackDialog';
import FeedbackDetailDialog from './dialogs/FeedbackDetailDialog';
import KeywordConfigDialog from './dialogs/KeywordConfigDialog';
import SentimentReportDialog from './dialogs/SentimentReportDialog';

const SentimentAnalysis = () => {
  const { currentTenant } = useTenant();
  const {
    analyses,
    keywords,
    settings,
    metrics,
    isLoading,
    isAnalyzing,
    loadAnalyses,
    loadMetrics,
    loadKeywords,
    createAnalysis,
    analyzeTextRealtime,
    deleteAnalysis,
    updateKeywordImpact,
    deleteKeyword,
    getSentimentDistribution
  } = useSentimentAnalysis();

  // Local state
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [analyzerSource, setAnalyzerSource] = useState('manual');
  const [analyzerCategory, setAnalyzerCategory] = useState('');
  const [analysisResult, setAnalysisResult] = useState<{
    sentiment: string;
    score: number;
    emotions: string[];
    keywords: string[];
  } | null>(null);

  // Filters
  const [feedbackSentimentFilter, setFeedbackSentimentFilter] = useState('all');
  const [feedbackSourceFilter, setFeedbackSourceFilter] = useState('all');
  const [keywordSentimentFilter, setKeywordSentimentFilter] = useState('all');

  // Dialogs
  const [addFeedbackOpen, setAddFeedbackOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SentimentAnalysisType | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<SentimentKeyword | null>(null);
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Apply filters
  useEffect(() => {
    const filters: Record<string, string> = {};
    if (feedbackSentimentFilter !== 'all') filters.sentiment = feedbackSentimentFilter;
    if (feedbackSourceFilter !== 'all') filters.source = feedbackSourceFilter;
    loadAnalyses(filters);
  }, [feedbackSentimentFilter, feedbackSourceFilter, loadAnalyses]);

  // Get distribution for charts
  const sentimentDistribution = getSentimentDistribution();

  // Filtered keywords
  const filteredKeywords = keywords.filter(k => 
    keywordSentimentFilter === 'all' || k.sentiment === keywordSentimentFilter
  );

  // Real-time analysis
  const handleAnalyze = async () => {
    if (!textToAnalyze.trim()) return;
    
    const result = await analyzeTextRealtime(textToAnalyze);
    if (result) {
      setAnalysisResult(result);
    }
  };

  // Save analyzed text
  const handleSaveAnalysis = async () => {
    if (!textToAnalyze.trim()) return;
    
    await createAnalysis(textToAnalyze, analyzerSource, analyzerCategory || undefined);
    setTextToAnalyze('');
    setAnalysisResult(null);
  };

  // Handle feedback submission
  const handleAddFeedback = async (text: string, source: string, category?: string) => {
    await createAnalysis(text, source, category);
  };

  // Sentiment helpers
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

  const getSentimentLabel = (sentiment: string) => {
    const labels: Record<string, string> = {
      'very_positive': 'Très Positif',
      'positive': 'Positif',
      'neutral': 'Neutre',
      'negative': 'Négatif',
      'very_negative': 'Très Négatif'
    };
    return labels[sentiment] || sentiment;
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

  const sourceLabels: Record<string, string> = {
    'google_reviews': 'Google',
    'facebook': 'Facebook',
    'email': 'Email',
    'enquete': 'Enquête',
    'manual': 'Manuel'
  };

  const categoryLabels: Record<string, string> = {
    'service': 'Service Client',
    'produits': 'Produits',
    'prix': 'Prix',
    'conseil': 'Conseil',
    'horaires': 'Horaires',
    'digital': 'Digital'
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
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {analyses.length > 0 && (
              <>Dernière analyse: {format(new Date(analyses[0]?.created_at), 'dd/MM HH:mm', { locale: fr })}</>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => loadMetrics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddFeedbackOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
          <Button size="sm" onClick={() => setReportDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Rapport Complet
          </Button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Global</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics?.globalScore || 0)}`}>
              {metrics?.globalScore?.toFixed(1) || '0'}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {metrics?.totalAnalyses || 0} analyses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis Total</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground">Analysés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positifs</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.positiveRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Sentiment positif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutres</CardTitle>
            <Meh className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics?.neutralRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Sentiment neutre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Négatifs</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.negativeRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Sentiment négatif</p>
          </CardContent>
        </Card>
      </div>

      {/* 5 Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="feedback">Retours</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="analyzer">Analyseur</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
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
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
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
                    <AreaChart data={metrics?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'dd/MM')} />
                      <YAxis />
                      <Tooltip labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy')} />
                      <Area type="monotone" dataKey="positive" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Positif" />
                      <Area type="monotone" dataKey="neutral" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.6} name="Neutre" />
                      <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Négatif" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Feedback */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Retours Clients Analysés
                  </CardTitle>
                  <CardDescription>Analyse automatique des commentaires par IA</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={feedbackSentimentFilter} onValueChange={setFeedbackSentimentFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="very_positive">Très Positif</SelectItem>
                      <SelectItem value="positive">Positif</SelectItem>
                      <SelectItem value="neutral">Neutre</SelectItem>
                      <SelectItem value="negative">Négatif</SelectItem>
                      <SelectItem value="very_negative">Très Négatif</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={feedbackSourceFilter} onValueChange={setFeedbackSourceFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="google_reviews">Google</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="enquete">Enquête</SelectItem>
                      <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                  ) : analyses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune analyse trouvée. Ajoutez des feedbacks pour commencer.
                    </div>
                  ) : (
                    analyses.map((feedback) => (
                      <div 
                        key={feedback.id} 
                        className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getSentimentColor(feedback.sentiment)}`}
                        onClick={() => {
                          setSelectedAnalysis(feedback);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getSentimentIcon(feedback.sentiment)}
                            <div className="flex gap-2">
                              <Badge variant="outline">{sourceLabels[feedback.source] || feedback.source}</Badge>
                              {feedback.category && (
                                <Badge variant="outline">{categoryLabels[feedback.category] || feedback.category}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">Score: {Math.round(feedback.score * 100)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3 italic line-clamp-2">"{feedback.text}"</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {feedback.emotions?.slice(0, 3).map((emotion, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                          <Progress value={feedback.score * 100} className="w-20 h-2" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Categories */}
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
              {metrics?.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {metrics.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                            {category.score}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{categoryLabels[category.category] || category.category}</h4>
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune donnée par catégorie disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Keywords */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Analyse des Mots-clés
                  </CardTitle>
                  <CardDescription>Mots les plus fréquents et leur impact sur le sentiment</CardDescription>
                </div>
                <Select value={keywordSentimentFilter} onValueChange={setKeywordSentimentFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filtre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="positive">Positifs</SelectItem>
                    <SelectItem value="negative">Négatifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredKeywords.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredKeywords.map((keyword) => (
                    <div 
                      key={keyword.id} 
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedKeyword(keyword);
                        setKeywordDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${keyword.sentiment === 'positive' ? 'bg-green-50' : 'bg-red-50'}`}>
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
                        {keyword.impact === 'high' ? 'Élevé' : keyword.impact === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun mot-clé détecté pour le moment
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analyzer */}
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
                <label className="text-sm font-medium mb-2 block">Texte à analyser</label>
                <Textarea
                  placeholder="Saisissez un commentaire client, avis, ou feedback à analyser..."
                  value={textToAnalyze}
                  onChange={(e) => setTextToAnalyze(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Source</label>
                  <Select value={analyzerSource} onValueChange={setAnalyzerSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Saisie manuelle</SelectItem>
                      <SelectItem value="google_reviews">Google Reviews</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="enquete">Enquête</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Catégorie (optionnel)</label>
                  <Select value={analyzerCategory} onValueChange={setAnalyzerCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service Client</SelectItem>
                      <SelectItem value="produits">Produits</SelectItem>
                      <SelectItem value="prix">Prix</SelectItem>
                      <SelectItem value="conseil">Conseil</SelectItem>
                      <SelectItem value="horaires">Horaires</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleAnalyze}
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
              
              {/* Analysis Result */}
              {analysisResult ? (
                <div className={`p-4 rounded-lg border ${getSentimentColor(analysisResult.sentiment)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getSentimentIcon(analysisResult.sentiment)}
                      <div>
                        <div className="font-semibold">{getSentimentLabel(analysisResult.sentiment)}</div>
                        <div className="text-sm opacity-80">Score: {Math.round(analysisResult.score * 100)}%</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleSaveAnalysis} disabled={isAnalyzing}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                  
                  <Progress value={analysisResult.score * 100} className="mb-4 h-3" />
                  
                  {analysisResult.emotions?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium">Émotions détectées:</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {analysisResult.emotions.map((emotion, i) => (
                          <Badge key={i} variant="secondary">{emotion}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.keywords?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Mots-clés:</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {analysisResult.keywords.map((kw, i) => (
                          <Badge key={i} variant="outline">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    Les résultats d'analyse apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddFeedbackDialog
        open={addFeedbackOpen}
        onOpenChange={setAddFeedbackOpen}
        onSubmit={handleAddFeedback}
        isLoading={isAnalyzing}
        categories={settings?.categories || undefined}
        sources={settings?.sources || undefined}
      />

      <FeedbackDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        analysis={selectedAnalysis}
        onDelete={deleteAnalysis}
      />

      <KeywordConfigDialog
        open={keywordDialogOpen}
        onOpenChange={setKeywordDialogOpen}
        keyword={selectedKeyword}
        onUpdateImpact={updateKeywordImpact}
        onDelete={deleteKeyword}
      />

      <SentimentReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        metrics={metrics}
        analyses={analyses}
        keywords={keywords}
        pharmacyName={currentTenant?.name || 'PharmaSoft'}
      />
    </div>
  );
};

export default SentimentAnalysis;
