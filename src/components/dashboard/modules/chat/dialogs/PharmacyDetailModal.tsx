import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Building, MapPin, Phone, Mail, Globe, Users, MessageSquare, 
  Activity, Clock, TrendingUp, CheckCircle, AlertCircle, Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface PharmacyWithMetrics {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  pays?: string;
  is_inter_tenant?: boolean;
  metrics: {
    messages_sent: number;
    messages_received: number;
    active_channels: number;
    last_activity: string;
    response_time_avg: number;
  };
}

interface PharmacyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacy: PharmacyWithMetrics | null;
  onStartConversation?: (pharmacyId: string) => void;
  onInviteToCollaboration?: (pharmacyId: string) => void;
}

const PharmacyDetailModal = ({ 
  open, 
  onOpenChange, 
  pharmacy,
  onStartConversation,
  onInviteToCollaboration
}: PharmacyDetailModalProps) => {
  const { currentTenant } = useTenant();
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [participatedChannels, setParticipatedChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && pharmacy) {
      loadPharmacyDetails();
    }
  }, [open, pharmacy]);

  const loadPharmacyDetails = async () => {
    if (!pharmacy) return;
    setLoading(true);

    try {
      // Charger les messages récents
      const { data: messages } = await supabase
        .from('network_messages')
        .select('id, content, created_at, channel_id')
        .eq('sender_pharmacy_id', pharmacy.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentMessages(messages || []);

      // Charger les canaux participés
      const { data: participations } = await supabase
        .from('channel_participants')
        .select('channel_id, role, joined_at')
        .eq('pharmacy_id', pharmacy.id);

      if (participations && participations.length > 0) {
        const channelIds = participations.map(p => p.channel_id);
        const { data: channels } = await supabase
          .from('network_channels')
          .select('id, name, type')
          .in('id', channelIds);

        const enrichedChannels = (channels || []).map(ch => {
          const participation = participations.find(p => p.channel_id === ch.id);
          return {
            ...ch,
            role: participation?.role || 'member',
            joined_at: participation?.joined_at
          };
        });

        setParticipatedChannels(enrichedChannels);
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'maintenance': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!pharmacy) return null;

  const isOwnPharmacy = pharmacy.id === currentTenant?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {pharmacy.name}
            {pharmacy.is_inter_tenant && (
              <Badge variant="outline" className="ml-2">Inter-réseau</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {getStatusIcon(pharmacy.status)}
            <span className="capitalize">{pharmacy.status}</span>
            {pharmacy.code && <span className="text-muted-foreground">• {pharmacy.code}</span>}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="metrics">Métriques</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            {/* Informations */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Adresse</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {pharmacy.address || 'Non renseignée'}
                      {pharmacy.city && <>, {pharmacy.city}</>}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Région</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {pharmacy.region || 'Non renseignée'}
                      {pharmacy.pays && <> ({pharmacy.pays})</>}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Téléphone</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {pharmacy.phone || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {pharmacy.email || 'Non renseigné'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Type d'officine</span>
                  </div>
                  <Badge variant="secondary" className="ml-6">
                    {pharmacy.type || 'Non défini'}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            {/* Métriques */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Messages Envoyés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {pharmacy.metrics.messages_sent}
                    </div>
                    <p className="text-xs text-muted-foreground">Total sur le réseau</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Messages Reçus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {pharmacy.metrics.messages_received}
                    </div>
                    <p className="text-xs text-muted-foreground">Via les canaux</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Canaux Actifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {pharmacy.metrics.active_channels}
                    </div>
                    <p className="text-xs text-muted-foreground">Participations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Temps de Réponse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(pharmacy.metrics.response_time_avg)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Dernière Activité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {new Date(pharmacy.metrics.last_activity).toLocaleString('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activité */}
            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Canaux ({participatedChannels.length})
                </h4>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse h-10 bg-muted rounded" />
                    ))}
                  </div>
                ) : participatedChannels.length > 0 ? (
                  <div className="space-y-2">
                    {participatedChannels.map(channel => (
                      <div key={channel.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{channel.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{channel.type}</Badge>
                          <Badge variant="secondary">{channel.role}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun canal</p>
                )}

                <Separator />

                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages Récents
                </h4>
                {recentMessages.length > 0 ? (
                  <div className="space-y-2">
                    {recentMessages.map(msg => (
                      <div key={msg.id} className="p-2 border rounded text-sm">
                        <p className="truncate">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun message récent</p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2">
          {!isOwnPharmacy && (
            <>
              <Button 
                variant="outline" 
                onClick={() => onInviteToCollaboration?.(pharmacy.id)}
              >
                <Users className="h-4 w-4 mr-2" />
                Inviter
              </Button>
              <Button onClick={() => onStartConversation?.(pharmacy.id)}>
                <Send className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PharmacyDetailModal;
