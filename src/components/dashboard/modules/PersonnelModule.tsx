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

// Mock data for employees
const employees = [
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

// Mock data for leave requests
const leaveRequests = [
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

// Mock data for trainings
const trainings = [
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
      case 'Actif':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'Congé':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Congé</Badge>;
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel employé
        </Button>
      </div>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom & Prénom</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date d'embauche</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.prenom} {employee.nom}
                      </TableCell>
                      <TableCell>{employee.poste}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{employee.telephone}</div>
                          <div className="text-muted-foreground">{employee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.dateEmbauche).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(employee.statut)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Voir fiche
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Fiche Employé - {employee.prenom} {employee.nom}</DialogTitle>
                              <DialogDescription>
                                Informations détaillées de l'employé
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold">Informations personnelles</h4>
                                <div className="text-sm space-y-1">
                                  <p><span className="font-medium">Nom complet:</span> {employee.prenom} {employee.nom}</p>
                                  <p><span className="font-medium">Poste:</span> {employee.poste}</p>
                                  <p><span className="font-medium">Statut:</span> {getStatusBadge(employee.statut)}</p>
                                  <p><span className="font-medium">Date d'embauche:</span> {new Date(employee.dateEmbauche).toLocaleDateString('fr-FR')}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold">Contact</h4>
                                <div className="text-sm space-y-1">
                                  <p><span className="font-medium">Téléphone:</span> {employee.telephone}</p>
                                  <p><span className="font-medium">Email:</span> {employee.email}</p>
                                </div>
                              </div>
                              <div className="col-span-2 space-y-2">
                                <h4 className="font-semibold">Certifications & Formations</h4>
                                <div className="flex flex-wrap gap-2">
                                  {employee.certifications.map((cert, index) => (
                                    <Badge key={index} variant="secondary">{cert}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plannings & Horaires</CardTitle>
              <CardDescription>
                Gestion des emplois du temps et gardes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Planning du {selectedDate?.toLocaleDateString('fr-FR')}
                      </h3>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter créneau
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Marie Dupont</div>
                        <div className="text-sm text-muted-foreground">09:00 - 18:00 • Pharmacien titulaire</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Pierre Martin</div>
                        <div className="text-sm text-muted-foreground">09:00 - 17:00 • Préparateur</div>
                      </div>
                      <div className="p-3 border rounded-lg bg-orange-50">
                        <div className="font-medium">Sophie Bernard</div>
                        <div className="text-sm text-muted-foreground">Congé • Pharmacien adjoint</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Congés & Absences</CardTitle>
              <CardDescription>
                Suivi des demandes et planning des remplacements
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle demande
                </Button>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Type de congé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.employe}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>
                        {new Date(request.dateDebut).toLocaleDateString('fr-FR')} - {new Date(request.dateFin).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{request.motif}</TableCell>
                      <TableCell>
                        {getStatusBadge(request.statut)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formations & Compétences</CardTitle>
              <CardDescription>
                Historique et certifications obligatoires
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Planifier formation
                </Button>
                <Button variant="outline" size="sm">
                  <Award className="mr-2 h-4 w-4" />
                  Certifications
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formation</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Organisme</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.nom}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {training.employes.map((emp, index) => (
                            <div key={index}>{emp}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(training.dateDebut).toLocaleDateString('fr-FR')} - {new Date(training.dateFin).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{training.organisme}</TableCell>
                      <TableCell>
                        {getStatusBadge(training.statut)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonnelModule;