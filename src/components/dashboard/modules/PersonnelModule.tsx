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

// Mock data - restored to component
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
  }
];

const PersonnelModule = () => {
  console.log('PersonnelModule: Component mounting');
  
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

  // Forms
  const newEmployeeForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      noms: '', prenoms: '', fonction: '', adresse: '', telephone_appel: '',
      telephone_whatsapp: '', email: '', niu_cni: '', profession: '',
      date_naissance: '', date_recrutement: '', photo_identite: '',
      salaire_base: 0, situation_familiale: '', nombre_enfants: 0,
      numero_cnss: '', statut_contractuel: ''
    }
  });

  const editEmployeeForm = useForm<EmployeeFormData>({ resolver: zodResolver(employeeSchema) });
  const newLeaveRequestForm = useForm<LeaveRequestFormData>({ resolver: zodResolver(leaveRequestSchema) });
  const editLeaveRequestForm = useForm<LeaveRequestFormData>({ resolver: zodResolver(leaveRequestSchema) });
  const newTrainingForm = useForm<TrainingFormData>({ resolver: zodResolver(trainingSchema) });
  const editTrainingForm = useForm<TrainingFormData>({ resolver: zodResolver(trainingSchema) });
  const newScheduleForm = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema) });
  const editScheduleForm = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema) });

  // Handlers
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    editEmployeeForm.reset(employee);
    setIsEditEmployeeOpen(true);
  };

  const onNewEmployeeSubmit = (data: EmployeeFormData) => {
    console.log('Nouvel employé:', data);
    setIsNewEmployeeOpen(false);
    newEmployeeForm.reset();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approuvé': return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'En attente': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'Planifié': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'Terminé': return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion du Personnel</h2>
          <p className="text-muted-foreground">Gérez les employés, plannings, congés et formations</p>
        </div>
        <Dialog open={isNewEmployeeOpen} onOpenChange={setIsNewEmployeeOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nouvel employé</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvel Employé</DialogTitle>
              <DialogDescription>Créer un nouveau profil employé</DialogDescription>
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

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees"><Users className="mr-2 h-4 w-4" />Employés</TabsTrigger>
          <TabsTrigger value="schedule"><CalendarIcon className="mr-2 h-4 w-4" />Plannings</TabsTrigger>
          <TabsTrigger value="leaves"><Clock className="mr-2 h-4 w-4" />Congés</TabsTrigger>
          <TabsTrigger value="training"><GraduationCap className="mr-2 h-4 w-4" />Formations</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Employés</CardTitle>
              <CardDescription>Fiches complètes du personnel avec données RH</CardDescription>
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
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'card' | 'list')}>
                  <ToggleGroupItem value="card" aria-label="Vue carte"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="Vue liste"><List className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                <EmployeeTable 
                  employees={filteredEmployees}
                  onEdit={handleEditEmployee}
                  onDelete={(id) => console.log('Delete:', id)}
                />
              ) : (
                <EmployeeCard 
                  employees={filteredEmployees}
                  onEdit={handleEditEmployee}
                  onDelete={(id) => console.log('Delete:', id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Demandes de Congés</CardTitle>
                  <CardDescription>Gestion des congés et absences du personnel</CardDescription>
                </div>
                <Button 
                  onClick={() => setIsNewLeaveRequestOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />Nouvelle demande
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
                            <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
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
              <CardDescription>Suivi des formations obligatoires et certifications professionnelles</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Module formations en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Plannings</CardTitle>
              <CardDescription>Planification des horaires et affectation du personnel</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Module plannings en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Request Dialog */}
      <Dialog open={isNewLeaveRequestOpen} onOpenChange={setIsNewLeaveRequestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande de Congé</DialogTitle>
            <DialogDescription>Créer une nouvelle demande de congé pour un employé</DialogDescription>
          </DialogHeader>
          <LeaveRequestForm 
            form={newLeaveRequestForm} 
            onSubmit={(data) => {
              console.log('Nouvelle demande de congé:', data);
              setIsNewLeaveRequestOpen(false);
              newLeaveRequestForm.reset();
            }} 
            isEdit={false}
            onCancel={() => setIsNewLeaveRequestOpen(false)}
            employees={employees}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonnelModule;