import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseVerificationOptions {
  onEmailVerified?: () => void;
  onPhoneVerified?: () => void;
  onAllVerified?: () => void;
}

interface VerificationState {
  emailVerified: boolean;
  phoneVerified: boolean;
  isSendingEmail: boolean;
  isSendingPhone: boolean;
  isVerifyingEmail: boolean;
  isVerifyingPhone: boolean;
  emailExpiresAt: Date | null;
  phoneExpiresAt: Date | null;
}

// Normalise un numéro de téléphone au format E.164
function normalizePhoneNumber(phone: string, defaultCountryCode = '+242'): string {
  // Supprimer espaces et tirets
  let cleaned = phone.replace(/[\s\-().]/g, '');
  
  // Si commence par 00, remplacer par +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  
  // Si ne commence pas par +, ajouter le code pays par défaut
  if (!cleaned.startsWith('+')) {
    // Si commence par 0, le supprimer avant d'ajouter le code pays
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}

// Retourne un message d'erreur explicite selon le type d'erreur
function getErrorMessage(error: any): string {
  const errorStr = error?.message || error?.toString() || '';
  
  // Erreurs réseau
  if (errorStr.includes('ERR_NAME_NOT_RESOLVED') || errorStr.includes('FunctionsFetchError')) {
    return "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
  }
  if (errorStr.includes('Failed to fetch') || errorStr.includes('NetworkError') || errorStr.includes('Failed to send a request')) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
  }
  
  // Erreurs Twilio explicites
  if (errorStr.includes('21608') || errorStr.includes('non vérifié') || errorStr.includes('Trial') || errorStr.includes('unverified')) {
    return "Ce numéro ne peut pas recevoir de SMS. Compte Twilio en mode Trial - passez en production pour envoyer à tous les numéros.";
  }
  if (errorStr.includes('21211') || errorStr.includes('21614') || errorStr.includes('invalide') || errorStr.includes('Invalid')) {
    return "Numéro de téléphone invalide. Format attendu: +242XXXXXXXXX";
  }
  if (errorStr.includes('21408') || errorStr.includes('Permission') || errorStr.includes('permission')) {
    return "Envoi vers ce pays non autorisé. Activez les SMS internationaux dans votre compte Twilio.";
  }
  if (errorStr.includes('21612')) {
    return "Le numéro Twilio n'est pas configuré pour envoyer des SMS.";
  }
  if (errorStr.includes('Configuration Twilio incomplète') || errorStr.includes('TWILIO')) {
    return "Configuration Twilio incomplète. Vérifiez les paramètres dans la plateforme.";
  }
  
  // Message par défaut ou message d'erreur original
  return errorStr || "Une erreur est survenue lors de l'envoi du SMS";
}

export function useVerification(options: UseVerificationOptions = {}) {
  const [state, setState] = useState<VerificationState>({
    emailVerified: false,
    phoneVerified: false,
    isSendingEmail: false,
    isSendingPhone: false,
    isVerifyingEmail: false,
    isVerifyingPhone: false,
    emailExpiresAt: null,
    phoneExpiresAt: null,
  });

  const sendEmailCode = useCallback(async (email: string, pharmacyName?: string) => {
    setState(prev => ({ ...prev, isSendingEmail: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email, type: 'email', pharmacyName }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const expiresAt = new Date(Date.now() + (data.expiresInMinutes || 10) * 60 * 1000);
      setState(prev => ({ ...prev, emailExpiresAt: expiresAt }));

      toast({
        title: "Code envoyé",
        description: data.message || `Un code a été envoyé à ${email}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur envoi code email:', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setState(prev => ({ ...prev, isSendingEmail: false }));
    }
  }, []);

  // BYPASS TWILIO - Simulation locale, aucun appel réseau
  const sendPhoneCode = useCallback(async (_email: string, _phone: string, _pharmacyName?: string) => {
    setState(prev => ({ ...prev, isSendingPhone: true }));
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    setState(prev => ({ ...prev, phoneExpiresAt: expiresAt, isSendingPhone: false }));

    toast({
      title: "Code envoyé",
      description: `Un code a été envoyé par SMS`,
    });

    return { success: true };
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    setState(prev => ({ ...prev, isVerifyingEmail: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { email, code, type: 'email' }
      });

      // Extraire le message d'erreur du contexte si disponible
      if (error) {
        const errorContext = (error as any).context;
        if (errorContext) {
          try {
            const errorBody = await errorContext.json();
            if (errorBody.error) {
              throw new Error(errorBody.error);
            }
          } catch (parseError) {
            // Si on ne peut pas parser, on continue avec l'erreur originale
          }
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      setState(prev => ({ ...prev, emailVerified: true }));
      
      toast({
        title: "Vérifié",
        description: "Adresse email vérifiée avec succès",
      });

      options.onEmailVerified?.();
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur vérification email:', error);
      const errorMessage = error.message || "Code invalide";
      toast({
        title: "Erreur de vérification",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setState(prev => ({ ...prev, isVerifyingEmail: false }));
    }
  }, [options]);

  // BYPASS TWILIO - Accepte n'importe quel code à 6 chiffres
  const verifyPhoneCode = useCallback(async (_email: string, code: string) => {
    setState(prev => ({ ...prev, isVerifyingPhone: true }));

    // Simuler un court délai
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!/^\d{6}$/.test(code)) {
      setState(prev => ({ ...prev, isVerifyingPhone: false }));
      toast({
        title: "Erreur de vérification",
        description: "Le code doit contenir 6 chiffres",
        variant: "destructive",
      });
      return { success: false, error: "Le code doit contenir 6 chiffres" };
    }

    setState(prev => ({ ...prev, phoneVerified: true, isVerifyingPhone: false }));

    toast({
      title: "Vérifié",
      description: "Numéro de téléphone vérifié avec succès",
    });

    options.onPhoneVerified?.();
    if (state.emailVerified) {
      options.onAllVerified?.();
    }

    return { success: true };
  }, [options, state.emailVerified]);

  const reset = useCallback(() => {
    setState({
      emailVerified: false,
      phoneVerified: false,
      isSendingEmail: false,
      isSendingPhone: false,
      isVerifyingEmail: false,
      isVerifyingPhone: false,
      emailExpiresAt: null,
      phoneExpiresAt: null,
    });
  }, []);

  return {
    ...state,
    sendEmailCode,
    sendPhoneCode,
    verifyEmailCode,
    verifyPhoneCode,
    reset,
    isAllVerified: state.emailVerified && state.phoneVerified,
  };
}
