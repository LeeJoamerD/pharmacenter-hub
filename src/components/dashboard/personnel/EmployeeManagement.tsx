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
import { EmployeeFilters } from './EmployeeFilters';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Employee, EmployeeFormData, employeeSchema } from './types';
import { toast } from 'sonner';

export const EmployeeManagement = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fonction: '',
    statut_contractuel: '',
    situation_familiale: '',
    salaire_min: '',
    salaire_max: ''
  });

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer tous les employés depuis la table personnel
  const { data: employees = [], isLoading, refetch } = useTenantQueryWithCache(
    ['employees'],
    'personnel',
    '*',
    {},
    { 
      orderBy: { column: 'noms', ascending: true }
    }
  );

  console.log('Employees data:', employees);
  console.log('Is loading:', isLoading);

  // Mutations
  const createMutation = useTenantMutation('personnel', 'insert', {
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

  const updateMutation = useTenantMutation('personnel', 'update', {
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

  const deleteMutation = useTenantMutation('personnel', 'delete', {
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
      statut_contractuel: '',
      // Infos Compte Client
      assureur_id: '',
      taux_remise_automatique: 0,
      limite_dette: 0,
      peut_prendre_bon: true,
      taux_agent: 0,
      taux_ayant_droit: 0,
      taux_ticket_moderateur: 0,
      caution: 0
    }
  });

  const handleSubmit = (data: EmployeeFormData) => {
    try {
      // Normaliser les données avant soumission
      const normalizedData = {
        ...data,
        // Convertir les strings vides en null pour les champs optionnels
        adresse: data.adresse || null,
        telephone_whatsapp: data.telephone_whatsapp || null,
        profession: data.profession || null,
        photo_identite: data.photo_identite || null,
        numero_cnss: data.numero_cnss || null,
        salaire_base: data.salaire_base || null,
        // Infos Compte Client
        assureur_id: data.assureur_id || null,
        taux_remise_automatique: data.taux_remise_automatique || 0,
        limite_dette: data.limite_dette || 0,
        peut_prendre_bon: data.peut_prendre_bon !== false,
        taux_agent: data.taux_agent || 0,
        taux_ayant_droit: data.taux_ayant_droit || 0,
        taux_ticket_moderateur: data.taux_ticket_moderateur || 0,
        caution: data.caution || 0
      };

      if (editingEmployee) {
        updateMutation.mutate({ 
          id: editingEmployee.id, 
          ...normalizedData,
          role: 'Vendeur', // Rôle par défaut pour les employés (rôle unifié)
          is_active: true
        });
      } else {
        createMutation.mutate({
          ...normalizedData,
          role: 'Vendeur', // Rôle par défaut pour les employés (rôle unifié)
          is_active: true,
          // Générer reference_agent automatiquement
          reference_agent: `${data.prenoms.split(' ')[0]}_${data.noms.split(' ')[0].substring(0, 4).toUpperCase()}`
        });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error('Erreur lors de la validation du formulaire. Veuillez vérifier tous les champs.');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      noms: employee.noms || '',
      prenoms: employee.prenoms || '',
      fonction: employee.fonction || '',
      adresse: employee.adresse || '',
      telephone_appel: employee.telephone_appel || '',
      telephone_whatsapp: employee.telephone_whatsapp || '',
      email: employee.email || '',
      niu_cni: employee.niu_cni || '',
      profession: employee.profession || '',
      date_naissance: employee.date_naissance || '',
      date_recrutement: employee.date_recrutement || '',
      photo_identite: employee.photo_identite || '',
      salaire_base: employee.salaire_base || 0,
      situation_familiale: employee.situation_familiale || '',
      nombre_enfants: employee.nombre_enfants || 0,
      numero_cnss: employee.numero_cnss || '',
      statut_contractuel: employee.statut_contractuel || '',
      // Infos Compte Client
      assureur_id: employee.assureur_id || '',
      taux_remise_automatique: employee.taux_remise_automatique || 0,
      limite_dette: employee.limite_dette || 0,
      peut_prendre_bon: employee.peut_prendre_bon !== false,
      taux_agent: employee.taux_agent || 0,
      taux_ayant_droit: employee.taux_ayant_droit || 0,
      taux_ticket_moderateur: employee.taux_ticket_moderateur || 0,
      caution: employee.caution || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    form.reset({
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
      statut_contractuel: '',
      // Infos Compte Client
      assureur_id: '',
      taux_remise_automatique: 0,
      limite_dette: 0,
      peut_prendre_bon: true,
      taux_agent: 0,
      taux_ayant_droit: 0,
      taux_ticket_moderateur: 0,
      caution: 0
    });
  };

  const filteredEmployees = employees.filter((employee: Employee) => {
    // Recherche par texte avec vérification de null/undefined
    const matchesSearch = searchTerm === '' || 
      (employee.noms && employee.noms.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.prenoms && employee.prenoms.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.fonction && employee.fonction.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtres avec vérification de null/undefined
    const matchesFonction = filters.fonction === '' || (employee.fonction && employee.fonction === filters.fonction);
    const matchesStatut = filters.statut_contractuel === '' || (employee.statut_contractuel && employee.statut_contractuel === filters.statut_contractuel);
    const matchesSituation = filters.situation_familiale === '' || (employee.situation_familiale && employee.situation_familiale === filters.situation_familiale);
    
    const salaire = employee.salaire_base || 0;
    const matchesSalaireMin = filters.salaire_min === '' || salaire >= parseFloat(filters.salaire_min);
    const matchesSalaireMax = filters.salaire_max === '' || salaire <= parseFloat(filters.salaire_max);

    return matchesSearch && matchesFonction && matchesStatut && matchesSituation && matchesSalaireMin && matchesSalaireMax;
  });

  const clearFilters = () => {
    setFilters({
      fonction: '',
      statut_contractuel: '',
      situation_familiale: '',
      salaire_min: '',
      salaire_max: ''
    });
  };

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
                 form.reset({
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
                   statut_contractuel: '',
                   // Infos Compte Client
                   assureur_id: '',
                   taux_remise_automatique: 0,
                   limite_dette: 0,
                   peut_prendre_bon: true,
                   taux_agent: 0,
                   taux_ayant_droit: 0,
                   taux_ticket_moderateur: 0,
                   caution: 0
                 });
               }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Employé
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-4xl max-h-[90vh] overflow-y-auto"
              aria-describedby="employee-form-description"
            >
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Modifier l\'employé' : 'Créer un nouvel employé'}
                </DialogTitle>
                <div id="employee-form-description" className="sr-only">
                  Formulaire pour {editingEmployee ? 'modifier les informations d\'un' : 'créer un nouvel'} employé.
                  Tous les champs marqués d'un astérisque sont obligatoires.
                </div>
              </DialogHeader>
              <EmployeeForm
                form={form}
                onSubmit={handleSubmit}
                isEdit={!!editingEmployee}
                onCancel={handleCancel}
                isLoading={createMutation?.isPending || updateMutation?.isPending}
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
              <EmployeeFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
              />
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