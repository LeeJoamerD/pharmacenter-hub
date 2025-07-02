import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Calendar as CalendarIcon, Clock, GraduationCap, Plus } from 'lucide-react';
import { EmployeesTab } from '../personnel/components/EmployeesTab';
import { ScheduleTab } from '../personnel/components/ScheduleTab';
import { LeavesTab } from '../personnel/components/LeavesTab';
import { TrainingTab } from '../personnel/components/TrainingTab';
import { EmployeeForm } from '../personnel/EmployeeForm';
import { LeaveRequestForm } from '../personnel/LeaveRequestForm';
import { TrainingForm } from '../personnel/TrainingForm';
import { ScheduleForm } from '../personnel/ScheduleForm';
import { usePersonnelForms } from '../personnel/hooks/usePersonnelForms';
import { employees, leaveRequests, trainings, schedules } from '../personnel/data/mockData';
import { Employee, LeaveRequest, Training, Schedule, EmployeeFormData, LeaveRequestFormData, TrainingFormData, ScheduleFormData } from '../personnel/types';

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

  const {
    newEmployeeForm,
    editEmployeeForm,
    newLeaveRequestForm,
    editLeaveRequestForm,
    newTrainingForm,
    editTrainingForm,
    newScheduleForm,
    editScheduleForm
  } = usePersonnelForms();

  // Employee handlers
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

  // Leave request handlers
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

  // Training handlers
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

  // Schedule handlers
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

      {/* All dialog components */}
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
          <EmployeesTab
            employees={employees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            posteFilter={posteFilter}
            setPosteFilter={setPosteFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleTab
            schedules={schedules}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            scheduleViewMode={scheduleViewMode}
            setScheduleViewMode={setScheduleViewMode}
            onNewSchedule={() => setIsNewScheduleOpen(true)}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <LeavesTab
            leaveRequests={leaveRequests}
            onNewLeaveRequest={() => setIsNewLeaveRequestOpen(true)}
            onEditLeaveRequest={handleEditLeaveRequest}
            onDeleteLeaveRequest={handleDeleteLeaveRequest}
          />
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <TrainingTab
            trainings={trainings}
            onNewTraining={() => setIsNewTrainingOpen(true)}
            onEditTraining={handleEditTraining}
            onDeleteTraining={handleDeleteTraining}
            onGenerateCertificate={handleGenerateCertificate}
            onMarkTrainingComplete={handleMarkTrainingComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonnelModule;