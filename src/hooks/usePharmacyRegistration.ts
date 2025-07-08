import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';

export const usePharmacyRegistration = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PharmacyRegistrationData>({
    defaultValues: {
      pays: 'Cameroun',
      type: 'standard'
    }
  });

  const onSubmit = async (data: PharmacyRegistrationData) => {
    setIsLoading(true);
    
    try {
      const pharmacyData = {
        name: data.name,
        code: data.code,
        address: data.address,
        quartier: data.quartier,
        arrondissement: data.arrondissement,
        city: data.city,
        region: data.region,
        pays: data.pays,
        email: data.email,
        telephone_appel: data.telephone_appel,
        telephone_whatsapp: data.telephone_whatsapp,
        departement: data.departement,
        type: data.type
      };

      const adminData = {
        noms: data.admin_noms,
        prenoms: data.admin_prenoms,
        reference_agent: data.admin_reference,
        telephone: data.admin_telephone
      };

      const { data: result, error } = await supabase.rpc('register_pharmacy_with_admin', {
        pharmacy_data: pharmacyData,
        admin_data: adminData,
        admin_email: data.admin_email,
        admin_password: data.admin_password
      });

      if (error) throw error;

      const response = result as { success: boolean; message?: string; error?: string };

      if (response.success) {
        toast({ 
          title: 'Pharmacie créée avec succès',
          description: response.message || 'Inscription terminée'
        });
        setStep(3);
      } else {
        throw new Error(response.error || 'Erreur inconnue');
      }
      
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      toast({
        title: 'Erreur lors de l\'inscription',
        description: error.message || 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    step,
    setStep,
    isLoading,
    onSubmit
  };
};