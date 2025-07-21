
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

interface PharmacyCreationResult {
  success: boolean;
  pharmacy_id?: string;
  error?: string;
  message?: string;
}

export const usePharmacyRegistration = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pharmacyGoogleUser, setPharmacyGoogleUser] = useState<User | null>(null);
  const [adminGoogleUser, setAdminGoogleUser] = useState<User | null>(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [authType, setAuthType] = useState<'pharmacy' | 'admin'>('pharmacy');

  const form = useForm<PharmacyRegistrationData>({
    defaultValues: {
      pays: 'Cameroun',
      type: 'standard'
    }
  });

  const handlePharmacyNext = () => {
    // Passer directement à l'étape 2 car l'utilisateur est déjà authentifié
    setStep(2);
  };

  const handlePharmacyGoogleSuccess = (user: User) => {
    setPharmacyGoogleUser(user);
    console.log('Authentification pharmacie réussie:', user.email);
  };

  const handleAdminFormNext = () => {
    // Soumettre directement le formulaire car l'utilisateur est déjà authentifié
    return form.handleSubmit(onSubmit)();
  };

  const handleAdminGoogleSuccess = (user: User) => {
    setAdminGoogleUser(user);
    setShowGoogleAuth(false);
    setStep(2);
    
    // Pré-remplir automatiquement les champs admin avec les données Google
    if (user.user_metadata?.given_name) {
      form.setValue('admin_prenoms', user.user_metadata.given_name);
    }
    if (user.user_metadata?.family_name) {
      form.setValue('admin_noms', user.user_metadata.family_name);
    }
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
      // Utiliser l'utilisateur déjà authentifié via useAuth
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Veuillez vous authentifier avec Google avant de continuer.",
          variant: "destructive",
        });
        return;
      }

      const adminEmail = user.email;
      if (!adminEmail) {
        toast({
          title: "Erreur",
          description: "Email de l'administrateur non trouvé.",
          variant: "destructive",
        });
        return;
      }

      console.log('REGISTRATION: Début de l\'inscription avec utilisateur:', adminEmail);

      // Vérifier que la session Supabase est active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        toast({
          title: "Erreur de session",
          description: "Session d'authentification expirée. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        return;
      }

      console.log('REGISTRATION: Session confirmée pour:', session.user.email);

      // Préparer les données de la pharmacie
      const pharmacyData = {
        name: data.name,
        code: data.licence_number,
        address: data.address,
        quartier: data.quartier,
        arrondissement: data.arrondissement,
        city: data.city,
        region: 'Cameroun',
        pays: data.pays,
        email: data.email,
        telephone_appel: data.telephone_appel,
        telephone_whatsapp: data.telephone_whatsapp,
        departement: data.departement,
        type: data.type
      };

      // Préparer les données de l'admin avec les informations Google
      const adminData = {
        noms: data.admin_noms || user.user_metadata?.family_name || '',
        prenoms: data.admin_prenoms || user.user_metadata?.given_name || '',
        reference_agent: data.admin_reference,
        telephone: data.admin_telephone_principal
      };

      // Générer un mot de passe sécurisé
      const adminPassword = generateSecurePassword();

      console.log('REGISTRATION: Appel de la fonction register_pharmacy_with_admin...');

      // Utiliser la fonction RPC qui gère les permissions avec l'utilisateur authentifié
      const { data: result, error: registrationError } = await supabase.rpc('register_pharmacy_with_admin', {
        pharmacy_data: pharmacyData,
        admin_data: adminData,
        admin_email: adminEmail,
        admin_password: adminPassword
      });

      const typedResult = result as unknown as { success: boolean; error?: string; pharmacy_id?: string; };

      if (registrationError || !typedResult?.success) {
        console.error('REGISTRATION: Erreur lors de l\'inscription:', registrationError);
        toast({
          title: "Erreur",
          description: typedResult?.error || registrationError?.message || "Erreur lors de l'inscription",
          variant: "destructive",
        });
        return;
      }

      console.log('REGISTRATION: Inscription réussie !');

      // Succès
      toast({
        title: "Succès !",
        description: `Votre pharmacie et votre compte ont été créés avec succès. Email: ${adminEmail}`,
      });

      // Passer à l'étape suivante
      setStep(3);
      
    } catch (error: any) {
      console.error('REGISTRATION: Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue. Veuillez réessayer.",
        variant: "destructive",
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
