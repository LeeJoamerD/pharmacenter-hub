import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';
import type { User } from '@supabase/supabase-js';

interface PharmacyCreationResult {
  success: boolean;
  pharmacy_id?: string;
  error?: string;
  message?: string;
}

interface AdminCreationResult {
  success: boolean;
  personnel_id?: string;
  error?: string;
  message?: string;
}

export const usePharmacyRegistration = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pharmacyGoogleUser, setPharmacyGoogleUser] = useState<User | null>(null);
  const [adminGoogleUser, setAdminGoogleUser] = useState<User | null>(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false); // Démarrer par le formulaire
  const [authType, setAuthType] = useState<'pharmacy' | 'admin'>('pharmacy');

  const form = useForm<PharmacyRegistrationData>({
    defaultValues: {
      pays: 'Cameroun',
      type: 'standard'
    }
  });

  // Vérifier le localStorage pour les redirections Google
  useEffect(() => {
    const storedAuthType = localStorage.getItem('pharmacyAuthType');
    
    if (storedAuthType === 'pharmacy' || storedAuthType === 'admin') {
      setAuthType(storedAuthType);
      setShowGoogleAuth(true);
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('pharmacyAuthType');
    }
  }, []);

  const handlePharmacyNext = () => {
    setShowGoogleAuth(true);
    setAuthType('pharmacy');
  };

  const handlePharmacyGoogleSuccess = (user: User) => {
    setPharmacyGoogleUser(user);
    // Rediriger vers la page des deux blocs d'authentification
    window.location.href = '/pharmacy-login';
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
      const adminEmail = adminGoogleUser?.email || data.admin_email;
      const adminPassword = generateSecurePassword();

      // Étape 1: Créer l'utilisateur via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError || !authData.user) {
        console.error('Erreur lors de la création de l\'utilisateur:', authError);
        toast({
          title: "Erreur",
          description: authError?.message || "Erreur lors de la création du compte utilisateur",
          variant: "destructive",
        });
        return;
      }

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

      // Étape 2: Créer la pharmacie
      const { data: pharmacyResult, error: pharmacyError } = await supabase.rpc('create_pharmacy_for_user', {
        pharmacy_data: pharmacyData
      });

      const typedPharmacyResult = pharmacyResult as unknown as PharmacyCreationResult;

      if (pharmacyError || !typedPharmacyResult?.success) {
        console.error('Erreur lors de la création de la pharmacie:', pharmacyError);
        toast({
          title: "Erreur",
          description: typedPharmacyResult?.error || pharmacyError?.message || "Erreur lors de la création de la pharmacie",
          variant: "destructive",
        });
        return;
      }

      // Préparer les données de l'admin
      const adminData = {
        noms: data.admin_noms,
        prenoms: data.admin_prenoms,
        reference_agent: data.admin_reference,
        telephone: data.admin_telephone_principal
      };

      // Étape 3: Lier l'utilisateur comme admin de la pharmacie
      const { data: adminResult, error: adminError } = await supabase.rpc('create_admin_personnel', {
        pharmacy_id: typedPharmacyResult.pharmacy_id,
        admin_data: adminData
      });

      const typedAdminResult = adminResult as unknown as AdminCreationResult;

      if (adminError || !typedAdminResult?.success) {
        console.error('Erreur lors de la création de l\'admin:', adminError);
        toast({
          title: "Erreur",
          description: typedAdminResult?.error || adminError?.message || "Erreur lors de la création de l'administrateur",
          variant: "destructive",
        });
        return;
      }

      // Déconnecter l'utilisateur automatiquement créé pour forcer une connexion manuelle
      await supabase.auth.signOut();

      // Succès
      toast({
        title: "Succès !",
        description: `Votre pharmacie et votre compte ont été créés avec succès. Email: ${adminEmail}, Mot de passe: ${adminPassword}`,
      });

      // Passer à l'étape suivante
      setStep(3);
      
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
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