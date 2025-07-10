import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';
import type { User } from '@supabase/supabase-js';

export const usePharmacyRegistration = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pharmacyGoogleUser, setPharmacyGoogleUser] = useState<User | null>(null);
  const [adminGoogleUser, setAdminGoogleUser] = useState<User | null>(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(true); // Démarrer par l'auth
  const [authType, setAuthType] = useState<'pharmacy' | 'admin'>('pharmacy');

  const form = useForm<PharmacyRegistrationData>({
    defaultValues: {
      pays: 'Cameroun',
      type: 'standard'
    }
  });

  // Vérifier les paramètres URL pour les redirections Google
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    if (stepParam === 'pharmacy' || stepParam === 'admin') {
      setAuthType(stepParam);
      setShowGoogleAuth(true);
    }
  }, []);

  const handlePharmacyNext = () => {
    setAuthType('pharmacy');
    setShowGoogleAuth(true);
  };

  const handlePharmacyGoogleSuccess = (user: User) => {
    setPharmacyGoogleUser(user);
    setShowGoogleAuth(false);
    
    // Remplir automatiquement les champs avec les données Google
    form.setValue('email', user.email || '');
    if (user.user_metadata?.phone) {
      form.setValue('telephone_appel', user.user_metadata.phone);
    }
    
    setStep(1); // Aller au formulaire pharmacie après auth
  };

  const handleAdminFormNext = () => {
    setAuthType('admin');
    setShowGoogleAuth(true);
  };

  const handleAdminGoogleSuccess = (user: User) => {
    setAdminGoogleUser(user);
    setShowGoogleAuth(false);
    
    // Remplir automatiquement les champs admin avec les données Google
    form.setValue('admin_email', user.email || '');
    if (user.user_metadata?.phone) {
      form.setValue('admin_telephone_principal', user.user_metadata.phone);
    }
    
    // Générer un mot de passe sécurisé
    const securePassword = generateSecurePassword();
    form.setValue('admin_password', securePassword);
  };

  const generateSecurePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGoogleAuthBack = () => {
    setShowGoogleAuth(false);
    if (authType === 'pharmacy') {
      setStep(1);
    } else {
      setStep(2);
    }
  };

  const onSubmit = async (data: PharmacyRegistrationData) => {
    setIsLoading(true);
    
    try {
      const pharmacyData = {
        name: data.name,
        licence_number: data.licence_number,
        address: data.address,
        quartier: data.quartier,
        arrondissement: data.arrondissement,
        city: data.city,
        pays: data.pays,
        website: data.website,
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
        telephone: data.admin_telephone_principal,
        whatsapp: data.admin_whatsapp,
        role: data.admin_role
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
    onSubmit,
    showGoogleAuth,
    authType,
    pharmacyGoogleUser,
    adminGoogleUser,
    handlePharmacyNext,
    handlePharmacyGoogleSuccess,
    handleAdminFormNext,
    handleAdminGoogleSuccess,
    handleGoogleAuthBack
  };
};