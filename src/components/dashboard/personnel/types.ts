import * as z from 'zod';

// Schéma assoupli pour accepter les données incomplètes des anciens employés
export const employeeSchema = z.object({
  noms: z.string().min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .transform(val => val.toUpperCase()),
  prenoms: z.string().min(1, "Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  fonction: z.string().min(1, "La fonction est requise"),
  adresse: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  // Téléphone : optionnel pour les anciens employés, validation souple si fourni
  telephone_appel: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  telephone_whatsapp: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  email: z.string().min(1, "L'email est requis")
    .email("Email invalide"),
  // NIU/CNI : optionnel pour les anciens employés
  niu_cni: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  profession: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  // Dates : optionnelles pour les anciens employés
  date_naissance: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  date_recrutement: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  photo_identite: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  salaire_base: z.number()
    .min(0, "Le salaire doit être positif")
    .optional(),
  // Situation familiale : optionnelle pour les anciens employés
  situation_familiale: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  nombre_enfants: z.number()
    .min(0, "Le nombre d'enfants doit être positif")
    .default(0),
  numero_cnss: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  // Statut contractuel : optionnel pour les anciens employés
  statut_contractuel: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  // Infos Compte Client
  assureur_id: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === "" ? undefined : val),
  taux_remise_automatique: z.number()
    .min(0, "Le taux de remise doit être positif")
    .max(100, "Le taux de remise ne peut pas dépasser 100%")
    .default(0),
  limite_dette: z.number()
    .min(0, "La limite de dette doit être positive")
    .default(0),
  peut_prendre_bon: z.boolean().default(true)
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export interface Employee {
  id: string;
  tenant_id?: string;
  auth_user_id?: string;
  noms: string;
  prenoms: string;
  fonction: string;
  adresse?: string;
  telephone_appel?: string;
  telephone_whatsapp?: string;
  email: string;
  niu_cni?: string;
  profession?: string;
  date_naissance?: string;
  date_recrutement?: string;
  photo_identite?: string;
  salaire_base?: number;
  situation_familiale?: string;
  nombre_enfants: number;
  numero_cnss?: string;
  statut_contractuel?: string;
  role?: string;
  is_active?: boolean;
  reference_agent?: string;
  // Infos Compte Client
  assureur_id?: string;
  taux_remise_automatique?: number;
  limite_dette?: number;
  peut_prendre_bon?: boolean;
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
