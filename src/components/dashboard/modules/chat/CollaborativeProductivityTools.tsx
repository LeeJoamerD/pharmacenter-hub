import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Zap,
  CheckSquare,
  Calendar,
  FileText,
  Users,
  Share2,
  Clock,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Target,
  TrendingUp,
  Folder,
  AlertCircle,
  CheckCircle,
  User,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useCollaborativeProductivity, type CollaborativeTask, type SharedDocument, type CollaborativeWorkspace } from '@/hooks/useCollaborativeProductivity';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreateTaskDialog } from './dialogs/CreateTaskDialog';
import { EditTaskDialog } from './dialogs/EditTaskDialog';
import { CreateEventDialog } from './dialogs/CreateEventDialog';
import { UploadDocumentDialog } from './dialogs/UploadDocumentDialog';
import { ShareDocumentDialog } from './dialogs/ShareDocumentDialog';
import { CreateWorkspaceDialog } from './dialogs/CreateWorkspaceDialog';
import { WorkspaceDetailDialog } from './dialogs/WorkspaceDetailDialog';
import { 
  exportTasksToExcel, 
  exportTasksToPDF, 
  exportDocumentsToExcel,
  exportDocumentsToPDF,
  exportEventsToExcel,
  exportEventsToPDF,
  exportWorkspacesToExcel 
} from '@/utils/collaborativeExportUtils';
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

const CollaborativeProductivityTools = () => {
  const {
    loading,
    saving,
    tasks,
    documents,
    events,
    workspaces,
    pharmacies,
    metrics,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    loadDocuments,
    uploadDocument,
    shareDocument,
    deleteDocument,
    loadEvents,
    createEvent,
    deleteEvent,
    createWorkspace,
    updateWorkspaceProgress,
    loadWorkspaceMembers,
    addWorkspaceMember,
    removeWorkspaceMember,
    loadAll
  } = useCollaborativeProductivity();

  // Filters
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  // Dialogs
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CollaborativeTask | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [shareDocOpen, setShareDocOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceDetailOpen, setWorkspaceDetailOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<CollaborativeWorkspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Handle workspace detail opening
  const handleOpenWorkspaceDetail = async (workspace: CollaborativeWorkspace) => {
    setSelectedWorkspace(workspace);
    const members = await loadWorkspaceMembers(workspace.id);
    setWorkspaceMembers(members);
    setWorkspaceDetailOpen(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = taskFilter === 'all' || task.status === taskFilter;
    const matchesPriority = taskPriorityFilter === 'all' || task.priority === taskPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = docCategoryFilter === 'all' || doc.category === docCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'task') {
      await deleteTask(deleteTarget.id);
    } else if (deleteTarget.type === 'document') {
      await deleteDocument(deleteTarget.id);
    } else if (deleteTarget.type === 'event') {
      await deleteEvent(deleteTarget.id);
    }
    
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Terminée</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'pending': return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'cancelled': return <Badge variant="destructive"><Trash2 className="h-3 w-3 mr-1" />Annulée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'meeting': return <Badge className="bg-blue-500">Réunion</Badge>;
      case 'training': return <Badge className="bg-purple-500">Formation</Badge>;
      case 'event': return <Badge className="bg-green-500">Événement</Badge>;
      case 'deadline': return <Badge className="bg-orange-500">Échéance</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des outils collaboratifs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Productivité Collaborative
          </h1>
          <p className="text-muted-foreground">
            Outils de collaboration et de productivité pour le réseau multi-officines
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Actives</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedTasks} terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sharedDocuments}</div>
            <p className="text-xs text-muted-foreground">Bibliothèque partagée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">À venir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaces</CardTitle>
            <Folder className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeWorkspaces}</div>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.collaboratingPharmacies}</div>
            <p className="text-xs text-muted-foreground">Officines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Complétion</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeTasks + metrics.completedTasks > 0 
                ? Math.round((metrics.completedTasks / (metrics.activeTasks + metrics.completedTasks)) * 100)
                : 0}%
            </div>
            <Progress 
              value={metrics.activeTasks + metrics.completedTasks > 0 
                ? (metrics.completedTasks / (metrics.activeTasks + metrics.completedTasks)) * 100 
                : 0} 
              className="h-1 mt-1" 
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tâches ({tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier ({events.length})</TabsTrigger>
          <TabsTrigger value="workspace">Espaces ({workspaces.length})</TabsTrigger>
        </TabsList>

        {/* === TASKS TAB === */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Gestion des Tâches Collaboratives
                  </CardTitle>
                  <CardDescription>Suivi et coordination des tâches inter-officines</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportTasksToExcel(filteredTasks)}>
                    <Download className="h-4 w-4 mr-1" />Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportTasksToPDF(filteredTasks)}>
                    <Download className="h-4 w-4 mr-1" />PDF
                  </Button>
                  <Button onClick={() => setCreateTaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Nouvelle tâche
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={taskFilter} onValueChange={setTaskFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="cancelled">Annulées</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune tâche trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              {task.is_network_task && <Badge variant="outline" className="text-xs">Réseau</Badge>}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {task.assignee_name && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {task.assignee_name}
                                </div>
                              )}
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(task.due_date), { addSuffix: true, locale: fr })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(task.status)}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedTask(task);
                                setEditTaskOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setDeleteTarget({ type: 'task', id: task.id, name: task.title });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === DOCUMENTS TAB === */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Bibliothèque de Documents
                  </CardTitle>
                  <CardDescription>Documents partagés entre officines</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportDocumentsToExcel(filteredDocuments)}>
                    <Download className="h-4 w-4 mr-1" />Excel
                  </Button>
                  <Button onClick={() => setUploadDocOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />Ajouter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={docCategoryFilter} onValueChange={setDocCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="protocols">Protocoles</SelectItem>
                    <SelectItem value="reports">Rapports</SelectItem>
                    <SelectItem value="training">Formation</SelectItem>
                    <SelectItem value="regulations">Réglementation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun document trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{doc.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{doc.category}</span>
                            <span>{doc.file_type || 'Document'}</span>
                            <span>{doc.download_count} téléchargements</span>
                            {doc.is_network_document && <Badge variant="outline" className="text-xs">Réseau</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShareDocOpen(true);
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {doc.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setDeleteTarget({ type: 'document', id: doc.id, name: doc.name });
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === CALENDAR TAB === */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendrier Collaboratif
                  </CardTitle>
                  <CardDescription>Événements et réunions du réseau</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportEventsToExcel(filteredEvents)}>
                    <Download className="h-4 w-4 mr-1" />Excel
                  </Button>
                  <Button onClick={() => setCreateEventOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Nouvel événement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="meeting">Réunions</SelectItem>
                    <SelectItem value="training">Formations</SelectItem>
                    <SelectItem value="event">Événements</SelectItem>
                    <SelectItem value="deadline">Échéances</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun événement trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{event.title}</h4>
                              {getEventTypeBadge(event.event_type)}
                              {event.is_network_event && <Badge variant="outline" className="text-xs">Réseau</Badge>}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(event.event_date), 'dd MMMM yyyy', { locale: fr })}
                              </div>
                              {event.event_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.event_time}
                                </div>
                              )}
                              {event.location && <span>{event.location}</span>}
                              {event.is_virtual && <Badge variant="outline" className="text-xs">Virtuel</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {event.participants?.length || 0}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setDeleteTarget({ type: 'event', id: event.id, name: event.title });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === WORKSPACES TAB === */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Espaces de Travail Collaboratifs
                  </CardTitle>
                  <CardDescription>Projets et espaces de collaboration</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportWorkspacesToExcel(workspaces)}>
                    <Download className="h-4 w-4 mr-1" />Excel
                  </Button>
                  <Button onClick={() => setCreateWorkspaceOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Nouvel espace
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {workspaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun espace de travail</p>
                  <Button className="mt-4" onClick={() => setCreateWorkspaceOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Créer un espace
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {workspaces.map((workspace) => (
                    <Card 
                      key={workspace.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleOpenWorkspaceDetail(workspace)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${workspace.color === 'primary' ? 'primary' : workspace.color + '-500'}/10`}>
                            <Target className={`h-5 w-5 text-${workspace.color === 'primary' ? 'primary' : workspace.color + '-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{workspace.name}</CardTitle>
                            {workspace.is_network_workspace && (
                              <Badge variant="outline" className="text-xs">Réseau</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {workspace.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{workspace.description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progression</span>
                            <span className="font-medium">{workspace.progress_percent}%</span>
                          </div>
                          <Progress value={workspace.progress_percent} className="h-2" />
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {workspace.members_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {workspace.tasks_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {workspace.documents_count || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={createTask}
        pharmacies={pharmacies}
        workspaces={workspaces.map(w => ({ id: w.id, name: w.name }))}
        isSubmitting={saving}
      />

      <EditTaskDialog
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={selectedTask}
        onSubmit={updateTask}
        pharmacies={pharmacies}
        workspaces={workspaces.map(w => ({ id: w.id, name: w.name }))}
        isSubmitting={saving}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSubmit={createEvent}
        pharmacies={pharmacies}
        isSubmitting={saving}
      />

      <UploadDocumentDialog
        open={uploadDocOpen}
        onOpenChange={setUploadDocOpen}
        onSubmit={uploadDocument}
        workspaces={workspaces.map(w => ({ id: w.id, name: w.name }))}
        isSubmitting={saving}
      />

      <ShareDocumentDialog
        open={shareDocOpen}
        onOpenChange={setShareDocOpen}
        document={selectedDocument}
        pharmacies={pharmacies}
        onShare={shareDocument}
        isSubmitting={saving}
      />

      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onSubmit={createWorkspace}
        isSubmitting={saving}
      />

      <WorkspaceDetailDialog
        open={workspaceDetailOpen}
        onOpenChange={setWorkspaceDetailOpen}
        workspace={selectedWorkspace}
        members={workspaceMembers}
        tasks={tasks}
        documents={documents}
        pharmacies={pharmacies}
        onUpdateProgress={(progress) => selectedWorkspace && updateWorkspaceProgress(selectedWorkspace.id, progress)}
        onAddMember={(pharmacyId, role) => selectedWorkspace && addWorkspaceMember(selectedWorkspace.id, pharmacyId, role)}
        onRemoveMember={(memberId) => selectedWorkspace && removeWorkspaceMember(selectedWorkspace.id, memberId)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteTarget?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollaborativeProductivityTools;
