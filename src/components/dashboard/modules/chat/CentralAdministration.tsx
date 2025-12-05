import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  Bell,
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Network,
  Zap,
  Globe,
  Building,
  MessageSquare,
  UserCog,
  Database,
  Server,
  Wifi,
  Monitor,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Save
} from 'lucide-react';
import { useNetworkChatAdmin } from '@/hooks/useNetworkChatAdmin';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateChannelDialog from './dialogs/CreateChannelDialog';
import ChannelMembersManagerDialog from './dialogs/ChannelMembersManagerDialog';

const CentralAdministration = () => {
  const { toast } = useToast();
  const {
    pharmacies,
    channels,
    channelInvitations,
    auditLogs,
    chatConfigs,
    networkStats,
    loading,
    createChannel,
    updateChannel,
    deleteChannel,
    updateChatConfig,
    logAuditAction,
    refetch
  } = useNetworkChatAdmin();

  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    auto_backup: true,
    real_time_sync: true,
    message_retention: '30',
    max_file_size: '10'
  });

  const [createChannelDialog, setCreateChannelDialog] = useState(false);
  const [membersManagerDialog, setMembersManagerDialog] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  // Load chat configs into settings
  useEffect(() => {
    if (chatConfigs.length > 0) {
      const getConfig = (key: string, defaultVal: string) => {
        const cfg = chatConfigs.find(c => c.key === key);
        return cfg?.value || defaultVal;
      };
      setSystemSettings({
        maintenance_mode: getConfig('maintenance_mode', 'false') === 'true',
        auto_backup: getConfig('auto_backup_enabled', 'true') === 'true',
        real_time_sync: getConfig('realtime_enabled', 'true') === 'true',
        message_retention: getConfig('message_retention_days', '30'),
        max_file_size: getConfig('max_file_size_mb', '10')
      });
    }
  }, [chatConfigs]);

  // Calculate metrics
  const systemMetrics = {
    total_pharmacies: pharmacies.length,
    active_pharmacies: pharmacies.filter(p => p.status === 'active').length,
    total_channels: channels.length,
    total_messages: networkStats?.total_messages || 0,
    system_uptime: '99.9%',
    network_status: pharmacies.filter(p => p.status === 'active').length / Math.max(pharmacies.length, 1) > 0.8 
      ? 'healthy' as const 
      : 'warning' as const
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': 
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': 
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': 
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  const handleCreateChannel = async (data: any) => {
    await createChannel({
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      is_system: data.isSystem
    });

    await logAuditAction('channel_create', 'channel', 'channel', undefined, data.name, { type: data.type });
  };

  const handleDeleteChannel = async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    if (channel.is_system) {
      toast({
        title: "Action non autorisée",
        description: "Les canaux système ne peuvent pas être supprimés.",
        variant: "destructive"
      });
      return;
    }

    await deleteChannel(channelId);
    await logAuditAction('channel_delete', 'channel', 'channel', channelId, channel.name);
  };

  const handleSaveSettings = async () => {
    try {
      await updateChatConfig('maintenance_mode', String(systemSettings.maintenance_mode), 'system');
      await updateChatConfig('auto_backup_enabled', String(systemSettings.auto_backup), 'system');
      await updateChatConfig('realtime_enabled', String(systemSettings.real_time_sync), 'system');
      await updateChatConfig('message_retention_days', systemSettings.message_retention, 'system');
      await updateChatConfig('max_file_size_mb', systemSettings.max_file_size, 'system');

      await logAuditAction('config_change', 'configuration', 'config', undefined, 'system_settings', systemSettings);

      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration a été mise à jour avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Chargement de l'administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Administration Centrale
          </h1>
          <p className="text-muted-foreground">
            Supervision et gestion centralisée du réseau PharmaSoft
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(systemMetrics.network_status)} text-white`}
          >
            {getStatusIcon(systemMetrics.network_status)}
            <span className="ml-1 capitalize">{systemMetrics.network_status}</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
          <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="monitoring">Surveillance</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Tableau de bord principal */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Métriques principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pharmacies Totales</CardTitle>
                <Building className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.total_pharmacies}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.active_pharmacies} actives
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Canaux Réseau</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.total_channels}</div>
                <p className="text-xs text-muted-foreground">
                  Canaux de communication
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Total</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.total_messages}</div>
                <p className="text-xs text-muted-foreground">
                  Messages échangés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
                <Server className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.system_uptime}</div>
                <p className="text-xs text-muted-foreground">
                  Temps de fonctionnement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* État des services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                État des Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Base de Données</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Opérationnel</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span className="font-medium">Temps Réel</span>
                  </div>
                  <div className={`flex items-center gap-1 ${systemSettings.real_time_sync ? 'text-green-600' : 'text-gray-400'}`}>
                    {systemSettings.real_time_sync ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="text-sm">{systemSettings.real_time_sync ? 'Connecté' : 'Désactivé'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    <span className="font-medium">Réseau</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Stable</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journaux d'audit récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        log.severity === 'error' || log.severity === 'critical' ? 'bg-red-500' :
                        log.severity === 'warning' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.action_type}</span>
                          {log.target_type && (
                            <span className="text-xs text-muted-foreground">sur {log.target_type}</span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-xs text-muted-foreground truncate">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune activité récente
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des pharmacies */}
        <TabsContent value="pharmacies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Gestion des Pharmacies
              </CardTitle>
              <CardDescription>
                Administration des officines du réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(pharmacy.status)}`} />
                      <div>
                        <h4 className="font-medium">{pharmacy.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pharmacy.code || 'N/A'} - {pharmacy.city || 'N/A'}, {pharmacy.region || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pharmacy.type || 'standard'}</Badge>
                      <Button variant="outline" size="sm">
                        <UserCog className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}

                {pharmacies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune pharmacie dans le réseau
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des canaux */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Gestion des Canaux
                  </CardTitle>
                  <CardDescription>
                    Administration des canaux de communication
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateChannelDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Canal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-muted-foreground">{channel.description || 'Aucune description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {channel.is_system && (
                        <Badge variant="secondary">Système</Badge>
                      )}
                      {channel.is_public ? (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Privé
                        </Badge>
                      )}
                      <Badge variant="outline">{channel.type}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedChannel(channel);
                          setMembersManagerDialog(channel.id);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Membres
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      {!channel.is_system && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteChannel(channel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {channels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun canal créé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surveillance */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Surveillance Réseau
              </CardTitle>
              <CardDescription>
                Monitoring en temps réel du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Statistiques Réseau</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pharmacies actives:</span>
                      <span className="font-medium">{networkStats?.active_pharmacies || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Canaux totaux:</span>
                      <span className="font-medium">{networkStats?.total_channels || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messages totaux:</span>
                      <span className="font-medium">{networkStats?.total_messages || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Partenaires actifs:</span>
                      <span className="font-medium">{networkStats?.active_partners || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Invitations en attente</h4>
                  {channelInvitations.filter(i => i.status === 'pending').length > 0 ? (
                    <div className="space-y-2">
                      {channelInvitations
                        .filter(i => i.status === 'pending')
                        .slice(0, 5)
                        .map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">
                              Invitation canal #{invitation.channel_id?.slice(0, 8)}
                            </span>
                            <Badge variant="secondary">En attente</Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune invitation en attente</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres système */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Système
              </CardTitle>
              <CardDescription>
                Configuration globale du réseau
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Maintenance</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance">Mode maintenance</Label>
                    <Switch 
                      id="maintenance"
                      checked={systemSettings.maintenance_mode}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({ ...prev, maintenance_mode: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup">Sauvegarde automatique</Label>
                    <Switch 
                      id="backup"
                      checked={systemSettings.auto_backup}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({ ...prev, auto_backup: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="realtime">Synchronisation temps réel</Label>
                    <Switch 
                      id="realtime"
                      checked={systemSettings.real_time_sync}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({ ...prev, real_time_sync: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Stockage</h4>
                  <div className="space-y-2">
                    <Label htmlFor="retention">Rétention des messages (jours)</Label>
                    <Input
                      id="retention"
                      type="number"
                      value={systemSettings.message_retention}
                      onChange={(e) => 
                        setSystemSettings(prev => ({ ...prev, message_retention: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filesize">Taille max fichiers (MB)</Label>
                    <Input
                      id="filesize"
                      type="number"
                      value={systemSettings.max_file_size}
                      onChange={(e) => 
                        setSystemSettings(prev => ({ ...prev, max_file_size: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => refetch()}>Réinitialiser</Button>
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateChannelDialog
        open={createChannelDialog}
        onOpenChange={setCreateChannelDialog}
        onCreateChannel={handleCreateChannel}
        loading={loading}
      />

      {selectedChannel && (
        <ChannelMembersManagerDialog
          open={!!membersManagerDialog}
          onOpenChange={(open) => {
            if (!open) {
              setMembersManagerDialog(null);
              setSelectedChannel(null);
            }
          }}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          members={[]} // TODO: fetch channel members
          availablePharmacies={pharmacies}
          onAddMember={async (pharmacyId, role) => {
            // TODO: implement add member
            toast({ title: "Membre ajouté" });
          }}
          onRemoveMember={async (memberId) => {
            // TODO: implement remove member
            toast({ title: "Membre retiré" });
          }}
          onUpdateMemberRole={async (memberId, role) => {
            // TODO: implement update role
            toast({ title: "Rôle mis à jour" });
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CentralAdministration;
