import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  employeeSchema, 
  EmployeeFormData, 
  leaveRequestSchema, 
  LeaveRequestFormData,
  trainingSchema,
  TrainingFormData,
  scheduleSchema,
  ScheduleFormData
} from '../types';

export const usePersonnelForms = () => {
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

  return {
    newEmployeeForm,
    editEmployeeForm,
    newLeaveRequestForm,
    editLeaveRequestForm,
    newTrainingForm,
    editTrainingForm,
    newScheduleForm,
    editScheduleForm
  };
};