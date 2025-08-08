import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LoginAttemptResult {
  success: boolean;
  isLocked: boolean;
  failedAttempts: number;
  maxAttempts: number;
  lockoutRemainingMinutes: number;
  error?: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  policy: any;
}

export const useAdvancedAuth = () => {
  const { personnel, pharmacy, connectedPharmacy } = useAuth();
  const [loading, setLoading] = useState(false);

  const validatePassword = async (password: string): Promise<PasswordValidation> => {
    if (!pharmacy?.id) {
      return {
        isValid: false,
        errors: ['Aucune pharmacie sélectionnée'],
        policy: null
      };
    }

    try {
      const { data, error } = await supabase.rpc('validate_password_strength', {
        password,
        tenant_id: pharmacy.id
      });

      if (error) throw error;
      
      return data as unknown as PasswordValidation;
    } catch (error) {
      console.error('Error validating password:', error);
      return {
        isValid: false,
        errors: ['Erreur lors de la validation du mot de passe'],
        policy: null
      };
    }
  };

  const checkLoginAttempts = async (email: string): Promise<LoginAttemptResult> => {
    if (!pharmacy?.id) {
      return {
        success: false,
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: 5,
        lockoutRemainingMinutes: 0,
        error: 'Aucune pharmacie sélectionnée'
      };
    }

    try {
      const { data, error } = await supabase.rpc('check_login_attempts', {
        email,
        tenant_id: pharmacy.id
      });

      if (error) throw error;
      
      const result = data as any;
      return {
        success: true,
        isLocked: result.is_locked || false,
        failedAttempts: result.failed_attempts || 0,
        maxAttempts: result.max_attempts || 5,
        lockoutRemainingMinutes: result.lockout_remaining_minutes || 0
      };
    } catch (error) {
      console.error('Error checking login attempts:', error);
      return {
        success: false,
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: 5,
        lockoutRemainingMinutes: 0,
        error: 'Erreur lors de la vérification des tentatives'
      };
    }
  };

  const logLoginAttempt = async (
    email: string,
    success: boolean,
    failureReason?: string
  ) => {
    if (!pharmacy?.id) return;

    try {
      // Récupérer l'IP et user agent (simulation pour le frontend)
      const userAgent = navigator.userAgent;
      
      await supabase.from('login_attempts').insert({
        tenant_id: pharmacy.id,
        email,
        success,
        failure_reason: failureReason,
        user_agent: userAgent,
        ip_address: '127.0.0.1' // En production, ceci serait géré côté serveur
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  };

  const createUserSession = async (sessionToken: string) => {
    if (!personnel?.id || !pharmacy?.id) return;

    try {
      const userAgent = navigator.userAgent;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 heures par défaut

      // Calculer le score de risque
      const { data: riskScore } = await supabase.rpc('calculate_session_risk_score', {
        ip_address: '127.0.0.1',
        user_agent: userAgent,
        personnel_id: personnel.id
      });

      // Déterminer le niveau de sécurité requis
      let securityLevel = 'standard';
      let requires2fa = false;

      if (riskScore > 50) {
        securityLevel = 'elevated';
        requires2fa = true;
      } else if (['Admin', 'Pharmacien'].includes(personnel.role)) {
        securityLevel = 'elevated';
        requires2fa = true;
      }

      await supabase.from('user_sessions').insert({
        tenant_id: pharmacy.id,
        personnel_id: personnel.id,
        session_token: sessionToken,
        ip_address: '127.0.0.1',
        user_agent: userAgent,
        risk_score: riskScore || 0,
        expires_at: expiresAt.toISOString(),
        security_level: securityLevel,
        requires_2fa: requires2fa
      });

    } catch (error) {
      console.error('Error creating user session:', error);
    }
  };

  const getPasswordPolicy = async () => {
    if (!pharmacy?.id) return null;

    try {
      const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching password policy:', error);
      return null;
    }
  };

  const enhancedSignIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Empêcher la connexion utilisateur sans pharmacie connectée
      if (!pharmacy?.id && !connectedPharmacy) {
        await logLoginAttempt(email, false, 'No pharmacy connected');
        setLoading(false);
        return { error: new Error('Aucune pharmacie connectée. Veuillez connecter votre pharmacie avant de vous connecter.') };
      }

      // 1. Vérifier les tentatives de connexion
      const attemptCheck = await checkLoginAttempts(email);
      
      if (attemptCheck.isLocked) {
        await logLoginAttempt(email, false, 'Account locked');
        setLoading(false);
        return {
          error: {
            message: `Compte verrouillé. Réessayez dans ${attemptCheck.lockoutRemainingMinutes} minutes.`
          }
        };
      }

      // 2. Tentative de connexion
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Logger l'échec
        await logLoginAttempt(email, false, error.message);
        setLoading(false);
        return { error };
      }

      // 3. Logger le succès
      await logLoginAttempt(email, true);

      // 4. Créer une session utilisateur
      if (data.session) {
        await createUserSession(data.session.access_token);
      }

      setLoading(false);
      return { data, error: null };

    } catch (err) {
      setLoading(false);
      await logLoginAttempt(email, false, 'Unexpected error');
      return { error: err as Error };
    }
  };

  return {
    loading,
    validatePassword,
    checkLoginAttempts,
    logLoginAttempt,
    createUserSession,
    getPasswordPolicy,
    enhancedSignIn
  };
};