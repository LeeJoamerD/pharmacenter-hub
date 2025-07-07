import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Zap,
  CheckSquare,
  Calendar,
  FileText,
  Users,
  Share2,
  Bell,
  Clock,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Target,
  TrendingUp,
  Activity,
  Folder,
  Link,
  AlertCircle,
  CheckCircle,
  User,
  MessageSquare,
  Star,
  Archive
} from 'lucide-react';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  pharmacy_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  created_at: string;
  created_by: string;
  tags: string[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_by: string;
  uploaded_at: string;
  pharmacy_id: string;
  shared_with: string[];
  category: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  organizer: string;
  participants: string[];
  type: 'meeting' | 'training' | 'event' | 'deadline';
  location: string;
}

const CollaborativeProductivityTools = () => {
  const { pharmacies, loading } = useNetworkMessaging();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMockData();
  }, [pharmacies]);

  const loadMockData = () => {
    // Simuler des tâches collaboratives
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Révision des protocoles de sécurité',
        description: 'Mise à jour des procédures de sécurité pour toutes les officines',
        assignee: 'Pharmacie du Centre',
        pharmacy_id: 'pharmacy-1',
        priority: 'high',
        status: 'in_progress',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'Dr. Martin',
        tags: ['sécurité', 'protocoles', 'urgent']
      },
      {
        id: '2',
        title: 'Formation sur nouveaux médicaments',
        description: 'Organisation de la formation collective sur les nouveaux produits',
        assignee: 'Pharmacie Moderne',
        pharmacy_id: 'pharmacy-2',
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'Dr. Dubois',
        tags: ['formation', 'médicaments']
      },
      {
        id: '3',
        title: 'Audit qualité trimestriel',
        description: 'Préparation et coordination de l\'audit qualité du réseau',
        assignee: 'Pharmacie Santé Plus',
        pharmacy_id: 'pharmacy-3',
        priority: 'medium',
        status: 'completed',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'Dr. Laurent',
        tags: ['audit', 'qualité']
      }
    ];

    // Simuler des documents partagés
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Protocole COVID-19 V3.pdf',
        type: 'PDF',
        size: '2.4 MB',
        uploaded_by: 'Dr. Martin',
        uploaded_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        pharmacy_id: 'pharmacy-1',
        shared_with: ['pharmacy-2', 'pharmacy-3'],
        category: 'Protocoles'
      },
      {
        id: '2',
        name: 'Catalogue Produits 2024.xlsx',
        type: 'Excel',
        size: '5.1 MB',
        uploaded_by: 'Dr. Dubois',
        uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        pharmacy_id: 'pharmacy-2',
        shared_with: ['pharmacy-1', 'pharmacy-3'],
        category: 'Catalogues'
      },
      {
        id: '3',
        name: 'Rapport Audit Q1.docx',
        type: 'Word',
        size: '1.8 MB',
        uploaded_by: 'Dr. Laurent',
        uploaded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        pharmacy_id: 'pharmacy-3',
        shared_with: ['pharmacy-1', 'pharmacy-2'],
        category: 'Rapports'
      }
    ];

    // Simuler des événements
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Réunion réseau mensuelle',
        description: 'Point mensuel sur les activités du réseau',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:00',
        organizer: 'Administration Centrale',
        participants: ['pharmacy-1', 'pharmacy-2', 'pharmacy-3'],
        type: 'meeting',
        location: 'Visioconférence'
      },
      {
        id: '2',
        title: 'Formation Nouvelles Réglementations',
        description: 'Session de formation sur les nouvelles réglementations pharmaceutiques',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00',
        organizer: 'Dr. Martin',
        participants: ['pharmacy-1', 'pharmacy-2'],
        type: 'training',
        location: 'Centre de Formation Régional'
      }
    ];

    setTasks(mockTasks);
    setDocuments(mockDocuments);
    setEvents(mockEvents);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-orange-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <Trash2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPharmacy = selectedPharmacy === 'all' || task.pharmacy_id === selectedPharmacy;
    const matchesStatus = taskFilter === 'all' || task.status === taskFilter;
    return matchesSearch && matchesPharmacy && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Chargement des outils collaboratifs...</p>
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
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel élément
          </Button>
        </div>
      </div>

      {/* Métriques de collaboration */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Actives</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'completed').length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === 'completed').length} terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Partagés</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Bibliothèque commune
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Planifiés ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pharmacies.length}</div>
            <p className="text-xs text-muted-foreground">
              Officines actives
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="workspace">Espaces</TabsTrigger>
        </TabsList>

        {/* Gestion des tâches */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Gestion des Tâches Collaboratives
                  </CardTitle>
                  <CardDescription>
                    Suivi et coordination des tâches inter-officines
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des tâches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par officine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les officines</SelectItem>
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={taskFilter} onValueChange={setTaskFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liste des tâches */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignee}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Échéance: {formatDistanceToNow(new Date(task.due_date), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span className="text-sm capitalize">{task.status.replace('_', ' ')}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des documents */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Bibliothèque de Documents Partagés
                  </CardTitle>
                  <CardDescription>
                    Partage et gestion de documents inter-officines
                  </CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {doc.uploaded_by}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(doc.uploaded_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        Partagé avec {doc.shared_with.length} officines
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendrier collaboratif */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendrier Collaboratif
                  </CardTitle>
                  <CardDescription>
                    Planification et coordination des événements réseau
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel événement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline">
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        <div className="grid gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Organisé par {event.organizer}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.participants.length} participants
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Espaces de travail */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Espaces de Travail Collaboratifs
              </CardTitle>
              <CardDescription>
                Espaces dédiés pour les projets et initiatives communes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Projet Qualité 2024</h3>
                      <p className="text-sm text-muted-foreground">Amélioration continue</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Progression</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      3 officines
                    </div>
                    <Button variant="outline" size="sm">
                      Accéder
                    </Button>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Formation Continue</h3>
                      <p className="text-sm text-muted-foreground">Programme de formation</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Modules terminés</span>
                      <span className="font-medium">8/12</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Toutes les officines
                    </div>
                    <Button variant="outline" size="sm">
                      Accéder
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="text-center py-8">
                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">Créer un nouvel espace</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Organisez vos projets collaboratifs dans des espaces dédiés
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un espace
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborativeProductivityTools;