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
  is_valid?: boolean; // Propriété temporaire pour le mapping snake_case
  errors: string[];
  policy: any;
}

export const useAdvancedAuth = () => {
  const { personnel, pharmacy, connectedPharmacy } = useAuth();
  const [loading, setLoading] = useState(false);

  const validatePassword = async (password: string): Promise<PasswordValidation> => {
    // Utiliser l'ID de pharmacie disponible (pharmacy ou connectedPharmacy)
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    
    if (!pharmacyId) {
      return {
        isValid: false,
        errors: ['Aucune pharmacie connectée. Veuillez d\'abord connecter votre pharmacie pour créer un compte utilisateur.'],
        policy: null
      };
    }

    try {
      console.log('🔍 Validation mot de passe - Pharmacy ID:', pharmacyId);
      console.log('🔍 Mot de passe à valider:', password);
      
      const { data, error } = await supabase.rpc('validate_password_strength', {
        password,
        p_tenant_id: pharmacyId
      });

      console.log('📊 Réponse validation:', { data, error });

      if (error) {
        console.error('❌ Erreur RPC validation:', error);
        throw error;
      }
      
      // S'assurer que les erreurs sont bien formatées
      const validationData = data as unknown as PasswordValidation;
      console.log('📋 Données validation formatées:', validationData);
      
      // Corriger le mapping snake_case → camelCase
      if (validationData) {
        // Si le serveur retourne is_valid au lieu de isValid, mapper correctement
        if (validationData.is_valid !== undefined && validationData.isValid === undefined) {
          validationData.isValid = validationData.is_valid;
          console.log('🔄 Mapping is_valid → isValid:', validationData.is_valid);
        }
        
        console.log('✅ Validation - isValid:', validationData.isValid);
        console.log('📝 Erreurs:', validationData.errors);
        console.log('📋 Politique:', validationData.policy);
        
        if (!validationData.isValid && validationData.errors.length === 0) {
          // Si la validation échoue mais sans erreurs spécifiques, essayer de récupérer la politique
          const policy = await getPasswordPolicy();
          console.log('📋 Politique récupérée:', policy);
          
          if (policy) {
            validationData.errors = [
              `Le mot de passe doit respecter: min ${policy.min_length || 8} caractères`,
              `Complexité: ${policy.require_uppercase ? 'majuscule, ' : ''}${policy.require_lowercase ? 'minuscule, ' : ''}${policy.require_numbers ? 'chiffre, ' : ''}${policy.require_special_chars ? 'caractère spécial' : ''}`
            ].filter(Boolean);
          } else {
            validationData.errors = ['Le mot de passe ne respecte pas les exigences de sécurité'];
          }
        }
      }
      
      return validationData;
    } catch (error) {
      console.error('❌ Erreur validation mot de passe:', error);
      return {
        isValid: false,
        errors: [`Erreur serveur: ${error.message || 'Validation échouée'}`],
        policy: null
      };
    }
  };

  const checkLoginAttempts = async (email: string): Promise<LoginAttemptResult> => {
    // Utiliser l'ID de pharmacie disponible (pharmacy ou connectedPharmacy)
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
  };

  const logLoginAttempt = async (
    email: string,
    success: boolean,
    failureReason?: string
  ) => {
    // Utiliser l'ID de pharmacie disponible (pharmacy ou connectedPharmacy)
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    if (!pharmacyId) return;

    try {
      // Récupérer l'IP et user agent (simulation pour le frontend)
      const userAgent = navigator.userAgent;
      
      await supabase.from('login_attempts').insert({
        tenant_id: pharmacyId,
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
    // Utiliser l'ID de pharmacie disponible (pharmacy ou connectedPharmacy)
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    if (!personnel?.id || !pharmacyId) return;

    try {
      const userAgent = navigator.userAgent;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 heures par défaut

      // Calculer le score de risque
      const { data: riskScore } = await supabase.rpc('calculate_session_risk_score', {
        p_ip_address: '127.0.0.1',
        p_user_agent: userAgent,
        p_personnel_id: personnel.id
      });

      // Déterminer le niveau de sécurité requis
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
  };

  const getPasswordPolicy = async () => {
    // Utiliser l'ID de pharmacie disponible (pharmacy ou connectedPharmacy)
    const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
    if (!pharmacyId) return null;

    try {
      const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .eq('tenant_id', pharmacyId)
        .maybeSingle(); // Utiliser maybeSingle pour éviter l'erreur 406 quand aucune politique n'existe

      if (error) {
        console.error('❌ Erreur récupération politique:', error);
        return null;
      }
      
      console.log('✅ Politique récupérée avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur inattendue récupération politique:', error);
      return null;
    }
  };

  const enhancedSignIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Utiliser l'ID de pharmacie disponible (pharmacy ou connectedPharmacy)
      const pharmacyId = pharmacy?.id || connectedPharmacy?.id;
      
      // Empêcher la connexion utilisateur sans pharmacie connectée
      if (!pharmacyId) {
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
