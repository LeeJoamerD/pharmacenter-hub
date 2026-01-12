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
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le code",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isSendingEmail: false }));
    }
  }, []);

  const sendPhoneCode = useCallback(async (email: string, phone: string, pharmacyName?: string) => {
    setState(prev => ({ ...prev, isSendingPhone: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email, phone, type: 'sms', pharmacyName }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const expiresAt = new Date(Date.now() + (data.expiresInMinutes || 10) * 60 * 1000);
      setState(prev => ({ ...prev, phoneExpiresAt: expiresAt }));

      toast({
        title: "Code envoyé",
        description: data.message || `Un code a été envoyé par SMS`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur envoi code SMS:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le SMS",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isSendingPhone: false }));
    }
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    setState(prev => ({ ...prev, isVerifyingEmail: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { email, code, type: 'email' }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setState(prev => ({ ...prev, emailVerified: true }));
      
      toast({
        title: "Vérifié",
        description: "Adresse email vérifiée avec succès",
      });

      options.onEmailVerified?.();
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur vérification email:', error);
      toast({
        title: "Erreur",
        description: error.message || "Code invalide",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isVerifyingEmail: false }));
    }
  }, [options]);

  const verifyPhoneCode = useCallback(async (email: string, code: string) => {
    setState(prev => ({ ...prev, isVerifyingPhone: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { email, code, type: 'sms' }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setState(prev => ({ ...prev, phoneVerified: true }));
      
      toast({
        title: "Vérifié",
        description: "Numéro de téléphone vérifié avec succès",
      });

      options.onPhoneVerified?.();
      
      // Vérifier si tout est vérifié
      if (state.emailVerified) {
        options.onAllVerified?.();
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur vérification téléphone:', error);
      toast({
        title: "Erreur",
        description: error.message || "Code invalide",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isVerifyingPhone: false }));
    }
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
