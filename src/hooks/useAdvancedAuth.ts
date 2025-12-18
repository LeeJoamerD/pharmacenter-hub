import { useState, useCallback } from 'react';
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
  is_valid?: boolean;
  errors: string[];
  policy: any;
}

export const useAdvancedAuth = () => {
  const { personnel, pharmacy, connectedPharmacy } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mémoriser getPasswordPolicy pour éviter les re-rendus infinis
  const getPasswordPolicy = useCallback(async () => {
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    if (!pharmacyId) return null;

    try {
      const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .eq('tenant_id', pharmacyId)
        .maybeSingle();

      if (error) {
        console.error('Erreur récupération politique:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erreur inattendue récupération politique:', error);
      return null;
    }
  }, [pharmacy?.id, connectedPharmacy?.id]);

  // Mémoriser validatePassword pour éviter les re-rendus infinis
  const validatePassword = useCallback(async (password: string): Promise<PasswordValidation> => {
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    
    if (!pharmacyId) {
      return {
        isValid: false,
        errors: ['Aucune pharmacie connectée. Veuillez d\'abord connecter votre pharmacie pour créer un compte utilisateur.'],
        policy: null
      };
    }

    try {
      const { data, error } = await supabase.rpc('validate_password_strength', {
        password,
        p_tenant_id: pharmacyId
      });

      if (error) {
        throw error;
      }
      
      const validationData = data as unknown as PasswordValidation;
      
      if (validationData) {
        // Mapper snake_case → camelCase si nécessaire
        if (validationData.is_valid !== undefined && validationData.isValid === undefined) {
          validationData.isValid = validationData.is_valid;
        }
        
        // Si validation échoue sans erreurs spécifiques, construire un message générique
        if (!validationData.isValid && validationData.errors.length === 0) {
          validationData.errors = ['Le mot de passe ne respecte pas les exigences de sécurité'];
        }
      }
      
      return validationData;
    } catch (error: any) {
      console.error('Erreur validation mot de passe:', error);
      return {
        isValid: false,
        errors: [`Erreur serveur: ${error.message || 'Validation échouée'}`],
        policy: null
      };
    }
  }, [pharmacy?.id, connectedPharmacy?.id]);

  const checkLoginAttempts = useCallback(async (email: string): Promise<LoginAttemptResult> => {
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    
    if (!pharmacyId) {
      return {
        success: false,
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: 5,
        lockoutRemainingMinutes: 0,
        error: 'Aucune pharmacie connectée. Veuillez d\'abord connecter votre pharmacie.'
      };
    }

    try {
      const { data, error } = await supabase.rpc('check_login_attempts', {
        p_email: email,
        p_tenant_id: pharmacyId
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
  }, [pharmacy?.id, connectedPharmacy?.id]);

  const logLoginAttempt = useCallback(async (
    email: string,
    success: boolean,
    failureReason?: string
  ) => {
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    if (!pharmacyId) return;

    try {
      const userAgent = navigator.userAgent;
      
      await supabase.from('login_attempts').insert({
        tenant_id: pharmacyId,
        email,
        success,
        failure_reason: failureReason,
        user_agent: userAgent,
        ip_address: '127.0.0.1'
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }, [pharmacy?.id, connectedPharmacy?.id]);

  const createUserSession = useCallback(async (sessionToken: string) => {
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    if (!personnel?.id || !pharmacyId) return;

    try {
      const userAgent = navigator.userAgent;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const { data: riskScore } = await supabase.rpc('calculate_session_risk_score', {
        p_ip_address: '127.0.0.1',
        p_user_agent: userAgent,
        p_personnel_id: personnel.id
      });

      let securityLevel = 'standard';
      let requires2fa = false;

      if (riskScore > 50) {
        securityLevel = 'elevated';
        requires2fa = true;
      } else if (['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint'].includes(personnel.role)) {
        securityLevel = 'elevated';
        requires2fa = true;
      }

      await supabase.from('user_sessions').insert({
        tenant_id: pharmacyId,
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
  }, [pharmacy?.id, connectedPharmacy?.id, personnel?.id, personnel?.role]);

  const enhancedSignIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
      
      if (!pharmacyId) {
        await logLoginAttempt(email, false, 'No pharmacy connected');
        setLoading(false);
        return { error: new Error('Aucune pharmacie connectée. Veuillez connecter votre pharmacie avant de vous connecter.') };
      }

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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logLoginAttempt(email, false, error.message);
        setLoading(false);
        return { error };
      }

      await logLoginAttempt(email, true);

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
  }, [pharmacy?.id, connectedPharmacy?.id, checkLoginAttempts, logLoginAttempt, createUserSession]);

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
