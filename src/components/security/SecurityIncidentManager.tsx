import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  ArrowRight,
  MessageCircle,
  Eye,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from "@/integrations/supabase/types";

type SecurityIncident = Database['public']['Tables']['security_incidents']['Row'];
type IncidentComment = Database['public']['Tables']['incident_comments']['Row'];

interface IncidentCommentWithUser extends IncidentComment {
  user_name: string;
}

const SecurityIncidentManager = () => {
  const { personnel } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [comments, setComments] = useState<IncidentCommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    incident_type: 'security_breach'
  });

  // Charger les incidents
  const loadIncidents = async () => {
    if (!personnel) return;

    try {
      const { data } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .order('created_at', { ascending: false });

      setIncidents(data || []);
    } catch (error) {
      console.error('Erreur chargement incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les commentaires d'un incident
  const loadIncidentComments = async (incidentId: string) => {
    try {
      const { data: commentsData } = await supabase
        .from('incident_comments')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (commentsData) {
        // Récupérer les noms des utilisateurs
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: users } = await supabase
          .from('personnel')
          .select('id, noms, prenoms')
          .in('id', userIds);

        const formattedComments: IncidentCommentWithUser[] = commentsData.map(comment => ({
          ...comment,
          user_name: users?.find(u => u.id === comment.user_id)?.prenoms + ' ' + 
                     users?.find(u => u.id === comment.user_id)?.noms || 'Utilisateur inconnu'
        }));

        setComments(formattedComments);
      }
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    }
  };

  // Créer un nouvel incident
  const createIncident = async () => {
    if (!personnel || !newIncident.title) return;

    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert({
          tenant_id: personnel.tenant_id,
          title: newIncident.title,
          description: newIncident.description || '',
          severity: newIncident.severity,
          status: 'open',
          incident_type: newIncident.incident_type,
          created_by: personnel.id
        })
        .select()
        .single();

      if (error) throw error;

      setIncidents(prev => [data, ...prev]);
      setNewIncident({
        title: '',
        description: '',
        severity: 'medium',
        incident_type: 'security_breach'
      });

      toast({
        title: "Incident créé",
        description: "L'incident de sécurité a été créé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'incident.",
        variant: "destructive"
      });
    }
  };

  // Mettre à jour le statut d'un incident
  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) throw error;

      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: status as any }
          : incident
      ));

      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, status: status as any } : null);
      }

      toast({
        title: "Statut mis à jour",
        description: `L'incident est maintenant ${status}.`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    }
  };

  // Ajouter un commentaire
  const addComment = async () => {
    if (!personnel || !selectedIncident || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .insert({
          incident_id: selectedIncident.id,
          user_id: personnel.id,
          comment: newComment.trim(),
          tenant_id: personnel.tenant_id
        })
        .select()
        .single();

      if (error) throw error;

      const newCommentData: IncidentCommentWithUser = {
        ...data,
        user_name: `${personnel.prenoms} ${personnel.noms}`
      };

      setComments(prev => [...prev, newCommentData]);
      setNewComment('');

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté à l'incident."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (personnel) {
      loadIncidents();
    }
  }, [personnel]);

  useEffect(() => {
    if (selectedIncident) {
      loadIncidentComments(selectedIncident.id);
    }
  }, [selectedIncident]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'investigating': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Gestion des Incidents
        </h2>
        <p className="text-muted-foreground">
          Suivi et résolution des incidents de sécurité
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des incidents */}
        <div className="lg:col-span-1 space-y-4">
          {/* Formulaire nouveau incident */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nouvel Incident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="incident-title">Titre</Label>
                <Input
                  id="incident-title"
                  placeholder="Titre de l'incident"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ 
                    ...prev, 
                    title: e.target.value 
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="incident-description">Description</Label>
                <Textarea
                  id="incident-description"
                  placeholder="Description détaillée"
                  rows={3}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                />
              </div>

              <div>
                <Label>Sévérité</Label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(severity: any) => setNewIncident(prev => ({ 
                    ...prev, 
                    severity 
                  }))}
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

              <Button onClick={createIncident} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Créer l'incident
              </Button>
            </CardContent>
          </Card>

          {/* Liste des incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Incidents Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incidents.filter(i => i.status !== 'closed').map(incident => (
                  <div
                    key={incident.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIncident?.id === incident.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{incident.title}</h4>
                      <Badge variant={getSeverityColor(incident.severity)} className="text-xs">
                        {incident.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(incident.status)} className="text-xs">
                        {incident.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(incident.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails de l'incident sélectionné */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedIncident.severity === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                      {selectedIncident.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getSeverityColor(selectedIncident.severity)}>
                        {selectedIncident.severity}
                      </Badge>
                      <Badge variant={getStatusColor(selectedIncident.status)}>
                        {selectedIncident.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <Select
                    value={selectedIncident.status}
                    onValueChange={(status) => updateIncidentStatus(selectedIncident.id, status)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="investigating">Investigation</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList>
                    <TabsTrigger value="details">Détails</TabsTrigger>
                    <TabsTrigger value="comments">
                      Commentaires ({comments.length})
                    </TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-muted-foreground">
                        {selectedIncident.description || 'Aucune description disponible'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Créé le</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedIncident.created_at)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Dernière mise à jour</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedIncident.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Type d'incident</h4>
                      <Badge variant="outline">
                        {selectedIncident.incident_type}
                      </Badge>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-4">
                    {/* Formulaire nouveau commentaire */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ajouter un commentaire..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      />
                      <Button onClick={addComment} disabled={!newComment.trim()}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Liste des commentaires */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {comments.map(comment => (
                        <div key={comment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {comment.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                      
                      {comments.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Aucun commentaire pour cet incident
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border-l-4 border-primary">
                        <div className="p-2 bg-primary rounded-full">
                          <FileText className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Incident créé</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(selectedIncident.created_at)}
                          </p>
                        </div>
                      </div>

                      {comments.map(comment => (
                        <div key={comment.id} className="flex items-center gap-3 p-3 border-l-4 border-muted">
                          <div className="p-2 bg-muted rounded-full">
                            <MessageCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Commentaire de {comment.user_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {selectedIncident.status === 'resolved' && (
                        <div className="flex items-center gap-3 p-3 border-l-4 border-green-500">
                          <div className="p-2 bg-green-500 rounded-full">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Incident résolu</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(selectedIncident.updated_at)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Sélectionnez un incident</h3>
                  <p className="text-muted-foreground">
                    Choisissez un incident dans la liste pour voir ses détails
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityIncidentManager;