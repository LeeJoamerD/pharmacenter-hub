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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  Shield,
  Users,
  Database,
  Network,
  Server,
  Globe,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart,
  Clock,
  Mail,
  Bell,
  Archive,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Power,
  Zap,
  Eye,
  EyeOff,
  Search,
  Filter,
  Plus,
  Edit,
  Save,
  X,
  Cpu,
  HardDrive,
  Wifi,
  Router,
  Monitor
} from 'lucide-react';

interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  load: number;
  memory: number;
  storage: number;
}

interface UserPermission {
  id: string;
  pharmacy_name: string;
  user_count: number;
  admin_count: number;
  last_access: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
}

interface SecurityLog {
  id: string;
  timestamp: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'security_alert';
  user: string;
  pharmacy: string;
  ip_address: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

const NetworkAdvancedAdministration = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState('all');

  useEffect(() => {
    loadAdministrationData();
  }, []);

  const loadAdministrationData = () => {
    // Statut système
    const mockSystemStatus: SystemStatus[] = [
      {
        id: '1',
        name: 'Serveur Principal',
        status: 'online',
        uptime: '15j 8h 23m',
        load: 45,
        memory: 67,
        storage: 23
      },
      {
        id: '2',
        name: 'Base de Données',
        status: 'online',
        uptime: '15j 8h 23m',
        load: 32,
        memory: 54,
        storage: 78
      },
      {
        id: '3',
        name: 'Serveur Chat',
        status: 'warning',
        uptime: '2j 4h 12m',
        load: 78,
        memory: 89,
        storage: 34
      },
      {
        id: '4',
        name: 'CDN/Médias',
        status: 'online',
        uptime: '30j 12h 45m',
        load: 23,
        memory: 34,
        storage: 56
      }
    ];

    // Permissions utilisateurs
    const mockUserPermissions: UserPermission[] = [
      {
        id: '1',
        pharmacy_name: 'Pharmacie Central',
        user_count: 8,
        admin_count: 2,
        last_access: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        permissions: ['read', 'write', 'admin', 'analytics']
      },
      {
        id: '2',
        pharmacy_name: 'Pharmacie de la Gare',
        user_count: 5,
        admin_count: 1,
        last_access: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        permissions: ['read', 'write', 'analytics']
      },
      {
        id: '3',
        pharmacy_name: 'Pharmacie du Centre',
        user_count: 6,
        admin_count: 1,
        last_access: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'inactive',
        permissions: ['read', 'write']
      }
    ];

    // Logs de sécurité
    const mockSecurityLogs: SecurityLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'login',
        user: 'Dr. Martin',
        pharmacy: 'Pharmacie Central',
        ip_address: '192.168.1.45',
        details: 'Connexion réussie',
        severity: 'info'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: 'failed_login',
        user: 'admin@pharma2',
        pharmacy: 'Pharmacie de la Gare',
        ip_address: '203.45.67.89',
        details: 'Tentative de connexion échouée - mot de passe incorrect',
        severity: 'warning'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'permission_change',
        user: 'Administrateur',
        pharmacy: 'Système',
        ip_address: '192.168.1.10',
        details: 'Modification des permissions pour Pharmacie du Centre',
        severity: 'info'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        type: 'security_alert',
        user: 'Système',
        pharmacy: 'Global',
        ip_address: 'N/A',
        details: 'Détection de tentatives de connexion suspectes',
        severity: 'error'
      }
    ];

    setSystemStatus(mockSystemStatus);
    setUserPermissions(mockUserPermissions);
    setSecurityLogs(mockSecurityLogs);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return 'bg-green-500';
    if (load < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Administration Réseau Avancée
          </h1>
          <p className="text-muted-foreground">
            Gestion avancée, sécurité et monitoring du réseau multi-officines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant={maintenanceMode ? "destructive" : "outline"} onClick={() => setMaintenanceMode(!maintenanceMode)}>
            <Power className="h-4 w-4 mr-2" />
            {maintenanceMode ? 'Quitter Maintenance' : 'Mode Maintenance'}
          </Button>
        </div>
      </div>

      {maintenanceMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Mode Maintenance Activé</h4>
                <p className="text-sm text-yellow-600">
                  Le système est en maintenance. Les utilisateurs ne peuvent pas accéder aux fonctionnalités.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="backup">Sauvegarde</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Système */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {systemStatus.map((system) => (
              <Card key={system.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{system.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(system.status)}`}></div>
                      <Badge variant={system.status === 'online' ? 'default' : system.status === 'warning' ? 'secondary' : 'destructive'}>
                        {system.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Uptime: {system.uptime}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>CPU</span>
                      <span>{system.load}%</span>
                    </div>
                    <Progress value={system.load} className={`h-2 ${getLoadColor(system.load)}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>RAM</span>
                      <span>{system.memory}%</span>
                    </div>
                    <Progress value={system.memory} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Stockage</span>
                      <span>{system.storage}%</span>
                    </div>
                    <Progress value={system.storage} className="h-2" />
                  </div>

                  <div className="flex gap-1 pt-2">
                    <Button variant="outline" size="sm">
                      <Monitor className="h-3 w-3 mr-1" />
                      Détails
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Configuration Réseau
              </CardTitle>
              <CardDescription>
                Paramètres de connectivité et performance réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Limite de connexions simultanées</Label>
                    <Input type="number" defaultValue="1000" className="mt-2" />
                  </div>
                  <div>
                    <Label>Timeout de session (minutes)</Label>
                    <Input type="number" defaultValue="30" className="mt-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rate limiting activé</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Bande passante maximum (Mbps)</Label>
                    <Input type="number" defaultValue="100" className="mt-2" />
                  </div>
                  <div>
                    <Label>Compression activée</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch defaultChecked />
                      <span className="text-sm text-muted-foreground">Réduit la charge réseau de ~40%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Permissions par Officine
              </CardTitle>
              <CardDescription>
                Administration des droits d'accès et permissions utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPermissions.map((pharmacy) => (
                  <div key={pharmacy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{pharmacy.pharmacy_name}</h4>
                        <Badge variant={pharmacy.status === 'active' ? 'default' : 'secondary'}>
                          {pharmacy.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mb-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Utilisateurs: </span>
                        <span className="font-medium">{pharmacy.user_count}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Administrateurs: </span>
                        <span className="font-medium">{pharmacy.admin_count}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Dernier accès: </span>
                        <span className="font-medium">
                          {new Date(pharmacy.last_access).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Permissions accordées:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pharmacy.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline">
                            {permission}
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

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Paramètres de Sécurité
                </CardTitle>
                <CardDescription>
                  Configuration des règles de sécurité réseau
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Authentification 2FA obligatoire</Label>
                    <p className="text-sm text-muted-foreground">Exiger l'authentification à deux facteurs</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verrouillage automatique</Label>
                    <p className="text-sm text-muted-foreground">Après 3 tentatives échouées</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Logs détaillés</Label>
                    <p className="text-sm text-muted-foreground">Enregistrer toutes les actions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alerte intrusion</Label>
                    <p className="text-sm text-muted-foreground">Notification temps réel</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div>
                  <Label>Règles IP autorisées</Label>
                  <Textarea
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Chiffrement et Certificats
                </CardTitle>
                <CardDescription>
                  Gestion des clés et certificats de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Certificat SSL</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expire le: 15/08/2025
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Clé API</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dernière rotation: 01/07/2025
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Chiffrement base</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AES-256 activé
                  </div>
                </div>

                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renouveler Certificats
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sauvegarde */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Stratégie de Sauvegarde
              </CardTitle>
              <CardDescription>
                Configuration et gestion des sauvegardes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sauvegarde automatique</Label>
                      <p className="text-sm text-muted-foreground">Sauvegardes quotidiennes à 02h00</p>
                    </div>
                    <Switch checked={backupEnabled} onCheckedChange={setBackupEnabled} />
                  </div>

                  <div>
                    <Label>Fréquence de sauvegarde</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Rétention (jours)</Label>
                    <Input type="number" defaultValue="30" className="mt-2" />
                  </div>

                  <div>
                    <Label>Stockage distant</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch defaultChecked />
                      <span className="text-sm text-muted-foreground">Cloud sécurisé</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Dernières sauvegardes</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium">Sauvegarde complète</div>
                          <div className="text-xs text-muted-foreground">07/07/2025 02:00</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium">Sauvegarde messages</div>
                          <div className="text-xs text-muted-foreground">06/07/2025 02:00</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium">Sauvegarde config</div>
                          <div className="text-xs text-muted-foreground">05/07/2025 02:00</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Archive className="h-4 w-4 mr-2" />
                    Créer Sauvegarde Manuelle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Logs de Sécurité et Activité
              </CardTitle>
              <CardDescription>
                Historique des événements système et sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input placeholder="Rechercher dans les logs..." className="w-64" />
                </div>
                <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les officines</SelectItem>
                    <SelectItem value="pharmacy-1">Pharmacie Central</SelectItem>
                    <SelectItem value="pharmacy-2">Pharmacie de la Gare</SelectItem>
                    <SelectItem value="pharmacy-3">Pharmacie du Centre</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {securityLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getSeverityColor(log.severity)}>
                            {log.type}
                          </Badge>
                          <span className="text-sm font-medium">{log.user}</span>
                          <span className="text-sm text-muted-foreground">• {log.pharmacy}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {log.details}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        IP: {log.ip_address}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de {securityLogs.length} événements
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkAdvancedAdministration;