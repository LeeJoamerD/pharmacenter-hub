import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bot,
  MessageSquare,
  Zap,
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Database,
  FileText,
  ChevronDown,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Lightbulb,
  Shield,
  BookOpen,
  Search
} from 'lucide-react';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';

interface AIConversation {
  id: string;
  title: string;
  participants: string[];
  messages: AIMessage[];
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  ai_model: string;
  context: string;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  pharmacy_id?: string;
  confidence?: number;
  suggestions?: string[];
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  specialization: string;
  status: 'active' | 'maintenance' | 'inactive';
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'trend' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  pharmacies_affected: string[];
  confidence: number;
  created_at: string;
}

const NetworkConversationalAI = () => {
  const { pharmacies, loading } = useNetworkMessaging();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Modèles IA disponibles
    const mockModels: AIModel[] = [
      {
        id: '1',
        name: 'PharmaSoft Assistant Pro',
        description: 'IA spécialisée dans les questions pharmaceutiques et réglementaires',
        capabilities: ['Consultation médicaments', 'Réglementation', 'Interactions', 'Conseils'],
        specialization: 'Pharmacie',
        status: 'active'
      },
      {
        id: '2',
        name: 'Business Intelligence AI',
        description: 'IA d\'analyse de performance et optimisation business',
        capabilities: ['Analytics', 'Prédictions', 'Optimisation', 'Reporting'],
        specialization: 'Business',
        status: 'active'
      },
      {
        id: '3',
        name: 'Technical Support Bot',
        description: 'Support technique et résolution de problèmes',
        capabilities: ['Diagnostic', 'Dépannage', 'Configuration', 'Maintenance'],
        specialization: 'Technique',
        status: 'active'
      }
    ];

    // Conversations IA
    const mockConversations: AIConversation[] = [
      {
        id: '1',
        title: 'Optimisation des stocks réseau',
        participants: ['pharmacy-1', 'pharmacy-2', 'ai-assistant'],
        messages: [
          {
            id: '1',
            role: 'system',
            content: 'Conversation démarrée pour l\'optimisation des stocks',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            role: 'user',
            content: 'Nous avons des problèmes de rupture de stock fréquentes',
            timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
            pharmacy_id: 'pharmacy-1'
          },
          {
            id: '3',
            role: 'assistant',
            content: 'J\'ai analysé vos données de stock. Je recommande d\'ajuster les seuils de réapprovisionnement pour 15 produits clés.',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            confidence: 0.92,
            suggestions: ['Ajuster seuils', 'Optimiser rotations', 'Prévoir demande']
          }
        ],
        status: 'active',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        ai_model: 'PharmaSoft Assistant Pro',
        context: 'gestion_stock'
      },
      {
        id: '2',
        title: 'Formation sur nouveaux protocoles',
        participants: ['pharmacy-1', 'pharmacy-2', 'pharmacy-3', 'ai-assistant'],
        messages: [
          {
            id: '1',
            role: 'system',
            content: 'Session de formation IA démarrée',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Bonjour ! Je vais vous accompagner dans l\'apprentissage des nouveaux protocoles de dispensation.',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            confidence: 0.98
          }
        ],
        status: 'active',
        created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        ai_model: 'PharmaSoft Assistant Pro',
        context: 'formation'
      }
    ];

    // Insights IA
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'recommendation',
        title: 'Optimisation des commandes groupées',
        description: 'L\'IA recommande de regrouper les commandes de 3 officines pour économiser 15% sur les frais de livraison',
        impact: 'high',
        pharmacies_affected: ['pharmacy-1', 'pharmacy-2', 'pharmacy-3'],
        confidence: 0.87,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'alert',
        title: 'Pic de demande prévu',
        description: 'Augmentation prévue de 30% de la demande en produits anti-allergiques cette semaine',
        impact: 'medium',
        pharmacies_affected: ['pharmacy-1', 'pharmacy-2'],
        confidence: 0.78,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'trend',
        title: 'Évolution des consultations',
        description: 'Tendance croissante des consultations en fin de journée (+25% sur 2 semaines)',
        impact: 'low',
        pharmacies_affected: ['pharmacy-1'],
        confidence: 0.92,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    setAIModels(mockModels);
    setConversations(mockConversations);
    setInsights(mockInsights);
    if (mockConversations.length > 0) {
      setSelectedConversation(mockConversations[0].id);
    }
    if (mockModels.length > 0) {
      setSelectedModel(mockModels[0].id);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'optimization': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !selectedConversation) return;

    const newMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
      pharmacy_id: 'current-pharmacy'
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, messages: [...conv.messages, newMessage] }
        : conv
    ));

    setCurrentMessage('');

    // Simuler une réponse de l'IA
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Je traite votre demande et analyse les données du réseau pour vous fournir la meilleure réponse possible.',
        timestamp: new Date().toISOString(),
        confidence: 0.89,
        suggestions: ['Analyser données', 'Proposer solutions', 'Suivre métriques']
      };

      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, messages: [...conv.messages, aiResponse] }
          : conv
      ));
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Bot className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Chargement de l'IA réseau...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Assistant IA Réseau Conversationnel
          </h1>
          <p className="text-muted-foreground">
            Intelligence artificielle collaborative avancée pour le réseau multi-officines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configuration IA
          </Button>
          <Button>
            <MessageSquare className="h-4 w-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>
      </div>

      {/* Métriques IA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations Actives</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {conversations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modèles IA</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiModels.filter(m => m.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Modèles disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Générés</CardTitle>
            <Lightbulb className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiabilité IA</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Taux de confiance moyen
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="models">Modèles IA</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        {/* Conversations IA */}
        <TabsContent value="conversations" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Liste des conversations */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {conversations.map((conv) => (
                      <div 
                        key={conv.id} 
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{conv.title}</h4>
                          <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                            {conv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{conv.ai_model}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{conv.participants.length - 1} participants</span>
                          <span>{conv.messages.length} messages</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {conversations.find(c => c.id === selectedConversation)?.title || 'Sélectionner une conversation'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      {conversations.find(c => c.id === selectedConversation)?.ai_model}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4">
                  <div className="space-y-4">
                    {conversations.find(c => c.id === selectedConversation)?.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : message.role === 'assistant'
                            ? 'bg-muted'
                            : 'bg-muted/50'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          {message.confidence && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Confiance: {Math.round(message.confidence * 100)}%
                              </Badge>
                            </div>
                          )}
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.suggestions.map((suggestion, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tapez votre message..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modèles IA */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Modèles IA Disponibles
              </CardTitle>
              <CardDescription>
                Gestion et configuration des modèles d'intelligence artificielle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {aiModels.map((model) => (
                  <div key={model.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{model.name}</h4>
                      <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                        {model.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{model.specialization}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Tester
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights IA */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights et Recommandations IA
              </CardTitle>
              <CardDescription>
                Analyses intelligentes et recommandations générées par l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getImpactColor(insight.impact)}`}>
                          {getTypeIcon(insight.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Confiance: {Math.round(insight.confidence * 100)}%</div>
                        <div>Impact: {insight.impact}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{insight.pharmacies_affected.length} officines concernées</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                        <Button size="sm">
                          Appliquer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration IA */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Généraux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Assistant vocal</Label>
                    <p className="text-sm text-muted-foreground">Activer les réponses vocales</p>
                  </div>
                  <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reconnaissance vocale</Label>
                    <p className="text-sm text-muted-foreground">Dictée vocale des messages</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-suggestions</Label>
                    <p className="text-sm text-muted-foreground">Suggestions automatiques</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Modèle IA par défaut</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité et Confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Chiffrement des conversations</Label>
                    <p className="text-sm text-muted-foreground">Sécurise les échanges</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit des interactions</Label>
                    <p className="text-sm text-muted-foreground">Traçabilité des échanges</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Données anonymisées</Label>
                    <p className="text-sm text-muted-foreground">Protection de la vie privée</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Rétention des données</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="90">90 jours</SelectItem>
                      <SelectItem value="365">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkConversationalAI;