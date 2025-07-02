import * as z from 'zod';

export const employeeSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  poste: z.string().min(1, "Le poste est requis"),
  telephone: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
  email: z.string().email("Email invalide"),
  statut: z.string().min(1, "Le statut est requis"),
  dateEmbauche: z.string().min(1, "La date d'embauche est requise"),
  certifications: z.string().optional()
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export interface Employee {
  id: number;
  nom: string;
  prenom: string;
  poste: string;
  telephone: string;
  email: string;
  statut: string;
  dateEmbauche: string;
  certifications: string[];
}

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