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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, personnelData: Partial<Personnel>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
    } catch (error) {
      console.error('Error in fetchUserData:', error);
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPersonnel(null);
    setPharmacy(null);
  };

  const value = {
    user,
    session,
    personnel,
    pharmacy,
    loading,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};