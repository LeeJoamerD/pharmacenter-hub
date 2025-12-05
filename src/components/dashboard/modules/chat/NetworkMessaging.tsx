import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Hash, 
  Building, 
  Clock,
  AlertTriangle,
  Users,
  Zap,
  Search,
  Plus,
  Settings,
  RefreshCw,
  Globe,
  Lock,
  Paperclip
} from 'lucide-react';
import { useNetworkMessagingEnhanced } from '@/hooks/useNetworkMessagingEnhanced';
import { useTenant } from '@/contexts/TenantContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NetworkMessaging = () => {
  const { currentTenant } = useTenant();
  const {
    pharmacies,
    channels,
    messages,
    activeChannel,
    currentPharmacy,
    loading,
    networkStats,
    sendMessage,
    selectChannel,
    refreshData,
    hasPermissionWith
  } = useNetworkMessagingEnhanced();

  const [newMessage, setNewMessage] = useState('');
  const [messagePriority, setMessagePriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [channelSearch, setChannelSearch] = useState('');
  const [channelTab, setChannelTab] = useState<'all' | 'own' | 'public' | 'direct'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage, messagePriority);
    if (success) {
      setNewMessage('');
      setMessagePriority('normal');
    }
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

  const getChannelIcon = (channel: any) => {
    if (channel.is_system) return <Settings className="h-4 w-4 text-muted-foreground" />;
    if (channel.is_public) return <Globe className="h-4 w-4 text-green-500" />;
    if (channel.channel_type === 'direct') return <MessageCircle className="h-4 w-4 text-blue-500" />;
    return <Lock className="h-4 w-4 text-yellow-500" />;
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);

  // Filtrer les canaux
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = !channelSearch || 
      channel.name.toLowerCase().includes(channelSearch.toLowerCase());
    
    const matchesTab = 
      channelTab === 'all' ||
      (channelTab === 'own' && channel.tenant_id === currentTenant?.id) ||
      (channelTab === 'public' && channel.is_public) ||
      (channelTab === 'direct' && channel.channel_type === 'direct');

    return matchesSearch && matchesTab;
  });

  // Vérifier les permissions inter-tenants
  const canMessageChannel = (channel: any) => {
    // Canaux propres ou publics
    if (channel.tenant_id === currentTenant?.id || channel.is_public) return true;
    // Vérifier les permissions
    return hasPermissionWith(channel.tenant_id, 'chat');
  };

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
      {/* Header avec stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Messagerie Réseau</CardTitle>
                <CardDescription>
                  Connecté en tant que: {currentPharmacy?.nom_pharmacie || 'Non connecté'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{networkStats.activePharmacies} officines actives</span>
              </div>
              <Badge variant="secondary">
                {networkStats.todayMessages} messages aujourd'hui
              </Badge>
              <Button variant="ghost" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Interface de messagerie */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Liste des canaux */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4" />
                Canaux
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={channelTab} onValueChange={(v) => setChannelTab(v as any)}>
              <TabsList className="w-full grid grid-cols-4 h-8 mx-2 mb-2">
                <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
                <TabsTrigger value="own" className="text-xs">Mes</TabsTrigger>
                <TabsTrigger value="public" className="text-xs">Public</TabsTrigger>
                <TabsTrigger value="direct" className="text-xs">Direct</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <ScrollArea className="h-[400px]">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 border-l-2 ${
                    activeChannel === channel.id ? 'bg-muted border-l-primary' : 'border-l-transparent'
                  } ${!canMessageChannel(channel) ? 'opacity-50' : ''}`}
                  onClick={() => canMessageChannel(channel) && selectChannel(channel.id)}
                >
                  {getChannelIcon(channel)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-sm truncate">{channel.name}</p>
                      {channel.is_system && (
                        <Badge variant="outline" className="text-[10px] px-1">Sys</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {channel.messages_count || 0} messages
                    </p>
                  </div>
                  {channel.members_count ? (
                    <Badge variant="secondary" className="text-xs">
                      {channel.members_count}
                    </Badge>
                  ) : null}
                </div>
              ))}
              
              {filteredChannels.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun canal trouvé</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {activeChannelData ? getChannelIcon(activeChannelData) : <Hash className="h-5 w-5" />}
                  {activeChannelData?.name || 'Sélectionnez un canal'}
                </CardTitle>
                <CardDescription>
                  {activeChannelData?.description || 'Aucun canal sélectionné'}
                </CardDescription>
              </div>
              {activeChannelData && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {activeChannelData.members_count || 0} participants
                  </div>
                  {activeChannelData.tenant_id !== currentTenant?.id && (
                    <Badge variant="outline" className="text-xs">
                      Inter-officine
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <ScrollArea className="h-[350px] mb-4 pr-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_pharmacy_id === currentPharmacy?.id;
                  return (
                    <div key={message.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isOwn ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                        }`}>
                          <Building className="h-4 w-4" />
                        </div>
                      </div>
                      <div className={`flex-1 min-w-0 ${isOwn ? 'text-right' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
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
                        <div className={`inline-block p-3 rounded-lg ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {messages.length === 0 && activeChannel && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun message dans ce canal</p>
                    <p className="text-xs">Soyez le premier à envoyer un message !</p>
                  </div>
                )}
                
                {!activeChannel && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sélectionnez un canal pour voir les messages</p>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Zone de saisie */}
            {activeChannel && canMessageChannel(activeChannelData) ? (
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
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
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
                    Vous devez être connecté à une pharmacie pour envoyer des messages
                  </p>
                )}
              </div>
            ) : activeChannel ? (
              <div className="text-center py-4 text-muted-foreground bg-muted rounded-lg">
                <Lock className="h-5 w-5 mx-auto mb-1" />
                <p className="text-sm">Vous n'avez pas la permission d'envoyer des messages dans ce canal</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkMessaging;
