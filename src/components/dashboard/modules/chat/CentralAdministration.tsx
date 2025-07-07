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
  Monitor
} from 'lucide-react';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SystemMetrics {
  total_pharmacies: number;
  active_pharmacies: number;
  total_channels: number;
  total_messages: number;
  system_uptime: string;
  network_status: 'healthy' | 'warning' | 'critical';
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

const CentralAdministration = () => {
  const { pharmacies, channels, loading } = useNetworkMessaging();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    total_pharmacies: 0,
    active_pharmacies: 0,
    total_channels: 0,
    total_messages: 0,
    system_uptime: '99.9%',
    network_status: 'healthy'
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    auto_backup: true,
    real_time_sync: true,
    message_retention: '30',
    max_file_size: '10'
  });

  useEffect(() => {
    if (pharmacies.length > 0 && channels.length > 0) {
      loadSystemMetrics();
      loadAuditLogs();
    }
  }, [pharmacies, channels]);

  const loadSystemMetrics = async () => {
    try {
      // Simuler des métriques système
      const activeCount = pharmacies.filter(p => p.status === 'active').length;
      
      // Compter les messages (simulation)
      const { count: messageCount } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true });

      setSystemMetrics({
        total_pharmacies: pharmacies.length,
        active_pharmacies: activeCount,
        total_channels: channels.length,
        total_messages: messageCount || 0,
        system_uptime: '99.9%',
        network_status: activeCount / pharmacies.length > 0.8 ? 'healthy' : 'warning'
      });
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    }
  };

  const loadAuditLogs = () => {
    // Simuler des logs d'audit
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        action: 'Connexion pharmacie',
        user: 'Pharmacie du Centre',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        details: 'Connexion réussie au réseau',
        severity: 'info'
      },
      {
        id: '2',
        action: 'Création canal',
        user: 'Admin Système',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        details: 'Nouveau canal "Urgences Régionales" créé',
        severity: 'info'
      },
      {
        id: '3',
        action: 'Alerte sécurité',
        user: 'Système',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        details: 'Tentative de connexion suspecte détectée',
        severity: 'warning'
      },
      {
        id: '4',
        action: 'Maintenance',
        user: 'Admin Technique',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        details: 'Maintenance programmée effectuée',
        severity: 'info'
      }
    ];
    setAuditLogs(mockLogs);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
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
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-blue-600';
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
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connecté</span>
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
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        log.severity === 'error' ? 'bg-red-500' :
                        log.severity === 'warning' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.action}</span>
                          <span className="text-xs text-muted-foreground">par {log.user}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                  ))}
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
                          {pharmacy.code} - {pharmacy.city}, {pharmacy.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pharmacy.type}</Badge>
                      <Button variant="outline" size="sm">
                        <UserCog className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des canaux */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Gestion des Canaux
              </CardTitle>
              <CardDescription>
                Administration des canaux de communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {channel.is_system && (
                        <Badge variant="secondary">Système</Badge>
                      )}
                      <Badge variant="outline">{channel.type}</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Monitoring Avancé</p>
                <p className="text-sm">Graphiques et métriques temps réel en cours de développement</p>
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
                <Button variant="outline">Réinitialiser</Button>
                <Button>Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CentralAdministration;