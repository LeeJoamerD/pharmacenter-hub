import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Building, 
  Users, 
  MessageSquare, 
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Activity,
  Send,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface PharmacyData {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
  region?: string;
  country?: string;
  status: string;
  type?: string;
  user_count: number;
  admin_count: number;
  last_access?: string;
  created_at: string;
}

interface ChannelData {
  id: string;
  name: string;
  type: string;
}

interface PharmacyStats {
  messages_sent: number;
  channels_joined: number;
  last_message_at?: string;
}

interface PharmacyActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacy: PharmacyData | null;
  channels: ChannelData[];
  onToggleChatEnabled: (pharmacyId: string, enabled: boolean) => Promise<void>;
  onSendInvitation: (pharmacyId: string, channelId: string) => Promise<void>;
  loading?: boolean;
}

const PharmacyActionsDialog = ({
  open,
  onOpenChange,
  pharmacy,
  channels,
  onToggleChatEnabled,
  onSendInvitation,
  loading = false
}: PharmacyActionsDialogProps) => {
  const { toast } = useToast();
  const [chatEnabled, setChatEnabled] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [stats, setStats] = useState<PharmacyStats>({
    messages_sent: 0,
    channels_joined: 0
  });
  const [joinedChannels, setJoinedChannels] = useState<ChannelData[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);

  useEffect(() => {
    if (pharmacy && open) {
      loadPharmacyStats();
    }
  }, [pharmacy, open]);

  const loadPharmacyStats = async () => {
    if (!pharmacy) return;
    
    setLoadingStats(true);
    try {
      // Get message count
      const { count: messagesCount } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', pharmacy.id);

      // Get joined channels
      const { data: participations } = await supabase
        .from('channel_participants')
        .select(`
          channel_id,
          channel:network_channels(id, name, type)
        `)
        .eq('pharmacy_id', pharmacy.id);

      const joinedCh = participations
        ?.filter(p => p.channel)
        .map(p => ({
          id: (p.channel as any).id,
          name: (p.channel as any).name,
          type: (p.channel as any).type
        })) || [];

      // Get last message date
      const { data: lastMessage } = await supabase
        .from('network_messages')
        .select('created_at')
        .eq('tenant_id', pharmacy.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        messages_sent: messagesCount || 0,
        channels_joined: joinedCh.length,
        last_message_at: lastMessage?.created_at
      });
      setJoinedChannels(joinedCh);
    } catch (error) {
      console.error('Error loading pharmacy stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleToggleChat = async (enabled: boolean) => {
    if (!pharmacy) return;
    
    try {
      await onToggleChatEnabled(pharmacy.id, enabled);
      setChatEnabled(enabled);
      toast({
        title: enabled ? "Chat activé" : "Chat désactivé",
        description: `Le chat a été ${enabled ? 'activé' : 'désactivé'} pour ${pharmacy.name}.`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du chat.",
        variant: "destructive"
      });
    }
  };

  const handleSendInvitation = async () => {
    if (!pharmacy || !selectedChannel) return;
    
    setSendingInvitation(true);
    try {
      await onSendInvitation(pharmacy.id, selectedChannel);
      toast({
        title: "Invitation envoyée",
        description: `Une invitation au canal a été envoyée à ${pharmacy.name}.`
      });
      setSelectedChannel('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation.",
        variant: "destructive"
      });
    } finally {
      setSendingInvitation(false);
    }
  };

  if (!pharmacy) return null;

  // Filter out already joined channels
  const availableChannels = channels.filter(
    c => !joinedChannels.some(jc => jc.id === c.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {pharmacy.name}
          </DialogTitle>
          <DialogDescription>
            Gérer les paramètres et les accès de cette pharmacie
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-medium">{pharmacy.code || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{pharmacy.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Téléphone:</span>
                  <span className="font-medium">{pharmacy.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ville:</span>
                  <span className="font-medium">{pharmacy.city || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Région:</span>
                  <span className="font-medium">{pharmacy.region || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Inscrit le:</span>
                  <span className="font-medium">
                    {format(new Date(pharmacy.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${pharmacy.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <Label className="font-medium">Statut du compte</Label>
                  <p className="text-sm text-muted-foreground">
                    {pharmacy.status === 'active' ? 'Compte actif' : 'Compte inactif'}
                  </p>
                </div>
              </div>
              <Badge variant={pharmacy.status === 'active' ? 'default' : 'secondary'}>
                {pharmacy.status === 'active' ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Actif</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Inactif</>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Accès au chat réseau</Label>
                <p className="text-sm text-muted-foreground">
                  Activer ou désactiver l'accès au chat pour cette pharmacie
                </p>
              </div>
              <Switch
                checked={chatEnabled}
                onCheckedChange={handleToggleChat}
                disabled={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 mt-4">
            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{pharmacy.user_count}</div>
                    <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{stats.messages_sent}</div>
                    <p className="text-sm text-muted-foreground">Messages envoyés</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{stats.channels_joined}</div>
                    <p className="text-sm text-muted-foreground">Canaux rejoints</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Dernière activité</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernier accès:</span>
                      <span>
                        {pharmacy.last_access 
                          ? format(new Date(pharmacy.last_access), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : 'Jamais'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernier message:</span>
                      <span>
                        {stats.last_message_at 
                          ? format(new Date(stats.last_message_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : 'Aucun'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="channels" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Inviter à un canal</h4>
              <div className="flex gap-2">
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name} ({channel.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSendInvitation}
                  disabled={!selectedChannel || sendingInvitation}
                >
                  {sendingInvitation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {availableChannels.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Cette pharmacie a déjà accès à tous les canaux disponibles.
                </p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">Canaux rejoints ({joinedChannels.length})</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {joinedChannels.map(channel => (
                    <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{channel.name}</span>
                      </div>
                      <Badge variant="outline">{channel.type}</Badge>
                    </div>
                  ))}
                  {joinedChannels.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun canal rejoint
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PharmacyActionsDialog;
