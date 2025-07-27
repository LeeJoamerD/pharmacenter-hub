import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, GraduationCap, Calendar, Users, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrainingForm } from './TrainingForm';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Training, TrainingFormData, trainingSchema } from './types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TrainingManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les formations
  const { data: trainings = [], isLoading: trainingsLoading, refetch } = useTenantQueryWithCache(
    ['trainings'],
    'formations_employes'
  );

  // Récupérer les employés pour la sélection
  const { data: employees = [] } = useTenantQueryWithCache(
    ['employees'],
    'employes_rh'
  );

  // Mutations
  const createMutation = useTenantMutation('formations_employes', 'insert', {
    onSuccess: () => {
      toast.success('Formation créée avec succès');
      setIsDialogOpen(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la formation');
      console.error(error);
    }
  });

  const updateMutation = useTenantMutation('formations_employes', 'update', {
    onSuccess: () => {
      toast.success('Formation modifiée avec succès');
      setIsDialogOpen(false);
      setEditingTraining(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de la formation');
      console.error(error);
    }
  });

  const deleteMutation = useTenantMutation('formations_employes', 'delete', {
    onSuccess: () => {
      toast.success('Formation supprimée avec succès');
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la formation');
      console.error(error);
    }
  });

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      nom: '',
      organisme: '',
      description: '',
      date_debut: '',
      date_fin: '',
      duree: 1,
      lieu: '',
      cout: 0,
      certificat_requis: false,
      statut: 'Planifié',
      employes: []
    }
  });

  const handleSubmit = (data: TrainingFormData) => {
    console.log('Form data avant traitement:', data);
    
    const trainingData = {
      nom: data.nom,
      organisme: data.organisme,
      description: data.description || null,
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      duree: data.duree,
      lieu: data.lieu,
      cout: data.cout || null,
      certificat_requis: data.certificat_requis,
      statut: data.statut
    };

    console.log('Training data to send:', trainingData);

    if (editingTraining) {
      updateMutation.mutate({ 
        id: editingTraining.id, 
        ...trainingData 
      });
    } else {
      createMutation.mutate(trainingData);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    form.reset({
      nom: training.nom,
      organisme: training.organisme,
      description: training.description || '',
      date_debut: training.date_debut,
      date_fin: training.date_fin,
      duree: training.duree,
      lieu: training.lieu,
      cout: training.cout || 0,
      certificat_requis: training.certificat_requis,
      statut: training.statut as any,
      employes: []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingTraining(null);
    form.reset();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Planifié': 'outline',
      'En cours': 'default',
      'Terminé': 'secondary',
      'Annulé': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (trainingsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des formations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des Formations</CardTitle>
            <CardDescription>
              Organisez et suivez les formations de vos employés
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTraining(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Formation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTraining ? 'Modifier la formation' : 'Créer une nouvelle formation'}
                </DialogTitle>
              </DialogHeader>
              <TrainingForm
                form={form}
                onSubmit={handleSubmit}
                isEdit={!!editingTraining}
                onCancel={handleCancel}
                employees={employees}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{trainings.length}</div>
                <p className="text-sm text-muted-foreground">Total formations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {trainings.filter((t: Training) => t.statut === 'Planifié').length}
                </div>
                <p className="text-sm text-muted-foreground">Planifiées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {trainings.filter((t: Training) => t.statut === 'En cours').length}
                </div>
                <p className="text-sm text-muted-foreground">En cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {trainings.filter((t: Training) => t.statut === 'Terminé').length}
                </div>
                <p className="text-sm text-muted-foreground">Terminées</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des formations */}
          {trainings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="text-muted-foreground">
                  Aucune formation programmée
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formation</TableHead>
                    <TableHead>Organisme</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training: Training) => (
                    <TableRow key={training.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{training.nom}</div>
                          <div className="text-sm text-muted-foreground">{training.lieu}</div>
                        </div>
                      </TableCell>
                      <TableCell>{training.organisme}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{training.date_debut ? format(new Date(training.date_debut), 'dd/MM/yyyy', { locale: fr }) : '-'}</div>
                          <div className="text-muted-foreground">
                            au {training.date_fin ? format(new Date(training.date_fin), 'dd/MM/yyyy', { locale: fr }) : '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {training.duree}h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          0
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(training.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(training)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(training.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            // <Trash2 className="text-red-600 hover:text-red-800 hover:border-red-300" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};