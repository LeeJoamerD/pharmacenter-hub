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
  disconnectPharmacy: () => void;
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
      // Fetch personnel data - utilise maybeSingle pour permettre NULL
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (personnelError && personnelError.code !== 'PGRST116') {
        console.error('Error fetching personnel:', personnelError);
        return;
      }

      if (personnelData) {
        setPersonnel(personnelData);

        // Fetch pharmacy data seulement si l'utilisateur a un tenant_id
        if (personnelData?.tenant_id) {
          const { data: pharmacyData, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('id', personnelData.tenant_id)
            .maybeSingle();

          if (pharmacyError && pharmacyError.code !== 'PGRST116') {
            console.error('Error fetching pharmacy:', pharmacyError);
            return;
          }

          if (pharmacyData) {
            setPharmacy(pharmacyData);
          }
        }
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
        supabase.rpc('validate_pharmacy_session', {
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

  const connectPharmacy = async (email: string, password: string) => {
    try {
      // Déconnecter l'utilisateur si connecté
      if (user) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setPersonnel(null);
        setPharmacy(null);
      }

      // Vérifier d'abord que l'utilisateur existe avec ce rôle
      const { data: personnel, error: personnelError } = await supabase
        .from('personnel')
        .select('*, pharmacies!inner(*)')
        .eq('email', email)
        .eq('role', 'Admin')
        .maybeSingle();

      if (personnelError || !personnel) {
        return { error: new Error('Email ou mot de passe incorrect') };
      }

      // Maintenant se connecter avec les identifiants utilisateur dans auth.users
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { error: new Error('Email ou mot de passe incorrect') };
      }

      // Récupérer la pharmacie associée
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .maybeSingle();

      if (pharmacyError || !pharmacy) {
        return { error: new Error('Aucune pharmacie associée à ce compte') };
      }

      // Créer une session pharmacie
      const { data: sessionData, error: sessionError } = await supabase.rpc('create_pharmacy_session', {
        p_pharmacy_id: pharmacy.id,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (sessionError || !sessionData) {
        return { error: new Error('Erreur lors de la création de la session') };
      }

      // Type assertion pour sessionData
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

  const disconnectPharmacy = async () => {
    if (connectedPharmacy?.sessionToken) {
      // Déconnecter la session côté serveur
      await supabase.rpc('disconnect_pharmacy_session', {
        p_session_token: connectedPharmacy.sessionToken
      });
    }
    
    setConnectedPharmacy(null);
    localStorage.removeItem('pharmacy_session');
  };

  const signOut = async () => {
    // Désactiver les sessions actives
    if (personnel?.id) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('personnel_id', personnel.id)
        .eq('is_active', true);
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPersonnel(null);
    setPharmacy(null);
    setSecurityLevel('standard');
    setRequires2FA(false);
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
    disconnectPharmacy
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};