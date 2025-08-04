import * as z from 'zod';

export const employeeSchema = z.object({
  noms: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  fonction: z.string().min(1, "La fonction est requise"),
  adresse: z.string().optional(),
  telephone_appel: z.string()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères")
    .regex(/^[\d+\-\s()\.]+$/, "Format de téléphone invalide"),
  telephone_whatsapp: z.string().optional(),
  email: z.string().email("Email invalide"),
  niu_cni: z.string().min(1, "Le NIU/CNI est requis"),
  profession: z.string().optional(),
  date_naissance: z.string().min(1, "La date de naissance est requise"),
  date_recrutement: z.string().min(1, "La date de recrutement est requise"),
  photo_identite: z.string().optional(),
  salaire_base: z.number().min(0, "Le salaire doit être positif").optional(),
  situation_familiale: z.string().min(1, "La situation familiale est requise"),
  nombre_enfants: z.number().min(0, "Le nombre d'enfants doit être positif").default(0),
  numero_cnss: z.string().optional(),
  statut_contractuel: z.string().min(1, "Le statut contractuel est requis")
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export interface Employee {
  id: number;
  noms: string;
  prenoms: string;
  fonction: string;
  adresse?: string;
  telephone_appel: string;
  telephone_whatsapp?: string;
  email: string;
  niu_cni: string;
  profession?: string;
  date_naissance: string;
  date_recrutement: string;
  photo_identite?: string;
  salaire_base?: number;
  situation_familiale: string;
  nombre_enfants: number;
  numero_cnss?: string;
  statut_contractuel: string;
}

export const leaveRequestSchema = z.object({
  employe_id: z.string().min(1, "L'employé est requis"),
  type_conge: z.string().min(1, "Le type de congé est requis"),
  date_debut: z.string().min(1, "La date de début est requise"),
  date_fin: z.string().min(1, "La date de fin est requise"),
  motif: z.string().min(1, "Le motif est requis"),
  statut: z.enum(['En attente', 'Approuvé', 'Rejeté']).optional(),
  commentaires: z.string().optional()
});

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export interface LeaveRequest {
  id: string;
  tenant_id: string;
  employe_id: string;
  type_conge: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  statut: string;
  approuve_par?: string;
  date_approbation?: string;
  commentaires?: string;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: string;
  tenant_id: string;
  nom: string;
  organisme: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  duree: number;
  lieu: string;
  cout?: number;
  certificat_requis: boolean;
  statut: string;
  created_at: string;
  updated_at: string;
}

export const trainingSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  organisme: z.string().min(2, "L'organisme doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  date_debut: z.string().min(1, "La date de début est requise"),
  date_fin: z.string().min(1, "La date de fin est requise"),
  duree: z.number().min(1, "La durée doit être d'au moins 1 heure"),
  lieu: z.string().min(2, "Le lieu doit contenir au moins 2 caractères"),
  cout: z.number().optional(),
  certificat_requis: z.boolean(),
  statut: z.enum(["Planifié", "En cours", "Terminé", "Annulé"]),
  employes: z.array(z.string()).optional()
});

export type TrainingFormData = z.infer<typeof trainingSchema>;

export interface Schedule {
  id: number;
  employe_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_shift: string;
  poste: string;
  statut: string;
  notes?: string;
}

export const scheduleSchema = z.object({
  employe: z.string().min(1, "L'employé est requis"),
  date: z.string().min(1, "La date est requise"),
  heureDebut: z.string().min(1, "L'heure de début est requise"),
  heureFin: z.string().min(1, "L'heure de fin est requise"),
  typeShift: z.enum(["Matinée", "Après-midi", "Soirée", "Nuit", "Journée complète"]),
  poste: z.string().min(1, "Le poste est requis"),
  statut: z.enum(["Planifié", "Confirmé", "En cours", "Terminé", "Annulé"]),
  notes: z.string().optional()
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;