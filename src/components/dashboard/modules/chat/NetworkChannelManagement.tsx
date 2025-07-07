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
  Folder,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Archive,
  Bell,
  Shield,
  Search,
  Filter,
  Eye,
  EyeOff,
  Hash,
  Building,
  Truck,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  Zap,
  Database,
  Network,
  MessageSquare,
  Tag,
  Key,
  Save,
  X
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'team' | 'function' | 'supplier' | 'system';
  category: string;
  members: number;
  messages: number;
  status: 'active' | 'archived' | 'paused';
  permissions: string[];
  keywords: string[];
  autoArchive: boolean;
  lastActivity: string;
  created_at: string;
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

const NetworkChannelManagement = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [keywordAlerts, setKeywordAlerts] = useState<KeywordAlert[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadChannelData();
  }, []);

  const loadChannelData = () => {
    // Simulation des données de canaux
    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'Direction Générale',
        description: 'Canal de communication pour la direction',
        type: 'team',
        category: 'Direction',
        members: 8,
        messages: 247,
        status: 'active',
        permissions: ['read', 'write', 'admin'],
        keywords: ['urgent', 'direction', 'décision'],
        autoArchive: true,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Équipe Pharmaciens',
        description: 'Discussions professionnelles entre pharmaciens',
        type: 'team',
        category: 'Pharmaciens',
        members: 12,
        messages: 1523,
        status: 'active',
        permissions: ['read', 'write'],
        keywords: ['ordonnance', 'interaction', 'conseil'],
        autoArchive: false,
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Support Client',
        description: 'Canal dédié au support clientèle',
        type: 'function',
        category: 'Support',
        members: 6,
        messages: 892,
        status: 'active',
        permissions: ['read', 'write'],
        keywords: ['problème', 'réclamation', 'aide'],
        autoArchive: true,
        lastActivity: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        name: 'Fournisseur Sanofi',
        description: 'Communication avec le laboratoire Sanofi',
        type: 'supplier',
        category: 'Laboratoires',
        members: 4,
        messages: 156,
        status: 'active',
        permissions: ['read'],
        keywords: ['commande', 'livraison', 'sanofi'],
        autoArchive: true,
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        name: 'Alertes Système',
        description: 'Notifications automatiques du système',
        type: 'system',
        category: 'Technique',
        members: 0,
        messages: 45,
        status: 'active',
        permissions: ['read'],
        keywords: ['alerte', 'système', 'erreur'],
        autoArchive: false,
        lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const mockPermissions: Permission[] = [
      { id: '1', name: 'Lecture', description: 'Voir les messages', level: 'read' },
      { id: '2', name: 'Écriture', description: 'Envoyer des messages', level: 'write' },
      { id: '3', name: 'Administration', description: 'Gérer le canal', level: 'admin' }
    ];

    const mockKeywordAlerts: KeywordAlert[] = [
      {
        id: '1',
        keyword: 'urgent',
        channels: ['1', '2', '3'],
        alertType: 'immediate',
        recipients: ['admin@pharmacie.fr'],
        active: true
      },
      {
        id: '2',
        keyword: 'rappel',
        channels: ['2', '3'],
        alertType: 'daily',
        recipients: ['direction@pharmacie.fr'],
        active: true
      },
      {
        id: '3',
        keyword: 'rupture',
        channels: ['1', '5'],
        alertType: 'immediate',
        recipients: ['stock@pharmacie.fr'],
        active: false
      }
    ];

    setChannels(mockChannels);
    setPermissions(mockPermissions);
    setKeywordAlerts(mockKeywordAlerts);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'team': return Users;
      case 'function': return Settings;
      case 'supplier': return Building;
      case 'system': return Database;
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
    const matchesFilter = filterType === 'all' || channel.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const CreateChannelForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Créer un nouveau canal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Nom du canal</Label>
            <Input placeholder="Ex: Support Technique" className="mt-2" />
          </div>
          <div>
            <Label>Type de canal</Label>
            <Select>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Équipe</SelectItem>
                <SelectItem value="function">Fonction</SelectItem>
                <SelectItem value="supplier">Fournisseur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label>Description</Label>
          <Textarea placeholder="Description du canal..." className="mt-2" rows={3} />
        </div>

        <div>
          <Label>Catégorie</Label>
          <Input placeholder="Ex: Direction, Support, Commandes..." className="mt-2" />
        </div>

        <div>
          <Label>Mots-clés surveillés</Label>
          <Input placeholder="urgent, problème, commande... (séparés par des virgules)" className="mt-2" />
        </div>

        <div className="flex items-center justify-between">
          <Label>Archivage automatique</Label>
          <Switch />
        </div>

        <div className="flex gap-2 pt-4">
          <Button>Créer le canal</Button>
          <Button variant="outline" onClick={() => setShowCreateChannel(false)}>Annuler</Button>
        </div>
      </CardContent>
    </Card>
  );

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
        <Button onClick={() => setShowCreateChannel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Canal
        </Button>
      </div>

      {showCreateChannel && <CreateChannelForm />}

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canaux</TabsTrigger>
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
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredChannels.map((channel) => {
                  const IconComponent = getChannelIcon(channel.type);
                  return (
                    <div key={channel.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{channel.name}</h4>
                            <p className="text-sm text-muted-foreground">{channel.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(channel.status)}`}></div>
                          <Badge variant="outline">{channel.category}</Badge>
                          <Button variant="outline" size="sm" onClick={() => setSelectedChannel(channel)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Membres: </span>
                          <span className="font-medium">{channel.members}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Messages: </span>
                          <span className="font-medium">{channel.messages}</span>
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

                      <div className="mt-3">
                        <Label className="text-sm">Mots-clés surveillés:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {channel.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                              <Tag className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    {channels.slice(0, 3).map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Hash className="h-4 w-4" />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="flex gap-2">
                          {channel.permissions.map((perm, index) => (
                            <Badge key={index} variant="outline">{perm}</Badge>
                          ))}
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
              <div className="space-y-4">
                {keywordAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-primary" />
                          <span className="font-medium text-lg">"{alert.keyword}"</span>
                        </div>
                        <Badge variant={alert.active ? 'default' : 'secondary'}>
                          {alert.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={alert.active} />
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
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

                    <div className="mt-3">
                      <Label className="text-sm">Destinataires:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {alert.recipients.map((recipient, index) => (
                          <Badge key={index} variant="secondary">
                            {recipient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <h4 className="font-medium">Systèmes Connectés</h4>
                  
                  <div className="space-y-3">
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
                        <Globe className="h-5 w-5 text-orange-500" />
                        <div>
                          <span className="font-medium">Site Web</span>
                          <p className="text-sm text-muted-foreground">Messages clients et commandes en ligne</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <Switch />
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
                          <SelectItem value="direction">Direction Générale</SelectItem>
                          <SelectItem value="support">Support Client</SelectItem>
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
    </div>
  );
};

export default NetworkChannelManagement;