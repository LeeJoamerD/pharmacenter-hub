import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar as CalendarIcon, Clock, GraduationCap, Search, Plus, Filter, FileText, Award, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeForm } from '../personnel/EmployeeForm';
import { EmployeeTable } from '../personnel/EmployeeTable';
import { employeeSchema, EmployeeFormData, Employee, LeaveRequest, Training } from '../personnel/types';

// Mock data
const employees: Employee[] = [
  {
    id: 1,
    nom: "Dupont",
    prenom: "Marie",
    poste: "Pharmacien titulaire",
    telephone: "01.23.45.67.89",
    email: "marie.dupont@pharma.com",
    statut: "Actif",
    dateEmbauche: "2020-03-15",
    certifications: ["DU Pharmacie clinique", "Formation gériatrie"]
  },
  {
    id: 2,
    nom: "Martin",
    prenom: "Pierre",
    poste: "Préparateur",
    telephone: "01.23.45.67.90",
    email: "pierre.martin@pharma.com",
    statut: "Actif",
    dateEmbauche: "2021-09-01",
    certifications: ["BP Préparateur", "Formation oncologie"]
  },
  {
    id: 3,
    nom: "Bernard",
    prenom: "Sophie",
    poste: "Pharmacien adjoint",
    telephone: "01.23.45.67.91",
    email: "sophie.bernard@pharma.com",
    statut: "Congé",
    dateEmbauche: "2019-01-10",
    certifications: ["Doctorat Pharmacie", "DU Pharmacie d'officine"]
  }
];

const leaveRequests: LeaveRequest[] = [
  {
    id: 1,
    employe: "Marie Dupont",
    type: "Congés payés",
    dateDebut: "2024-07-15",
    dateFin: "2024-07-29",
    statut: "Approuvé",
    motif: "Vacances d'été"
  },
  {
    id: 2,
    employe: "Pierre Martin",
    type: "Congé maladie",
    dateDebut: "2024-07-02",
    dateFin: "2024-07-05",
    statut: "En attente",
    motif: "Arrêt médical"
  }
];

const trainings: Training[] = [
  {
    id: 1,
    nom: "Formation Vaccinations",
    employes: ["Marie Dupont", "Sophie Bernard"],
    dateDebut: "2024-08-01",
    dateFin: "2024-08-02",
    statut: "Planifié",
    organisme: "Ordre des Pharmaciens"
  },
  {
    id: 2,
    nom: "Mise à jour réglementation",
    employes: ["Pierre Martin"],
    dateDebut: "2024-07-20",
    dateFin: "2024-07-20",
    statut: "Terminé",
    organisme: "Formation Continue Pharma"
  }
];

const PersonnelModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState('');
  const [posteFilter, setPosteFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);

  const newEmployeeForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      poste: '',
      telephone: '',
      email: '',
      statut: 'Actif',
      dateEmbauche: '',
      certifications: ''
    }
  });

  const editEmployeeForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema)
  });

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    editEmployeeForm.reset({
      nom: employee.nom,
      prenom: employee.prenom,
      poste: employee.poste,
      telephone: employee.telephone,
      email: employee.email,
      statut: employee.statut,
      dateEmbauche: employee.dateEmbauche,
      certifications: employee.certifications.join(', ')
    });
    setIsEditEmployeeOpen(true);
  };

  const handleDeleteEmployee = (id: number) => {
    console.log('Supprimer employé:', id);
  };

  const onNewEmployeeSubmit = (data: EmployeeFormData) => {
    console.log('Nouvel employé:', data);
    setIsNewEmployeeOpen(false);
    newEmployeeForm.reset();
  };

  const onEditEmployeeSubmit = (data: EmployeeFormData) => {
    console.log('Modification employé:', data);
    setIsEditEmployeeOpen(false);
    editEmployeeForm.reset();
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.poste.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || employee.statut === statusFilter;
    const matchesPoste = posteFilter === '' || employee.poste === posteFilter;
    
    return matchesSearch && matchesStatus && matchesPoste;
  });

  const clearFilters = () => {
    setStatusFilter('');
    setPosteFilter('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approuvé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'En attente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'Planifié':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'Terminé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion du Personnel</h2>
          <p className="text-muted-foreground">
            Gérez les employés, plannings, congés et formations
          </p>
        </div>
        <Dialog open={isNewEmployeeOpen} onOpenChange={setIsNewEmployeeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvel Employé</DialogTitle>
              <DialogDescription>
                Créer un nouveau profil employé avec toutes les informations nécessaires
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm 
              form={newEmployeeForm} 
              onSubmit={onNewEmployeeSubmit} 
              isEdit={false}
              onCancel={() => setIsNewEmployeeOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier Employé</DialogTitle>
            <DialogDescription>
              Modifier les informations de l'employé sélectionné
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm 
            form={editEmployeeForm} 
            onSubmit={onEditEmployeeSubmit} 
            isEdit={true}
            onCancel={() => setIsEditEmployeeOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">
            <Users className="mr-2 h-4 w-4" />
            Employés
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Plannings
          </TabsTrigger>
          <TabsTrigger value="leaves">
            <Clock className="mr-2 h-4 w-4" />
            Congés
          </TabsTrigger>
          <TabsTrigger value="training">
            <GraduationCap className="mr-2 h-4 w-4" />
            Formations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Employés</CardTitle>
              <CardDescription>
                Fiches complètes du personnel avec données RH
              </CardDescription>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtres
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filtres</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('Actif')}>
                      Employés actifs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('Congé')}>
                      En congé
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setPosteFilter('Pharmacien titulaire')}>
                      Pharmaciens titulaires
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPosteFilter('Pharmacien adjoint')}>
                      Pharmaciens adjoints
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPosteFilter('Préparateur')}>
                      Préparateurs
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Effacer les filtres
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeTable 
                employees={filteredEmployees}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
              />
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Calendrier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Planning du jour</CardTitle>
                <CardDescription>
                  {selectedDate ? selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Aucune date sélectionnée'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Marie Dupont</p>
                    <p className="text-sm text-muted-foreground">08:00 - 16:00</p>
                  </div>
                  <Badge variant="default">Matinée</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Pierre Martin</p>
                    <p className="text-sm text-muted-foreground">14:00 - 20:00</p>
                  </div>
                  <Badge variant="secondary">Après-midi</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Congés</CardTitle>
              <CardDescription>
                Gestion des congés et absences du personnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.employe}</TableCell>
                        <TableCell>{request.type}</TableCell>
                        <TableCell>{new Date(request.dateDebut).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{new Date(request.dateFin).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{getStatusBadge(request.statut)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formations et Certifications</CardTitle>
              <CardDescription>
                Suivi des formations obligatoires et certifications professionnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formation</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.map((training) => (
                      <TableRow key={training.id}>
                        <TableCell className="font-medium">{training.nom}</TableCell>
                        <TableCell>{training.employes.join(', ')}</TableCell>
                        <TableCell>{new Date(training.dateDebut).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{new Date(training.dateFin).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{getStatusBadge(training.statut)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonnelModule;
