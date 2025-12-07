import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Zap,
  Play,
  Pause,
  Settings,
  Trash2,
  RefreshCw,
  Download,
  Plus,
  LayoutGrid,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  Loader2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAIAutomation, AutomationWorkflow, AutomationExecution } from '@/hooks/useAIAutomation';
import { useTenant } from '@/contexts/TenantContext';
import { exportWorkflowsToPDF, exportWorkflowsToExcel } from '@/utils/automationExportUtils';
import CreateWorkflowDialog from './dialogs/CreateWorkflowDialog';
import EditWorkflowDialog from './dialogs/EditWorkflowDialog';
import ExecutionDetailDialog from './dialogs/ExecutionDetailDialog';
import TemplateGalleryDialog from './dialogs/TemplateGalleryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AIAutomation = () => {
  const { currentTenant } = useTenant();
  const {
    loading,
    executing,
    workflows,
    executions,
    templates,
    metrics,
    triggerTypes,
    actionTypes,
    categories,
    filters,
    setFilters,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
    executeWorkflow,
    createFromTemplate,
    refreshData
  } = useAIAutomation();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [executionDetailOpen, setExecutionDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const getTriggerLabel = (triggerType: string) => {
    return triggerTypes.find(t => t.value === triggerType)?.label || triggerType;
  };

  const handleEdit = (workflow: AutomationWorkflow) => {
    setSelectedWorkflow(workflow);
    setEditDialogOpen(true);
  };

  const handleViewExecution = (execution: AutomationExecution) => {
    setSelectedExecution(execution);
    setExecutionDetailOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (workflowToDelete) {
      await deleteWorkflow(workflowToDelete);
      setWorkflowToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const pharmacyName = (currentTenant as any)?.nom_pharmacie || 'PharmaSoft';
    if (format === 'pdf') {
      exportWorkflowsToPDF(workflows, metrics, pharmacyName);
    } else {
      exportWorkflowsToExcel(workflows, executions, metrics);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automatisation IA</h2>
          <p className="text-muted-foreground">
            Configurez des workflows automatisés pour votre pharmacie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="all">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <select 
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_workflows}</div>
            <p className="text-xs text-muted-foreground">
              sur {metrics.total_workflows} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.executions_24h}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successful_24h} succès, {metrics.failed_24h} échecs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              dernières 24 heures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_duration_ms} ms</div>
            <p className="text-xs text-muted-foreground">
              par exécution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {loading && workflows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Chargement des workflows...</p>
              </CardContent>
            </Card>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun workflow</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre premier workflow d'automatisation
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflows.map((wf) => (
                <Card key={wf.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={wf.is_active}
                          onCheckedChange={(checked) => toggleWorkflowStatus(wf.id, checked)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{wf.name}</h4>
                            <Badge variant="outline">{wf.category}</Badge>
                            <Badge variant={wf.is_active ? 'default' : 'secondary'}>
                              {wf.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {wf.description || 'Aucune description'} | Déclencheur: {getTriggerLabel(wf.trigger_type)}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Priorité: #{wf.priority}</span>
                            <span>Exécutions: {wf.execution_count}</span>
                            <span>Succès: {wf.success_count}</span>
                            <span>Échecs: {wf.failure_count}</span>
                            {wf.last_execution_at && (
                              <span>Dernière: {format(new Date(wf.last_execution_at), 'dd/MM HH:mm', { locale: fr })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeWorkflow(wf.id)}
                          disabled={executing || !wf.is_active}
                        >
                          {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(wf)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteConfirm(wf.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune exécution</h3>
                <p className="text-muted-foreground">
                  Les exécutions de workflows apparaîtront ici
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {executions.map((exec) => (
                    <div 
                      key={exec.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 cursor-pointer"
                      onClick={() => handleViewExecution(exec)}
                    >
                      <div className="flex items-center gap-3">
                        {exec.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {exec.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                        {exec.status === 'running' && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                        {exec.status === 'pending' && <Clock className="h-4 w-4 text-orange-600" />}
                        <div>
                          <p className="font-medium">{exec.workflow?.name || 'Workflow inconnu'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(exec.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{exec.duration_ms || 0} ms</span>
                        <Badge variant={exec.status === 'completed' ? 'default' : exec.status === 'failed' ? 'destructive' : 'secondary'}>
                          {exec.status === 'completed' ? 'Succès' : exec.status === 'failed' ? 'Échec' : exec.status}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTemplateDialogOpen(true)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{template.category}</Badge>
                        {template.is_system && <Badge variant="secondary">Système</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'Automatisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Notifications d'exécution</p>
                  <p className="text-sm text-muted-foreground">Recevoir une notification à chaque exécution de workflow</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Alertes d'échec</p>
                  <p className="text-sm text-muted-foreground">Recevoir une alerte en cas d'échec d'un workflow</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Exécution automatique au démarrage</p>
                  <p className="text-sm text-muted-foreground">Exécuter les workflows planifiés au lancement de l'application</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-medium">Limite d'exécutions simultanées</p>
                  <p className="text-sm text-muted-foreground">Nombre maximum de workflows exécutés en parallèle</p>
                </div>
                <select className="px-3 py-2 border rounded-md bg-background">
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateWorkflowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createWorkflow}
        triggerTypes={triggerTypes}
        actionTypes={actionTypes}
        categories={categories}
      />

      <EditWorkflowDialog
        workflow={selectedWorkflow}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={updateWorkflow}
        triggerTypes={triggerTypes}
        actionTypes={actionTypes}
        categories={categories}
      />

      <ExecutionDetailDialog
        execution={selectedExecution}
        open={executionDetailOpen}
        onOpenChange={setExecutionDetailOpen}
      />

      <TemplateGalleryDialog
        templates={templates}
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSelectTemplate={createFromTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le workflow ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le workflow et son historique d'exécutions seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIAutomation;
