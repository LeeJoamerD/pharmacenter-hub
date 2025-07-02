import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Workflow, Settings, Play, Pause, Plus, Edit, Trash2, 
  Clock, CheckCircle, AlertTriangle, Calendar, Mail,
  FileText, Users, Package, DollarSign, ArrowRight,
  Filter, Search, MoreHorizontal, Copy, Eye
} from 'lucide-react';

const WorkflowModule = () => {
  const [selectedTab, setSelectedTab] = useState('workflows');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data pour les workflows
  const workflows = [
    {
      id: 1,
      name: 'Alerte Stock Faible',
      description: 'Envoie une notification quand le stock descend sous le seuil critique',
      status: 'active',
      trigger: 'Stock Level',
      actions: ['Email', 'Notification'],
      lastRun: '2024-01-15 14:30',
      executions: 145,
      successRate: 98.6
    },
    {
      id: 2,
      name: 'Commande Automatique',
      description: 'Crée automatiquement une commande fournisseur pour les produits critiques',
      status: 'active',
      trigger: 'Schedule',
      actions: ['Create Order', 'Send Email'],
      lastRun: '2024-01-15 09:00',
      executions: 32,
      successRate: 100
    },
    {
      id: 3,
      name: 'Rapport Mensuel',
      description: 'Génère et envoie le rapport mensuel des ventes',
      status: 'paused',
      trigger: 'Schedule',
      actions: ['Generate Report', 'Email'],
      lastRun: '2024-01-01 08:00',
      executions: 12,
      successRate: 91.7
    },
    {
      id: 4,
      name: 'Péremption Proche',
      description: 'Alerte sur les produits arrivant à péremption',
      status: 'active',
      trigger: 'Date Check',
      actions: ['Alert', 'Update Status'],
      lastRun: '2024-01-15 06:00',
      executions: 289,
      successRate: 95.2
    }
  ];

  const workflowHistory = [
    { id: 1, workflow: 'Alerte Stock Faible', timestamp: '2024-01-15 14:30', status: 'success', duration: '2.3s' },
    { id: 2, workflow: 'Commande Automatique', timestamp: '2024-01-15 09:00', status: 'success', duration: '15.7s' },
    { id: 3, workflow: 'Péremption Proche', timestamp: '2024-01-15 06:00', status: 'success', duration: '4.1s' },
    { id: 4, workflow: 'Alerte Stock Faible', timestamp: '2024-01-14 16:45', status: 'failed', duration: '1.2s' },
    { id: 5, workflow: 'Rapport Mensuel', timestamp: '2024-01-01 08:00', status: 'success', duration: '45.3s' },
  ];

  const templates = [
    {
      id: 1,
      name: 'Gestion Stock Automatique',
      description: 'Template pour automatiser la gestion des stocks',
      category: 'Inventaire',
      triggers: ['Stock Level', 'Timer'],
      actions: ['Email Alert', 'Create Order', 'Update Status']
    },
    {
      id: 2,
      name: 'Suivi Client',
      description: 'Automatise le suivi et les relances clients',
      category: 'Commercial',
      triggers: ['Client Action', 'Timer'],
      actions: ['Send Email', 'Create Task', 'Update CRM']
    },
    {
      id: 3,
      name: 'Rapports Automatiques',
      description: 'Génération et envoi automatique de rapports',
      category: 'Reporting',
      triggers: ['Schedule', 'Data Change'],
      actions: ['Generate Report', 'Send Email', 'Archive']
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      failed: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'active' ? 'Actif' : status === 'paused' ? 'Pausé' : 'Échoué'}
      </Badge>
    );
  };

  const getHistoryStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || workflow.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflows & Automatisation</h2>
          <p className="text-muted-foreground">
            Gestion des processus automatisés et des workflows métier
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau workflow</DialogTitle>
              <DialogDescription>
                Configurez les déclencheurs et actions pour votre workflow automatisé
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input id="name" className="col-span-3" placeholder="Nom du workflow" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" className="col-span-3" placeholder="Description du workflow" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trigger" className="text-right">Déclencheur</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Niveau de stock</SelectItem>
                    <SelectItem value="schedule">Planification</SelectItem>
                    <SelectItem value="date">Vérification date</SelectItem>
                    <SelectItem value="event">Événement système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Annuler</Button>
              <Button>Créer le workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+1 depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions Aujourd'hui</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+15% vs hier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4s</div>
            <p className="text-xs text-muted-foreground">-1.2s vs moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        {/* Liste des workflows */}
        <TabsContent value="workflows" className="space-y-4">
          {/* Filtres et recherche */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un workflow..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="paused">Pausés</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des workflows */}
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {workflow.name}
                        {getStatusBadge(workflow.status)}
                      </CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        {workflow.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Déclencheur</div>
                      <div className="text-muted-foreground">{workflow.trigger}</div>
                    </div>
                    <div>
                      <div className="font-medium">Actions</div>
                      <div className="text-muted-foreground">{workflow.actions.join(', ')}</div>
                    </div>
                    <div>
                      <div className="font-medium">Dernière exécution</div>
                      <div className="text-muted-foreground">{workflow.lastRun}</div>
                    </div>
                    <div>
                      <div className="font-medium">Taux de succès</div>
                      <div className="text-muted-foreground">{workflow.successRate}% ({workflow.executions} exec.)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Déclencheurs disponibles:</div>
                      <div className="text-sm text-muted-foreground">
                        {template.triggers.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Actions disponibles:</div>
                      <div className="text-sm text-muted-foreground">
                        {template.actions.join(', ')}
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      Utiliser ce template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Exécutions</CardTitle>
              <CardDescription>Journal détaillé des exécutions de workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflowHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getHistoryStatusIcon(entry.status)}
                      <div>
                        <div className="font-medium">{entry.workflow}</div>
                        <div className="text-sm text-muted-foreground">{entry.timestamp}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {entry.status === 'success' ? 'Succès' : 'Échec'}
                      </div>
                      <div className="text-sm text-muted-foreground">{entry.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Générale</CardTitle>
                <CardDescription>Paramètres globaux pour l'automatisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exécution automatique</Label>
                    <div className="text-sm text-muted-foreground">Activer l'exécution automatique des workflows</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <div className="text-sm text-muted-foreground">Recevoir des notifications par email</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Logs détaillés</Label>
                    <div className="text-sm text-muted-foreground">Enregistrer des logs détaillés</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limites et Quotas</CardTitle>
                <CardDescription>Configuration des limites d'exécution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-concurrent">Exécutions simultanées max</Label>
                    <Input id="max-concurrent" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (secondes)</Label>
                    <Input id="timeout" type="number" defaultValue="300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-count">Nombre de tentatives</Label>
                  <Input id="retry-count" type="number" defaultValue="3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intégrations</CardTitle>
                <CardDescription>Configuration des services externes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-server">Serveur Email SMTP</Label>
                  <Input id="email-server" placeholder="smtp.example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-user">Utilisateur SMTP</Label>
                    <Input id="email-user" placeholder="user@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-port">Port SMTP</Label>
                    <Input id="email-port" type="number" defaultValue="587" />
                  </div>
                </div>
                <Button>Tester la configuration</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowModule;