import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Eye, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Database } from '@/integrations/supabase/types';

type SecurityIncident = Database['public']['Tables']['security_incidents']['Row'];
type IncidentComment = Database['public']['Tables']['incident_comments']['Row'];

interface IncidentCommentWithUser extends IncidentComment {
  user_name?: string;
}

const SecurityIncidents = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [comments, setComments] = useState<IncidentCommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    incident_type: '',
    affected_systems: [] as string[]
  });
  const { toast } = useToast();
  const loadIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des incidents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les incidents de sécurité",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadIncidentComments = async (incidentId: string) => {
    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Charger les noms des utilisateurs séparément
      const commentsWithUserNames = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: personnel } = await supabase
            .from('personnel')
            .select('noms, prenoms')
            .eq('auth_user_id', comment.user_id)
            .single();
          
          return {
            ...comment,
            user_name: personnel ? `${personnel.noms} ${personnel.prenoms}` : 'Utilisateur'
          };
        })
      );
      
      setComments(commentsWithUserNames);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    }
  };

  const createIncident = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel) throw new Error('Personnel non trouvé');

      const { error } = await supabase
        .from('security_incidents')
        .insert({
          ...newIncident,
          tenant_id: personnel.tenant_id,
          affected_systems: newIncident.affected_systems
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Incident créé avec succès",
      });

      setShowCreateDialog(false);
      setNewIncident({
        title: '',
        description: '',
        severity: 'medium',
        incident_type: '',
        affected_systems: []
      });
      loadIncidents();
    } catch (error) {
      console.error('Erreur lors de la création de l\'incident:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'incident",
        variant: "destructive",
      });
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') {
        const { data: user } = await supabase.auth.getUser();
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user.user?.id;
      }

      const { error } = await supabase
        .from('security_incidents')
        .update(updates)
        .eq('id', incidentId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de l'incident mis à jour",
      });

      loadIncidents();
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, ...updates });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const addComment = async () => {
    if (!selectedIncident || !newComment.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel) throw new Error('Personnel non trouvé');

      const { error } = await supabase
        .from('incident_comments')
        .insert({
          incident_id: selectedIncident.id,
          user_id: user.user.id,
          comment: newComment.trim(),
          tenant_id: personnel.tenant_id
        });

      if (error) throw error;

      setNewComment('');
      loadIncidentComments(selectedIncident.id);
      toast({
        title: "Succès",
        description: "Commentaire ajouté",
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    if (selectedIncident) {
      loadIncidentComments(selectedIncident.id);
    }
  }, [selectedIncident]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.incident_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Gestion des Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des incidents...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gestion des Incidents de Sécurité
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un Nouvel Incident</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      value={newIncident.title}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre de l'incident"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newIncident.description}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description détaillée de l'incident"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Sévérité</label>
                      <Select
                        value={newIncident.severity}
                        onValueChange={(value: any) => setNewIncident(prev => ({ ...prev, severity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type d'Incident</label>
                      <Input
                        value={newIncident.incident_type}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, incident_type: e.target.value }))}
                        placeholder="Ex: Intrusion, Malware, Phishing"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={createIncident}>
                      Créer l'Incident
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sévérités</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Incidents Ouverts</p>
                    <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'open').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">En Cours</p>
                    <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'in_progress').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Résolus</p>
                    <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'resolved').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Critiques</p>
                    <p className="text-2xl font-bold">{incidents.filter(i => i.severity === 'critical').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Liste des incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Incidents ({filteredIncidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date de Création</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{incident.title}</div>
                      {incident.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {incident.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(incident.severity)}>
                      <span className="flex items-center gap-1">
                        {getSeverityIcon(incident.severity)}
                        {incident.severity}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.incident_type}</TableCell>
                  <TableCell>{formatDate(incident.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {incident.status !== 'closed' && (
                        <Select
                          value={incident.status}
                          onValueChange={(value) => updateIncidentStatus(incident.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Ouvert</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="resolved">Résolu</SelectItem>
                            <SelectItem value="closed">Fermé</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredIncidents.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun incident trouvé avec les critères actuels</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails de l'incident sélectionné */}
      {selectedIncident && (
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {selectedIncident.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sévérité</label>
                  <Badge className={`${getSeverityColor(selectedIncident.severity)} mt-1`}>
                    <span className="flex items-center gap-1">
                      {getSeverityIcon(selectedIncident.severity)}
                      {selectedIncident.severity}
                    </span>
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <Badge className={`${getStatusColor(selectedIncident.status)} mt-1`}>
                    {selectedIncident.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p>{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <p>{formatDate(selectedIncident.created_at)}</p>
                </div>
              </div>

              {/* Description */}
              {selectedIncident.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedIncident.description}</p>
                </div>
              )}

              {/* Systèmes affectés */}
              {selectedIncident.affected_systems && selectedIncident.affected_systems.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Systèmes Affectés</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedIncident.affected_systems.map((system, index) => (
                      <Badge key={index} variant="outline">{system}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline / Commentaires */}
              <div>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Timeline et Commentaires
                </h4>
                
                <div className="space-y-4 max-h-60 overflow-y-auto border rounded-md p-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {comment.user_name || 'Utilisateur'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ajouter un commentaire */}
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ajouter un Commentaire
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SecurityIncidents;