import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, Filter, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeaveRequestForm } from './LeaveRequestForm';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { LeaveRequest, LeaveRequestFormData, leaveRequestSchema } from './types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useLanguage } from '@/contexts/LanguageContext';

export const LeaveManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const { t } = useLanguage();
  const { dateLocale } = useDateLocale();

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les demandes de congés
  const { data: leaves = [], isLoading: leavesLoading, refetch } = useTenantQueryWithCache(
    ['leaves'],
    'conges_employes'
  );

  // Récupérer les employés pour la sélection
  const { data: employees = [] } = useTenantQueryWithCache(
    ['employees'],
    'personnel',
    '*',
    {},
    { 
      orderBy: { column: 'noms', ascending: true }
    }
  );

  // Mutations
  const createMutation = useTenantMutation('conges_employes', 'insert', {
    onSuccess: () => {
      toast.success(t('leaveCreated'));
      setIsDialogOpen(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error(t('errorCreatingLeave'));
      console.error(error);
    }
  });

  const updateMutation = useTenantMutation('conges_employes', 'update', {
    onSuccess: () => {
      toast.success(t('leaveUpdated'));
      setIsDialogOpen(false);
      setEditingLeave(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error(t('errorUpdatingLeave'));
      console.error(error);
    }
  });

  const deleteMutation = useTenantMutation('conges_employes', 'delete', {
    onSuccess: () => {
      toast.success(t('leaveDeleted'));
      refetch();
    },
    onError: (error) => {
      toast.error(t('errorDeletingLeave'));
      console.error(error);
    }
  });

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employe_id: '',
      type_conge: '',
      date_debut: '',
      date_fin: '',
      motif: '',
      statut: 'En attente',
      commentaires: ''
    }
  });

  const handleSubmit = (data: LeaveRequestFormData) => {
    console.log('Form data avant traitement:', data);
    
    const leaveData = {
      employe_id: data.employe_id,
      type_conge: data.type_conge,
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      motif: data.motif,
      statut: data.statut || 'En attente',
      commentaires: data.commentaires || null
    };

    console.log('Leave data to send:', leaveData);

    if (editingLeave) {
      updateMutation.mutate({ 
        id: editingLeave.id, 
        ...leaveData 
      });
    } else {
      createMutation.mutate(leaveData);
    }
  };

  const handleEdit = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    form.reset({
      employe_id: leave.employe_id,
      type_conge: leave.type_conge,
      date_debut: leave.date_debut,
      date_fin: leave.date_fin,
      motif: leave.motif,
      statut: leave.statut as any,
      commentaires: leave.commentaires || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande de congé ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingLeave(null);
    form.reset();
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({
      id,
      statut: 'Approuvé',
      date_approbation: new Date().toISOString()
    });
  };

  const handleReject = (id: string) => {
    updateMutation.mutate({
      id,
      statut: 'Rejeté'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'En attente': 'outline',
      'Approuvé': 'default',
      'Rejeté': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getEmployeeName = (employeId: string) => {
    const employee = employees.find((e: any) => e.id === employeId);
    return employee ? `${employee.prenoms} ${employee.noms}` : t('noEmployeeFound');
  };

  if (leavesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">{t('loadingLeaves')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('leaveManagement')}</CardTitle>
            <CardDescription>
              {t('leaveManagementDesc')}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingLeave(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('newLeaveRequest')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLeave ? t('editLeaveRequest') : t('createLeaveRequest')}
                </DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <LeaveRequestForm
                form={form}
                onSubmit={handleSubmit}
                isEdit={!!editingLeave}
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
                <div className="text-2xl font-bold">{leaves.length}</div>
                <p className="text-sm text-muted-foreground">{t('totalRequests')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {leaves.filter((l: LeaveRequest) => l.statut === 'En attente').length}
                </div>
                <p className="text-sm text-muted-foreground">{t('pending')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {leaves.filter((l: LeaveRequest) => l.statut === 'Approuvé').length}
                </div>
                <p className="text-sm text-muted-foreground">{t('approved')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {leaves.filter((l: LeaveRequest) => l.statut === 'Rejeté').length}
                </div>
                <p className="text-sm text-muted-foreground">{t('rejected')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des demandes */}
          {leaves.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="text-muted-foreground">
                  {t('noLeaveRequest')}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employees')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('period')}</TableHead>
                    <TableHead>{t('duration')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('reason')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave: LeaveRequest) => {
                    const startDate = new Date(leave.date_debut);
                    const endDate = new Date(leave.date_fin);
                    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(leave.employe_id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{leave.type_conge}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(startDate, 'dd/MM/yyyy', { locale: dateLocale })}</div>
                            <div className="text-muted-foreground">
                              {t('to')} {format(endDate, 'dd/MM/yyyy', { locale: dateLocale })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {duration} {duration > 1 ? t('days') : t('day')}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(leave.statut)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={leave.motif}>
                          {leave.motif}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {leave.statut === 'En attente' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(leave.id)}
                                  className="text-green-600 hover:text-green-700 hover:border-green-300"
                                >
                                  {t('approve')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(leave.id)}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  {t('reject')}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(leave)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(leave.id)}
                              className="text-red-600 hover:text-red-800 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};