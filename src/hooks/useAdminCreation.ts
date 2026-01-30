import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useVerification } from '@/hooks/useVerification';

interface AdminData {
  prenoms: string;
  noms: string;
  email: string;
  phone: string;
  password: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  policy: any;
}

export function useAdminCreation(pharmacyId: string, pharmacyEmail: string) {
  const [isCreating, setIsCreating] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  // Validation basique du mot de passe (côté client uniquement car pas de tenant ID disponible pour politique)
  const validatePasswordBasic = useCallback((password: string): PasswordValidation => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      policy: null
    };
  }, []);

  // Valider que l'email admin est différent de l'email pharmacie
  const validateAdminEmail = useCallback((adminEmail: string): { valid: boolean; error?: string } => {
    const normalizedAdmin = adminEmail.toLowerCase().trim();
    const normalizedPharmacy = pharmacyEmail.toLowerCase().trim();
    
    if (normalizedAdmin === normalizedPharmacy) {
      return {
        valid: false,
        error: "L'email de l'administrateur doit être différent de celui de la pharmacie"
      };
    }
    
    return { valid: true };
  }, [pharmacyEmail]);

  // Vérifier la disponibilité de l'email
  const checkEmailAvailability = useCallback(async (email: string): Promise<{ available: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('check_email_available_for_user', {
        p_email: email
      });
      
      if (error) {
        console.error('Erreur vérification email:', error);
        return { available: false, error: 'Erreur lors de la vérification de l\'email' };
      }
      
      const result = data as { available: boolean; reason?: string } | null;
      if (!result?.available) {
        return { available: false, error: result?.reason || 'Cet email est déjà utilisé' };
      }
      
      return { available: true };
    } catch (error) {
      console.error('Exception vérification email:', error);
      return { available: false, error: 'Erreur lors de la vérification' };
    }
  }, []);

  // Créer le compte administrateur
  const createAdmin = useCallback(async (adminData: AdminData): Promise<{ success: boolean; error?: string }> => {
    setIsCreating(true);
    
    try {
      // 1. Valider que l'email est différent de la pharmacie
      const emailValidation = validateAdminEmail(adminData.email);
      if (!emailValidation.valid) {
        toast({
          title: "Erreur",
          description: emailValidation.error,
          variant: "destructive"
        });
        return { success: false, error: emailValidation.error };
      }

      // 2. Valider le mot de passe
      const passwordValidation = validatePasswordBasic(adminData.password);
      if (!passwordValidation.isValid) {
        toast({
          title: "Mot de passe invalide",
          description: passwordValidation.errors[0],
          variant: "destructive"
        });
        return { success: false, error: passwordValidation.errors[0] };
      }

      // 3. Vérifier la disponibilité de l'email
      const availability = await checkEmailAvailability(adminData.email);
      if (!availability.available) {
        toast({
          title: "Email non disponible",
          description: availability.error,
          variant: "destructive"
        });
        return { success: false, error: availability.error };
      }

      console.log('ADMIN-CREATION: Création du compte admin pour tenant:', pharmacyId);

      // 4. Appeler l'Edge Function pour créer l'utilisateur avec le rôle Admin
      const { data, error } = await supabase.functions.invoke('create-user-with-personnel', {
        body: {
          email: adminData.email,
          password: adminData.password,
          noms: adminData.noms,
          prenoms: adminData.prenoms,
          role: 'Admin',
          telephone_appel: adminData.phone,
          tenant_id: pharmacyId
        }
      });

      if (error) {
        console.error('ADMIN-CREATION: Erreur Edge Function:', error);
        
        // Parser l'erreur si possible
        let errorMessage = "Erreur lors de la création du compte";
        try {
          const errorContext = (error as any).context;
          if (errorContext) {
            const errorBody = await errorContext.json();
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch (parseError) {
          // Garder le message par défaut
        }
        
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        console.error('ADMIN-CREATION: Erreur dans la réponse:', data.error);
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive"
        });
        return { success: false, error: data.error };
      }

      console.log('ADMIN-CREATION: Compte admin créé avec succès:', data);
      setAdminCreated(true);
      
      toast({
        title: "Compte administrateur créé",
        description: `Le compte de ${adminData.prenoms} ${adminData.noms} a été créé avec succès.`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('ADMIN-CREATION: Exception:', error);
      const errorMessage = error.message || "Une erreur est survenue";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, [pharmacyId, pharmacyEmail, validateAdminEmail, validatePasswordBasic, checkEmailAvailability]);

  return {
    createAdmin,
    isCreating,
    adminCreated,
    validatePasswordBasic,
    validateAdminEmail,
    checkEmailAvailability,
  };
}
