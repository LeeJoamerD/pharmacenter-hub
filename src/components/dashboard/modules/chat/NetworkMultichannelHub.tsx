import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Globe,
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
  Video,
  Zap,
  Settings,
  Users,
  Bell,
  Shield,
  Activity,
  BarChart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Send,
  Plus
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp' | 'teams' | 'slack' | 'webhook';
  status: 'active' | 'inactive' | 'error';
  messages_sent: number;
  response_rate: number;
  last_used: string;
}

const NetworkMultichannelHub = () => {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'SMS Réseau',
        type: 'sms',
        status: 'active',
        messages_sent: 1247,
        response_rate: 85.3,
        last_used: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Email Professionnel',
        type: 'email',
        status: 'active',
        messages_sent: 856,
        response_rate: 72.1,
        last_used: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'WhatsApp Business',
        type: 'whatsapp',
        status: 'active',
        messages_sent: 623,
        response_rate: 91.7,
        last_used: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        name: 'Microsoft Teams',
        type: 'teams',
        status: 'active',
        messages_sent: 445,
        response_rate: 78.9,
        last_used: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        name: 'Slack Workspace',
        type: 'slack',
        status: 'inactive',
        messages_sent: 234,
        response_rate: 65.4,
        last_used: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    setChannels(mockChannels);
  }, []);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'sms': return <Smartphone className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />;
      case 'teams': return <Video className="h-5 w-5" />;
      case 'slack': return <Zap className="h-5 w-5" />;
      case 'webhook': return <Globe className="h-5 w-5" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Hub Multi-Canaux Réseau
          </h1>
          <p className="text-muted-foreground">
            Centre de communication multi-canaux unifié pour le réseau multi-officines
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau canal
        </Button>
      </div>

      {/* Métriques multi-canaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux Actifs</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {channels.length} total configurés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Envoyés</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.reduce((sum, c) => sum + c.messages_sent, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réponse</CardTitle>
            <BarChart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(channels.reduce((sum, c) => sum + c.response_rate, 0) / channels.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne réseau
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.2%</div>
            <p className="text-xs text-muted-foreground">
              Uptime global
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        {/* Gestion des canaux */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Canaux de Communication
              </CardTitle>
              <CardDescription>
                Gestion centralisée de tous les canaux de communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getChannelIcon(channel.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{channel.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{channel.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(channel.status)}`}></div>
                        <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
                          {channel.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Messages envoyés:</span>
                        <span className="font-medium">{channel.messages_sent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taux de réponse:</span>
                        <span className="font-medium">{channel.response_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière utilisation:</span>
                        <span className="font-medium">
                          {new Date(channel.last_used).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart className="h-4 w-4 mr-2" />
                        Stats
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automatisation */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Règles d'Automatisation
              </CardTitle>
              <CardDescription>
                Configuration des règles de routage et d'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Routage Intelligent</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Messages urgents → SMS</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Rapports → Email</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Discussions → WhatsApp</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Réponses Automatiques</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Accusé de réception</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Réponse hors horaires</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Escalade automatique</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics multi-canaux */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Analytics Multi-Canaux
              </CardTitle>
              <CardDescription>
                Performance et métriques des communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Performance par Canal</h4>
                  <div className="space-y-3">
                    {channels.slice(0, 3).map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel.type)}
                          <span className="text-sm">{channel.name}</span>
                        </div>
                        <span className="font-medium">{channel.response_rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Tendances Temporelles</h4>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+18%</div>
                      <div className="text-sm text-muted-foreground">Engagement ce mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">2.3s</div>
                      <div className="text-sm text-muted-foreground">Temps de réponse moyen</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Multi-Canaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Priorité des canaux</Label>
                    <div className="space-y-2 mt-2">
                      <div className="p-2 border rounded flex items-center justify-between">
                        <span className="text-sm">1. SMS</span>
                        <Button variant="ghost" size="sm">↕</Button>
                      </div>
                      <div className="p-2 border rounded flex items-center justify-between">
                        <span className="text-sm">2. WhatsApp</span>
                        <Button variant="ghost" size="sm">↕</Button>
                      </div>
                      <div className="p-2 border rounded flex items-center justify-between">
                        <span className="text-sm">3. Email</span>
                        <Button variant="ghost" size="sm">↕</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Paramètres globaux</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <Label>Fallback automatique</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Logs détaillés</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Notifications temps réel</Label>
                        <Switch />
                      </div>
                    </div>
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

export default NetworkMultichannelHub;