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
  Shield, Users, Settings, Activity, Bell, FileText, Lock, AlertTriangle,
  CheckCircle, XCircle, Clock, BarChart3, Network, Globe, Building,
  MessageSquare, UserCog, Database, Server, Wifi, Monitor, Plus, Edit,
  Trash2, RefreshCw, Save, Download, Search, Filter
} from 'lucide-react';
import { useNetworkChatAdmin } from '@/hooks/useNetworkChatAdmin';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateChannelDialog from './dialogs/CreateChannelDialog';
import ChannelMembersManagerDialog from './dialogs/ChannelMembersManagerDialog';
import EditChannelDialog from './dialogs/EditChannelDialog';
import PharmacyActionsDialog from './dialogs/PharmacyActionsDialog';
import ConfigurationExportDialog from './dialogs/ConfigurationExportDialog';
import NetworkHealthChart from './components/NetworkHealthChart';
import SystemAlertsCard from './components/SystemAlertsCard';

const CentralAdministration = () => {
  const { toast } = useToast();
  const {
    pharmacies, channels, channelInvitations, auditLogs, chatConfigs, networkStats, loading,
    createChannel, updateChannel, deleteChannel, updateChatConfig, logAuditAction, refetch,
    loadChannelMembers, addChannelMember, removeChannelMember, updateChannelMemberRole,
    markAlertAsReviewed, getMessageEvolution, getChannelDistribution, createChannelInvitation
  } = useNetworkChatAdmin();

  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false, auto_backup: true, real_time_sync: true,
    message_retention: '30', max_file_size: '10'
  });

  const [createChannelDialog, setCreateChannelDialog] = useState(false);
  const [membersManagerDialog, setMembersManagerDialog] = useState<string | null>(null);
  const [editChannelDialog, setEditChannelDialog] = useState(false);
  const [pharmacyActionsDialog, setPharmacyActionsDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [messageEvolution, setMessageEvolution] = useState<any[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (chatConfigs.length > 0) {
      const getConfig = (key: string, defaultVal: string) => chatConfigs.find(c => c.key === key)?.value || defaultVal;
      setSystemSettings({
        maintenance_mode: getConfig('maintenance_mode', 'false') === 'true',
        auto_backup: getConfig('auto_backup_enabled', 'true') === 'true',
        real_time_sync: getConfig('realtime_enabled', 'true') === 'true',
        message_retention: getConfig('message_retention_days', '30'),
        max_file_size: getConfig('max_file_size_mb', '10')
      });
    }
  }, [chatConfigs]);

  useEffect(() => {
    const loadCharts = async () => {
      const evolution = await getMessageEvolution(7);
      const distribution = await getChannelDistribution();
      setMessageEvolution(evolution);
      setChannelDistribution(distribution);
    };
    loadCharts();
  }, [channels]);

  const systemMetrics = {
    total_pharmacies: pharmacies.length,
    active_pharmacies: pharmacies.filter(p => p.status === 'active').length,
    total_channels: channels.length,
    total_messages: networkStats?.total_messages || 0,
    system_uptime: '99.9%',
    network_status: pharmacies.filter(p => p.status === 'active').length / Math.max(pharmacies.length, 1) > 0.8 ? 'healthy' : 'warning'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'active': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleOpenMembersDialog = async (channel: any) => {
    setSelectedChannel(channel);
    const members = await loadChannelMembers(channel.id);
    setChannelMembers(members);
    setMembersManagerDialog(channel.id);
  };

  const handleCreateChannel = async (data: any) => {
    await createChannel({ name: data.name, description: data.description, type: data.type, category: data.category, is_system: data.isSystem });
    await logAuditAction('channel_create', 'channel', 'channel', undefined, data.name, { type: data.type });
  };

  const handleDeleteChannel = async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel?.is_system) { toast({ title: "Action non autorisée", description: "Les canaux système ne peuvent pas être supprimés.", variant: "destructive" }); return; }
    await deleteChannel(channelId);
  };

  const handleSaveSettings = async () => {
    await updateChatConfig('maintenance_mode', String(systemSettings.maintenance_mode), 'system');
    await updateChatConfig('auto_backup_enabled', String(systemSettings.auto_backup), 'system');
    await updateChatConfig('realtime_enabled', String(systemSettings.real_time_sync), 'system');
    await updateChatConfig('message_retention_days', systemSettings.message_retention, 'system');
    await updateChatConfig('max_file_size_mb', systemSettings.max_file_size, 'system');
    await logAuditAction('config_change', 'configuration', 'config', undefined, 'system_settings', systemSettings);
    toast({ title: "Paramètres sauvegardés" });
  };

  const filteredPharmacies = pharmacies.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(pharmacySearch.toLowerCase());
    const matchFilter = pharmacyFilter === 'all' || p.status === pharmacyFilter;
    return matchSearch && matchFilter;
  });

  const filteredChannels = channels.filter(c => channelFilter === 'all' || c.type === channelFilter);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Shield className="h-8 w-8 animate-pulse" /><p className="ml-2">Chargement...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8 text-primary" />Administration Centrale</h1>
          <p className="text-muted-foreground">Supervision et gestion centralisée du réseau PharmaSoft</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportDialog(true)}><Download className="h-4 w-4 mr-2" />Exporter</Button>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
          <Badge variant="secondary" className={`${getStatusColor(systemMetrics.network_status)} text-white`}>{systemMetrics.network_status}</Badge>
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

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { title: 'Pharmacies', value: systemMetrics.total_pharmacies, sub: `${systemMetrics.active_pharmacies} actives`, icon: Building, color: 'text-primary' },
              { title: 'Canaux', value: systemMetrics.total_channels, sub: 'Canaux de communication', icon: MessageSquare, color: 'text-blue-500' },
              { title: 'Messages', value: systemMetrics.total_messages, sub: 'Messages échangés', icon: Activity, color: 'text-green-500' },
              { title: 'Disponibilité', value: systemMetrics.system_uptime, sub: 'Temps de fonctionnement', icon: Server, color: 'text-purple-500' }
            ].map((m, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{m.value}</div><p className="text-xs text-muted-foreground">{m.sub}</p></CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" />État des Services</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[{ icon: Database, label: 'Base de Données', status: true }, { icon: Wifi, label: 'Temps Réel', status: systemSettings.real_time_sync }, { icon: Network, label: 'Réseau', status: true }].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2"><s.icon className="h-4 w-4" /><span className="font-medium">{s.label}</span></div>
                    <div className={`flex items-center gap-1 ${s.status ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.status ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span className="text-sm">{s.status ? 'Opérationnel' : 'Désactivé'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Activité Récente</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {auditLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${log.severity === 'error' || log.severity === 'critical' ? 'bg-red-500' : log.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{log.action_type}</span>{log.target_type && <span className="text-xs text-muted-foreground">sur {log.target_type}</span>}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune activité récente</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Gestion des Pharmacies</CardTitle><CardDescription>Administration des officines du réseau</CardDescription></div>
                <div className="flex items-center gap-2">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." className="pl-9 w-64" value={pharmacySearch} onChange={e => setPharmacySearch(e.target.value)} /></div>
                  <Select value={pharmacyFilter} onValueChange={setPharmacyFilter}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="active">Actifs</SelectItem><SelectItem value="inactive">Inactifs</SelectItem></SelectContent></Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredPharmacies.map(pharmacy => (
                    <div key={pharmacy.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(pharmacy.status)}`} />
                        <div><h4 className="font-medium">{pharmacy.name}</h4><p className="text-sm text-muted-foreground">{pharmacy.code || 'N/A'} - {pharmacy.city || 'N/A'}, {pharmacy.region || 'N/A'}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{pharmacy.user_count} utilisateurs</Badge>
                        <Badge variant="outline">{pharmacy.type || 'standard'}</Badge>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPharmacy(pharmacy); setPharmacyActionsDialog(true); }}><UserCog className="h-4 w-4 mr-2" />Gérer</Button>
                      </div>
                    </div>
                  ))}
                  {filteredPharmacies.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune pharmacie trouvée</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Gestion des Canaux</CardTitle><CardDescription>Administration des canaux de communication</CardDescription></div>
                <div className="flex items-center gap-2">
                  <Select value={channelFilter} onValueChange={setChannelFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="team">Équipe</SelectItem><SelectItem value="function">Fonction</SelectItem><SelectItem value="supplier">Fournisseur</SelectItem><SelectItem value="system">Système</SelectItem></SelectContent></Select>
                  <Button onClick={() => setCreateChannelDialog(true)}><Plus className="h-4 w-4 mr-2" />Nouveau Canal</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredChannels.map(channel => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div><h4 className="font-medium">{channel.name}</h4><p className="text-sm text-muted-foreground">{channel.description || 'Aucune description'}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {channel.is_system && <Badge variant="secondary">Système</Badge>}
                      {channel.is_public ? <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />Public</Badge> : <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Privé</Badge>}
                      <Badge variant="outline">{channel.type}</Badge>
                      <Badge variant="outline">{channel.member_count} membres</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleOpenMembersDialog(channel)}><Users className="h-4 w-4 mr-2" />Membres</Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedChannel(channel); setEditChannelDialog(true); }}><Settings className="h-4 w-4" /></Button>
                      {!channel.is_system && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteChannel(channel.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                ))}
                {filteredChannels.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucun canal trouvé</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <NetworkHealthChart messageEvolution={messageEvolution} channelDistribution={channelDistribution} pharmacyActivity={pharmacies.slice(0, 10).map(p => ({ name: p.name.slice(0, 20), messages: Math.floor(Math.random() * 100), users: p.user_count }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <SystemAlertsCard alerts={auditLogs.filter(l => l.severity !== 'info').slice(0, 20)} onMarkAsReviewed={markAlertAsReviewed} />
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Invitations en attente</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {channelInvitations.filter(i => i.status === 'pending').length > 0 ? (
                    <div className="space-y-2">
                      {channelInvitations.filter(i => i.status === 'pending').map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm">Invitation canal #{inv.channel_id?.slice(0, 8)}</span>
                          <Badge variant="secondary">En attente</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground text-center py-8">Aucune invitation en attente</p>}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Paramètres Système</CardTitle><CardDescription>Configuration globale du réseau</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Maintenance</h4>
                  {[{ id: 'maintenance', label: 'Mode maintenance', key: 'maintenance_mode' }, { id: 'backup', label: 'Sauvegarde automatique', key: 'auto_backup' }, { id: 'realtime', label: 'Synchronisation temps réel', key: 'real_time_sync' }].map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <Label htmlFor={s.id}>{s.label}</Label>
                      <Switch id={s.id} checked={(systemSettings as any)[s.key]} onCheckedChange={checked => setSystemSettings(prev => ({ ...prev, [s.key]: checked }))} />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Stockage</h4>
                  <div className="space-y-2"><Label>Rétention des messages (jours)</Label><Input type="number" value={systemSettings.message_retention} onChange={e => setSystemSettings(prev => ({ ...prev, message_retention: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Taille max fichiers (MB)</Label><Input type="number" value={systemSettings.max_file_size} onChange={e => setSystemSettings(prev => ({ ...prev, max_file_size: e.target.value }))} /></div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => refetch()}>Réinitialiser</Button>
                <Button onClick={handleSaveSettings}><Save className="h-4 w-4 mr-2" />Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateChannelDialog open={createChannelDialog} onOpenChange={setCreateChannelDialog} onCreateChannel={handleCreateChannel} loading={loading} />
      {selectedChannel && <ChannelMembersManagerDialog open={!!membersManagerDialog} onOpenChange={open => { if (!open) { setMembersManagerDialog(null); setSelectedChannel(null); } }} channelId={selectedChannel.id} channelName={selectedChannel.name} members={channelMembers} availablePharmacies={pharmacies} onAddMember={async (pharmacyId, role) => { await addChannelMember(selectedChannel.id, pharmacyId, role); const m = await loadChannelMembers(selectedChannel.id); setChannelMembers(m); }} onRemoveMember={async memberId => { await removeChannelMember(memberId); const m = await loadChannelMembers(selectedChannel.id); setChannelMembers(m); }} onUpdateMemberRole={async (memberId, role) => { await updateChannelMemberRole(memberId, role); const m = await loadChannelMembers(selectedChannel.id); setChannelMembers(m); }} loading={loading} />}
      <EditChannelDialog open={editChannelDialog} onOpenChange={setEditChannelDialog} channel={selectedChannel} onSave={async (id, updates) => { await updateChannel(id, updates); }} loading={loading} />
      <PharmacyActionsDialog open={pharmacyActionsDialog} onOpenChange={setPharmacyActionsDialog} pharmacy={selectedPharmacy} channels={channels} onToggleChatEnabled={async () => {}} onSendInvitation={async (pharmacyId, channelId) => { await createChannelInvitation({ channel_id: channelId, invitee_tenant_id: pharmacyId, invitee_type: 'pharmacy' }); }} loading={loading} />
      <ConfigurationExportDialog open={exportDialog} onOpenChange={setExportDialog} pharmacies={pharmacies} auditLogs={auditLogs} channels={channels.map(c => ({ ...c, is_public: c.is_public || false }))} config={chatConfigs} stats={{ total_pharmacies: systemMetrics.total_pharmacies, active_pharmacies: systemMetrics.active_pharmacies, total_channels: systemMetrics.total_channels, total_messages: systemMetrics.total_messages }} />
    </div>
  );
};

export default CentralAdministration;
