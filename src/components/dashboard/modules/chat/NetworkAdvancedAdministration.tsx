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
import { useNetworkAdministration } from '@/hooks/useNetworkAdministration';

const NetworkAdvancedAdministration = () => {
  const {
    systemComponents,
    userPermissions,
    securityLogs,
    backupJobs,
    loading,
    maintenanceMode,
    updateSystemComponent,
    updateAdminSetting,
    createBackupJob,
    updateBackupJob,
    refreshSystemStatus,
    toggleMaintenanceMode,
    getSetting
  } = useNetworkAdministration();

  const [selectedPharmacy, setSelectedPharmacy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          <Button variant="outline" onClick={refreshSystemStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant={maintenanceMode ? "destructive" : "outline"} onClick={toggleMaintenanceMode} disabled={loading}>
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
            {systemComponents.map((system) => (
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
                      <span>{system.cpu_load}%</span>
                    </div>
                    <Progress value={system.cpu_load} className={`h-2 ${getLoadColor(system.cpu_load)}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>RAM</span>
                      <span>{system.memory_usage}%</span>
                    </div>
                    <Progress value={system.memory_usage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Stockage</span>
                      <span>{system.storage_usage}%</span>
                    </div>
                    <Progress value={system.storage_usage} className="h-2" />
                  </div>

                  <div className="flex gap-1 pt-2">
                    <Button variant="outline" size="sm">
                      <Monitor className="h-3 w-3 mr-1" />
                      Détails
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateSystemComponent(system.id, { last_check: new Date().toISOString() })}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
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
                    <Input 
                      type="number" 
                      value={getSetting('network', 'max_connections', '1000')}
                      onChange={(e) => updateAdminSetting('network', 'max_connections', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                  <div>
                    <Label>Timeout de session (minutes)</Label>
                    <Input 
                      type="number" 
                      value={getSetting('network', 'session_timeout', '30')}
                      onChange={(e) => updateAdminSetting('network', 'session_timeout', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rate limiting activé</Label>
                    <Switch 
                      checked={getSetting('network', 'rate_limiting') === 'true'}
                      onCheckedChange={(checked) => updateAdminSetting('network', 'rate_limiting', checked.toString())}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Bande passante maximum (Mbps)</Label>
                    <Input 
                      type="number" 
                      value={getSetting('network', 'max_bandwidth', '100')}
                      onChange={(e) => updateAdminSetting('network', 'max_bandwidth', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                  <div>
                    <Label>Compression activée</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch 
                        checked={getSetting('network', 'compression_enabled') !== 'false'}
                        onCheckedChange={(checked) => updateAdminSetting('network', 'compression_enabled', checked.toString())}
                      />
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
                    <Switch 
                      checked={getSetting('security', 'require_2fa') === 'true'}
                      onCheckedChange={(checked) => updateAdminSetting('security', 'require_2fa', checked.toString())}
                    />
                  </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verrouillage automatique</Label>
                    <p className="text-sm text-muted-foreground">Après 3 tentatives échouées</p>
                  </div>
                  <Switch 
                    checked={getSetting('security', 'auto_lock') !== 'false'}
                    onCheckedChange={(checked) => updateAdminSetting('security', 'auto_lock', checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Logs détaillés</Label>
                    <p className="text-sm text-muted-foreground">Enregistrer toutes les actions</p>
                  </div>
                  <Switch 
                    checked={getSetting('security', 'detailed_logs') !== 'false'}
                    onCheckedChange={(checked) => updateAdminSetting('security', 'detailed_logs', checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alerte intrusion</Label>
                    <p className="text-sm text-muted-foreground">Notification temps réel</p>
                  </div>
                  <Switch 
                    checked={getSetting('security', 'intrusion_alerts') !== 'false'}
                    onCheckedChange={(checked) => updateAdminSetting('security', 'intrusion_alerts', checked.toString())}
                  />
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
                    <Switch 
                      checked={getSetting('backup', 'auto_backup_enabled') === 'true'}
                      onCheckedChange={(checked) => updateAdminSetting('backup', 'auto_backup_enabled', checked.toString())}
                    />
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
                      {backupJobs.slice(0, 3).map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="text-sm font-medium">{backup.job_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {backup.last_run ? new Date(backup.last_run).toLocaleString('fr-FR') : 'Jamais exécuté'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {backup.last_status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : backup.last_status === 'failed' ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <Button variant="ghost" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {backupJobs.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Aucune sauvegarde configurée
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => createBackupJob({
                      job_name: `Sauvegarde manuelle ${new Date().toLocaleDateString('fr-FR')}`,
                      job_type: 'full',
                      schedule_type: 'manual'
                    })}
                    disabled={loading}
                  >
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
                  <Input 
                    placeholder="Rechercher dans les logs..." 
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
                  {securityLogs
                    .filter(log => 
                      searchTerm === '' || 
                      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.user.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((log) => (
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
                  
                  {securityLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun log de sécurité disponible
                    </div>
                  )}
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
                    <Button variant="outline" size="sm" onClick={refreshSystemStatus} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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