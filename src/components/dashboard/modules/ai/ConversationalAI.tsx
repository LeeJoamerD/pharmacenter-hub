import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Lightbulb,
  TrendingUp,
  Package,
  Users,
  Plus,
  RefreshCw,
  Download,
  Play,
  Pause,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Brain,
  Cpu,
  BarChart3,
  Shield,
  Loader2,
  X,
  Save
} from 'lucide-react';
import { useNetworkConversationalAI, AIConversation, AIMessage, AIModel, AIInsight, AISettings } from '@/hooks/useNetworkConversationalAI';
import CreateConversationDialog from '../chat/dialogs/CreateConversationDialog';
import ConfigureModelDialog from '../chat/dialogs/ConfigureModelDialog';
import TestModelDialog from '../chat/dialogs/TestModelDialog';
import InsightDetailDialog from '../chat/dialogs/InsightDetailDialog';
import { exportConversationsToPDF, exportConversationsToExcel, exportInsightsToPDF, exportInsightsToExcel } from '@/utils/networkAIExportUtils';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

const ConversationalAI = () => {
  const { currentTenant } = useTenant();
  const pharmacyName = (currentTenant as any)?.nom_pharmacie || currentTenant?.name || 'Pharmacie';
  
  const {
    conversations,
    messages,
    aiModels,
    insights,
    settings,
    loading,
    streaming,
    streamingContent,
    loadConversations,
    loadMessages,
    createConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    cancelStreaming,
    loadAIModels,
    createAIModel,
    updateAIModel,
    deleteAIModel,
    toggleModelStatus,
    setDefaultModel,
    testAIModel,
    loadInsights,
    markInsightAsRead,
    applyInsight,
    dismissInsight,
    loadSettings,
    saveSettings,
    getConversationStats,
    getAverageConfidence,
  } = useNetworkConversationalAI();

  // State
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConfigureDialog, setShowConfigureDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showInsightDialog, setShowInsightDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  
  // Filter states
  const [insightTypeFilter, setInsightTypeFilter] = useState<string>('all');
  const [insightImpactFilter, setInsightImpactFilter] = useState<string>('all');
  
  // Settings state
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    loadConversations();
    loadAIModels();
    loadInsights();
    loadSettings();
  }, []);

  // Update local settings when settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  // Stats
  const stats = getConversationStats();
  const avgConfidence = getAverageConfidence();
  const activeModels = aiModels.filter(m => m.status === 'active').length;
  const unreadInsights = insights.filter(i => !i.is_read).length;

  // Send message handler
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation) return;
    
    const messageContent = inputValue;
    setInputValue('');
    await sendMessage(selectedConversation.id, messageContent, selectedConversation.ai_model_id || undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
  };

  // Model actions
  const handleConfigureModel = (model: AIModel) => {
    setSelectedModel(model);
    setShowConfigureDialog(true);
  };

  const handleTestModel = (model: AIModel) => {
    setSelectedModel(model);
    setShowTestDialog(true);
  };

  // Insight actions
  const handleViewInsight = (insight: AIInsight) => {
    setSelectedInsight(insight);
    markInsightAsRead(insight.id);
    setShowInsightDialog(true);
  };

  // Export handlers
  const handleExport = (format: 'pdf' | 'excel') => {
    if (activeTab === 'chat') {
      if (format === 'pdf') {
        exportConversationsToPDF(conversations as any[], pharmacyName);
      } else {
        exportConversationsToExcel(conversations as any[], pharmacyName);
      }
    } else if (activeTab === 'insights') {
      if (format === 'pdf') {
        exportInsightsToPDF(insights as any[], pharmacyName);
      } else {
        exportInsightsToExcel(insights as any[], pharmacyName);
      }
    }
    toast.success(`Export ${format.toUpperCase()} généré`);
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await saveSettings(localSettings);
    setSavingSettings(false);
  };

  // Quick action suggestions
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  // Filter insights
  const filteredInsights = insights.filter(insight => {
    if (insightTypeFilter !== 'all' && insight.type !== insightTypeFilter) return false;
    if (insightImpactFilter !== 'all' && insight.impact !== insightImpactFilter) return false;
    return true;
  });

  // Get type/impact labels and colors
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      recommendation: 'Recommandation',
      alert: 'Alerte',
      trend: 'Tendance',
      optimization: 'Optimisation',
    };
    return labels[type] || type;
  };

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[impact] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assistant IA Conversationnel</h2>
          <p className="text-muted-foreground">
            Discutez avec l'IA pour obtenir des insights et recommandations
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={() => {
              loadConversations();
              loadAIModels();
              loadInsights();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Conversation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations Actives</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.total} au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modèles IA</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModels}</div>
            <p className="text-xs text-muted-foreground">{aiModels.length} disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Non Lus</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadInsights}</div>
            <p className="text-xs text-muted-foreground">{insights.length} insights au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiabilité IA</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfidence}%</div>
            <p className="text-xs text-muted-foreground">Confiance moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Modèles IA
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
            {unreadInsights > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {unreadInsights}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune conversation</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        Créer une conversation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedConversation?.id === conv.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedConversation(conv)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{conv.title}</span>
                            <Badge variant={conv.status === 'active' ? 'default' : 'secondary'} className="ml-2 text-xs">
                              {conv.status === 'active' ? 'Actif' : conv.status === 'paused' ? 'Pause' : 'Terminé'}
                            </Badge>
                          </div>
                          <p className="text-xs opacity-75 truncate mt-1">{conv.context}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2 h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      {selectedConversation?.title || 'Sélectionnez une conversation'}
                    </CardTitle>
                    <CardDescription>
                      {selectedConversation?.context || 'Posez vos questions en langage naturel'}
                    </CardDescription>
                  </div>
                  {selectedConversation && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateConversation(selectedConversation.id, { 
                          status: selectedConversation.status === 'active' ? 'paused' : 'active' 
                        })}
                      >
                        {selectedConversation.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          deleteConversation(selectedConversation.id);
                          setSelectedConversation(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {!selectedConversation ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Bot className="h-12 w-12 mb-4 opacity-50" />
                        <p>Sélectionnez ou créez une conversation pour commencer</p>
                      </div>
                    ) : messages.length === 0 && !streaming ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                        <p>Envoyez un message pour démarrer la conversation</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {message.role === 'assistant' ? (
                                  <Bot className="h-4 w-4 text-primary" />
                                ) : message.role === 'user' ? (
                                  <User className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Settings className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {message.role === 'assistant' ? 'Assistant IA' : message.role === 'user' ? 'Vous' : 'Système'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleTimeString()}
                                </span>
                                {message.confidence && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(message.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                              
                              <div className={`p-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : message.role === 'system'
                                  ? 'bg-muted/50 border'
                                  : 'bg-muted'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>

                              {/* Suggestions */}
                              {message.suggestions && message.suggestions.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.suggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="block w-full text-left text-xs p-2 bg-primary/10 hover:bg-primary/20 rounded text-primary transition-colors"
                                    >
                                      💡 {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Streaming indicator */}
                        {streaming && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%]">
                              <div className="flex items-center gap-2 mb-1">
                                <Bot className="h-4 w-4 text-primary" />
                                <span className="text-xs text-muted-foreground">Assistant IA</span>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                {streamingContent ? (
                                  <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                                ) : (
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                )}
                              </div>
                              {streaming && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="mt-1"
                                  onClick={cancelStreaming}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Annuler
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedConversation ? "Tapez votre question ici..." : "Sélectionnez une conversation"}
                        className="pr-12"
                        disabled={!selectedConversation || streaming}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={toggleVoice}
                        disabled={!selectedConversation}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!inputValue.trim() || !selectedConversation || streaming}
                    >
                      {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar - Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick('Analyser les ventes de cette semaine')}
                    disabled={!selectedConversation}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyser Ventes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick('État du stock et alertes')}
                    disabled={!selectedConversation}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Vérifier Stock
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick('Analyse comportement clients')}
                    disabled={!selectedConversation}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Analyser Clients
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick('Recommandations d\'optimisation')}
                    disabled={!selectedConversation}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Optimisations
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statut IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connexion</span>
                    <Badge className="bg-green-50 text-green-600">Connecté</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modèles</span>
                    <Badge className="bg-blue-50 text-blue-600">{activeModels} Actifs</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fiabilité</span>
                    <Badge className="bg-orange-50 text-orange-600">{avgConfidence}%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Gérez les modèles IA disponibles pour vos conversations</p>
            <Button size="sm" onClick={() => createAIModel({
              name: 'Nouveau Modèle',
              provider: 'lovable',
              model_identifier: 'google/gemini-2.5-flash',
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Modèle
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      {model.name}
                    </CardTitle>
                    <Badge className={getStatusColor(model.status)}>
                      {model.status === 'active' ? 'Actif' : model.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                    </Badge>
                  </div>
                  <CardDescription>{model.description || 'Aucune description'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Provider:</span>{' '}
                      <span className="font-medium">{model.provider}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tokens:</span>{' '}
                      <span className="font-medium">{model.max_tokens}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Temp:</span>{' '}
                      <span className="font-medium">{model.temperature}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spéc:</span>{' '}
                      <span className="font-medium">{model.specialization}</span>
                    </div>
                  </div>

                  {model.capabilities && model.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.slice(0, 3).map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                      {model.capabilities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{model.capabilities.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleConfigureModel(model)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configurer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleTestModel(model)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Tester
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleModelStatus(model.id, model.status === 'active' ? 'inactive' : 'active')}
                    >
                      {model.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>

                  {model.is_default && (
                    <Badge className="w-full justify-center bg-primary/10 text-primary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Modèle par défaut
                    </Badge>
                  )}
                  {!model.is_default && model.status === 'active' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setDefaultModel(model.id)}
                    >
                      Définir par défaut
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Select value={insightTypeFilter} onValueChange={setInsightTypeFilter}>
                <SelectTrigger className="w-[180px]">
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

              <Select value={insightImpactFilter} onValueChange={setInsightImpactFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les impacts</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredInsights.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Aucun insight disponible</p>
                </CardContent>
              </Card>
            ) : (
              filteredInsights.map((insight) => (
                <Card key={insight.id} className={!insight.is_read ? 'border-primary/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {insight.type === 'alert' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : insight.type === 'recommendation' ? (
                            <Lightbulb className="h-5 w-5 text-blue-600" />
                          ) : insight.type === 'trend' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                          )}
                          <h4 className="font-semibold">{insight.title}</h4>
                          {!insight.is_read && (
                            <Badge variant="secondary" className="text-xs">Nouveau</Badge>
                          )}
                          {insight.is_applied && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Appliqué</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getTypeLabel(insight.type)}</Badge>
                          <Badge className={getImpactColor(insight.impact)}>
                            Impact {insight.impact === 'low' ? 'faible' : insight.impact === 'medium' ? 'moyen' : insight.impact === 'high' ? 'élevé' : 'critique'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Confiance: {insight.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewInsight(insight)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!insight.is_applied && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => applyInsight(insight.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => dismissInsight(insight.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres de l'Assistant IA
              </CardTitle>
              <CardDescription>Configurez le comportement de l'assistant IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Settings */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Assistant Vocal
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="voice_assistant">Réponses vocales</Label>
                      <p className="text-xs text-muted-foreground">L'assistant lit ses réponses</p>
                    </div>
                    <Switch
                      id="voice_assistant"
                      checked={localSettings.voice_assistant}
                      onCheckedChange={(checked) => setLocalSettings({ ...localSettings, voice_assistant: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="voice_recognition">Reconnaissance vocale</Label>
                      <p className="text-xs text-muted-foreground">Dictez vos messages</p>
                    </div>
                    <Switch
                      id="voice_recognition"
                      checked={localSettings.voice_recognition}
                      onCheckedChange={(checked) => setLocalSettings({ ...localSettings, voice_recognition: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* AI Behavior */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Comportement IA
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="auto_suggestions">Suggestions automatiques</Label>
                      <p className="text-xs text-muted-foreground">Afficher des suggestions après chaque réponse</p>
                    </div>
                    <Switch
                      id="auto_suggestions"
                      checked={localSettings.auto_suggestions}
                      onCheckedChange={(checked) => setLocalSettings({ ...localSettings, auto_suggestions: checked })}
                    />
                  </div>
                  <div className="space-y-2 p-3 border rounded-lg">
                    <Label htmlFor="default_model">Modèle par défaut</Label>
                    <Select 
                      value={localSettings.default_model_id || ''} 
                      onValueChange={(value) => setLocalSettings({ ...localSettings, default_model_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.filter(m => m.status === 'active').map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sécurité & Confidentialité
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="conversation_encryption">Chiffrement des conversations</Label>
                      <p className="text-xs text-muted-foreground">Chiffrer les messages stockés</p>
                    </div>
                    <Switch
                      id="conversation_encryption"
                      checked={localSettings.conversation_encryption}
                      onCheckedChange={(checked) => setLocalSettings({ ...localSettings, conversation_encryption: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="audit_interactions">Audit des interactions</Label>
                      <p className="text-xs text-muted-foreground">Journaliser toutes les interactions</p>
                    </div>
                    <Switch
                      id="audit_interactions"
                      checked={localSettings.audit_interactions}
                      onCheckedChange={(checked) => setLocalSettings({ ...localSettings, audit_interactions: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="anonymize_data">Anonymisation des données</Label>
                      <p className="text-xs text-muted-foreground">Masquer les données sensibles</p>
                    </div>
                    <Switch
                      id="anonymize_data"
                      checked={localSettings.anonymize_data}
                      onCheckedChange={(checked) => setLocalSettings({ ...localSettings, anonymize_data: checked })}
                    />
                  </div>
                  <div className="space-y-2 p-3 border rounded-lg">
                    <Label htmlFor="data_retention">Rétention des données (jours)</Label>
                    <Input
                      id="data_retention"
                      type="number"
                      min={1}
                      max={365}
                      value={localSettings.data_retention_days}
                      onChange={(e) => setLocalSettings({ ...localSettings, data_retention_days: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder les paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateConversationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        aiModels={aiModels}
        onCreateConversation={async (title, context, modelId, participants) => {
          const result = await createConversation(title, context, modelId, participants);
          if (result) {
            setSelectedConversation(result as unknown as AIConversation);
          }
          return result;
        }}
      />

      <ConfigureModelDialog
        open={showConfigureDialog}
        onOpenChange={setShowConfigureDialog}
        model={selectedModel}
        onSave={updateAIModel}
      />

      <TestModelDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        model={selectedModel}
        onTest={testAIModel}
      />

      <InsightDetailDialog
        open={showInsightDialog}
        onOpenChange={setShowInsightDialog}
        insight={selectedInsight}
        pharmacies={[]}
        onApply={applyInsight}
        onDismiss={dismissInsight}
      />
    </div>
  );
};

export default ConversationalAI;
