import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  AlertTriangle, 
  Plus, 
  Eye, 
  Edit,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface IncidentFormData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const SecurityIncidents = () => {
  const { toast } = useToast();
  const { tenantId, useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Charger les incidents depuis la base de données
  const { data: incidents = [], isLoading } = useTenantQueryWithCache(
    ['security-incidents'],
    'security_incidents',
    '*',
    undefined,
    { orderBy: { column: 'created_at', ascending: false } }
  );

  // Mutation pour créer un incident
  const createIncidentMutation = useTenantMutation('security_incidents', 'insert', {
    invalidateQueries: ['security-incidents'],
    onSuccess: () => {
      toast({
        title: "Incident créé",
        description: "L'incident de sécurité a été créé avec succès.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      console.error('Erreur lors de la création de l\'incident:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'incident. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour un incident
  const updateIncidentMutation = useTenantMutation('security_incidents', 'update', {
    invalidateQueries: ['security-incidents'],
    onSuccess: () => {
      toast({
        title: "Incident mis à jour",
        description: "L'incident a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'incident.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<IncidentFormData>({
    defaultValues: {
      title: '',
      description: '',
      severity: 'medium'
    }
  });

  const onSubmit = async (data: IncidentFormData) => {
    if (!tenantId) {
      toast({
        title: "Erreur",
        description: "Tenant ID non disponible.",
        variant: "destructive",
      });
      return;
    }

    createIncidentMutation.mutate({
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'open',
      incident_type: 'security_breach',
      metadata: {
        created_via: 'security_dashboard',
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    updateIncidentMutation.mutate({
      id: incidentId,
      status: newStatus
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="h-4 w-4" />;
      case 'in_progress': return <Eye className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Filtrer les incidents
  const filteredIncidents = incidents.filter((incident: any) => {
    const matchesSearch = incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">Incidents Ouverts</p>
                <p className="text-2xl font-bold text-red-500">
                  {incidents.filter((i: any) => i.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium">En Investigation</p>
                <p className="text-2xl font-bold text-orange-500">
                  {incidents.filter((i: any) => i.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">Résolus</p>
                <p className="text-2xl font-bold text-green-500">
                  {incidents.filter((i: any) => i.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">Critiques</p>
                <p className="text-2xl font-bold text-red-500">
                  {incidents.filter((i: any) => i.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gestion des Incidents de Sécurité
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un Nouvel Incident</DialogTitle>
                  <DialogDescription>
                    Signaler un nouveau problème de sécurité
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Titre de l'incident"
                              required 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Description détaillée de l'incident"
                              required 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sévérité</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">🟢 Faible</SelectItem>
                              <SelectItem value="medium">🟡 Moyenne</SelectItem>
                              <SelectItem value="high">🟠 Élevée</SelectItem>
                              <SelectItem value="critical">🔴 Critique</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createIncidentMutation.isPending}
                      >
                        {createIncidentMutation.isPending ? 'Création...' : 'Créer l\'incident'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">Investigation</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sévérités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Chargement des incidents...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || severityFilter !== 'all' 
                  ? 'Aucun incident trouvé avec ces filtres.'
                  : 'Aucun incident de sécurité signalé.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident: any) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {incident.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(incident.severity)} className="flex items-center gap-1 w-fit">
                        <span>{getSeverityIcon(incident.severity)}</span>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(incident.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(incident.status)}
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {incident.created_at && format(new Date(incident.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={incident.status}
                          onValueChange={(value) => handleStatusChange(incident.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Ouvert</SelectItem>
                            <SelectItem value="in_progress">Investigation</SelectItem>
                            <SelectItem value="resolved">Résolu</SelectItem>
                            <SelectItem value="closed">Fermé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityIncidents;