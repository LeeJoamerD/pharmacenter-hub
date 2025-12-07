import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Folder, Users, Settings, Plus, Edit, Trash2, Archive, Bell, Shield, Search,
  Hash, Building, Database, Network, MessageSquare, Tag, Save, X,
  CheckCircle, AlertTriangle, Globe, Lock, Zap, RefreshCw, Download,
  Copy, RotateCcw, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useNetworkChannelManagement, type ChannelWithMetrics } from '@/hooks/useNetworkChannelManagement';
import CreateKeywordAlertDialog from './dialogs/CreateKeywordAlertDialog';
import ChannelPermissionModal from './dialogs/ChannelPermissionModal';
import PartnerDetailModal from './dialogs/PartnerDetailModal';
import { 
  exportChannelsToExcel, 
  exportChannelsToPDF, 
  exportAlertsToExcel,
  exportPermissionsToExcel,
  exportPartnersToExcel
} from '@/utils/channelExportUtils';

const NetworkChannelManagement = () => {
  const {
    channels,
    keywordAlerts,
    permissions,
    partners,
    integrations,
    fluxConfig,
    stats,
    pharmacies,
    loading,
    loadAllData,
    createChannel,
    updateChannel,
    deleteChannel,
    archiveChannel,
    restoreChannel,
    duplicateChannel,
    createKeywordAlert,
    updateKeywordAlert,
    deleteKeywordAlert,
    toggleKeywordAlert,
    createPermission,
    updatePermission,
    deletePermission,
    togglePartner,
    saveFluxConfig,
    testIntegrationConnection
  } = useNetworkChannelManagement();

  // UI State
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelWithMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showKeywordAlertDialog, setShowKeywordAlertDialog] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedChannelForPermission, setSelectedChannelForPermission] = useState<ChannelWithMetrics | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [localFluxConfig, setLocalFluxConfig] = useState(fluxConfig);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'team',
    is_public: false,
    category: 'general',
    keywords: '',
    auto_archive_days: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'team',
      is_public: false,
      category: 'general',
      keywords: '',
      auto_archive_days: 0
    });
  };

  const handleCreateChannel = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom du canal est requis');
      return;
    }

    await createChannel({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      is_public: formData.is_public,
      category: formData.category,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      auto_archive_days: formData.auto_archive_days
    });

    setShowCreateChannel(false);
    resetForm();
  };

  const handleUpdateChannel = async () => {
    if (!editingChannel) return;

    await updateChannel(editingChannel.id, {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      is_public: formData.is_public,
      category: formData.category,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      auto_archive_days: formData.auto_archive_days
    });

    setEditingChannel(null);
    resetForm();
  };

  const openEditDialog = (channel: ChannelWithMetrics) => {
    setFormData({
      name: channel.name,
      description: channel.description,
      type: channel.type,
      is_public: channel.is_public,
      category: channel.category,
      keywords: channel.keywords.join(', '),
      auto_archive_days: channel.auto_archive_days
    });
    setEditingChannel(channel);
  };

  const openPermissionModal = (channel: ChannelWithMetrics) => {
    setSelectedChannelForPermission(channel);
    setShowPermissionModal(true);
  };

  const handleSaveFluxConfig = async () => {
    await saveFluxConfig(localFluxConfig);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'team': return Users;
      case 'function': return Settings;
      case 'supplier': return Building;
      case 'system': return Database;
      case 'collaboration': return Network;
      case 'alert': return AlertTriangle;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || channel.type === filterType;
    const matchesStatus = filterStatus === 'all' || channel.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Folder className="h-8 w-8 text-primary" />
            Gestion des Canaux Réseau
          </h1>
          <p className="text-muted-foreground">
            Configuration et administration des canaux de communication spécialisés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAllData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateChannel(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Canal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalChannels}</p>
                <p className="text-sm text-muted-foreground">Canaux ({stats.activeChannels} actifs)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-sm text-muted-foreground">Membres total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                <p className="text-sm text-muted-foreground">Alertes actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activePartners}</p>
                <p className="text-sm text-muted-foreground">Partenaires actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canaux ({channels.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés ({keywordAlerts.length})</TabsTrigger>
          <TabsTrigger value="external">Flux Externes</TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Canaux Actifs ({filteredChannels.length})
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input 
                      placeholder="Rechercher..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="team">Équipe</SelectItem>
                      <SelectItem value="function">Fonction</SelectItem>
                      <SelectItem value="supplier">Fournisseur</SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => exportChannelsToExcel(filteredChannels)}>
                    <Download className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportChannelsToPDF(filteredChannels)}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {filteredChannels.map((channel) => {
                      const IconComponent = getChannelIcon(channel.type);
                      return (
                        <div key={channel.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-primary" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{channel.name}</h4>
                                  {channel.is_system && (
                                    <Badge variant="outline" className="text-xs">Système</Badge>
                                  )}
                                  {channel.is_public && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Globe className="h-3 w-3 mr-1" />Public
                                    </Badge>
                                  )}
                                  {channel.is_inter_tenant && (
                                    <Badge variant="default" className="text-xs bg-purple-500">
                                      <Network className="h-3 w-3 mr-1" />Inter-tenant
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{channel.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(channel.status)}`} />
                              <Badge variant="outline">{channel.type}</Badge>
                              {!channel.is_system && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => openPermissionModal(channel)}>
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => openEditDialog(channel)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {channel.status === 'active' ? (
                                    <Button variant="outline" size="sm" onClick={() => archiveChannel(channel.id)}>
                                      <Archive className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button variant="outline" size="sm" onClick={() => restoreChannel(channel.id)}>
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => duplicateChannel(channel.id)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => deleteChannel(channel.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-5 text-sm">
                            <div>
                              <span className="text-muted-foreground">Membres: </span>
                              <span className="font-medium">{channel.members_count}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Messages: </span>
                              <span className="font-medium">{channel.messages_count}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Catégorie: </span>
                              <span className="font-medium">{channel.category}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Dernière activité: </span>
                              <span className="font-medium">
                                {format(new Date(channel.last_activity), 'dd/MM/yy HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Archive className="h-4 w-4" />
                              <span className="text-sm">
                                Auto-archivage: {channel.auto_archive_days > 0 ? `${channel.auto_archive_days}j` : 'Désactivé'}
                              </span>
                            </div>
                          </div>
                          
                          {channel.keywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {channel.keywords.map((kw, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />{kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredChannels.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Hash className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun canal trouvé</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions Granulaires ({permissions.length})
                  </CardTitle>
                  <CardDescription>
                    Configuration des droits d'accès par rôle et fonction
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportPermissionsToExcel(permissions)}>
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Permission Levels Legend */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Lecture</h4>
                      <Badge variant="secondary">read</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Voir les messages du canal</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Écriture</h4>
                      <Badge variant="secondary">write</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Envoyer des messages</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Administration</h4>
                      <Badge variant="default">admin</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Gérer le canal</p>
                  </div>
                </div>

                <Separator />

                {/* Permissions by Channel */}
                <div>
                  <h4 className="font-medium mb-4">Attribution des Permissions par Canal</h4>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {channels.filter(c => c.status === 'active').map((channel) => {
                        const channelPerms = permissions.filter(p => p.channel_id === channel.id);
                        return (
                          <div key={channel.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <Hash className="h-4 w-4" />
                              <div>
                                <span className="font-medium">{channel.name}</span>
                                {channel.is_public && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Public</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{channelPerms.length} règle(s)</Badge>
                              <Button variant="outline" size="sm" onClick={() => openPermissionModal(channel)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Gérer
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Surveillance des Mots-clés ({keywordAlerts.length})
                  </CardTitle>
                  <CardDescription>
                    Alertes automatiques sur termes critiques et sujets sensibles
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportAlertsToExcel(keywordAlerts)}>
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </Button>
                  <Button onClick={() => setShowKeywordAlertDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Alerte
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {keywordAlerts.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {keywordAlerts.map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-primary" />
                            <span className="font-medium text-lg">"{alert.keyword}"</span>
                            <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                              {alert.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={alert.is_active}
                              onCheckedChange={(checked) => toggleKeywordAlert(alert.id, checked)}
                            />
                            <Button variant="outline" size="sm" onClick={() => deleteKeywordAlert(alert.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type: </span>
                            <Badge variant="outline">
                              {alert.alert_type === 'immediate' ? 'Immédiat' : 
                               alert.alert_type === 'daily' ? 'Quotidien' : 'Hebdomadaire'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Canaux: </span>
                            <span className="font-medium">{alert.channel_ids.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Déclenchements: </span>
                            <span className="font-medium">{alert.trigger_count}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Destinataires: </span>
                            <span className="font-medium">{alert.recipients.length}</span>
                          </div>
                        </div>

                        {alert.channel_names.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {alert.channel_names.slice(0, 5).map((name, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <Hash className="h-3 w-3 mr-1" />{name}
                              </Badge>
                            ))}
                            {alert.channel_names.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{alert.channel_names.length - 5} autres
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune alerte configurée</p>
                  <p className="text-sm">Créez des alertes pour surveiller des mots-clés importants</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* External Flux Tab */}
        <TabsContent value="external" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Flux Externes et Intégrations
              </CardTitle>
              <CardDescription>
                Configuration des alertes et notifications des systèmes externes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Partners */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Partenaires Connectés ({partners.length})</h4>
                    <Button variant="outline" size="sm" onClick={() => exportPartnersToExcel(partners)}>
                      <Download className="h-4 w-4 mr-1" />
                      Exporter
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {partners.length > 0 ? (
                        partners.map((partner) => (
                          <div key={partner.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <Building className="h-5 w-5 text-primary" />
                              <div>
                                <span className="font-medium">{partner.display_name}</span>
                                <p className="text-sm text-muted-foreground">{partner.partner_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {partner.is_active ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                              )}
                              <Switch 
                                checked={partner.is_active}
                                onCheckedChange={(checked) => togglePartner(partner.id, checked)}
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setShowPartnerModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <Database className="h-5 w-5 text-green-500" />
                              <div>
                                <span className="font-medium">Système de Stock</span>
                                <p className="text-sm text-muted-foreground">Alertes ruptures et péremptions</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <Switch defaultChecked />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <Network className="h-5 w-5 text-blue-500" />
                              <div>
                                <span className="font-medium">ERP Pharmacie</span>
                                <p className="text-sm text-muted-foreground">Commandes et facturation</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Configuration */}
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration des Flux</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Fréquence de synchronisation</Label>
                      <Select 
                        value={localFluxConfig.sync_frequency} 
                        onValueChange={(v) => setLocalFluxConfig({...localFluxConfig, sync_frequency: v})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1min">Toutes les minutes</SelectItem>
                          <SelectItem value="5min">Toutes les 5 minutes</SelectItem>
                          <SelectItem value="15min">Toutes les 15 minutes</SelectItem>
                          <SelectItem value="1hour">Toutes les heures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Canal de destination</Label>
                      <Select 
                        value={localFluxConfig.destination_channel}
                        onValueChange={(v) => setLocalFluxConfig({...localFluxConfig, destination_channel: v})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Alertes Système</SelectItem>
                          {channels.filter(c => c.status === 'active').slice(0, 10).map(ch => (
                            <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Notifications temps réel</Label>
                      <Switch 
                        checked={localFluxConfig.realtime_notifications}
                        onCheckedChange={(v) => setLocalFluxConfig({...localFluxConfig, realtime_notifications: v})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Filtrage des doublons</Label>
                      <Switch 
                        checked={localFluxConfig.duplicate_filtering}
                        onCheckedChange={(v) => setLocalFluxConfig({...localFluxConfig, duplicate_filtering: v})}
                      />
                    </div>

                    <Button className="w-full" onClick={handleSaveFluxConfig}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder Configuration
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer un nouveau canal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du canal *</Label>
              <Input 
                placeholder="Ex: Support Technique" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-2" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de canal</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Privé</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="team">Équipe</SelectItem>
                    <SelectItem value="function">Fonction</SelectItem>
                    <SelectItem value="supplier">Fournisseur</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="urgences">Urgences</SelectItem>
                    <SelectItem value="commandes">Commandes</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="operations">Opérations</SelectItem>
                    <SelectItem value="sales">Ventes</SelectItem>
                    <SelectItem value="pharmacovigilance">Pharmacovigilance</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                placeholder="Description du canal..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-2" 
                rows={3} 
              />
            </div>
            <div>
              <Label>Mots-clés (séparés par virgule)</Label>
              <Input 
                placeholder="urgent, stock, commande" 
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                className="mt-2" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Canal public</Label>
                <Switch 
                  checked={formData.is_public} 
                  onCheckedChange={(v) => setFormData({...formData, is_public: v})}
                />
              </div>
              <div>
                <Label>Auto-archivage (jours)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.auto_archive_days}
                  onChange={(e) => setFormData({...formData, auto_archive_days: parseInt(e.target.value) || 0})}
                  className="mt-2" 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateChannel(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleCreateChannel}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={!!editingChannel} onOpenChange={() => { setEditingChannel(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier le canal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du canal</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-2" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Privé</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="team">Équipe</SelectItem>
                    <SelectItem value="function">Fonction</SelectItem>
                    <SelectItem value="supplier">Fournisseur</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="urgences">Urgences</SelectItem>
                    <SelectItem value="commandes">Commandes</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="operations">Opérations</SelectItem>
                    <SelectItem value="sales">Ventes</SelectItem>
                    <SelectItem value="pharmacovigilance">Pharmacovigilance</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-2" 
                rows={3} 
              />
            </div>
            <div>
              <Label>Mots-clés</Label>
              <Input 
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                className="mt-2" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Canal public</Label>
                <Switch 
                  checked={formData.is_public} 
                  onCheckedChange={(v) => setFormData({...formData, is_public: v})}
                />
              </div>
              <div>
                <Label>Auto-archivage (jours)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.auto_archive_days}
                  onChange={(e) => setFormData({...formData, auto_archive_days: parseInt(e.target.value) || 0})}
                  className="mt-2" 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingChannel(null); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleUpdateChannel}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyword Alert Dialog */}
      <CreateKeywordAlertDialog
        open={showKeywordAlertDialog}
        onOpenChange={setShowKeywordAlertDialog}
        channels={channels}
        onSubmit={createKeywordAlert}
      />

      {/* Permission Modal */}
      <ChannelPermissionModal
        open={showPermissionModal}
        onOpenChange={setShowPermissionModal}
        channel={selectedChannelForPermission}
        permissions={permissions}
        pharmacies={pharmacies}
        onCreatePermission={createPermission}
        onUpdatePermission={updatePermission}
        onDeletePermission={deletePermission}
      />

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        open={showPartnerModal}
        onOpenChange={setShowPartnerModal}
        partner={selectedPartner}
        onToggleActive={togglePartner}
      />
    </div>
  );
};

export default NetworkChannelManagement;
