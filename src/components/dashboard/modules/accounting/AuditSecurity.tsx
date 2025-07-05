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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
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
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuditSecurity = () => {
  const [activeTab, setActiveTab] = useState('pistes-audit');
  const { toast } = useToast();

  // Mock data for audit trail
  const auditTrail = [
    {
      id: 1,
      timestamp: '2024-12-10 14:30:25',
      user: 'Marie Kouassi',
      action: 'Création',
      entity: 'Facture',
      entityId: 'FC-2024-1205',
      details: 'Nouvelle facture client - Pharmacie Central',
      ipAddress: '192.168.1.45',
      severity: 'Normal'
    },
    {
      id: 2,
      timestamp: '2024-12-10 14:25:12',
      user: 'Jean Traoré',
      action: 'Modification',
      entity: 'Écriture Comptable',
      entityId: 'EC-2024-8956',
      details: 'Modification montant: 150000 → 165000 FCFA',
      ipAddress: '192.168.1.32',
      severity: 'Élevé'
    },
    {
      id: 3,
      timestamp: '2024-12-10 13:45:08',
      user: 'Fatou Diallo',
      action: 'Suppression',
      entity: 'Écriture Comptable',
      entityId: 'EC-2024-8945',
      details: 'Suppression écriture erronée avec justification',
      ipAddress: '192.168.1.28',
      severity: 'Critique'
    },
    {
      id: 4,
      timestamp: '2024-12-10 12:15:33',
      user: 'Système',
      action: 'Connexion',
      entity: 'Session',
      entityId: 'SESS-789456',
      details: 'Connexion utilisateur Marie Kouassi',
      ipAddress: '192.168.1.45',
      severity: 'Normal'
    }
  ];

  // Mock data for user permissions
  const userPermissions = [
    {
      id: 1,
      user: 'Marie Kouassi',
      role: 'Comptable Senior',
      permissions: ['Lecture', 'Écriture', 'Validation'],
      lastLogin: '2024-12-10 14:30',
      status: 'Actif',
      sessions: 3
    },
    {
      id: 2,
      user: 'Jean Traoré',
      role: 'Directeur Financier',
      permissions: ['Lecture', 'Écriture', 'Validation', 'Administration'],
      lastLogin: '2024-12-10 09:15',
      status: 'Actif',
      sessions: 1
    },
    {
      id: 3,
      user: 'Fatou Diallo',
      role: 'Assistante Comptable',
      permissions: ['Lecture', 'Écriture'],
      lastLogin: '2024-12-09 16:45',
      status: 'Actif',
      sessions: 2
    },
    {
      id: 4,
      user: 'Amadou Sanogo',
      role: 'Consultant',
      permissions: ['Lecture'],
      lastLogin: '2024-12-05 11:20',
      status: 'Suspendu',
      sessions: 0
    }
  ];

  // Mock data for security controls
  const securityControls = [
    { id: 1, control: 'Authentification forte', status: 'Actif', score: 95, lastCheck: '2024-12-10' },
    { id: 2, control: 'Chiffrement des données', status: 'Actif', score: 100, lastCheck: '2024-12-10' },
    { id: 3, control: 'Sauvegarde automatique', status: 'Actif', score: 90, lastCheck: '2024-12-10' },
    { id: 4, control: 'Contrôle d\'accès', status: 'Actif', score: 88, lastCheck: '2024-12-10' },
    { id: 5, control: 'Détection d\'intrusion', status: 'Attention', score: 75, lastCheck: '2024-12-09' },
    { id: 6, control: 'Audit des connexions', status: 'Actif', score: 92, lastCheck: '2024-12-10' }
  ];

  // Mock data for compliance checks
  const complianceChecks = [
    { id: 1, requirement: 'Conservation documents 10 ans', status: 'Conforme', score: 100 },
    { id: 2, requirement: 'Traçabilité modifications', status: 'Conforme', score: 95 },
    { id: 3, requirement: 'Séparation des tâches', status: 'Conforme', score: 90 },
    { id: 4, requirement: 'Contrôle périodique', status: 'À améliorer', score: 70 },
    { id: 5, requirement: 'Signature électronique', status: 'En cours', score: 60 }
  ];

  // Mock data for audit statistics
  const auditStats = [
    { month: 'Jul', connexions: 245, modifications: 56, suppressions: 3, alertes: 2 },
    { month: 'Aug', connexions: 289, modifications: 62, suppressions: 1, alertes: 1 },
    { month: 'Sep', connexions: 267, modifications: 48, suppressions: 2, alertes: 3 },
    { month: 'Oct', connexions: 312, modifications: 71, suppressions: 4, alertes: 2 },
    { month: 'Nov', connexions: 298, modifications: 59, suppressions: 2, alertes: 1 },
    { month: 'Dec', connexions: 278, modifications: 65, suppressions: 3, alertes: 4 }
  ];

  const handleGenerateAuditReport = () => {
    toast({
      title: "Rapport d'audit généré",
      description: "Le rapport d'audit complet a été créé avec succès."
    });
  };

  const handleExportAuditTrail = () => {
    toast({
      title: "Export en cours",
      description: "Les pistes d'audit sont en cours d'export au format CSV."
    });
  };

  const handleRunSecurityScan = () => {
    toast({
      title: "Scan de sécurité lancé",
      description: "Vérification des contrôles de sécurité en cours..."
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif':
      case 'Conforme':
        return 'default';
      case 'En cours':
      case 'Attention':
        return 'secondary';
      case 'Suspendu':
      case 'À améliorer':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Normal':
        return 'default';
      case 'Élevé':
        return 'secondary';
      case 'Critique':
        return 'destructive';
      default:
        return 'default';
    }
  };

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
          <Button onClick={handleRunSecurityScan} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Scan Sécurité
          </Button>
          <Button onClick={handleGenerateAuditReport}>
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

        <TabsContent value="pistes-audit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Aujourd'hui</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-success">+12% vs hier</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Sessions en cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertes Sécurité</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-destructive">Nécessitent attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Sécurité</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89%</div>
                <Progress value={89} className="mt-2" />
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
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="marie">Marie Kouassi</SelectItem>
                      <SelectItem value="jean">Jean Traoré</SelectItem>
                      <SelectItem value="fatou">Fatou Diallo</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Type d'action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      <SelectItem value="create">Création</SelectItem>
                      <SelectItem value="modify">Modification</SelectItem>
                      <SelectItem value="delete">Suppression</SelectItem>
                      <SelectItem value="login">Connexion</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sévérité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleExportAuditTrail} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horodatage</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Sévérité</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditTrail.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">{entry.timestamp}</TableCell>
                        <TableCell>{entry.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.entity}</p>
                            <p className="text-sm text-muted-foreground">{entry.entityId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{entry.details}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.ipAddress}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(entry.severity)}>
                            {entry.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de Sécurité</CardTitle>
              <CardDescription>État des mesures de protection en place</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {securityControls.map((control) => (
                  <Card key={control.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{control.control}</h4>
                        <Badge variant={getStatusColor(control.status)}>
                          {control.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Score:</span>
                          <span className="font-bold">{control.score}%</span>
                        </div>
                        <Progress value={control.score} />
                        <p className="text-xs text-muted-foreground">
                          Dernière vérification: {control.lastCheck}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Politiques de Sécurité</CardTitle>
                <CardDescription>Configuration des règles de sécurité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Authentification à deux facteurs</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Expiration des sessions (min)</Label>
                    <Input className="w-20" defaultValue="30" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Tentatives de connexion max</Label>
                    <Input className="w-20" defaultValue="3" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Complexité mot de passe</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Chiffrement des données</Label>
                    <Switch defaultChecked disabled />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label>Adresses IP autorisées</Label>
                  <Textarea 
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes de Sécurité</CardTitle>
                <CardDescription>Événements critiques récents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tentative de connexion échouée</strong><br />
                      IP: 203.45.67.89 - 3 tentatives (14:25)
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Modification sensible détectée</strong><br />
                      Écriture comptable modifiée hors heures (23:45)
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sauvegarde complétée</strong><br />
                      Backup automatique terminé avec succès (02:00)
                    </AlertDescription>
                  </Alert>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <History className="h-4 w-4 mr-2" />
                  Voir Toutes les Alertes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Permissions</CardTitle>
              <CardDescription>Contrôle d'accès et droits utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Dernière Connexion</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPermissions.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4" />
                          <span className="font-medium">{user.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.permissions.map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant={user.sessions > 0 ? 'default' : 'secondary'}>
                          {user.sessions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Lock className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rôles et Permissions</CardTitle>
                <CardDescription>Configuration des niveaux d'accès</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Directeur Financier</h4>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Lecture complète</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Écriture comptable</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Validation écritures</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Administration système</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Comptable Senior</h4>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Lecture complète</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Écriture comptable</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Validation écritures</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox />
                        <span>Administration système</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions Actives</CardTitle>
                <CardDescription>Connexions utilisateurs en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Marie Kouassi</p>
                      <p className="text-sm text-muted-foreground">192.168.1.45 - 14:30</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Actif</Badge>
                      <Button variant="ghost" size="sm">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Jean Traoré</p>
                      <p className="text-sm text-muted-foreground">192.168.1.32 - 09:15</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Actif</Badge>
                      <Button variant="ghost" size="sm">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Fatou Diallo</p>
                      <p className="text-sm text-muted-foreground">192.168.1.28 - 13:22</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Inactif</Badge>
                      <Button variant="ghost" size="sm">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conformite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tableau de Bord Conformité</CardTitle>
              <CardDescription>Respect des exigences réglementaires</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={complianceChecks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="requirement" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Exigences de Conformité</CardTitle>
                <CardDescription>Vérification des critères réglementaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{check.requirement}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress value={check.score} className="flex-1" />
                          <span className="text-sm font-medium">{check.score}%</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Badge variant={getStatusColor(check.status)}>
                          {check.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Correctives</CardTitle>
                <CardDescription>Mesures à prendre pour améliorer la conformité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Contrôle périodique:</strong> Planifier audit trimestriel des comptes
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Signature électronique:</strong> Finaliser l'implémentation du système de signature
                    </AlertDescription>
                  </Alert>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Plan d'Action</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Mise en place procédure de révision mensuelle</li>
                      <li>• Formation équipe sur nouvelles réglementations</li>
                      <li>• Documentation des processus de contrôle</li>
                      <li>• Test des procédures de récupération</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sauvegarde" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernière Sauvegarde</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">02:00</div>
                <p className="text-xs text-success">Succès - 2.3 GB</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fréquence</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Quotidienne</div>
                <p className="text-xs text-muted-foreground">Automatique</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rétention</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">365 jours</div>
                <p className="text-xs text-muted-foreground">Conservation légale</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Sauvegarde</CardTitle>
                <CardDescription>Paramètres de protection des données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sauvegarde automatique</Label>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <Label>Fréquence</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Quotidienne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Heure de sauvegarde</Label>
                    <Input type="time" defaultValue="02:00" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Chiffrement</Label>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Sauvegarde distante</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des Sauvegardes</CardTitle>
                <CardDescription>Statut des sauvegardes récentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">10/12/2024 02:00</p>
                      <p className="text-sm text-muted-foreground">Sauvegarde complète - 2.3 GB</p>
                    </div>
                    <Badge variant="default">Succès</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">09/12/2024 02:00</p>
                      <p className="text-sm text-muted-foreground">Sauvegarde complète - 2.2 GB</p>
                    </div>
                    <Badge variant="default">Succès</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">08/12/2024 02:00</p>
                      <p className="text-sm text-muted-foreground">Erreur réseau</p>
                    </div>
                    <Badge variant="destructive">Échec</Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Lancer Sauvegarde
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Restaurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rapports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques d'Audit</CardTitle>
              <CardDescription>Évolution de l'activité système sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={auditStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="connexions" stroke="hsl(var(--primary))" name="Connexions" strokeWidth={2} />
                  <Line type="monotone" dataKey="modifications" stroke="hsl(var(--secondary))" name="Modifications" strokeWidth={2} />
                  <Line type="monotone" dataKey="suppressions" stroke="hsl(var(--destructive))" name="Suppressions" strokeWidth={2} />
                  <Line type="monotone" dataKey="alertes" stroke="hsl(var(--accent))" name="Alertes" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rapports Disponibles</CardTitle>
                <CardDescription>Génération de rapports d'audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Rapport d'Audit Complet</p>
                    <p className="text-sm text-muted-foreground">Toutes les activités sur une période</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Journal des Connexions</p>
                    <p className="text-sm text-muted-foreground">Historique des accès utilisateurs</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Rapport de Conformité</p>
                    <p className="text-sm text-muted-foreground">État de la conformité réglementaire</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Analyse des Risques</p>
                    <p className="text-sm text-muted-foreground">Évaluation des vulnérabilités</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planification des Rapports</CardTitle>
                <CardDescription>Génération automatique périodique</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Rapport Mensuel</h4>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Envoi automatique le 1er de chaque mois
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Rapport Trimestriel</h4>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Analyse approfondie tous les 3 mois
                    </p>
                  </div>
                  <div>
                    <Label>Destinataires</Label>
                    <Textarea 
                      placeholder="directeur@pharmacie.com&#10;audit@pharmacie.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditSecurity;