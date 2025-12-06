import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Lock,
  Shield,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings,
  Search,
  Filter,
  Download,
  Clock,
  RefreshCw,
  Users,
  FileText,
  Smartphone,
  Activity,
  Fingerprint,
  ShieldCheck,
  Monitor,
  Save,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import { useNetworkSecurity } from '@/hooks/useNetworkSecurity';
import NetworkAuditViewerDialog from './dialogs/NetworkAuditViewerDialog';
import SecurityEventDetailDialog from './dialogs/SecurityEventDetailDialog';
import CreateAccessRuleDialog from './dialogs/CreateAccessRuleDialog';
import EncryptionDetailDialog from './dialogs/EncryptionDetailDialog';
import GenerateComplianceReportDialog from './dialogs/GenerateComplianceReportDialog';
import ResolveSecurityEventDialog from './dialogs/ResolveSecurityEventDialog';
import { exportSecurityEventsToExcel, exportSecurityEventsToPDF } from '@/utils/networkSecurityExportUtils';
import type { SecurityEvent, EncryptionConfig, SecurityAccessRule } from '@/hooks/useNetworkSecurity';

const NetworkSecurityManager = () => {
  const {
    loading,
    saving,
    securityEvents,
    encryptionConfigs,
    complianceReports,
    accessRules,
    authMethods,
    securitySettings,
    securityMetrics,
    complianceStatuses,
    refreshData,
    resolveEvent,
    createAccessRule,
    deleteAccessRule,
    rotateEncryptionKey,
    updateEncryptionConfig,
    generateComplianceReport,
    toggleAuthMethod,
    saveSecuritySettings,
    resetSecuritySettings,
    setSecuritySettings,
  } = useNetworkSecurity();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  
  // Dialog states
  const [auditViewerDialog, setAuditViewerDialog] = useState(false);
  const [eventDetailDialog, setEventDetailDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [createRuleDialog, setCreateRuleDialog] = useState(false);
  const [encryptionDetailDialog, setEncryptionDetailDialog] = useState(false);
  const [selectedEncryption, setSelectedEncryption] = useState<EncryptionConfig | null>(null);
  const [generateReportDialog, setGenerateReportDialog] = useState(false);
  const [resolveEventDialog, setResolveEventDialog] = useState(false);
  const [eventToResolve, setEventToResolve] = useState<SecurityEvent | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-muted-foreground';
      case 'expired': return 'bg-destructive';
      case 'rotating': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-destructive';
      case 'resolved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'investigating': return 'bg-orange-500';
      default: return 'bg-muted-foreground';
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const handleViewEventDetails = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setEventDetailDialog(true);
  };

  const handleResolveEvent = (event: SecurityEvent) => {
    setEventToResolve(event);
    setResolveEventDialog(true);
  };

  const handleConfirmResolve = async (notes: string) => {
    if (eventToResolve) {
      await resolveEvent(eventToResolve.id, notes);
      setResolveEventDialog(false);
      setEventToResolve(null);
    }
  };

  const handleViewEncryptionDetails = (config: EncryptionConfig) => {
    setSelectedEncryption(config);
    setEncryptionDetailDialog(true);
  };

  const handleRotateKey = async (configId: string) => {
    await rotateEncryptionKey(configId);
  };

  const handleCreateRule = async (rule: Partial<SecurityAccessRule>) => {
    await createAccessRule(rule);
    setCreateRuleDialog(false);
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteAccessRule(ruleId);
  };

  const handleGenerateReport = async (reportType: string, period: string) => {
    await generateComplianceReport(reportType, period);
  };

  const handleSaveSettings = async () => {
    await saveSecuritySettings(securitySettings);
  };

  const handleExportEvents = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportSecurityEventsToExcel(filteredEvents);
    } else {
      exportSecurityEventsToPDF(filteredEvents);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="outline" onClick={() => refreshData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setAuditViewerDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Rapport Sécurité
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
                <p className={`text-2xl font-bold ${securityMetrics.score >= 80 ? 'text-green-600' : securityMetrics.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {securityMetrics.score}%
                </p>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Événements de Sécurité en Temps Réel
                  </CardTitle>
                  <CardDescription>
                    Monitoring et analyse des événements de sécurité du réseau ({securityEvents.length} événements)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportEvents('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportEvents('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
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
                            <h4 className="font-medium">{event.description.slice(0, 100)}{event.description.length > 100 ? '...' : ''}</h4>
                            <p className="text-sm text-muted-foreground">
                              {event.user} • {event.pharmacy?.slice(0, 8)}... • {event.ip_address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs border ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleViewEventDetails(event)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium capitalize">{event.event_type.replace(/_/g, ' ')}</span>
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
                          <Button variant="outline" size="sm" onClick={() => handleViewEventDetails(event)}>
                            <Shield className="h-4 w-4 mr-1" />
                            Analyser
                          </Button>
                          {event.status !== 'resolved' && (
                            <Button variant="outline" size="sm" onClick={() => handleResolveEvent(event)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Résoudre
                            </Button>
                          )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Règles d'Accès
                    </CardTitle>
                    <CardDescription>
                      Règles de sécurité et permissions ({accessRules.length} règles)
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCreateRuleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Règle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {accessRules.length > 0 ? (
                  accessRules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
                          <div>
                            <h4 className="font-medium">{rule.rule_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Type: {rule.rule_type} • Priorité: {rule.priority}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {rule.target_resource && (
                        <p className="text-sm text-muted-foreground">
                          Ressource: {rule.target_resource}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune règle d'accès configurée
                  </p>
                )}
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
                      checked={securitySettings.require_2fa}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, require_2fa: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Méthodes d'authentification autorisées</Label>
                    <div className="space-y-2">
                      {authMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm capitalize">{method.method_type}</span>
                            {method.is_required_for_2fa && (
                              <Badge variant="secondary" className="text-xs">Requis</Badge>
                            )}
                          </div>
                          <Switch 
                            checked={method.is_enabled}
                            onCheckedChange={(checked) => toggleAuthMethod(method.id, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Fingerprint className="h-4 w-4" />
                      <span>{securityMetrics.usersWithTwoFA} utilisateurs actifs</span>
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
                Monitoring et gestion du chiffrement des communications ({encryptionConfigs.length} configurations)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {encryptionConfigs.map((config) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(config.status)}`}></div>
                        <div>
                          <h4 className="font-medium">{config.resource_name}</h4>
                          <p className="text-sm text-muted-foreground">{config.encryption_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                          {config.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleRotateKey(config.id)} disabled={saving}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                          Rotation
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewEncryptionDetails(config)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Algorithme: </span>
                        <span className="font-medium">{config.algorithm}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rotation: </span>
                        <span className="font-medium">{config.key_rotation_days} jours</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dernière rotation: </span>
                        <span className="font-medium">
                          {config.last_rotation_at ? new Date(config.last_rotation_at).toLocaleDateString('fr-FR') : 'Jamais'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clés actives: </span>
                        <span className="font-medium">{config.active_keys_count}</span>
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
                        checked={securitySettings.encryption_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, encryption_enabled: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Rotation automatique des clés</Label>
                      <Switch 
                        checked={securitySettings.auto_key_rotation}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auto_key_rotation: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messages chiffrés:</span>
                      <span className="font-medium">{securityMetrics.encryptedMessagesPercent}%</span>
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
                      <span className="font-medium">{securityMetrics.activeKeysCount}</span>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rapports de Conformité
                    </CardTitle>
                    <CardDescription>
                      Génération et suivi des rapports ({complianceReports.length} rapports)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceReports.length > 0 ? (
                  complianceReports.map((report) => (
                    <div key={report.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`}></div>
                          <div>
                            <h4 className="font-medium">{report.report_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              Période: {report.period}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.compliance_score && (
                            <Badge variant="default" className="bg-green-500">
                              {Math.round(report.compliance_score)}%
                            </Badge>
                          )}
                          {report.status === 'completed' && report.file_url && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Statut: </span>
                          <span className="font-medium capitalize">{report.status.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créé: </span>
                          <span className="font-medium">
                            {new Date(report.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Taille: </span>
                          <span className="font-medium">
                            {report.file_size_mb ? `${report.file_size_mb.toFixed(1)} MB` : 'En cours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun rapport généré
                  </p>
                )}

                <Button className="w-full" onClick={() => setGenerateReportDialog(true)}>
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
                  {complianceStatuses.map((status) => (
                    <div key={status.code} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {status.status === 'compliant' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : status.status === 'pending' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <span className="font-medium">{status.name}</span>
                          <p className="text-sm text-muted-foreground">{status.description}</p>
                        </div>
                      </div>
                      <Badge className={status.status === 'compliant' ? 'bg-green-500' : status.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}>
                        {status.score}%
                      </Badge>
                    </div>
                  ))}
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
                      <Label>Audit des connexions</Label>
                      <Switch 
                        checked={securitySettings.audit_connections}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, audit_connections: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des modifications de données</Label>
                      <Switch 
                        checked={securitySettings.audit_data_changes}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, audit_data_changes: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des accès aux dossiers patients</Label>
                      <Switch 
                        checked={securitySettings.audit_patient_access}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, audit_patient_access: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit des exports de données</Label>
                      <Switch 
                        checked={securitySettings.audit_exports}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, audit_exports: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Résumé des Événements</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Événements totaux (30 jours):</span>
                      <span className="font-medium">{securityMetrics.totalEvents30Days}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Alertes critiques:</span>
                      <span className="font-medium text-red-600">{securityMetrics.criticalAlerts}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Événements d'aujourd'hui:</span>
                      <span className="font-medium">{securityMetrics.eventsToday}</span>
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
                        checked={securitySettings.require_2fa}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, require_2fa: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Verrouillage automatique</Label>
                        <p className="text-xs text-muted-foreground">Après 3 tentatives échouées</p>
                      </div>
                      <Switch 
                        checked={securitySettings.auto_lock_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auto_lock_enabled: checked})}
                      />
                    </div>
                    <div>
                      <Label>Durée de session (minutes)</Label>
                      <Input 
                        type="number" 
                        value={securitySettings.session_duration_minutes} 
                        onChange={(e) => setSecuritySettings({...securitySettings, session_duration_minutes: parseInt(e.target.value) || 30})}
                        className="mt-2" 
                      />
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
                        checked={securitySettings.encryption_enabled}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, encryption_enabled: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rotation automatique des clés</Label>
                        <p className="text-xs text-muted-foreground">Tous les 30 jours</p>
                      </div>
                      <Switch 
                        checked={securitySettings.auto_key_rotation}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auto_key_rotation: checked})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetSecuritySettings}>
                  Réinitialiser
                </Button>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
        auditLogs={securityEvents.map(e => ({
          id: e.id,
          created_at: e.timestamp,
          action_type: e.event_type,
          severity: e.severity === 'high' ? 'error' : e.severity === 'medium' ? 'warning' : e.severity === 'low' ? 'info' : 'critical',
          user_id: e.user,
          tenant_id: e.pharmacy,
          details: e.metadata || {},
          ip_address: e.ip_address,
        }))}
        loading={loading}
      />

      <SecurityEventDetailDialog
        open={eventDetailDialog}
        onOpenChange={setEventDetailDialog}
        event={selectedEvent}
        onResolve={(event) => handleResolveEvent(event)}
      />

      <CreateAccessRuleDialog
        open={createRuleDialog}
        onOpenChange={setCreateRuleDialog}
        onCreate={handleCreateRule}
        isCreating={saving}
      />

      <EncryptionDetailDialog
        open={encryptionDetailDialog}
        onOpenChange={setEncryptionDetailDialog}
        config={selectedEncryption}
        onRotateKey={handleRotateKey}
        isRotating={saving}
        rotations={[]}
      />

      <GenerateComplianceReportDialog
        open={generateReportDialog}
        onOpenChange={setGenerateReportDialog}
        onGenerate={handleGenerateReport}
        isGenerating={saving}
      />

      <ResolveSecurityEventDialog
        open={resolveEventDialog}
        onOpenChange={setResolveEventDialog}
        event={eventToResolve}
        onResolve={handleConfirmResolve}
        isResolving={saving}
      />
    </div>
  );
};

export default NetworkSecurityManager;
