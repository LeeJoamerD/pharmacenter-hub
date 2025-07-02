import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Users, Calendar as CalendarIcon, Clock, GraduationCap, Search, Plus, Filter, FileText, Award, CheckCircle, X, LayoutGrid, List, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeForm } from '../personnel/EmployeeForm';
import { EmployeeTable } from '../personnel/EmployeeTable';
import { EmployeeCard } from '../personnel/EmployeeCard';
import { LeaveRequestForm } from '../personnel/LeaveRequestForm';
import { TrainingForm } from '../personnel/TrainingForm';
import { ScheduleForm } from '../personnel/ScheduleForm';
import { employeeSchema, EmployeeFormData, Employee, LeaveRequest, Training, leaveRequestSchema, LeaveRequestFormData, trainingSchema, TrainingFormData, Schedule, scheduleSchema, ScheduleFormData } from '../personnel/types';

// Mock data
const employees: Employee[] = [
  {
    id: 1,
    noms: "Dupont",
    prenoms: "Marie",
    fonction: "Pharmacien titulaire",
    adresse: "123 Rue de la Pharmacie, Paris",
    telephone_appel: "01.23.45.67.89",
    telephone_whatsapp: "01.23.45.67.89",
    email: "marie.dupont@pharma.com",
    niu_cni: "1234567890123",
    profession: "Pharmacien",
    date_naissance: "1985-05-15",
    date_recrutement: "2020-03-15",
    photo_identite: "marie_dupont.jpg",
    salaire_base: 4500.00,
    situation_familiale: "Marié(e)",
    nombre_enfants: 2,
    numero_cnss: "123456789",
    statut_contractuel: "CDI"
  },
  {
    id: 2,
    noms: "Martin",
    prenoms: "Pierre",
    fonction: "Préparateur",
    adresse: "456 Avenue des Médicaments, Lyon",
    telephone_appel: "01.23.45.67.90",
    telephone_whatsapp: "01.23.45.67.90",
    email: "pierre.martin@pharma.com",
    niu_cni: "1234567890124",
    profession: "Préparateur en pharmacie",
    date_naissance: "1990-08-22",
    date_recrutement: "2021-09-01",
    salaire_base: 2800.00,
    situation_familiale: "Célibataire",
    nombre_enfants: 0,
    numero_cnss: "123456790",
    statut_contractuel: "CDI"
  },
  {
    id: 3,
    noms: "Bernard",
    prenoms: "Sophie",
    fonction: "Pharmacien adjoint",
    adresse: "789 Boulevard de la Santé, Marseille",
    telephone_appel: "01.23.45.67.91",
    telephone_whatsapp: "01.23.45.67.91",
    email: "sophie.bernard@pharma.com",
    niu_cni: "1234567890125",
    profession: "Pharmacien",
    date_naissance: "1988-12-10",
    date_recrutement: "2019-01-10",
    salaire_base: 3800.00,
    situation_familiale: "Divorcé(e)",
    nombre_enfants: 1,
    numero_cnss: "123456791",
    statut_contractuel: "CDD"
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
    organisme: "Ordre des Pharmaciens",
    description: "Formation sur les protocoles de vaccination en pharmacie",
    duree: 16,
    lieu: "Centre de formation, Paris",
    cout: 350.00,
    certificat_requis: true
  },
  {
    id: 2,
    nom: "Mise à jour réglementation",
    employes: ["Pierre Martin"],
    dateDebut: "2024-07-20",
    dateFin: "2024-07-20",
    statut: "Terminé",
    organisme: "Formation Continue Pharma",
    description: "Mise à jour sur les nouvelles réglementations pharmaceutiques",
    duree: 8,
    lieu: "En ligne",
    certificat_requis: false
  }
];

const schedules: Schedule[] = [
  {
    id: 1,
    employe: "Marie Dupont",
    date: "2024-07-02",
    heureDebut: "08:00",
    heureFin: "16:00",
    typeShift: "Journée complète",
    poste: "Comptoir principal",
    statut: "Confirmé",
    notes: "Responsable de l'ouverture"
  },
  {
    id: 2,
    employe: "Pierre Martin",
    date: "2024-07-02",
    heureDebut: "14:00",
    heureFin: "20:00",
    typeShift: "Après-midi",
    poste: "Préparation",
    statut: "Planifié"
  },
  {
    id: 3,
    employe: "Sophie Bernard",
    date: "2024-07-02",
    heureDebut: "09:00",
    heureFin: "17:00",
    typeShift: "Journée complète",
    poste: "Conseil/OTC",
    statut: "Confirmé"
  },
  {
    id: 4,
    employe: "Marie Dupont",
    date: "2024-07-03",
    heureDebut: "08:00",
    heureFin: "12:00",
    typeShift: "Matinée",
    poste: "Comptoir principal",
    statut: "Planifié"
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
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [isNewLeaveRequestOpen, setIsNewLeaveRequestOpen] = useState(false);
  const [isEditLeaveRequestOpen, setIsEditLeaveRequestOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isNewTrainingOpen, setIsNewTrainingOpen] = useState(false);
  const [isEditTrainingOpen, setIsEditTrainingOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'day' | 'week'>('day');

  const newEmployeeForm = useForm<EmployeeFormData>({
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

  const editEmployeeForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema)
  });

  const newLeaveRequestForm = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employe: '',
      type: '',
      dateDebut: '',
      dateFin: '',
      motif: '',
      statut: 'En attente'
    }
  });

  const editLeaveRequestForm = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema)
  });

  const newTrainingForm = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      nom: '',
      employes: [],
      dateDebut: '',
      dateFin: '',
      statut: 'Planifié',
      organisme: '',
      description: '',
      duree: 1,
      lieu: '',
      cout: undefined,
      certificat_requis: false
    }
  });

  const editTrainingForm = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema)
  });

  const newScheduleForm = useForm<ScheduleFormData>({
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

  const editScheduleForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema)
  });

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    editEmployeeForm.reset({
      noms: employee.noms,
      prenoms: employee.prenoms,
      fonction: employee.fonction,
      adresse: employee.adresse,
      telephone_appel: employee.telephone_appel,
      telephone_whatsapp: employee.telephone_whatsapp,
      email: employee.email,
      niu_cni: employee.niu_cni,
      profession: employee.profession,
      date_naissance: employee.date_naissance,
      date_recrutement: employee.date_recrutement,
      photo_identite: employee.photo_identite,
      salaire_base: employee.salaire_base,
      situation_familiale: employee.situation_familiale,
      nombre_enfants: employee.nombre_enfants,
      numero_cnss: employee.numero_cnss,
      statut_contractuel: employee.statut_contractuel
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

  const handleEditLeaveRequest = (leaveRequest: LeaveRequest) => {
    setSelectedLeaveRequest(leaveRequest);
    editLeaveRequestForm.reset({
      employe: leaveRequest.employe,
      type: leaveRequest.type,
      dateDebut: leaveRequest.dateDebut,
      dateFin: leaveRequest.dateFin,
      motif: leaveRequest.motif,
      statut: leaveRequest.statut
    });
    setIsEditLeaveRequestOpen(true);
  };

  const handleDeleteLeaveRequest = (id: number) => {
    console.log('Supprimer demande de congé:', id);
  };

  const onNewLeaveRequestSubmit = (data: LeaveRequestFormData) => {
    console.log('Nouvelle demande de congé:', data);
    setIsNewLeaveRequestOpen(false);
    newLeaveRequestForm.reset();
  };

  const onEditLeaveRequestSubmit = (data: LeaveRequestFormData) => {
    console.log('Modification demande de congé:', data);
    setIsEditLeaveRequestOpen(false);
    editLeaveRequestForm.reset();
  };

  const handleEditTraining = (training: Training) => {
    setSelectedTraining(training);
    editTrainingForm.reset({
      nom: training.nom,
      employes: training.employes,
      dateDebut: training.dateDebut,
      dateFin: training.dateFin,
      statut: training.statut as "Planifié" | "Terminé" | "En cours" | "Annulé",
      organisme: training.organisme,
      description: training.description,
      duree: training.duree,
      lieu: training.lieu,
      cout: training.cout,
      certificat_requis: training.certificat_requis
    });
    setIsEditTrainingOpen(true);
  };

  const handleDeleteTraining = (id: number) => {
    console.log('Supprimer formation:', id);
  };

  const onNewTrainingSubmit = (data: TrainingFormData) => {
    console.log('Nouvelle formation:', data);
    setIsNewTrainingOpen(false);
    newTrainingForm.reset();
  };

  const onEditTrainingSubmit = (data: TrainingFormData) => {
    console.log('Modification formation:', data);
    setIsEditTrainingOpen(false);
    editTrainingForm.reset();
  };

  const handleGenerateCertificate = (trainingId: number) => {
    console.log('Générer certificat pour formation:', trainingId);
  };

  const handleMarkTrainingComplete = (trainingId: number) => {
    console.log('Marquer formation comme terminée:', trainingId);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    editScheduleForm.reset({
      employe: schedule.employe,
      date: schedule.date,
      heureDebut: schedule.heureDebut,
      heureFin: schedule.heureFin,
      typeShift: schedule.typeShift as "Matinée" | "Après-midi" | "Soirée" | "Nuit" | "Journée complète",
      poste: schedule.poste,
      statut: schedule.statut as "Planifié" | "Confirmé" | "En cours" | "Terminé" | "Annulé",
      notes: schedule.notes
    });
    setIsEditScheduleOpen(true);
  };

  const handleDeleteSchedule = (id: number) => {
    console.log('Supprimer planning:', id);
  };

  const onNewScheduleSubmit = (data: ScheduleFormData) => {
    console.log('Nouveau planning:', data);
    setIsNewScheduleOpen(false);
    newScheduleForm.reset();
  };

  const onEditScheduleSubmit = (data: ScheduleFormData) => {
    console.log('Modification planning:', data);
    setIsEditScheduleOpen(false);
    editScheduleForm.reset();
  };

  const getSchedulesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateString);
  };

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmé</Badge>;
      case 'Planifié':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'En cours':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      case 'Terminé':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Terminé</Badge>;
      case 'Annulé':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.fonction.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || employee.statut_contractuel === statusFilter;
    const matchesPoste = posteFilter === '' || employee.fonction === posteFilter;
    
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

        <Dialog open={isNewLeaveRequestOpen} onOpenChange={setIsNewLeaveRequestOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvelle Demande de Congé</DialogTitle>
              <DialogDescription>
                Créer une nouvelle demande de congé pour un employé
              </DialogDescription>
            </DialogHeader>
            <LeaveRequestForm 
              form={newLeaveRequestForm} 
              onSubmit={onNewLeaveRequestSubmit} 
              isEdit={false}
              onCancel={() => setIsNewLeaveRequestOpen(false)}
              employees={employees}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditLeaveRequestOpen} onOpenChange={setIsEditLeaveRequestOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier Demande de Congé</DialogTitle>
              <DialogDescription>
                Modifier la demande de congé sélectionnée
              </DialogDescription>
            </DialogHeader>
            <LeaveRequestForm 
              form={editLeaveRequestForm} 
              onSubmit={onEditLeaveRequestSubmit} 
              isEdit={true}
              onCancel={() => setIsEditLeaveRequestOpen(false)}
              employees={employees}
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
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'card' | 'list')}>
                  <ToggleGroupItem value="card" aria-label="Vue carte">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="Vue liste">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                <EmployeeTable 
                  employees={filteredEmployees}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                />
              ) : (
                <EmployeeCard 
                  employees={filteredEmployees}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Gestion des Plannings
                  </CardTitle>
                  <CardDescription>
                    Planification des horaires et affectation du personnel
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <ToggleGroup type="single" value={scheduleViewMode} onValueChange={(value) => value && setScheduleViewMode(value as 'day' | 'week')}>
                    <ToggleGroupItem value="day" aria-label="Vue journalière">
                      Jour
                    </ToggleGroupItem>
                    <ToggleGroupItem value="week" aria-label="Vue hebdomadaire">
                      Semaine
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button 
                    onClick={() => setIsNewScheduleOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau planning
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Calendrier</CardTitle>
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
                
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Planning du {selectedDate ? selectedDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'jour sélectionné'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDate && getSchedulesForDate(selectedDate).length > 0 ? (
                        <div className="space-y-3">
                          {getSchedulesForDate(selectedDate).map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{schedule.employe}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {schedule.heureDebut} - {schedule.heureFin} • {schedule.poste}
                                    </p>
                                    {schedule.notes && (
                                      <p className="text-xs text-muted-foreground mt-1">{schedule.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getScheduleStatusBadge(schedule.statut)}
                                    <Badge variant="outline">{schedule.typeShift}</Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditSchedule(schedule)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="text-red-600 hover:text-red-800 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>Aucun planning pour cette date</p>
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => setIsNewScheduleOpen(true)}
                          >
                            Ajouter un planning
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Résumé hebdomadaire</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">Total heures planifiées</div>
                          <div className="text-2xl font-bold text-primary">132h</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">Employés actifs</div>
                          <div className="text-2xl font-bold text-primary">3</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">Créneaux à confirmer</div>
                          <div className="text-2xl font-bold text-yellow-600">2</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">Conflits détectés</div>
                          <div className="text-2xl font-bold text-red-600">0</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Demandes de Congés</CardTitle>
                  <CardDescription>
                    Gestion des congés et absences du personnel
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    console.log('Bouton Nouvelle demande cliqué');
                    setIsNewLeaveRequestOpen(true);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle demande
                </Button>
              </div>
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditLeaveRequest(request)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteLeaveRequest(request.id)}
                              className="text-red-600 hover:text-red-800 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {request.statut === 'En attente' && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-800">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Formations et Certifications</CardTitle>
                  <CardDescription>
                    Suivi des formations obligatoires et certifications professionnelles
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsNewTrainingOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle formation
                </Button>
              </div>
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
                           <div className="flex items-center space-x-2">
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => handleEditTraining(training)}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => handleDeleteTraining(training.id)}
                               className="text-red-600 hover:text-red-800 hover:border-red-300"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                             {training.certificat_requis && training.statut === 'Terminé' && (
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => handleGenerateCertificate(training.id)}
                                 className="text-blue-600 hover:text-blue-800"
                               >
                                 <Award className="h-4 w-4" />
                               </Button>
                             )}
                             {training.statut === 'En cours' && (
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => handleMarkTrainingComplete(training.id)}
                                 className="text-green-600 hover:text-green-800"
                               >
                                 <CheckCircle className="h-4 w-4" />
                               </Button>
                             )}
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
      </Tabs>

      <Dialog open={isNewTrainingOpen} onOpenChange={setIsNewTrainingOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Formation</DialogTitle>
            <DialogDescription>
              Créer une nouvelle formation avec tous les détails nécessaires
            </DialogDescription>
          </DialogHeader>
          <TrainingForm 
            form={newTrainingForm} 
            onSubmit={onNewTrainingSubmit} 
            isEdit={false}
            onCancel={() => setIsNewTrainingOpen(false)}
            employees={employees}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTrainingOpen} onOpenChange={setIsEditTrainingOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Modifier Formation</DialogTitle>
            <DialogDescription>
              Modifier les informations de la formation sélectionnée
            </DialogDescription>
          </DialogHeader>
          <TrainingForm 
            form={editTrainingForm} 
            onSubmit={onEditTrainingSubmit} 
            isEdit={true}
            onCancel={() => setIsEditTrainingOpen(false)}
            employees={employees}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau Planning</DialogTitle>
            <DialogDescription>
              Créer un nouveau créneau de planning pour un employé
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm 
            form={newScheduleForm} 
            onSubmit={onNewScheduleSubmit} 
            isEdit={false}
            onCancel={() => setIsNewScheduleOpen(false)}
            employees={employees}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier Planning</DialogTitle>
            <DialogDescription>
              Modifier le créneau de planning sélectionné
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm 
            form={editScheduleForm} 
            onSubmit={onEditScheduleSubmit} 
            isEdit={true}
            onCancel={() => setIsEditScheduleOpen(false)}
            employees={employees}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonnelModule;
