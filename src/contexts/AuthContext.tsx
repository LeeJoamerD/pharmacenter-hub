import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Personnel = Tables<'personnel'>;
type Pharmacy = Tables<'pharmacies'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  personnel: Personnel | null;
  pharmacy: Pharmacy | null;
  loading: boolean;
  securityLevel: string;
  requires2FA: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, personnelData: Partial<Personnel>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateSecurityContext: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [securityLevel, setSecurityLevel] = useState<string>('standard');
  const [requires2FA, setRequires2FA] = useState<boolean>(false);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch personnel data
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (personnelError) {
        console.error('Error fetching personnel:', personnelError);
        return;
      }

      setPersonnel(personnelData);

      // Fetch pharmacy data
      if (personnelData?.tenant_id) {
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', personnelData.tenant_id)
          .single();

        if (pharmacyError) {
          console.error('Error fetching pharmacy:', pharmacyError);
          return;
        }

        setPharmacy(pharmacyData);
      }

      // Mettre à jour le contexte de sécurité
      await updateSecurityContext();
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  const updateSecurityContext = async () => {
    if (!personnel?.id || !pharmacy?.id) return;

    try {
      // Récupérer la session utilisateur active
      const { data: userSession } = await supabase
        .from('user_sessions')
        .select('security_level, requires_2fa')
        .eq('personnel_id', personnel.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (userSession) {
        setSecurityLevel(userSession.security_level);
        setRequires2FA(userSession.requires_2fa);
      }

      // Vérifier les politiques de sécurité pour ce rôle
      const { data: passwordPolicy } = await supabase
        .from('password_policies')
        .select('force_2fa_for_roles')
        .eq('tenant_id', pharmacy.id)
        .single();

      if (passwordPolicy?.force_2fa_for_roles?.includes(personnel.role)) {
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
      if (data.user && personnelData.tenant_id) {
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
    loading,
    securityLevel,
    requires2FA,
    signIn,
    signUp,
    signOut,
    updateSecurityContext
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};