import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  Hash, 
  Building, 
  Clock,
  AlertTriangle,
  Users,
  Zap
} from 'lucide-react';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NetworkMessaging = () => {
  const {
    pharmacies,
    channels,
    messages,
    activeChannel,
    currentPharmacy,
    loading,
    sendMessage,
    selectChannel,
    selectPharmacy
  } = useNetworkMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [messagePriority, setMessagePriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage, messagePriority);
    setNewMessage('');
    setMessagePriority('normal');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement de la messagerie réseau...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection de pharmacie */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <CardTitle>Pharmacie Active</CardTitle>
            </div>
            <Badge variant="secondary">
              {pharmacies.length} officines connectées
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={currentPharmacy?.id || ''} onValueChange={(value) => {
            const pharmacy = pharmacies.find(p => p.id === value);
            if (pharmacy) selectPharmacy(pharmacy);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner votre pharmacie" />
            </SelectTrigger>
            <SelectContent>
              {pharmacies.map((pharmacy) => (
                <SelectItem key={pharmacy.id} value={pharmacy.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pharmacy.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {pharmacy.type}
                    </Badge>
                    <span className="text-muted-foreground">- {pharmacy.city}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Interface de messagerie */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Liste des canaux */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Canaux
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 border-l-2 ${
                    activeChannel === channel.id ? 'bg-muted border-l-primary' : 'border-l-transparent'
                  }`}
                  onClick={() => selectChannel(channel.id)}
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{channel.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {channel.description}
                    </p>
                  </div>
                  {channel.is_system && (
                    <Badge variant="secondary" className="text-xs">
                      Système
                    </Badge>
                  )}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  {activeChannelData?.name || 'Canal'}
                </CardTitle>
                <CardDescription>
                  {activeChannelData?.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {pharmacies.length} participants
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <ScrollArea className="h-96 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.sender_name}</span>
                        {message.priority !== 'normal' && (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${getPriorityColor(message.priority)}`}>
                            {getPriorityIcon(message.priority)}
                            {message.priority}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun message dans ce canal</p>
                    <p className="text-xs">Soyez le premier à envoyer un message !</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Zone de saisie */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={messagePriority} onValueChange={(value: 'normal' | 'high' | 'urgent') => setMessagePriority(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Envoyer un message dans #${activeChannelData?.name || 'canal'}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[60px] resize-none"
                  disabled={!currentPharmacy}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !currentPharmacy}
                  size="icon"
                  className="h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {!currentPharmacy && (
                <p className="text-xs text-muted-foreground">
                  Sélectionnez votre pharmacie pour envoyer des messages
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkMessaging;