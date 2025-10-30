import { Database } from '@/integrations/supabase/types';
import { z } from 'zod';

export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export const clientFormSchema = z.object({
  nom_complet: z.string().min(1, "Le nom complet est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  adresse: z.string().optional(),
  type_client: z.enum(['Ordinaire', 'Assuré', 'Conventionné', 'Entreprise', 'Personnel']).optional(),
  taux_remise_automatique: z.number().min(0).max(100).default(0),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;