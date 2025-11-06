import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export interface Prescription {
  id: string;
  numero_prescription: string;
  client_id?: string;
  medecin_nom?: string;
  medecin_specialite?: string;
  medecin_telephone?: string;
  date_prescription: string;
  date_expiration?: string;
  type_prescription: 'Ordinaire' | 'Renouvelable' | 'Urgence';
  diagnostic?: string;
  instructions?: string;
  fichier_url?: string;
  est_validee: boolean;
  validateur_id?: string;
  date_validation?: string;
  vente_id?: string;
  statut: 'En attente' | 'Validée' | 'Partiellement servie' | 'Servie' | 'Expirée' | 'Rejetée';
  notes?: string;
  lignes?: PrescriptionLine[];
}

export interface PrescriptionLine {
  id: string;
  produit_id?: string;
  nom_medicament: string;
  dosage?: string;
  posologie?: string;
  duree_traitement?: string;
  quantite_prescrite: number;
  quantite_servie: number;
  notes?: string;
}

export interface CreatePrescriptionData {
  client_id?: string;
  medecin_nom: string;
  medecin_specialite?: string;
  medecin_telephone?: string;
  date_prescription: string;
  type_prescription: 'Ordinaire' | 'Renouvelable' | 'Urgence';
  diagnostic?: string;
  instructions?: string;
  notes?: string;
  lignes: Omit<PrescriptionLine, 'id' | 'quantite_servie'>[];
}

/**
 * Hook pour gérer les ordonnances/prescriptions
 * Fonctionnalités: création, upload scan, validation pharmacien, service
 */
export const usePrescriptions = () => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer toutes les prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['prescriptions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          client:client_id(nom_complet, telephone),
          validateur:validateur_id(noms, prenoms),
          lignes_prescriptions(*)
        `)
        .eq('tenant_id', tenantId)
        .order('date_prescription', { ascending: false });

      if (error) throw error;
      return data as Prescription[];
    },
    enabled: !!tenantId,
  });

  // Récupérer une prescription par ID
  const getPrescriptionById = async (id: string): Promise<Prescription | null> => {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        client:client_id(nom_complet, telephone, date_naissance),
        validateur:validateur_id(noms, prenoms),
        lignes_prescriptions(
          *,
          produit:produit_id(libelle_produit, code_cip)
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }
    return data as Prescription;
  };

  // Créer une prescription
  const createPrescriptionMutation = useMutation({
    mutationFn: async (prescriptionData: CreatePrescriptionData) => {
      // Générer numéro prescription
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const count = (prescriptions?.length || 0) + 1;
      const numero = `ORD-${dateStr}-${String(count).padStart(4, '0')}`;

      // Calculer date d'expiration (3 mois par défaut)
      const dateExpiration = new Date(prescriptionData.date_prescription);
      dateExpiration.setMonth(dateExpiration.getMonth() + 3);

      // Créer la prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          tenant_id: tenantId,
          numero_prescription: numero,
          client_id: prescriptionData.client_id,
          medecin_nom: prescriptionData.medecin_nom,
          medecin_specialite: prescriptionData.medecin_specialite,
          medecin_telephone: prescriptionData.medecin_telephone,
          date_prescription: prescriptionData.date_prescription,
          date_expiration: dateExpiration.toISOString().split('T')[0],
          type_prescription: prescriptionData.type_prescription,
          diagnostic: prescriptionData.diagnostic,
          instructions: prescriptionData.instructions,
          notes: prescriptionData.notes,
          statut: 'En attente',
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Créer les lignes
      const lignes = prescriptionData.lignes.map(ligne => ({
        tenant_id: tenantId,
        prescription_id: prescription.id,
        ...ligne,
        quantite_servie: 0,
      }));

      const { error: lignesError } = await supabase
        .from('lignes_prescriptions')
        .insert(lignes);

      if (lignesError) throw lignesError;

      return prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', tenantId] });
      toast({
        title: 'Prescription créée',
        description: 'L\'ordonnance a été enregistrée avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de créer la prescription: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Upload scan d'ordonnance
  const uploadPrescriptionScan = async (prescriptionId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prescriptionId}_${Date.now()}.${fileExt}`;
    const filePath = `prescriptions/${tenantId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Récupérer URL publique
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Mettre à jour la prescription
    await supabase
      .from('prescriptions')
      .update({ fichier_url: data.publicUrl })
      .eq('id', prescriptionId)
      .eq('tenant_id', tenantId);

    return data.publicUrl;
  };

  // Valider une prescription (pharmacien)
  const validatePrescriptionMutation = useMutation({
    mutationFn: async ({ 
      id, 
      pharmacistId,
      approved,
    }: { 
      id: string; 
      pharmacistId: string;
      approved: boolean;
    }) => {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          est_validee: approved,
          validateur_id: pharmacistId,
          date_validation: new Date().toISOString(),
          statut: approved ? 'Validée' : 'Rejetée',
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', tenantId] });
      toast({
        title: 'Prescription validée',
        description: 'L\'ordonnance a été traitée par le pharmacien',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de valider la prescription: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Marquer comme servie (liée à une vente)
  const servePrescriptionMutation = useMutation({
    mutationFn: async ({ 
      prescriptionId, 
      venteId,
      quantitiesServed,
    }: { 
      prescriptionId: string; 
      venteId: string;
      quantitiesServed: Record<string, number>;
    }) => {
      // Mettre à jour la prescription
      const { error: updateError } = await supabase
        .from('prescriptions')
        .update({
          vente_id: venteId,
          statut: 'Servie',
        })
        .eq('id', prescriptionId)
        .eq('tenant_id', tenantId);

      if (updateError) throw updateError;

      // Mettre à jour les quantités servies des lignes
      for (const [ligneId, quantite] of Object.entries(quantitiesServed)) {
        await supabase
          .from('lignes_prescriptions')
          .update({ quantite_servie: quantite })
          .eq('id', ligneId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', tenantId] });
      toast({
        title: 'Prescription servie',
        description: 'L\'ordonnance a été associée à la vente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de servir la prescription: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Vérifier les prescriptions expirées
  const checkExpirations = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('prescriptions')
      .update({ statut: 'Expirée' })
      .eq('tenant_id', tenantId)
      .lt('date_expiration', today)
      .in('statut', ['En attente', 'Validée', 'Partiellement servie']);

    if (error) {
      console.error('Error checking expirations:', error);
    }
  };

  // Rechercher prescriptions
  const searchPrescriptions = async (filters: {
    clientName?: string;
    medecinName?: string;
    statut?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        client:client_id(nom_complet, telephone)
      `)
      .eq('tenant_id', tenantId);

    if (filters.statut) {
      query = query.eq('statut', filters.statut);
    }
    if (filters.dateFrom) {
      query = query.gte('date_prescription', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('date_prescription', filters.dateTo);
    }
    if (filters.medecinName) {
      query = query.ilike('medecin_nom', `%${filters.medecinName}%`);
    }

    const { data, error } = await query.order('date_prescription', { ascending: false });

    if (error) throw error;
    return data as Prescription[];
  };

  return {
    prescriptions,
    prescriptionsLoading,
    getPrescriptionById,
    createPrescription: createPrescriptionMutation.mutateAsync,
    uploadPrescriptionScan,
    validatePrescription: validatePrescriptionMutation.mutateAsync,
    servePrescription: servePrescriptionMutation.mutateAsync,
    checkExpirations,
    searchPrescriptions,
  };
};
