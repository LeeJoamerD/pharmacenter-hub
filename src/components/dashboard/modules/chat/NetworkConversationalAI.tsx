import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Bot,
  MessageSquare,
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Settings,
  Play,
  Pause,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Target,
  Lightbulb,
  Shield,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Download,
  FileText,
  Loader2,
  Wrench,
  Save
} from 'lucide-react';
import { useNetworkConversationalAI, AIConversation, AIMessage, AIModel, AIInsight } from '@/hooks/useNetworkConversationalAI';
import CreateConversationDialog from './dialogs/CreateConversationDialog';
import ConfigureModelDialog from './dialogs/ConfigureModelDialog';
import TestModelDialog from './dialogs/TestModelDialog';
import InsightDetailDialog from './dialogs/InsightDetailDialog';
import { exportConversationsToExcel, exportInsightsToExcel } from '@/utils/networkAIExportUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NetworkConversationalAI = () => {
  const {
    conversations,
    messages,
    aiModels,
    insights,
    settings,
    loading,
    streamingMessage,
    isStreaming,
    loadConversations,
    loadAIModels,
    loadInsights,
    loadSettings,
    createConversation,
    updateConversation,
    deleteConversation,
    loadConversationMessages,
    sendMessage,
    createAIModel,
    updateAIModel,
    testAIModel,
    markInsightAsRead,
    applyInsight,
    dismissInsight,
    saveSettings,
    getConversationStats,
    getAverageConfidence
  } = useNetworkConversationalAI();

  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [insightFilter, setInsightFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  
  // Dialogs
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [showConfigureModel, setShowConfigureModel] = useState(false);
  const [showTestModel, setShowTestModel] = useState(false);
  const [showInsightDetail, setShowInsightDetail] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  // Local settings state
  const [localSettings, setLocalSettings] = useState({
    voice_assistant: false,
    voice_recognition: false,
    auto_suggestions: true,
    default_model_id: '',
    conversation_encryption: true,
    audit_interactions: true,
    anonymize_data: false,
    data_retention_days: 90
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadAIModels();
    loadInsights();
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        voice_assistant: settings.voice_assistant ?? false,
        voice_recognition: settings.voice_recognition ?? false,
        auto_suggestions: settings.auto_suggestions ?? true,
        default_model_id: settings.default_model_id ?? '',
        conversation_encryption: settings.conversation_encryption ?? true,
        audit_interactions: settings.audit_interactions ?? true,
        anonymize_data: settings.anonymize_data ?? false,
        data_retention_days: settings.data_retention_days ?? 90
      });
    }
  }, [settings]);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const stats = getConversationStats();
  const avgConfidence = getAverageConfidence();

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedConversation || isStreaming) return;
    
    const messageText = currentMessage;
    setCurrentMessage('');
    await sendMessage(selectedConversation, messageText);
  };

  const handleCreateConversation = async (data: { title: string; modelId: string; context: string; participants: string[] }) => {
    const newConv = await createConversation(data.title, data.modelId, data.context, data.participants);
    if (newConv) {
      setSelectedConversation(newConv.id);
      setShowCreateConversation(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (selectedConversation === id) {
      setSelectedConversation('');
    }
  };

  const handlePauseResume = async (conv: AIConversation) => {
    const newStatus = conv.status === 'active' ? 'paused' : 'active';
    await updateConversation(conv.id, { status: newStatus });
  };

  const handleConfigureModel = (model: AIModel) => {
    setSelectedModel(model);
    setShowConfigureModel(true);
  };

  const handleTestModel = (model: AIModel) => {
    setSelectedModel(model);
    setShowTestModel(true);
  };

  const handleSaveModelConfig = async (modelId: string, config: { max_tokens: number; temperature: number }) => {
    await updateAIModel(modelId, config);
    setShowConfigureModel(false);
  };

  const handleViewInsight = (insight: AIInsight) => {
    setSelectedInsight(insight);
    setShowInsightDetail(true);
    if (!insight.is_read) {
      markInsightAsRead(insight.id);
    }
  };

  const handleApplyInsight = async (id: string) => {
    await applyInsight(id);
    setShowInsightDetail(false);
  };

  const handleDismissInsight = async (id: string) => {
    await dismissInsight(id);
    setShowInsightDetail(false);
  };

  const handleSaveSettings = async () => {
    await saveSettings(localSettings);
    toast.success('Configuration sauvegardée');
  };

  const filteredInsights = insights.filter(insight => {
    if (insightFilter !== 'all' && insight.type !== insightFilter) return false;
    if (impactFilter !== 'all' && insight.impact !== impactFilter) return false;
    return true;
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted';
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

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Bot className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement de l'IA réseau...</p>
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
          <Button variant="outline" onClick={() => loadInsights()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateConversation(true)}>
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
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total} total
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
              {aiModels.length} modèles disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Générés</CardTitle>
            <Lightbulb className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.filter(i => !i.is_read).length}</div>
            <p className="text-xs text-muted-foreground">
              Non lus sur {insights.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiabilité IA</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfidence}%</div>
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
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversations
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setShowCreateConversation(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {conversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune conversation</p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => setShowCreateConversation(true)}
                        >
                          Créer une conversation
                        </Button>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div 
                          key={conv.id} 
                          className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                            selectedConversation === conv.id 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-muted border-transparent'
                          }`}
                          onClick={() => setSelectedConversation(conv.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm truncate">{conv.title}</h4>
                            <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                              {conv.status === 'active' ? 'Actif' : conv.status === 'paused' ? 'En pause' : 'Terminé'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{conv.context}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{(conv.participants as string[])?.length || 0} participants</span>
                            <span>{format(new Date(conv.created_at), 'dd/MM HH:mm', { locale: fr })}</span>
                          </div>
                        </div>
                      ))
                    )}
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
                      {selectedConv?.title || 'Sélectionner une conversation'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      {selectedConv?.context || 'Assistant IA'}
                    </CardDescription>
                  </div>
                  {selectedConv && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsListening(!isListening)}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                      >
                        {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseResume(selectedConv)}
                      >
                        {selectedConv.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConversation(selectedConv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4">
                  <div className="space-y-4 pr-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : message.role === 'assistant'
                            ? 'bg-muted'
                            : 'bg-muted/50 text-xs'
                        }`}>
                          {message.sender_name && (
                            <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.confidence && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Confiance: {Math.round(message.confidence * 100)}%
                              </Badge>
                            </div>
                          )}
                          {message.suggestions && (message.suggestions as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(message.suggestions as string[]).map((suggestion, idx) => (
                                <Button key={idx} variant="ghost" size="sm" className="text-xs h-6 px-2">
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {streamingMessage && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                          <Loader2 className="h-3 w-3 animate-spin mt-1" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {selectedConv && (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Tapez votre message..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={isStreaming || selectedConv.status !== 'active'}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isStreaming || selectedConv.status !== 'active'}
                    >
                      {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modèles IA */}
        <TabsContent value="models" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Modèles IA Disponibles</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportConversationsToExcel(conversations, 'PharmaSoft')}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      {model.name}
                    </CardTitle>
                    <Badge variant={model.status === 'active' ? 'default' : model.status === 'maintenance' ? 'secondary' : 'outline'}>
                      {model.status === 'active' ? 'Actif' : model.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                    </Badge>
                  </div>
                  <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Spécialisation</Label>
                      <p className="font-medium">{model.specialization}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Capacités</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(model.capabilities as string[] || []).map((cap, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                        <p className="font-medium">{model.max_tokens || 2048}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Température</Label>
                        <p className="font-medium">{model.temperature || 0.7}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleConfigureModel(model)}>
                        <Wrench className="h-4 w-4 mr-1" />
                        Configurer
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleTestModel(model)}>
                        <Play className="h-4 w-4 mr-1" />
                        Tester
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-lg font-semibold">Insights IA Générés</h3>
            <div className="flex gap-2 flex-wrap">
              <Select value={insightFilter} onValueChange={setInsightFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="recommendation">Recommandations</SelectItem>
                  <SelectItem value="alert">Alertes</SelectItem>
                  <SelectItem value="trend">Tendances</SelectItem>
                  <SelectItem value="optimization">Optimisations</SelectItem>
                </SelectContent>
              </Select>
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les impacts</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => exportInsightsToExcel(insights, 'PharmaSoft')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInsights.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun insight correspondant aux filtres</p>
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <Card key={insight.id} className={!insight.is_read ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(insight.type)}
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact}
                        </Badge>
                      </div>
                      {!insight.is_read && <Badge variant="outline" className="text-xs">Nouveau</Badge>}
                    </div>
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{insight.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confiance</span>
                        <span className="font-medium">{Math.round((insight.confidence || 0) * 100)}%</span>
                      </div>
                      <Progress value={(insight.confidence || 0) * 100} className="h-1" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(insight.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleViewInsight(insight)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                    {insight.is_applied && (
                      <Badge variant="secondary" className="mt-2 w-full justify-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Appliqué
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Paramètres Généraux */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Généraux
                </CardTitle>
                <CardDescription>Configuration générale de l'assistant IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Assistant vocal</Label>
                    <p className="text-xs text-muted-foreground">Activer les réponses vocales</p>
                  </div>
                  <Switch 
                    checked={localSettings.voice_assistant}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, voice_assistant: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reconnaissance vocale</Label>
                    <p className="text-xs text-muted-foreground">Activer la saisie vocale</p>
                  </div>
                  <Switch 
                    checked={localSettings.voice_recognition}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, voice_recognition: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-suggestions</Label>
                    <p className="text-xs text-muted-foreground">Suggérer des réponses automatiques</p>
                  </div>
                  <Switch 
                    checked={localSettings.auto_suggestions}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_suggestions: checked }))}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Modèle IA par défaut</Label>
                  <Select 
                    value={localSettings.default_model_id} 
                    onValueChange={(value) => setLocalSettings(prev => ({ ...prev, default_model_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.filter(m => m.status === 'active').map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sécurité & Confidentialité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité & Confidentialité
                </CardTitle>
                <CardDescription>Paramètres de sécurité des conversations IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Chiffrement des conversations</Label>
                    <p className="text-xs text-muted-foreground">Chiffrer toutes les conversations</p>
                  </div>
                  <Switch 
                    checked={localSettings.conversation_encryption}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, conversation_encryption: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit des interactions</Label>
                    <p className="text-xs text-muted-foreground">Journaliser les interactions IA</p>
                  </div>
                  <Switch 
                    checked={localSettings.audit_interactions}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, audit_interactions: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Données anonymisées</Label>
                    <p className="text-xs text-muted-foreground">Anonymiser les données dans les logs</p>
                  </div>
                  <Switch 
                    checked={localSettings.anonymize_data}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, anonymize_data: checked }))}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Rétention des données</Label>
                  <Select 
                    value={String(localSettings.data_retention_days)} 
                    onValueChange={(value) => setLocalSettings(prev => ({ ...prev, data_retention_days: parseInt(value) }))}
                  >
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

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les paramètres
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateConversationDialog
        open={showCreateConversation}
        onOpenChange={setShowCreateConversation}
        aiModels={aiModels}
        onCreateConversation={createConversation}
      />

      {selectedModel && (
        <>
          <ConfigureModelDialog
            open={showConfigureModel}
            onOpenChange={setShowConfigureModel}
            model={selectedModel}
            onSave={handleSaveModelConfig}
          />
          <TestModelDialog
            open={showTestModel}
            onOpenChange={setShowTestModel}
            model={selectedModel}
            onTest={testAIModel}
          />
        </>
      )}

      {selectedInsight && (
        <InsightDetailDialog
          open={showInsightDetail}
          onOpenChange={setShowInsightDetail}
          insight={selectedInsight}
          pharmacies={[]}
          onApply={handleApplyInsight}
          onDismiss={handleDismissInsight}
        />
      )}
    </div>
  );
};

export default NetworkConversationalAI;
