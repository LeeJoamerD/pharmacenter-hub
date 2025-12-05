import React, { useState, useEffect } from 'react';
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
  Filter, Hash, Building, Truck, Database, Network, MessageSquare, Tag, Save, X,
  CheckCircle, AlertTriangle, Globe, Lock, Zap, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Channel {
  id: string;
  name: string;
  description: string;
  type?: string;
  channel_type?: string;
  members_count: number;
  messages_count: number;
  status: 'active' | 'archived' | 'paused';
  is_public: boolean;
  is_system: boolean;
  keywords: string[];
  autoArchive: boolean;
  lastActivity: string;
  created_at: string;
  tenant_id: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  level: 'read' | 'write' | 'admin';
}

interface KeywordAlert {
  id: string;
  keyword: string;
  channels: string[];
  alertType: 'immediate' | 'daily' | 'weekly';
  recipients: string[];
  active: boolean;
}

interface PartnerAccount {
  id: string;
  partner_type: string;
  partner_name: string;
  is_active: boolean;
  created_at: string;
}

const NetworkChannelManagement = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [permissions] = useState<Permission[]>([
    { id: '1', name: 'Lecture', description: 'Voir les messages', level: 'read' },
    { id: '2', name: 'Écriture', description: 'Envoyer des messages', level: 'write' },
    { id: '3', name: 'Administration', description: 'Gérer le canal', level: 'admin' }
  ]);
  const [keywordAlerts, setKeywordAlerts] = useState<KeywordAlert[]>([]);
  const [partnerAccounts, setPartnerAccounts] = useState<PartnerAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form state for new/edit channel
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel_type: 'team',
    is_public: false,
    keywords: ''
  });

  useEffect(() => {
    if (tenantId) {
      loadAllData();
    }
  }, [tenantId]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadChannels(),
      loadKeywordAlerts(),
      loadPartnerAccounts()
    ]);
    setLoading(false);
  };

  const loadChannels = async () => {
    try {
      const { data } = await supabase
        .from('network_channels')
        .select('id, name, description, type, is_public, is_system, tenant_id, created_at')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      const enrichedChannels: Channel[] = (data || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        description: ch.description || '',
        type: ch.type,
        channel_type: ch.type,
        members_count: 0,
        messages_count: 0,
        status: 'active' as const,
        is_public: ch.is_public || false,
        is_system: ch.is_system || false,
        keywords: [],
        autoArchive: false,
        lastActivity: ch.created_at,
        created_at: ch.created_at,
        tenant_id: ch.tenant_id
      }));

      setChannels(enrichedChannels);
    } catch (error) {
      console.error('Erreur chargement canaux:', error);
    }
  };

  const loadKeywordAlerts = async () => {
    // Keyword alerts not yet implemented in DB
    setKeywordAlerts([]);
  };

  const loadPartnerAccounts = async () => {
    try {
      const { data } = await supabase
        .from('network_partner_accounts')
        .select('id, partner_type, display_name, is_active, created_at')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      const mapped: PartnerAccount[] = (data || []).map((p: any) => ({
        id: p.id,
        partner_type: p.partner_type,
        partner_name: p.display_name || '',
        is_active: p.is_active,
        created_at: p.created_at
      }));

      setPartnerAccounts(mapped);
    } catch (error) {
      console.error('Erreur chargement partenaires:', error);
    }
  };

  const handleCreateChannel = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom du canal est requis');
      return;
    }

    try {
      const { error } = await supabase
        .from('network_channels')
        .insert({
          name: formData.name,
          description: formData.description,
          channel_type: formData.channel_type,
          is_public: formData.is_public,
          tenant_id: tenantId,
          is_system: false
        });

      if (error) throw error;

      toast.success('Canal créé avec succès');
      setShowCreateChannel(false);
      resetForm();
      await loadChannels();
    } catch (error) {
      console.error('Erreur création canal:', error);
      toast.error('Erreur lors de la création du canal');
    }
  };

  const handleUpdateChannel = async () => {
    if (!editingChannel || !formData.name.trim()) return;

    try {
      const { error } = await supabase
        .from('network_channels')
        .update({
          name: formData.name,
          description: formData.description,
          is_public: formData.is_public
        })
        .eq('id', editingChannel.id);

      if (error) throw error;

      toast.success('Canal mis à jour');
      setEditingChannel(null);
      resetForm();
      await loadChannels();
    } catch (error) {
      console.error('Erreur mise à jour canal:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce canal ?')) return;

    try {
      // Delete participants first
      await supabase.from('channel_participants').delete().eq('channel_id', channelId);
      // Delete messages
      await supabase.from('network_messages').delete().eq('channel_id', channelId);
      // Delete channel
      const { error } = await supabase.from('network_channels').delete().eq('id', channelId);

      if (error) throw error;

      toast.success('Canal supprimé');
      await loadChannels();
    } catch (error) {
      console.error('Erreur suppression canal:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      channel_type: 'team',
      is_public: false,
      keywords: ''
    });
  };

  const openEditDialog = (channel: Channel) => {
    setFormData({
      name: channel.name,
      description: channel.description,
      channel_type: channel.channel_type || 'team',
      is_public: channel.is_public,
      keywords: channel.keywords.join(', ')
    });
    setEditingChannel(channel);
  };

  const getChannelIcon = (type?: string) => {
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
    const matchesFilter = filterType === 'all' || channel.channel_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canaux ({channels.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="external">Flux Externes</TabsTrigger>
        </TabsList>

        {/* Gestion des Canaux */}
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
                      placeholder="Rechercher un canal..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="team">Équipe</SelectItem>
                      <SelectItem value="function">Fonction</SelectItem>
                      <SelectItem value="supplier">Fournisseur</SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                      <SelectItem value="alert">Alertes</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
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
                <div className="space-y-4">
                  {filteredChannels.map((channel) => {
                    const IconComponent = getChannelIcon(channel.channel_type);
                    return (
                      <div key={channel.id} className="p-4 border rounded-lg">
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
                              </div>
                              <p className="text-sm text-muted-foreground">{channel.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(channel.status)}`} />
                            <Badge variant="outline">{channel.channel_type || 'team'}</Badge>
                            {!channel.is_system && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(channel)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteChannel(channel.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Membres: </span>
                            <span className="font-medium">{channel.members_count}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Messages: </span>
                            <span className="font-medium">{channel.messages_count}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Dernière activité: </span>
                            <span className="font-medium">
                              {new Date(channel.lastActivity).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Archive className="h-4 w-4" />
                            <span className="text-sm">
                              Auto-archivage: {channel.autoArchive ? 'Activé' : 'Désactivé'}
                            </span>
                          </div>
                        </div>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des Permissions */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions Granulaires
              </CardTitle>
              <CardDescription>
                Configuration des droits d'accès par rôle et fonction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{permission.name}</h4>
                        <Badge variant={permission.level === 'admin' ? 'default' : 'secondary'}>
                          {permission.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Attribution des Permissions par Canal</h4>
                  <div className="space-y-3">
                    {channels.slice(0, 5).map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Hash className="h-4 w-4" />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">read</Badge>
                          <Badge variant="outline">write</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surveillance des Mots-clés */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Surveillance des Mots-clés
                  </CardTitle>
                  <CardDescription>
                    Alertes automatiques sur termes critiques et sujets sensibles
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Alerte
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {keywordAlerts.length > 0 ? (
                <div className="space-y-4">
                  {keywordAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Tag className="h-5 w-5 text-primary" />
                          <span className="font-medium text-lg">"{alert.keyword}"</span>
                          <Badge variant={alert.active ? 'default' : 'secondary'}>
                            {alert.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={alert.active} />
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type d'alerte: </span>
                          <Badge variant="outline">{alert.alertType}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Canaux surveillés: </span>
                          <span className="font-medium">{alert.channels.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Destinataires: </span>
                          <span className="font-medium">{alert.recipients.length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

        {/* Flux Externes */}
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
                <div className="space-y-4">
                  <h4 className="font-medium">Partenaires Connectés ({partnerAccounts.length})</h4>
                  
                  <div className="space-y-3">
                    {partnerAccounts.length > 0 ? (
                      partnerAccounts.map((partner) => (
                        <div key={partner.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-primary" />
                            <div>
                              <span className="font-medium">{partner.partner_name}</span>
                              <p className="text-sm text-muted-foreground">{partner.partner_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {partner.is_active ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                            )}
                            <Switch checked={partner.is_active} />
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

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-purple-500" />
                            <div>
                              <span className="font-medium">Transporteurs</span>
                              <p className="text-sm text-muted-foreground">Notifications de livraison</p>
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
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Configuration des Flux</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Fréquence de synchronisation</Label>
                      <Select defaultValue="5min">
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
                      <Select defaultValue="system">
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Alertes Système</SelectItem>
                          {channels.slice(0, 5).map(ch => (
                            <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Notifications temps réel</Label>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Filtrage des doublons</Label>
                      <Switch defaultChecked />
                    </div>

                    <Button className="w-full">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer un nouveau canal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du canal</Label>
              <Input 
                placeholder="Ex: Support Technique" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-2" 
              />
            </div>
            <div>
              <Label>Type de canal</Label>
              <Select value={formData.channel_type} onValueChange={(v) => setFormData({...formData, channel_type: v})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Équipe</SelectItem>
                  <SelectItem value="function">Fonction</SelectItem>
                  <SelectItem value="supplier">Fournisseur</SelectItem>
                  <SelectItem value="collaboration">Collaboration</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="flex items-center justify-between">
              <Label>Canal public</Label>
              <Switch 
                checked={formData.is_public} 
                onCheckedChange={(v) => setFormData({...formData, is_public: v})}
              />
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
        <DialogContent>
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
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-2" 
                rows={3} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Canal public</Label>
              <Switch 
                checked={formData.is_public} 
                onCheckedChange={(v) => setFormData({...formData, is_public: v})}
              />
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
    </div>
  );
};

export default NetworkChannelManagement;
