import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeCard } from './EmployeeCard';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Employee, EmployeeFormData, employeeSchema } from './types';
import { toast } from 'sonner';

export const EmployeeManagement = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les employés
  const { data: employees = [], isLoading, refetch } = useTenantQueryWithCache(
    ['employees'],
    'employes_rh'
  );

  // Mutations
  const createMutation = useTenantMutation('employes_rh', 'insert', {
    onSuccess: () => {
      toast.success('Employé créé avec succès');
      setIsDialogOpen(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'employé');
      console.error(error);
    }
  });

  const updateMutation = useTenantMutation('employes_rh', 'update', {
    onSuccess: () => {
      toast.success('Employé modifié avec succès');
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de l\'employé');
      console.error(error);
    }
  });

  const deleteMutation = useTenantMutation('employes_rh', 'delete', {
    onSuccess: () => {
      toast.success('Employé supprimé avec succès');
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de l\'employé');
      console.error(error);
    }
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      noms: '',
      prenoms: '',
      fonction: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      niu_cni: '',
      profession: '',
      date_naissance: '',
      date_recrutement: '',
      photo_identite: '',
      salaire_base: 0,
      situation_familiale: '',
      nombre_enfants: 0,
      numero_cnss: '',
      statut_contractuel: ''
    }
  });

  const handleSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateMutation.mutate({ 
        id: editingEmployee.id, 
        ...data 
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      noms: employee.noms,
      prenoms: employee.prenoms,
      fonction: employee.fonction,
      adresse: employee.adresse || '',
      telephone_appel: employee.telephone_appel,
      telephone_whatsapp: employee.telephone_whatsapp || '',
      email: employee.email,
      niu_cni: employee.niu_cni,
      profession: employee.profession || '',
      date_naissance: employee.date_naissance,
      date_recrutement: employee.date_recrutement,
      photo_identite: employee.photo_identite || '',
      salaire_base: employee.salaire_base || 0,
      situation_familiale: employee.situation_familiale,
      nombre_enfants: employee.nombre_enfants,
      numero_cnss: employee.numero_cnss || '',
      statut_contractuel: employee.statut_contractuel
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    form.reset();
  };

  const filteredEmployees = employees.filter((employee: Employee) =>
    employee.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.fonction.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des employés...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des Employés</CardTitle>
            <CardDescription>
              Gérez les informations personnelles et professionnelles de vos employés
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEmployee(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Employé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Modifier l\'employé' : 'Créer un nouvel employé'}
                </DialogTitle>
              </DialogHeader>
              <EmployeeForm
                form={form}
                onSubmit={handleSubmit}
                isEdit={!!editingEmployee}
                onCancel={handleCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un employé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{employees.length}</div>
                <p className="text-sm text-muted-foreground">Total employés</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {employees.filter((e: Employee) => e.statut_contractuel === 'CDI').length}
                </div>
                <p className="text-sm text-muted-foreground">CDI</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {employees.filter((e: Employee) => e.statut_contractuel === 'CDD').length}
                </div>
                <p className="text-sm text-muted-foreground">CDD</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des employés */}
          {filteredEmployees.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  {searchTerm ? 'Aucun employé trouvé pour cette recherche' : 'Aucun employé enregistré'}
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            <EmployeeTable
              employees={filteredEmployees}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <EmployeeCard
              employees={filteredEmployees}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};