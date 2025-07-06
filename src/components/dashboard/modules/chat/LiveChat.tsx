import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  User, 
  Headphones,
  Phone,
  Video,
  MoreVertical,
  Star,
  Archive,
  UserX,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  timestamp: Date;
  isRead: boolean;
}

interface LiveChatProps {
  ticketId: string;
}

const LiveChat = ({ ticketId }: LiveChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour, j\'ai une question concernant mon ordonnance.',
      sender: 'customer',
      senderName: 'Marie Dupont',
      timestamp: new Date(Date.now() - 1800000),
      isRead: true
    },
    {
      id: '2',
      content: 'Bonjour Marie ! Je serais ravie de vous aider. Pouvez-vous me préciser votre question ?',
      sender: 'agent',
      senderName: 'Sophie Martin',
      timestamp: new Date(Date.now() - 1500000),
      isRead: true
    },
    {
      id: '3',
      content: 'Mon médecin m\'a prescrit du Doliprane mais je ne sais pas quelle dosage prendre avec mon traitement actuel.',
      sender: 'customer',
      senderName: 'Marie Dupont',
      timestamp: new Date(Date.now() - 1200000),
      isRead: true
    },
    {
      id: '4',
      content: 'Je comprends votre préoccupation. Pouvez-vous me dire quels médicaments vous prenez actuellement ?',
      sender: 'agent',
      senderName: 'Sophie Martin',
      timestamp: new Date(Date.now() - 900000),
      isRead: true
    },
    {
      id: '5',
      content: 'Je prends de l\'Aspirine 100mg et du Lisinopril 10mg quotidiennement.',
      sender: 'customer',
      senderName: 'Marie Dupont',
      timestamp: new Date(Date.now() - 300000),
      isRead: false
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [customerInfo] = useState({
    name: 'Marie Dupont',
    phone: '+33 1 23 45 67 89',
    email: 'marie.dupont@email.com',
    customerSince: '2019',
    totalOrders: 45,
    satisfaction: 4.8
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'agent',
      senderName: 'Sophie Martin',
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simuler réponse client
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Merci pour ces informations, c\'est très utile !',
          sender: 'customer',
          senderName: 'Marie Dupont',
          timestamp: new Date(),
          isRead: false
        };
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 2000);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickResponses = [
    'Pouvez-vous me donner plus de détails ?',
    'Je vérifie cette information pour vous.',
    'Voici ce que je recommande...',
    'Y a-t-il autre chose que je puisse faire pour vous ?'
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Interface de chat principale */}
      <div className="lg:col-span-3">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">{customerInfo.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-muted-foreground">En ligne</span>
                    <Badge className="bg-blue-50 text-blue-600 text-xs">
                      Client depuis {customerInfo.customerSince}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender === 'agent' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'customer' && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {message.sender === 'agent' && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Headphones className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.sender === 'agent' && (
                          <CheckCircle2 className={`h-3 w-3 ${message.isRead ? 'text-blue-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        message.sender === 'agent' 
                          ? 'bg-primary text-primary-foreground' 
                          : message.sender === 'customer'
                          ? 'bg-blue-50 text-blue-900'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex space-x-1">
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

            {/* Réponses rapides */}
            <div className="border-t p-2">
              <div className="flex flex-wrap gap-1">
                {quickResponses.map((response, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setNewMessage(response)}
                  >
                    {response}
                  </Button>
                ))}
              </div>
            </div>

            {/* Zone de saisie */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre réponse..."
                  />
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations client */}
      <div className="lg:col-span-1">
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="text-base">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-medium">{customerInfo.name}</h3>
              <div className="flex items-center justify-center mt-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm text-muted-foreground ml-1">
                  {customerInfo.satisfaction}/5
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Téléphone</label>
                <p className="text-sm font-medium">{customerInfo.phone}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <p className="text-sm font-medium">{customerInfo.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Client depuis</label>
                <p className="text-sm font-medium">{customerInfo.customerSince}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Commandes totales</label>
                <p className="text-sm font-medium">{customerInfo.totalOrders}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button className="w-full" variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Voir profil complet
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Historique commandes
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Conversations passées
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button className="w-full" variant="destructive" size="sm">
                <UserX className="h-4 w-4 mr-2" />
                Terminer conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveChat;