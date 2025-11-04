import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  Download, 
  Upload, 
  Calendar, 
  User, 
  Activity, 
  FileText, 
  Key,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  History,
  Settings,
  Archive,
  UserCheck,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuditSecurity, type TimeRange } from '@/hooks/useAuditSecurity';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTenant } from '@/contexts/TenantContext';

const AuditSecurity = () => {
  const [activeTab, setActiveTab] = useState('pistes-audit');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const { toast } = useToast();
  const { currentUser } = useTenant();
  
  const {
    auditLogs,
    securityAlerts,
    securityControls,
    complianceChecks,
    backupLogs,
    auditReports,
    regionalParams,
    userSessions,
    metrics,
    loadingAuditLogs,
    loadingSecurityAlerts,
    loadingSecurityControls,
    loadingComplianceChecks,
    loadingBackupLogs,
    resolveAlert,
    updateSecurityControl,
    updateComplianceCheck,
    createBackup,
    disconnectSession,
    generateAuditReport,
    exportToCSV,
    exportToPDF,
  } = useAuditSecurity(selectedTimeRange);

  // State for filters
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (userFilter !== 'all' && log.personnel_id !== userFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  // Filtered security alerts
  const filteredSecurityAlerts = securityAlerts.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const handleGenerateAuditReport = async (
    reportType: 'audit_complet' | 'connexions' | 'conformite' | 'risques'
  ) => {
    try {
      await generateAuditReport({
        reportType,
        reportName: `Rapport ${reportType} - ${format(new Date(), 'dd/MM/yyyy')}`,
        reportFormat: 'pdf',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        generatedBy: currentUser?.id || '',
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleExportAuditTrail = () => {
    exportToCSV(
      filteredAuditLogs.map(log => ({
        Horodatage: format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
        Utilisateur: log.personnel_id,
        Action: log.action,
        Table: log.table_name,
        'ID Enregistrement': log.record_id,
        'Adresse IP': log.ip_address,
        Statut: log.status,
      })),
      'pistes_audit'
    );
  };

  const handleRunSecurityScan = async () => {
    toast({
      title: "Scan de sécurité lancé",
      description: "Vérification des contrôles de sécurité en cours..."
    });

    // Update all security controls with a new check
    for (const control of securityControls) {
      await updateSecurityControl({
        id: control.id,
        last_check_date: new Date().toISOString(),
        next_check_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    toast({
      title: "Scan terminé",
      description: "Tous les contrôles ont été vérifiés avec succès."
    });
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert({ alertId, userId: currentUser?.id || '' });
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      await disconnectSession(sessionId);
    } catch (error) {
      console.error('Error disconnecting session:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup({ initiatedBy: currentUser?.id || '' });
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" => {
    switch (status?.toLowerCase()) {
      case 'actif':
      case 'compliant':
      case 'conforme':
      case 'completed':
        return 'default';
      case 'en cours':
      case 'attention':
      case 'partial':
      case 'in_progress':
        return 'secondary';
      case 'suspendu':
      case 'non_compliant':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getSeverityColor = (severity: string): "default" | "secondary" | "destructive" => {
    switch (severity?.toLowerCase()) {
      case 'low':
      case 'normal':
        return 'default';
      case 'medium':
      case 'élevé':
        return 'secondary';
      case 'high':
      case 'critical':
      case 'critique':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.personnel_id)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Audit & Sécurité</h3>
          <p className="text-muted-foreground">
            Pistes d'audit, contrôles de sécurité et conformité réglementaire
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeRange} onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRunSecurityScan} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Scan Sécurité
          </Button>
          <Button onClick={() => handleGenerateAuditReport('audit_complet')}>
            <FileText className="h-4 w-4 mr-2" />
            Rapport Audit
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pistes-audit">Pistes d'Audit</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="conformite">Conformité</TabsTrigger>
          <TabsTrigger value="sauvegarde">Sauvegarde</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
        </TabsList>

        {/* PISTES D'AUDIT */}
        <TabsContent value="pistes-audit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Aujourd'hui</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.actionsToday}</div>
                <p className="text-xs text-muted-foreground">Actions enregistrées</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">{userSessions.length} sessions en cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertes Sécurité</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.unresolvedAlerts}</div>
                <p className="text-xs text-destructive">Nécessitent attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Sécurité</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.averageSecurityScore)}%</div>
                <Progress value={metrics.averageSecurityScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Journal d'Audit</CardTitle>
              <CardDescription>Traçabilité complète de toutes les actions système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      {uniqueUsers.map(userId => (
                        <SelectItem key={userId} value={userId}>{userId}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Type d'action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      <SelectItem value="INSERT">Création</SelectItem>
                      <SelectItem value="UPDATE">Modification</SelectItem>
                      <SelectItem value="DELETE">Suppression</SelectItem>
                      <SelectItem value="SELECT">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleExportAuditTrail} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>

                {loadingAuditLogs ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Chargement des pistes d'audit...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horodatage</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>ID Enregistrement</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Aucune action enregistrée pour cette période
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAuditLogs.slice(0, 50).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-sm">{log.personnel_id?.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.table_name}</p>
                                <p className="text-sm text-muted-foreground">{log.record_id?.substring(0, 8)}...</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.record_id?.substring(0, 12)}...</TableCell>
                            <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Détails de l'action</DialogTitle>
                                    <DialogDescription>
                                      Informations complètes sur cette opération d'audit
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Horodatage</Label>
                                        <p className="text-sm font-mono">
                                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Utilisateur</Label>
                                        <p className="text-sm">{log.personnel_id}</p>
                                      </div>
                                      <div>
                                        <Label>Action</Label>
                                        <p className="text-sm">{log.action}</p>
                                      </div>
                                      <div>
                                        <Label>Table</Label>
                                        <p className="text-sm">{log.table_name}</p>
                                      </div>
                                      <div>
                                        <Label>Adresse IP</Label>
                                        <p className="text-sm font-mono">{log.ip_address}</p>
                                      </div>
                                      <div>
                                        <Label>User Agent</Label>
                                        <p className="text-sm truncate">{log.user_agent}</p>
                                      </div>
                                    </div>
                                    {log.old_values && (
                                      <div>
                                        <Label>Anciennes valeurs</Label>
                                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                          {JSON.stringify(log.old_values, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    {log.new_values && (
                                      <div>
                                        <Label>Nouvelles valeurs</Label>
                                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                          {JSON.stringify(log.new_values, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SÉCURITÉ */}
        <TabsContent value="securite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de Sécurité</CardTitle>
              <CardDescription>État des mesures de protection en place</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSecurityControls ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {securityControls.map((control) => (
                    <Card key={control.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{control.control_name}</h4>
                          <Badge variant={getStatusColor(control.status)}>
                            {control.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Score:</span>
                            <span className="font-bold">{Math.round(control.compliance_score)}%</span>
                          </div>
                          <Progress value={control.compliance_score} />
                          <p className="text-xs text-muted-foreground">
                            Dernière vérification: {control.last_check_date ? format(new Date(control.last_check_date), 'dd/MM/yyyy', { locale: fr }) : 'Jamais'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertes de Sécurité</CardTitle>
              <CardDescription>Incidents et événements nécessitant attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sévérités</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>

                {loadingSecurityAlerts ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSecurityAlerts.filter(alert => !alert.resolved).slice(0, 10).map((alert) => (
                      <Alert key={alert.id} variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm">{alert.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Résoudre
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                    {filteredSecurityAlerts.filter(alert => !alert.resolved).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                        <p>Aucune alerte de sécurité non résolue</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERMISSIONS */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessions Actives</CardTitle>
              <CardDescription>Utilisateurs connectés actuellement</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAuditLogs ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Adresse IP</TableHead>
                      <TableHead>Dernière activité</TableHead>
                      <TableHead>Score de risque</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucune session active
                        </TableCell>
                      </TableRow>
                    ) : (
                      userSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.personnel_id?.substring(0, 12)}...</TableCell>
                          <TableCell className="font-mono text-sm">{session.ip_address}</TableCell>
                          <TableCell>
                            {format(new Date(session.last_activity), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.risk_score > 70 ? 'destructive' : session.risk_score > 40 ? 'secondary' : 'default'}>
                              {session.risk_score}/100
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisconnectSession(session.id)}
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Déconnecter
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFORMITÉ */}
        <TabsContent value="conformite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exigences Réglementaires</CardTitle>
              <CardDescription>Suivi de la conformité aux normes applicables</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComplianceChecks ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {complianceChecks.map((check) => (
                    <div key={check.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{check.requirement_name}</h4>
                          <p className="text-sm text-muted-foreground">{check.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{check.regulatory_body}</Badge>
                            <Badge variant="outline">{check.country_code}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusColor(check.compliance_status)}>
                            {check.compliance_status}
                          </Badge>
                          <div className="text-sm font-bold">{Math.round(check.compliance_score)}%</div>
                          <Progress value={check.compliance_score} className="w-24" />
                        </div>
                      </div>
                      {check.last_evaluation_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Dernière évaluation: {format(new Date(check.last_evaluation_date), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      )}
                    </div>
                  ))}
                  {complianceChecks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune exigence de conformité configurée
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAUVEGARDE */}
        <TabsContent value="sauvegarde" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernière Sauvegarde</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupLogs.length > 0
                    ? format(new Date(backupLogs[0].completed_at || backupLogs[0].started_at), 'dd/MM HH:mm', { locale: fr })
                    : 'Aucune'}
                </div>
                {backupLogs.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Taille: {backupLogs[0].backup_size_mb.toFixed(2)} MB
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fréquence</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Quotidienne</div>
                <p className="text-xs text-muted-foreground">À 02:00 UTC</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rétention</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">365 jours</div>
                <p className="text-xs text-muted-foreground">Conforme OHADA</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des Sauvegardes</CardTitle>
              <CardDescription>Liste des 10 dernières sauvegardes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Button onClick={handleCreateBackup} className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Lancer une Sauvegarde Manuelle
                </Button>
              </div>

              {loadingBackupLogs ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucune sauvegarde enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      backupLogs.slice(0, 10).map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>
                            {format(new Date(backup.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{backup.backup_type}</Badge>
                          </TableCell>
                          <TableCell>{backup.backup_size_mb.toFixed(2)} MB</TableCell>
                          <TableCell>
                            {backup.duration_seconds ? `${Math.round(backup.duration_seconds / 60)} min` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(backup.status)}>
                              {backup.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAPPORTS */}
        <TabsContent value="rapports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Génération de Rapports d'Audit</CardTitle>
              <CardDescription>Créer des rapports personnalisés pour l'audit et la conformité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Rapport d'Audit Complet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Toutes les actions sur la période sélectionnée
                    </p>
                    <Button onClick={() => handleGenerateAuditReport('audit_complet')} className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Journal des Connexions</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Historique des authentifications utilisateurs
                    </p>
                    <Button onClick={() => handleGenerateAuditReport('connexions')} className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Rapport de Conformité</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      État de conformité aux exigences réglementaires
                    </p>
                    <Button onClick={() => handleGenerateAuditReport('conformite')} className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Analyse des Risques</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Évaluation des alertes et incidents de sécurité
                    </p>
                    <Button onClick={() => handleGenerateAuditReport('risques')} className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rapports Récents</CardTitle>
              <CardDescription>Historique des rapports générés</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du Rapport</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Date Génération</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun rapport généré
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditReports.slice(0, 10).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.report_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.report_type}</Badge>
                        </TableCell>
                        <TableCell className="uppercase text-sm">{report.report_format}</TableCell>
                        <TableCell>
                          {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditSecurity;
