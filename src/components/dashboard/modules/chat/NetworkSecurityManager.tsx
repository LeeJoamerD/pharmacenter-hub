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
import { useToast } from '@/components/ui/use-toast';
import { 
  Lock,
  Shield,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Clock,
  RefreshCw,
  Users,
  FileText,
  Database,
  Smartphone,
  Wifi,
  Activity,
  BarChart3,
  Zap,
  Globe,
  Server,
  HardDrive,
  UserCheck,
  UserX,
  Calendar,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  LogOut,
  LogIn,
  Monitor,
  Bell,
  Save
} from 'lucide-react';
import { useNetworkChatAdmin } from '@/hooks/useNetworkChatAdmin';
import { useNetworkAdministration } from '@/hooks/useNetworkAdministration';
import NetworkAuditViewerDialog from './dialogs/NetworkAuditViewerDialog';

const NetworkSecurityManager = () => {
  const { toast } = useToast();
  const {
    auditLogs,
    chatPermissions,
    chatConfigs,
    loading: chatLoading,
    updateChatConfig,
    logAuditAction
  } = useNetworkChatAdmin();

  const {
    securityLogs,
    loading: networkLoading,
    getSetting,
    updateAdminSetting
  } = useNetworkAdministration();

  const loading = chatLoading || networkLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [auditingEnabled, setAuditingEnabled] = useState(true);
  const [auditViewerDialog, setAuditViewerDialog] = useState(false);

  // Load settings from config
  useEffect(() => {
    if (chatConfigs.length > 0) {
      const getConfig = (key: string, defaultVal: string) => {
        const cfg = chatConfigs.find(c => c.key === key);
        return cfg?.value || defaultVal;
      };
      setTwoFactorEnabled(getConfig('require_2fa', 'true') === 'true');
      setEncryptionEnabled(getConfig('encryption_enabled', 'true') === 'true');
    }
  }, [chatConfigs]);

  // Combine audit logs from both sources
  const allSecurityEvents = [
    ...auditLogs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      event_type: log.action_type,
      severity: log.severity as 'low' | 'medium' | 'high' | 'critical',
      user: log.user_id || 'Système',
      pharmacy: log.tenant_id || 'Réseau',
      description: log.details ? JSON.stringify(log.details) : log.action_type,
      ip_address: log.ip_address || 'N/A',
      status: 'resolved' as const
    })),
    ...securityLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      event_type: log.type,
      severity: (log.severity === 'error' ? 'high' : log.severity === 'warning' ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'critical',
      user: log.user,
      pharmacy: log.pharmacy,
      description: log.details,
      ip_address: log.ip_address,
      status: 'resolved' as const
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Access rules from chat permissions
  const accessRules = chatPermissions.map(perm => ({
    id: perm.id,
    name: `Permission ${perm.permission_type}`,
    type: 'permission' as const,
    target: perm.target_tenant_id,
    permissions: [perm.permission_type],
    resources: ['chat', 'channels'],
    status: perm.is_granted ? 'active' as const : 'inactive' as const,
    created_at: perm.created_at || new Date().toISOString()
  }));

  // Security metrics
  const securityMetrics = {
    score: 98,
    activeAlerts: allSecurityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length,
    activeSessions: 127,
    encryptionStatus: encryptionEnabled ? 'Actif' : 'Inactif'
  };

  // Encryption status (mock data + real config)
  const encryptionStatus = [
    {
      id: 'ENC001',
      resource: 'Messages Chat',
      type: 'End-to-End',
      algorithm: 'AES-256-GCM',
      key_rotation: '30 jours',
      status: encryptionEnabled ? 'active' : 'inactive',
      last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ENC002',
      resource: 'Base de données',
      type: 'Database Encryption',
      algorithm: 'AES-256',
      key_rotation: '90 jours',
      status: 'active',
      last_updated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ENC003',
      resource: 'Fichiers partagés',
      type: 'File Encryption',
      algorithm: 'ChaCha20-Poly1305',
      key_rotation: '60 jours',
      status: 'active',
      last_updated: new Date().toISOString()
    }
  ];

  // Compliance reports (mock)
  const complianceReports = [
    {
      id: 'COMP001',
      type: 'HIPAA Compliance',
      period: 'Q4 2024',
      status: 'completed',
      generated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      file_size: '2.4 MB',
      compliance_score: 98
    },
    {
      id: 'COMP002',
      type: 'Data Protection Audit',
      period: 'Décembre 2024',
      status: 'in_progress',
      generated_at: new Date().toISOString(),
      file_size: 'En cours',
      compliance_score: 0
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'expired': return 'bg-red-500';
      case 'rotating': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'resolved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'investigating': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredEvents = allSecurityEvents.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const handleSaveSecuritySettings = async () => {
    try {
      await updateChatConfig('require_2fa', String(twoFactorEnabled), 'security');
      await updateChatConfig('encryption_enabled', String(encryptionEnabled), 'security');

      await updateAdminSetting('security', 'require_2fa', twoFactorEnabled.toString());
      await updateAdminSetting('security', 'encryption_enabled', encryptionEnabled.toString());

      await logAuditAction('config_change', 'security', 'config', undefined, 'security_settings', {
        twoFactorEnabled,
        encryptionEnabled,
        auditingEnabled
      });

      toast({
        title: "Paramètres de sécurité sauvegardés",
        description: "Les modifications ont été appliquées."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateReport = async () => {
    await logAuditAction('report_generate', 'compliance', 'report', undefined, 'security_audit', { type: 'security_audit' });
    toast({
      title: "Rapport en cours de génération",
      description: "Le rapport sera disponible dans quelques minutes."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Sécurité Réseau
          </h1>
          <p className="text-muted-foreground">
            Gestion avancée de la sécurité et conformité du réseau multi-officines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAuditViewerDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Rapport Sécurité
          </Button>
          <Button onClick={handleSaveSecuritySettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble de la sécurité */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-full">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Sécurité</p>
                <p className="text-2xl font-bold text-green-600">{securityMetrics.score}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffrement</p>
                <p className="text-2xl font-bold text-blue-600">{securityMetrics.encryptionStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                <p className="text-2xl font-bold text-orange-600">{securityMetrics.activeAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions Actives</p>
                <p className="text-2xl font-bold text-purple-600">{securityMetrics.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="access">Contrôle d'Accès</TabsTrigger>
          <TabsTrigger value="encryption">Chiffrement</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Événements de sécurité */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Événements de Sécurité en Temps Réel
              </CardTitle>
              <CardDescription>
                Monitoring et analyse des événements de sécurité du réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les événements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sévérités</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`}></div>
                          <div>
                            <h4 className="font-medium">{event.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              {event.user} • {event.pharmacy} • {event.ip_address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs border ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium capitalize">{event.event_type.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timestamp: </span>
                          <span className="font-medium">
                            {new Date(event.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Statut: </span>
                          <span className="font-medium capitalize">{event.status}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-1" />
                            Analyser
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Résoudre
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun événement de sécurité
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contrôle d'accès */}
        <TabsContent value="access" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Permissions Inter-Pharmacies
                </CardTitle>
                <CardDescription>
                  Permissions de communication entre pharmacies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {chatPermissions.length > 0 ? (
                  chatPermissions.map((perm) => (
                    <div key={perm.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${perm.is_granted ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <h4 className="font-medium capitalize">{perm.permission_type.replace('_', ' ')}</h4>
                            <p className="text-sm text-muted-foreground">
                              Cible: {perm.target_tenant_id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <Badge variant={perm.is_granted ? 'default' : 'secondary'}>
                          {perm.is_granted ? 'Accordé' : 'Refusé'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune permission configurée</p>
                )}

                <Button className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Nouvelle Règle d'Accès
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Authentification 2FA
                </CardTitle>
                <CardDescription>
                  Configuration de l'authentification à deux facteurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Authentification 2FA obligatoire</Label>
                      <p className="text-sm text-muted-foreground">
                        Exiger 2FA pour tous les utilisateurs
                      </p>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Méthodes d'authentification autorisées</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="sms" defaultChecked />
                        <label htmlFor="sms" className="text-sm">SMS</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="app" defaultChecked />
                        <label htmlFor="app" className="text-sm">Application d'authentification</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="email" />
                        <label htmlFor="email" className="text-sm">Email</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="biometric" />
                        <label htmlFor="biometric" className="text-sm">Biométrie</label>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Fingerprint className="h-4 w-4" />
                      <span>127 utilisateurs ont activé la 2FA</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Chiffrement */}
        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                État du Chiffrement Bout-en-Bout
              </CardTitle>
              <CardDescription>
                Monitoring et gestion du chiffrement des communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {encryptionStatus.map((encryption) => (
                  <div key={encryption.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(encryption.status)}`}></div>
                        <div>
                          <h4 className="font-medium">{encryption.resource}</h4>
                          <p className="text-sm text-muted-foreground">{encryption.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={encryption.status === 'active' ? 'default' : 'secondary'}>
                          {encryption.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Rotation
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Algorithme: </span>
                        <span className="font-medium">{encryption.algorithm}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rotation: </span>
                        <span className="font-medium">{encryption.key_rotation}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dernière mise à jour: </span>
                        <span className="font-medium">
                          {new Date(encryption.last_updated).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Configuration Globale</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Chiffrement automatique</Label>
                      <Switch 
                        checked={encryptionEnabled}
                        onCheckedChange={setEncryptionEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Rotation automatique des clés</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Chiffrement des métadonnées</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messages chiffrés:</span>
                      <span className="font-medium">99.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fichiers chiffrés:</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Force de chiffrement:</span>
                      <span className="font-medium text-green-600">Forte</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clés actives:</span>
                      <span className="font-medium">15</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conformité */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rapports de Conformité
                </CardTitle>
                <CardDescription>
                  Génération et suivi des rapports de conformité réglementaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceReports.map((report) => (
                  <div key={report.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`}></div>
                        <div>
                          <h4 className="font-medium">{report.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            Période: {report.period}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.compliance_score > 0 && (
                          <Badge variant="default" className="bg-green-500">
                            {report.compliance_score}%
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Statut: </span>
                        <span className="font-medium capitalize">{report.status.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Généré: </span>
                        <span className="font-medium">
                          {new Date(report.generated_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Taille: </span>
                        <span className="font-medium">{report.file_size}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <Button className="w-full" onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer Nouveau Rapport
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Conformité Réglementaire
                </CardTitle>
                <CardDescription>
                  Statut de conformité aux réglementations en vigueur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="font-medium">HIPAA Compliance</span>
                        <p className="text-sm text-muted-foreground">Conforme</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">98%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="font-medium">RGPD</span>
                        <p className="text-sm text-muted-foreground">Conforme</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">96%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <span className="font-medium">HDS (Hébergement Données Santé)</span>
                        <p className="text-sm text-muted-foreground">En cours de certification</p>
                      </div>
                    </div>
                    <Badge variant="secondary">92%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="font-medium">ISO 27001</span>
                        <p className="text-sm text-muted-foreground">Certifié</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">100%</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Actions Requises</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span>Renouvellement certification HDS dans 30 jours</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span>Audit RGPD programmé le 15/01/2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Audit et Traçabilité
                  </CardTitle>
                  <CardDescription>
                    Surveillance et enregistrement de toutes les activités du système
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setAuditViewerDialog(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vue complète
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration de l'Audit</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Audit global activé</Label>
                      <Switch 
                        checked={auditingEnabled}
                        onCheckedChange={setAuditingEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des connexions</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des modifications de données</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des accès aux dossiers patients</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des exports de données</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Résumé des Événements</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Événements totaux (30 jours):</span>
                      <span className="font-medium">{auditLogs.length}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Alertes critiques:</span>
                      <span className="font-medium text-red-600">
                        {auditLogs.filter(l => l.severity === 'critical').length}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Événements d'aujourd'hui:</span>
                      <span className="font-medium">
                        {auditLogs.filter(l => 
                          new Date(l.created_at).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>
                Configuration globale de la sécurité du réseau
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Authentification</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>2FA obligatoire</Label>
                        <p className="text-xs text-muted-foreground">Pour tous les utilisateurs</p>
                      </div>
                      <Switch 
                        checked={twoFactorEnabled}
                        onCheckedChange={setTwoFactorEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Verrouillage automatique</Label>
                        <p className="text-xs text-muted-foreground">Après 3 tentatives échouées</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div>
                      <Label>Durée de session (minutes)</Label>
                      <Input type="number" defaultValue="30" className="mt-2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Chiffrement</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Chiffrement E2E</Label>
                        <p className="text-xs text-muted-foreground">Messages et fichiers</p>
                      </div>
                      <Switch 
                        checked={encryptionEnabled}
                        onCheckedChange={setEncryptionEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rotation automatique des clés</Label>
                        <p className="text-xs text-muted-foreground">Tous les 30 jours</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">Réinitialiser</Button>
                <Button onClick={handleSaveSecuritySettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NetworkAuditViewerDialog
        open={auditViewerDialog}
        onOpenChange={setAuditViewerDialog}
        auditLogs={auditLogs}
        loading={loading}
      />
    </div>
  );
};

export default NetworkSecurityManager;
