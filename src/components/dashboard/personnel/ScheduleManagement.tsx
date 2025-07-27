import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, Filter, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScheduleForm } from './ScheduleForm';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Schedule, ScheduleFormData, scheduleSchema } from './types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ScheduleManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les plannings
  const { data: schedules = [], isLoading: schedulesLoading, refetch } = useTenantQueryWithCache(
    ['schedules'],
    'planning_employes'
  );

  // Récupérer les employés pour la sélection
  const { data: employees = [] } = useTenantQueryWithCache(
    ['employees'],
    'employes_rh'
  );

  // Mutations
  const createMutation = useTenantMutation('planning_employes', 'insert', {
    onSuccess: () => {
      toast.success('Horaire créé avec succès');
      setIsDialogOpen(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'horaire');
      console.error(error);
    }
  });

  const updateMutation = useTenantMutation('planning_employes', 'update', {
    onSuccess: () => {
      toast.success('Horaire modifié avec succès');
      setIsDialogOpen(false);
      setEditingSchedule(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de l\'horaire');
      console.error(error);
    }
  });

  const deleteMutation = useTenantMutation('planning_employes', 'delete', {
    onSuccess: () => {
      toast.success('Horaire supprimé avec succès');
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de l\'horaire');
      console.error(error);
    }
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      employe: '',
      date: '',
      heureDebut: '',
      heureFin: '',
      typeShift: 'Matinée',
      poste: '',
      statut: 'Planifié',
      notes: ''
    }
  });

  const handleSubmit = (data: ScheduleFormData) => {
    console.log('Form data received:', data);
    const scheduleData = {
      employe_id: data.employe,
      date: data.date,
      heure_debut: data.heureDebut,
      heure_fin: data.heureFin,
      type_shift: data.typeShift,
      poste: data.poste,
      statut: data.statut,
      notes: data.notes
    };
    console.log('Schedule data prepared:', scheduleData);

    if (editingSchedule) {
      updateMutation.mutate({ 
        id: editingSchedule.id, 
        ...scheduleData 
      });
    } else {
      createMutation.mutate(scheduleData);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    form.reset({
      employe: schedule.employe_id,
      date: schedule.date,
      heureDebut: schedule.heure_debut,
      heureFin: schedule.heure_fin,
      typeShift: schedule.type_shift as any,
      poste: schedule.poste,
      statut: schedule.statut as any,
      notes: schedule.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet horaire ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingSchedule(null);
    form.reset();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Planifié': 'outline',
      'Confirmé': 'secondary',
      'En cours': 'default',
      'Terminé': 'default',
      'Annulé': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getEmployeeName = (employeId: string) => {
    const employee = employees.find((e: any) => e.id.toString() === employeId);
    return employee ? `${employee.prenoms} ${employee.noms}` : 'Employé inconnu';
  };

  if (schedulesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des horaires...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des Horaires</CardTitle>
            <CardDescription>
              Planifiez et gérez les horaires de travail de vos employés
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSchedule(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Horaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Modifier l\'horaire' : 'Créer un nouvel horaire'}
                </DialogTitle>
              </DialogHeader>
              <ScheduleForm
                form={form}
                onSubmit={handleSubmit}
                isEdit={!!editingSchedule}
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
                <div className="text-2xl font-bold">{schedules.length}</div>
                <p className="text-sm text-muted-foreground">Total horaires</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {schedules.filter((s: Schedule) => s.statut === 'Planifié').length}
                </div>
                <p className="text-sm text-muted-foreground">Planifiés</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {schedules.filter((s: Schedule) => s.statut === 'En cours').length}
                </div>
                <p className="text-sm text-muted-foreground">En cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {schedules.filter((s: Schedule) => s.statut === 'Terminé').length}
                </div>
                <p className="text-sm text-muted-foreground">Terminés</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des horaires */}
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="text-muted-foreground">
                  Aucun horaire planifié
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Horaires</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule: Schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(schedule.employe_id)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(schedule.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {schedule.heure_debut} - {schedule.heure_fin}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.type_shift}</Badge>
                      </TableCell>
                      <TableCell>{schedule.poste}</TableCell>
                      <TableCell>{getStatusBadge(schedule.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-600 hover:text-red-800 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
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