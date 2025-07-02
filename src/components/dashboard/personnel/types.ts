import * as z from 'zod';

export const employeeSchema = z.object({
  noms: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenoms: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  fonction: z.string().min(1, "La fonction est requise"),
  adresse: z.string().optional(),
  telephone_appel: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
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
  employe: z.string().min(1, "L'employé est requis"),
  type: z.string().min(1, "Le type de congé est requis"),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().min(1, "La date de fin est requise"),
  motif: z.string().min(1, "Le motif est requis"),
  statut: z.string().default("En attente")
});

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export interface LeaveRequest {
  id: number;
  employe: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  motif: string;
}

export interface Training {
  id: number;
  nom: string;
  employes: string[];
  dateDebut: string;
  dateFin: string;
  statut: string;
  organisme: string;
}