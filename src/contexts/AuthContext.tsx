import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Personnel = Tables<'personnel'>;
type Pharmacy = Tables<'pharmacies'>;

interface ConnectedPharmacy extends Pharmacy {
  sessionToken: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  personnel: Personnel | null;
  pharmacy: Pharmacy | null;
  connectedPharmacy: ConnectedPharmacy | null;
  loading: boolean;
  securityLevel: string;
  requires2FA: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, personnelData: Partial<Personnel>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateSecurityContext: () => Promise<void>;
  connectPharmacy: (email: string, password: string) => Promise<{ error: Error | null }>;
  createPharmacySession: () => Promise<{ error: Error | null }>;
  disconnectPharmacy: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [connectedPharmacy, setConnectedPharmacy] = useState<ConnectedPharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [securityLevel, setSecurityLevel] = useState<string>('standard');
  const [requires2FA, setRequires2FA] = useState<boolean>(false);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('AUTH: Fetching user data for:', userId);

      // Fetch personnel data - utilise maybeSingle pour permettre NULL
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (personnelError) {
        console.error('AUTH: Error fetching personnel:', personnelError);
        return;
      }

      // Si aucun personnel trouvé, retourner simplement
      if (!personnelData) {
        console.log('AUTH: Personnel non trouvé pour cet utilisateur');
        return;
      }

      // Personnel trouvé normalement
      console.log('AUTH: Personnel trouvé:', personnelData.id, 'tenant:', personnelData.tenant_id);
      setPersonnel(personnelData);

      // Fetch pharmacy data seulement si l'utilisateur a un tenant_id
      if (personnelData?.tenant_id) {
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', personnelData.tenant_id)
          .maybeSingle();

        if (pharmacyError) {
          console.error('AUTH: Error fetching pharmacy:', pharmacyError);
          return;
        }

        if (pharmacyData) {
          console.log('AUTH: Pharmacie trouvée:', pharmacyData.name);
          setPharmacy(pharmacyData);
          // Ne plus créer automatiquement de session pharmacie
          // La pharmacie sera définie mais pas connectée automatiquement
        }
      } else {
        console.log('AUTH: Personnel sans tenant_id');
      }

      // Mettre à jour le contexte de sécurité
      await updateSecurityContext();
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  const updateSecurityContext = async () => {
    // Permettre aux utilisateurs sans tenant_id (admins système)
    if (!personnel?.id) return;

    try {
      // Récupérer la session utilisateur active seulement si l'utilisateur a un tenant
      if (personnel.tenant_id) {
        const { data: userSession } = await supabase
          .from('user_sessions')
          .select('security_level, requires_2fa')
          .eq('personnel_id', personnel.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userSession) {
          setSecurityLevel(userSession.security_level);
          setRequires2FA(userSession.requires_2fa);
        }

        // Vérifier les politiques de sécurité pour ce rôle si pharmacie existe
        if (pharmacy?.id) {
          const { data: passwordPolicy } = await supabase
            .from('password_policies')
            .select('force_2fa_for_roles')
            .eq('tenant_id', pharmacy.id)
            .maybeSingle();

          if (passwordPolicy?.force_2fa_for_roles?.includes(personnel.role)) {
            setRequires2FA(true);
          }
        }
      } else {
        // Pour les admins système, utiliser des paramètres par défaut
        setSecurityLevel('high');
        setRequires2FA(true);
      }
    } catch (error) {
      console.error('Error updating security context:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setPersonnel(null);
          setPharmacy(null);
          setSecurityLevel('standard');
          setRequires2FA(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    // Check for connected pharmacy session in localStorage
    const savedPharmacySession = localStorage.getItem('pharmacy_session');
    if (savedPharmacySession) {
      try {
        const sessionData = JSON.parse(savedPharmacySession);
        // Valider la session pharmacie
        supabase.rpc('validate_pharmacy_session' as any, {
          p_session_token: sessionData.sessionToken
        }).then(({ data, error }) => {
          if (data && typeof data === 'object' && 'valid' in data && data.valid && !error) {
            const validationData = data as { valid: boolean; pharmacy: any };
            setConnectedPharmacy({
              ...validationData.pharmacy,
              sessionToken: sessionData.sessionToken
            });
          } else {
            localStorage.removeItem('pharmacy_session');
          }
        });
      } catch (error) {
        localStorage.removeItem('pharmacy_session');
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Empêcher la connexion utilisateur sans pharmacie connectée
      if (!connectedPharmacy) {
        return { error: new Error('Aucune pharmacie connectée. Veuillez connecter votre pharmacie d\'abord.') };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, personnelData: Partial<Personnel>) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) return { error };

      // Create personnel record if auth user was created
      if (data.user) {
        const { error: personnelError } = await supabase
          .from('personnel')
          .insert({
            auth_user_id: data.user.id,
            email: email,
            noms: personnelData.noms || '',
            prenoms: personnelData.prenoms || '',
            reference_agent: personnelData.reference_agent || '',
            tenant_id: personnelData.tenant_id,
            role: personnelData.role || 'Employé'
          });

        if (personnelError) {
          return { error: personnelError as Error };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Nouvelle fonction simplifiée pour créer une session pharmacie
  const createPharmacySession = async () => {
    try {
      if (!user || !pharmacy) {
        return { error: new Error('Utilisateur ou pharmacie non trouvé') };
      }

      // Créer une session pharmacie pour la pharmacie de l'utilisateur
      const { data: sessionData, error: sessionError } = await supabase.rpc('create_pharmacy_session', {
        p_pharmacy_id: pharmacy.id,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (sessionError || !sessionData) {
        return { error: new Error('Erreur lors de la création de la session') };
      }

      const sessionResult = sessionData as { session_token: string; expires_at: string };

      const connectedPharmacyData: ConnectedPharmacy = {
        ...pharmacy,
        sessionToken: sessionResult.session_token
      };

      // Stocker la pharmacie connectée
      setConnectedPharmacy(connectedPharmacyData);
      localStorage.setItem('pharmacy_session', JSON.stringify({
        sessionToken: sessionResult.session_token,
        expiresAt: sessionResult.expires_at
      }));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Fonction connectPharmacy - authentification avec Supabase Auth uniquement
  const connectPharmacy = async (email: string, password: string) => {
    try {
      console.log('AUTH: Tentative de connexion pharmacie avec email:', email);
      
      // Vérifier d'abord que l'email existe dans les pharmacies
      const { data: pharmacyCheck, error: checkError } = await supabase.rpc('check_pharmacy_email_exists', {
        email_to_check: email
      });

      if (checkError) {
        console.error('AUTH: Erreur vérification email pharmacie:', checkError);
        return { error: new Error('Erreur lors de la vérification de l\'email') };
      }

      const result = pharmacyCheck as { exists: boolean; pharmacy_id?: string; has_auth_account?: boolean };
      
      if (!result.exists) {
        return { error: new Error('Aucune pharmacie trouvée avec cet email') };
      }

      if (!result.has_auth_account) {
        return { error: new Error('Cette pharmacie n\'a pas encore de compte d\'authentification configuré') };
      }

      // Authentifier avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('AUTH: Erreur authentification Supabase:', authError);
        return { error: new Error('Email ou mot de passe incorrect') };
      }

      console.log('AUTH: Connexion pharmacie réussie');
      
      // Récupérer les données de la pharmacie immédiatement après l'authentification
      if (result.pharmacy_id) {
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', result.pharmacy_id)
          .single();

        if (pharmacyData && !pharmacyError) {
          // Créer immédiatement une session pharmacie
          const { data: sessionData, error: sessionError } = await supabase.rpc('create_pharmacy_session', {
            p_pharmacy_id: pharmacyData.id,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });

          if (sessionData && !sessionError) {
            const sessionResult = sessionData as { session_token: string; expires_at: string };
            
            const connectedPharmacyData: ConnectedPharmacy = {
              ...pharmacyData,
              sessionToken: sessionResult.session_token
            };

            // Stocker la pharmacie connectée immédiatement
            setConnectedPharmacy(connectedPharmacyData);
            localStorage.setItem('pharmacy_session', JSON.stringify({
              sessionToken: sessionResult.session_token,
              expiresAt: sessionResult.expires_at
            }));

            console.log('AUTH: Session pharmacie créée avec succès');
          } else {
            console.warn('AUTH: Impossible de créer la session pharmacie:', sessionError);
          }
        }
      }
      
      // Les données utilisateur seront récupérées par fetchUserData via le listener onAuthStateChange
      
      return { error: null };
    } catch (error) {
      console.error('AUTH: Exception connectPharmacy:', error);
      return { error: error as Error };
    }
  };

  const disconnectPharmacy = async () => {
    if (connectedPharmacy?.sessionToken) {
      // Déconnecter la session côté serveur
      await supabase.rpc('disconnect_pharmacy_session' as any, {
        p_session_token: connectedPharmacy.sessionToken
      });
    }
    
    setConnectedPharmacy(null);
    localStorage.removeItem('pharmacy_session');
  };

  const signOut = async () => {
    // Désactiver les sessions actives de l'utilisateur
    if (personnel?.id) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('personnel_id', personnel.id)
        .eq('is_active', true);
    }

    // Important: Ne pas déconnecter la pharmacie ici
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPersonnel(null);
    setPharmacy(null); // La pharmacie liée au personnel est réinitialisée, mais la session pharmacie reste active
    setSecurityLevel('standard');
    setRequires2FA(false);
    // Ne pas toucher à connectedPharmacy afin de garder la session pharmacie active
  };

  const value = {
    user,
    session,
    personnel,
    pharmacy,
    connectedPharmacy,
    loading,
    securityLevel,
    requires2FA,
    signIn,
    signUp,
    signOut,
    updateSecurityContext,
    connectPharmacy,
    createPharmacySession,
    disconnectPharmacy
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
