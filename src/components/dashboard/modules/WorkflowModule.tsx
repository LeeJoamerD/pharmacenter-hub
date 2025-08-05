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
  Filter, Search, MoreHorizontal, Copy, Eye, Loader2
} from 'lucide-react';
import { 
  useWorkflowsQuery, 
  useWorkflowTemplatesQuery, 
  useWorkflowExecutionsQuery, 
  useWorkflowSettingsQuery,
  useWorkflowMutation,
  useWorkflowTemplateMutation,
  useWorkflowExecutionMutation,
  useWorkflowSettingMutation,
  usePersonnelQuery
} from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

const WorkflowModule = () => {
  const [selectedTab, setSelectedTab] = useState('workflows');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'Manuel',
    priority: 'Normale',
    category: 'Général',
    status: 'Brouillon'
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'Général',
    template_data: {}
  });

  // États pour les configurations
  const [workflowSettings, setWorkflowSettings] = useState({
    notifications_enabled: true,
    default_timeout: 30,
    max_concurrent: 5,
    log_retention_days: 90,
    check_frequency: 5,
    auto_triggers_enabled: true,
    stock_monitoring: true,
    sales_events: true,
    stock_threshold: 20,
    scheduling_enabled: true,
    auto_retry: true,
    max_retries: 3,
    retry_delay: 5,
    failure_notifications: true,
    auto_escalation: false,
    state_backup: true,
    audit_enabled: true,
    log_level: 'detailed',
    strict_access: true,
    encrypt_sensitive: true,
    audit_retention_months: 12,
    security_alerts: true
  });

  const { toast } = useToast();
  const { currentUser } = useTenant();

  // Queries
  const { data: workflows = [], isLoading: workflowsLoading, refetch: refetchWorkflows } = useWorkflowsQuery();
  const { data: templates = [], isLoading: templatesLoading } = useWorkflowTemplatesQuery();
  const { data: executions = [], isLoading: executionsLoading, refetch: refetchExecutions } = useWorkflowExecutionsQuery();
  const { data: settings = [], isLoading: settingsLoading } = useWorkflowSettingsQuery();
  const { data: personnel = [] } = usePersonnelQuery();

  // Mutations
  const createWorkflowMutation = useWorkflowMutation('insert');
  const updateWorkflowMutation = useWorkflowMutation('update');
  const deleteWorkflowMutation = useWorkflowMutation('delete');
  const createTemplateMutation = useWorkflowTemplateMutation('insert');
  const executeWorkflowMutation = useWorkflowExecutionMutation('insert');
  const updateSettingMutation = useWorkflowSettingMutation('upsert');

  const handleCreateWorkflow = async () => {
    try {
      await createWorkflowMutation.mutateAsync({
        ...newWorkflow,
        created_by: currentUser?.id,
        trigger_config: {},
        tags: [],
        completion_rate: 0,
        execution_count: 0
      });
      
      toast({
        title: "Workflow créé",
        description: "Le workflow a été créé avec succès.",
      });
      
      setShowCreateDialog(false);
      setNewWorkflow({
        name: '',
        description: '',
        trigger_type: 'Manuel',
        priority: 'Normale',
        category: 'Général',
        status: 'Brouillon'
      });
      refetchWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le workflow.",
        variant: "destructive"
      });
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplateMutation.mutateAsync({
        ...newTemplate,
        created_by: currentUser?.id,
        is_system: false,
        usage_count: 0,
        tags: []
      });
      
      toast({
        title: "Template créé",
        description: "Le template a été créé avec succès.",
      });
      
      setShowTemplateDialog(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'Général',
        template_data: {}
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le template.",
        variant: "destructive"
      });
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflowMutation.mutateAsync({
        workflow_id: workflowId,
        executor_id: currentUser?.id,
        status: 'En cours',
        progress_percentage: 0,
        logs: [],
        result_data: {}
      });
      
      toast({
        title: "Workflow démarré",
        description: "L'exécution du workflow a été démarrée.",
      });
      
      // Rafraîchir l'historique après exécution
      refetchExecutions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le workflow.",
        variant: "destructive"
      });
    }
  };

  const handleToggleWorkflowStatus = async (workflow: any) => {
    const newStatus = workflow.status === 'Actif' ? 'Inactif' : 'Actif';
    try {
      await updateWorkflowMutation.mutateAsync({
        id: workflow.id,
        status: newStatus
      });
      
      toast({
        title: "Statut mis à jour",
        description: `Le workflow est maintenant ${newStatus.toLowerCase()}.`,
      });
      refetchWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteWorkflowMutation.mutateAsync({ id: workflowId });
      
      toast({
        title: "Workflow supprimé",
        description: "Le workflow a été supprimé avec succès.",
      });
      refetchWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le workflow.",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      // Créer un nouveau workflow basé sur le template
      await createWorkflowMutation.mutateAsync({
        name: `${template.name} - Copie`,
        description: template.description,
        category: template.category,
        trigger_type: template.template_data?.trigger_type || 'Manuel',
        priority: template.template_data?.priority || 'Normale',
        status: 'Brouillon',
        created_by: currentUser?.id,
        trigger_config: template.template_data?.trigger_config || {},
        tags: template.template_data?.tags || [],
        completion_rate: 0,
        execution_count: 0
      });
      
      toast({
        title: "Workflow créé depuis template",
        description: "Le workflow a été créé à partir du template.",
      });
      
      refetchWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le workflow depuis le template.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Actif': 'default',
      'Inactif': 'secondary',
      'Brouillon': 'outline',
      'Archivé': 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'Haute': 'destructive',
      'Normale': 'default',
      'Basse': 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'default'}>
        {priority}
      </Badge>
    );
  };

  const getHistoryStatusIcon = (status: string) => {
    switch (status) {
      case 'Terminé':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Échec':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'En cours':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'En pause':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Gestion des paramètres de configuration
  const handleSaveSettings = async () => {
    try {
      // Sauvegarder chaque paramètre individuellement
      const settingsToSave = Object.entries(workflowSettings).map(([key, value]) => ({
        setting_type: 'workflow',
        setting_key: key,
        setting_value: String(value),
        is_system: false
      }));

      for (const setting of settingsToSave) {
        await updateSettingMutation.mutateAsync(setting);
      }

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres ont été enregistrés avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive"
      });
    }
  };

  // Charger les paramètres au démarrage
  React.useEffect(() => {
    if (settings && settings.length > 0) {
      const newSettings = { ...workflowSettings };
      settings.forEach(setting => {
        if (setting.setting_key && workflowSettings.hasOwnProperty(setting.setting_key)) {
          const value = setting.setting_value;
          // Conversion des types
          if (typeof workflowSettings[setting.setting_key] === 'boolean') {
            newSettings[setting.setting_key] = value === 'true';
          } else if (typeof workflowSettings[setting.setting_key] === 'number') {
            newSettings[setting.setting_key] = parseInt(value) || 0;
          } else {
            newSettings[setting.setting_key] = value;
          }
        }
      });
      setWorkflowSettings(newSettings);
    }
  }, [settings]);

  const updateSetting = (key: string, value: any) => {
    setWorkflowSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || workflow.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredTemplates = templates.filter(template => 
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculs des statistiques
  const activeWorkflows = workflows.filter(w => w.status === 'Actif').length;
  const todayExecutions = executions.filter(e => {
    const today = new Date().toDateString();
    return new Date(e.started_at).toDateString() === today;
  }).length;
  
  const completedExecutions = executions.filter(e => e.status === 'Terminé');
  const successRate = executions.length > 0 ? 
    (completedExecutions.length / executions.length * 100).toFixed(1) : '0';
  
  const avgDuration = completedExecutions.length > 0 ?
    (completedExecutions.reduce((acc, e) => acc + (e.duration_minutes || 0), 0) / completedExecutions.length).toFixed(1) : '0';

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
        <div className="flex gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Nouveau Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau template</DialogTitle>
                <DialogDescription>
                  Créez un modèle réutilisable pour vos workflows
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nom du template</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="Nom du template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    placeholder="Description du template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-category">Catégorie</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Général">Général</SelectItem>
                      <SelectItem value="Inventaire">Inventaire</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Reporting">Reporting</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                  Configurez les paramètres de base pour votre workflow automatisé
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du workflow</Label>
                  <Input
                    id="name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                    placeholder="Nom du workflow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                    placeholder="Description du workflow"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trigger">Type de déclencheur</Label>
                    <Select value={newWorkflow.trigger_type} onValueChange={(value) => setNewWorkflow({...newWorkflow, trigger_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manuel">Manuel</SelectItem>
                        <SelectItem value="Automatique">Automatique</SelectItem>
                        <SelectItem value="Planifié">Planifié</SelectItem>
                        <SelectItem value="Événement">Événement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={newWorkflow.priority} onValueChange={(value) => setNewWorkflow({...newWorkflow, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Haute">Haute</SelectItem>
                        <SelectItem value="Normale">Normale</SelectItem>
                        <SelectItem value="Basse">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={newWorkflow.category} onValueChange={(value) => setNewWorkflow({...newWorkflow, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Général">Général</SelectItem>
                      <SelectItem value="Inventaire">Inventaire</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Reporting">Reporting</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateWorkflow} disabled={createWorkflowMutation.isPending}>
                  {createWorkflowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              sur {workflows.length} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions Aujourd'hui</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayExecutions}</div>
            <p className="text-xs text-muted-foreground">
              exécutions lancées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              sur {executions.length} exécutions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration}min</div>
            <p className="text-xs text-muted-foreground">
              temps d'exécution
            </p>
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
                <SelectItem value="Actif">Actifs</SelectItem>
                <SelectItem value="Inactif">Inactifs</SelectItem>
                <SelectItem value="Brouillon">Brouillons</SelectItem>
                <SelectItem value="Archivé">Archivés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des workflows */}
          {workflowsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun workflow trouvé</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Commencez par créer votre premier workflow pour automatiser vos processus.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer un workflow
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {workflow.name}
                            {getStatusBadge(workflow.status)}
                            {getPriorityBadge(workflow.priority)}
                          </CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                            disabled={workflow.status !== 'Actif'}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleWorkflowStatus(workflow)}
                          >
                            {workflow.status === 'Actif' ? 
                              <Pause className="h-4 w-4" /> : 
                              <Play className="h-4 w-4" />
                            }
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Type de déclencheur</div>
                          <div className="text-muted-foreground">{workflow.trigger_type}</div>
                        </div>
                        <div>
                          <div className="font-medium">Catégorie</div>
                          <div className="text-muted-foreground">{workflow.category}</div>
                        </div>
                        <div>
                          <div className="font-medium">Créé par</div>
                          <div className="text-muted-foreground">
                            {workflow.created_by_user ? 
                              `${workflow.created_by_user.prenoms} ${workflow.created_by_user.noms}` : 
                              'Système'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Exécutions</div>
                          <div className="text-muted-foreground">
                            {workflow.execution_count} ({workflow.completion_rate}% succès)
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun template trouvé</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Créez des templates pour réutiliser vos configurations de workflows.
                      </p>
                      <Button onClick={() => setShowTemplateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredTemplates.map((template) => (
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
                        <div className="text-sm text-muted-foreground">
                          Utilisé {template.usage_count} fois
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Créé par: {template.created_by_user ? 
                            `${template.created_by_user.prenoms} ${template.created_by_user.noms}` : 
                            'Système'
                          }
                        </div>
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                        >
                          Utiliser ce template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Exécutions</CardTitle>
              <CardDescription>Journal détaillé des exécutions de workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {executionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune exécution</h3>
                  <p className="text-muted-foreground">
                    L'historique des exécutions apparaîtra ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.slice(0, 20).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getHistoryStatusIcon(execution.status)}
                        <div>
                          <div className="font-medium">
                            {execution.workflow?.name || 'Workflow supprimé'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Démarré le {new Date(execution.started_at).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Exécuté par: {execution.executor ? 
                              `${execution.executor.prenoms} ${execution.executor.noms}` : 
                              'Système'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {execution.status}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {execution.duration_minutes ? `${execution.duration_minutes}min` : 'En cours...'}
                        </div>
                        {execution.progress_percentage !== null && (
                          <div className="text-sm text-muted-foreground">
                            {execution.progress_percentage}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            {/* Paramètres généraux d'automatisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Généraux d'Automatisation
                </CardTitle>
                <CardDescription>
                  Configuration globale des workflows et processus automatisés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Notifications activées</Label>
                      <div className="text-sm text-muted-foreground">
                        Recevoir des notifications pour les événements de workflow
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.auto_triggers_enabled}
                      onCheckedChange={(checked) => updateSetting('auto_triggers_enabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Délai d'attente par défaut (minutes)</Label>
                      <div className="text-sm text-muted-foreground">
                        Temps maximum d'exécution avant timeout
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.default_timeout} 
                      onChange={(e) => updateSetting('default_timeout', parseInt(e.target.value) || 30)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Exécutions simultanées maximum</Label>
                      <div className="text-sm text-muted-foreground">
                        Nombre limite de workflows exécutés en parallèle
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.check_frequency} 
                      onChange={(e) => updateSetting('check_frequency', parseInt(e.target.value) || 5)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Rétention des logs (jours)</Label>
                      <div className="text-sm text-muted-foreground">
                        Durée de conservation des journaux d'exécution
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.log_retention_days} 
                      onChange={(e) => updateSetting('log_retention_days', parseInt(e.target.value) || 90)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Fréquence de vérification (minutes)</Label>
                      <div className="text-sm text-muted-foreground">
                        Intervalle de vérification des conditions de déclenchement
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.max_concurrent} 
                      onChange={(e) => updateSetting('max_concurrent', parseInt(e.target.value) || 5)}
                      className="w-24" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration des déclencheurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Configuration des Déclencheurs
                </CardTitle>
                <CardDescription>
                  Paramètres des événements et conditions de déclenchement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Déclencheurs automatiques activés</Label>
                      <div className="text-sm text-muted-foreground">
                        Permet l'exécution automatique basée sur les événements
                      </div>
                    </div>
                     <Switch 
                       checked={workflowSettings.auto_triggers_enabled}
                       onCheckedChange={(checked) => updateSetting('auto_triggers_enabled', checked)}
                     />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Surveillance des stocks</Label>
                      <div className="text-sm text-muted-foreground">
                        Déclenchement automatique sur seuils de stock
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.stock_monitoring}
                      onCheckedChange={(checked) => updateSetting('stock_monitoring', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Événements de vente</Label>
                      <div className="text-sm text-muted-foreground">
                        Déclenchement sur les transactions de vente
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.sales_events}
                      onCheckedChange={(checked) => updateSetting('sales_events', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Seuil d'alerte stock bas (%)</Label>
                      <div className="text-sm text-muted-foreground">
                        Pourcentage de stock restant pour déclencher une alerte
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.stock_threshold} 
                      onChange={(e) => updateSetting('stock_threshold', parseInt(e.target.value) || 20)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Planification activée</Label>
                      <div className="text-sm text-muted-foreground">
                        Permet les workflows planifiés (cron jobs)
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.scheduling_enabled}
                      onCheckedChange={(checked) => updateSetting('scheduling_enabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gestion des erreurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Gestion des Erreurs
                </CardTitle>
                <CardDescription>
                  Configuration de la gestion des échecs et nouvelle tentatives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Nouvelles tentatives automatiques</Label>
                      <div className="text-sm text-muted-foreground">
                        Relancer automatiquement les workflows échoués
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.auto_retry}
                      onCheckedChange={(checked) => updateSetting('auto_retry', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Nombre maximum de tentatives</Label>
                      <div className="text-sm text-muted-foreground">
                        Limite des reprises automatiques avant échec définitif
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.max_retries} 
                      onChange={(e) => updateSetting('max_retries', parseInt(e.target.value) || 3)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Délai entre tentatives (minutes)</Label>
                      <div className="text-sm text-muted-foreground">
                        Temps d'attente avant nouvelle tentative
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.retry_delay} 
                      onChange={(e) => updateSetting('retry_delay', parseInt(e.target.value) || 5)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Notifications d'échec</Label>
                      <div className="text-sm text-muted-foreground">
                        Envoyer des alertes en cas d'échec de workflow
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.failure_notifications}
                      onCheckedChange={(checked) => updateSetting('failure_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Escalade automatique</Label>
                      <div className="text-sm text-muted-foreground">
                        Remonter les échecs critiques aux superviseurs
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.auto_escalation}
                      onCheckedChange={(checked) => updateSetting('auto_escalation', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Sauvegarde des états</Label>
                      <div className="text-sm text-muted-foreground">
                        Conserver l'état du workflow pour reprise
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.state_backup}
                      onCheckedChange={(checked) => updateSetting('state_backup', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sécurité et audit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sécurité et Audit
                </CardTitle>
                <CardDescription>
                  Paramètres de sécurité, contrôles d'accès et audit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Audit complet activé</Label>
                      <div className="text-sm text-muted-foreground">
                        Journaliser toutes les actions sur les workflows
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.audit_enabled}
                      onCheckedChange={(checked) => updateSetting('audit_enabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Niveau de log</Label>
                      <div className="text-sm text-muted-foreground">
                        Détail des informations à enregistrer
                      </div>
                    </div>
                    <Select 
                      value={workflowSettings.log_level}
                      onValueChange={(value) => updateSetting('log_level', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Détaillé</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Contrôle d'accès strict</Label>
                      <div className="text-sm text-muted-foreground">
                        Vérification des permissions pour chaque action
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.strict_access}
                      onCheckedChange={(checked) => updateSetting('strict_access', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Chiffrement des données sensibles</Label>
                      <div className="text-sm text-muted-foreground">
                        Chiffrer les informations confidentielles dans les logs
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.encrypt_sensitive}
                      onCheckedChange={(checked) => updateSetting('encrypt_sensitive', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Rétention des audits (mois)</Label>
                      <div className="text-sm text-muted-foreground">
                        Durée de conservation des journaux d'audit
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={workflowSettings.audit_retention_months} 
                      onChange={(e) => updateSetting('audit_retention_months', parseInt(e.target.value) || 12)}
                      className="w-24" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Alertes de sécurité</Label>
                      <div className="text-sm text-muted-foreground">
                        Notifications pour tentatives d'accès non autorisées
                      </div>
                    </div>
                    <Switch 
                      checked={workflowSettings.security_alerts}
                      onCheckedChange={(checked) => updateSetting('security_alerts', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions de Maintenance</CardTitle>
                <CardDescription>
                  Outils de maintenance et d'optimisation du système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button variant="outline">
                    <Package className="mr-2 h-4 w-4" />
                    Nettoyer les logs anciens
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Exporter la configuration
                  </Button>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Réinitialiser par défaut
                  </Button>
                  <Button variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Test de connectivité
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={updateSettingMutation.isPending}
                    className="w-full"
                  >
                    {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder toute la configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowModule;