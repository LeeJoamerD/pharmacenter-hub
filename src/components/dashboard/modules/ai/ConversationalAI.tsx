import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Users
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'action';
  suggestions?: string[];
  actions?: { label: string; action: () => void }[];
}

const ConversationalAI = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant IA PharmaSoft. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      suggestions: [
        'Analyser les ventes de cette semaine',
        'Recommandations pour le stock',
        'Prévisions de demande',
        'Optimiser les promotions'
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = (userMessage: string): Message => {
    // Simulation de réponses intelligentes basées sur le contenu
    let response = '';
    let suggestions: string[] = [];
    let actions: { label: string; action: () => void }[] = [];

    if (userMessage.toLowerCase().includes('vente')) {
      response = 'D\'après l\'analyse des données, vos ventes de cette semaine montrent une tendance positive avec une croissance de 12% par rapport à la semaine dernière. Les produits OTC représentent 68% de ce chiffre.';
      suggestions = [
        'Détails par catégorie de produits',
        'Comparaison avec l\'année dernière',
        'Prévisions pour la semaine prochaine'
      ];
      actions = [
        { label: 'Voir rapport détaillé', action: () => console.log('Rapport ventes') },
        { label: 'Exporter données', action: () => console.log('Export ventes') }
      ];
    } else if (userMessage.toLowerCase().includes('stock')) {
      response = 'J\'ai identifié 3 produits nécessitant une attention : Doliprane 1000mg (stock critique), Vitamine D (réappro. recommandé), et Masques chirurgicaux (surstock détecté). Souhaitez-vous les détails ?';
      suggestions = [
        'Générer commande automatique',
        'Voir alertes de péremption',
        'Optimiser rotations stock'
      ];
      actions = [
        { label: 'Créer commande', action: () => console.log('Créer commande') },
        { label: 'Voir détails', action: () => console.log('Détails stock') }
      ];
    } else if (userMessage.toLowerCase().includes('prévision')) {
      response = 'Basé sur les patterns historiques et les facteurs saisonniers, je prédis une hausse de 25% des ventes d\'antihistaminiques dans les 10 prochains jours. Recommandation : augmenter le stock de Loratadine et Cétirizine.';
      suggestions = [
        'Voir graphique prévisionnel',
        'Facteurs influençant la prévision',
        'Ajuster les paramètres'
      ];
    } else {
      response = 'Je comprends votre demande. Basé sur les données actuelles de votre pharmacie, je peux vous fournir une analyse détaillée. Que souhaitez-vous explorer en priorité ?';
      suggestions = [
        'Performance des ventes',
        'Gestion des stocks',
        'Analyse client',
        'Optimisations possibles'
      ];
    }

    return {
      id: Date.now().toString(),
      content: response,
      sender: 'ai',
      timestamp: new Date(),
      type: 'suggestion',
      suggestions,
      actions
    };
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simuler délai de traitement IA
    setTimeout(() => {
      const aiResponse = simulateAIResponse(inputValue);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Dans une vraie implémentation, intégrer Web Speech API
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversation IA
              </CardTitle>
              <CardDescription>
                Posez vos questions en langage naturel
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender === 'ai' ? (
                            <Bot className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {message.sender === 'ai' ? 'Assistant IA' : 'Vous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>

                        {/* Suggestions */}
                        {message.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block w-full text-left text-xs p-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 transition-colors"
                              >
                                💡 {suggestion}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {message.actions && (
                          <div className="mt-2 flex gap-2">
                            {message.actions.map((action, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant="outline"
                                onClick={action.action}
                                className="text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre question ici... (Ex: Comment vont mes ventes cette semaine ?)"
                      className="pr-12"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={toggleVoice}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4 text-red-600" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={sendMessage} disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyser Ventes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleSuggestionClick('État du stock et alertes')}
              >
                <Package className="h-4 w-4 mr-2" />
                Vérifier Stock
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleSuggestionClick('Analyse comportement clients')}
              >
                <Users className="h-4 w-4 mr-2" />
                Analyser Clients
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleSuggestionClick('Recommandations d\'optimisation')}
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
                <Badge className="bg-blue-50 text-blue-600">4 Actifs</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Réponse</span>
                <Badge className="bg-orange-50 text-orange-600">1.2s</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationalAI;