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
  Bell
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: string;
  pharmacy: string;
  description: string;
  ip_address: string;
  status: 'pending' | 'resolved' | 'investigating';
}

interface AccessRule {
  id: string;
  name: string;
  type: 'user' | 'role' | 'pharmacy';
  target: string;
  permissions: string[];
  resources: string[];
  status: 'active' | 'inactive';
  created_at: string;
}

interface ComplianceReport {
  id: string;
  type: string;
  period: string;
  status: 'completed' | 'in_progress' | 'failed';
  generated_at: string;
  file_size: string;
  compliance_score: number;
}

interface EncryptionStatus {
  id: string;
  resource: string;
  type: string;
  algorithm: string;
  key_rotation: string;
  status: 'active' | 'expired' | 'rotating';
  last_updated: string;
}

const NetworkSecurityManager = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [auditingEnabled, setAuditingEnabled] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = () => {
    // Simulation des événements de sécurité
    const mockSecurityEvents: SecurityEvent[] = [
      {
        id: 'SEC001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        event_type: 'unauthorized_access_attempt',
        severity: 'high',
        user: 'Unknown',
        pharmacy: 'Pharmacie Central',
        description: 'Tentative d\'accès non autorisée détectée',
        ip_address: '192.168.1.100',
        status: 'investigating'
      },
      {
        id: 'SEC002',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        event_type: 'password_change',
        severity: 'low',
        user: 'Marie Dupont',
        pharmacy: 'Pharmacie de la Gare',
        description: 'Changement de mot de passe réussi',
        ip_address: '192.168.1.45',
        status: 'resolved'
      },
      {
        id: 'SEC003',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        event_type: 'data_export',
        severity: 'medium',
        user: 'Jean Martin',
        pharmacy: 'Pharmacie du Centre',
        description: 'Export de données patients effectué',
        ip_address: '192.168.1.78',
        status: 'pending'
      }
    ];

    // Simulation des règles d'accès
    const mockAccessRules: AccessRule[] = [
      {
        id: 'RULE001',
        name: 'Pharmaciens - Accès complet',
        type: 'role',
        target: 'pharmacien',
        permissions: ['read', 'write', 'delete', 'export'],
        resources: ['prescriptions', 'patient_data', 'medications'],
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'RULE002',
        name: 'Caissiers - Accès limité',
        type: 'role',
        target: 'caissier',
        permissions: ['read'],
        resources: ['medications', 'inventory'],
        status: 'active',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Simulation des rapports de conformité
    const mockComplianceReports: ComplianceReport[] = [
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

    // Simulation du statut de chiffrement
    const mockEncryptionStatus: EncryptionStatus[] = [
      {
        id: 'ENC001',
        resource: 'Messages Chat',
        type: 'End-to-End',
        algorithm: 'AES-256-GCM',
        key_rotation: '30 jours',
        status: 'active',
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
        status: 'rotating',
        last_updated: new Date().toISOString()
      }
    ];

    setSecurityEvents(mockSecurityEvents);
    setAccessRules(mockAccessRules);
    setComplianceReports(mockComplianceReports);
    setEncryptionStatus(mockEncryptionStatus);
  };

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

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Rapport Sécurité
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
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
                <p className="text-2xl font-bold text-green-600">98%</p>
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
                <p className="text-2xl font-bold text-blue-600">Actif</p>
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
                <p className="text-2xl font-bold text-orange-600">3</p>
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
                <p className="text-2xl font-bold text-purple-600">127</p>
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

              <div className="space-y-4">
                {filteredEvents.map((event) => (
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
              </div>
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
                  Règles d'Accès
                </CardTitle>
                <CardDescription>
                  Gestion granulaire des permissions par utilisateur et rôle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accessRules.map((rule) => (
                  <div key={rule.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(rule.status)}`}></div>
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Type: {rule.type} • Cible: {rule.target}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Permissions:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rule.permissions.map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Ressources:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rule.resources.map((resource, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

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

                <Button className="w-full">
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
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Audit et Traçabilité
              </CardTitle>
              <CardDescription>
                Surveillance et enregistrement de toutes les activités du système
              </CardDescription>
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

                  <Separator />

                  <div>
                    <Label>Rétention des logs d'audit</Label>
                    <Select defaultValue="365">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="180">180 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                        <SelectItem value="1095">3 ans</SelectItem>
                        <SelectItem value="1825">5 ans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Statistiques d'Audit</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Événements aujourd'hui</span>
                        <span className="font-medium">1,247</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Connexions cette semaine</span>
                        <span className="font-medium">89</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Accès dossiers patients</span>
                        <span className="font-medium">456</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Modifications de données</span>
                        <span className="font-medium">234</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter Logs d'Audit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Généraux
                </CardTitle>
                <CardDescription>
                  Configuration générale de la sécurité du réseau
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mode sécurisé renforcé</Label>
                      <p className="text-sm text-muted-foreground">
                        Active les contrôles de sécurité avancés
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Blocage automatique des IP suspectes</Label>
                      <p className="text-sm text-muted-foreground">
                        Bloque automatiquement les adresses IP malveillantes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notifications temps réel</Label>
                      <p className="text-sm text-muted-foreground">
                        Alertes instantanées pour événements critiques
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Masquage automatique des données</Label>
                      <p className="text-sm text-muted-foreground">
                        Masque automatiquement les informations sensibles
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Niveau de sécurité par défaut</Label>
                  <Select defaultValue="high">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                      <SelectItem value="maximum">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alertes et Notifications
                </CardTitle>
                <CardDescription>
                  Configuration des alertes de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>Types d'alertes activées</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="unauthorized" defaultChecked />
                        <label htmlFor="unauthorized" className="text-sm">Accès non autorisé</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="suspicious" defaultChecked />
                        <label htmlFor="suspicious" className="text-sm">Activité suspecte</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="failed-login" defaultChecked />
                        <label htmlFor="failed-login" className="text-sm">Échecs de connexion</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="data-export" defaultChecked />
                        <label htmlFor="data-export" className="text-sm">Export de données</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="permission-change" />
                        <label htmlFor="permission-change" className="text-sm">Changement de permissions</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Canaux de notification</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="email-notif" defaultChecked />
                        <label htmlFor="email-notif" className="text-sm">Email</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="sms-notif" defaultChecked />
                        <label htmlFor="sms-notif" className="text-sm">SMS</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="chat-notif" defaultChecked />
                        <label htmlFor="chat-notif" className="text-sm">Chat interne</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="webhook-notif" />
                        <label htmlFor="webhook-notif" className="text-sm">Webhook</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Délai d'escalade (minutes)</Label>
                  <Input type="number" defaultValue="15" className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkSecurityManager;