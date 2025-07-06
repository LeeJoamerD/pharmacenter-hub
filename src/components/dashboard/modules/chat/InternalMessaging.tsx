import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ChatInterface from './ChatInterface';
import PresenceManager from './PresenceManager';
import { 
  MessageCircle, 
  Users, 
  Plus,
  Search,
  Hash,
  Lock,
  Clock
} from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
  lastMessage: string;
  lastTime: string;
  unread: number;
  isOnline?: boolean;
}

const InternalMessaging = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Dr. Martin Dubois',
      type: 'direct',
      participants: ['current-user', 'dr-martin'],
      lastMessage: 'Pouvez-vous vérifier le stock de Doliprane ?',
      lastTime: '14:32',
      unread: 2,
      isOnline: true
    },
    {
      id: '2',
      name: 'Équipe Pharmaciens',
      type: 'group',
      participants: ['current-user', 'sophie', 'pierre', 'marie'],
      lastMessage: 'Sophie: Nouvelle formation prévue demain',
      lastTime: '13:45',
      unread: 1,
      isOnline: false
    },
    {
      id: '3',
      name: '# Général',
      type: 'channel',
      participants: ['all-staff'],
      lastMessage: 'Réunion équipe reportée à 16h',
      lastTime: '12:15',
      unread: 0,
      isOnline: false
    },
    {
      id: '4',
      name: 'Direction',
      type: 'channel',
      participants: ['management'],
      lastMessage: 'Rapport mensuel en préparation',
      lastTime: '11:30',
      unread: 3,
      isOnline: false
    }
  ]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <MessageCircle className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'channel':
        return <Hash className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Messagerie Interne</h2>
          <p className="text-muted-foreground">
            Communication en temps réel avec votre équipe
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar - Liste des conversations */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                <div className="space-y-1 p-3">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getConversationIcon(conversation.type)}
                          <span className="font-medium text-sm truncate">
                            {conversation.name}
                          </span>
                          {conversation.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                        {conversation.unread > 0 && (
                          <Badge className="bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Zone de chat principale */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatInterface conversationId={selectedConversation} />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez une conversation pour commencer à échanger
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar droite - Présence et infos */}
        <div className="lg:col-span-1">
          <PresenceManager />
        </div>
      </div>
    </div>
  );
};

export default InternalMessaging;