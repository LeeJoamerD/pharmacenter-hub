import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Personnel = Tables<'personnel'>;
type Pharmacy = Tables<'pharmacies'>;

interface ConnectedPharmacy extends Pharmacy {
  sessionToken: string;
}

// Format enrichi pour localStorage
interface PharmacySessionData {
  sessionToken: string;
  expiresAt: string;
  pharmacy: {
    id: string;
    name: string;
    email: string;
    city: string | null;
    status: string | null;
    address: string | null;
    departement: string | null;
    arrondissement: string | null;
  };
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
  setConnectedPharmacyFromSession: (sessionToken: string) => Promise<void>;
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
  
  // Ref pour éviter les récupérations multiples simultanées
  const isRecoveringSession = useRef(false);

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

  // Nouvelle fonction pour mettre à jour connectedPharmacy depuis un session token
  const setConnectedPharmacyFromSession = async (sessionToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-pharmacy-session', {
        body: { session_token: sessionToken }
      });
      
      if (error || !data?.valid) {
        console.error('AUTH: Session token invalide');
        return;
      }
      
      setConnectedPharmacy({
        ...data.pharmacy,
        sessionToken
      });
    } catch (error) {
      console.error('AUTH: Erreur setConnectedPharmacyFromSession:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // === PARTIE 4 : Restauration immédiate + validation asynchrone ===
    const restorePharmacySession = async (): Promise<boolean> => {
      const savedPharmacySession = localStorage.getItem('pharmacy_session');
      if (!savedPharmacySession) {
        console.log('AUTH: Aucune session pharmacie dans localStorage');
        return false;
      }
      
      try {
        const sessionData = JSON.parse(savedPharmacySession) as PharmacySessionData | { sessionToken: string; expiresAt: string };
        console.log('AUTH: Données localStorage pharmacy_session:', JSON.stringify(sessionData));
        
        // Vérifier que le sessionToken existe
        if (!sessionData.sessionToken) {
          console.log('AUTH: localStorage pharmacy_session sans sessionToken, suppression...');
          localStorage.removeItem('pharmacy_session');
          return false;
        }

        // Vérifier si la session a expiré localement
        if (sessionData.expiresAt) {
          const expiryDate = new Date(sessionData.expiresAt);
          if (expiryDate < new Date()) {
            console.log('AUTH: Session pharmacie expirée localement, suppression...');
            localStorage.removeItem('pharmacy_session');
            return false;
          }
        }
        
        // === ÉTAPE 1 : Restauration IMMÉDIATE depuis localStorage (si données enrichies) ===
        if ('pharmacy' in sessionData && sessionData.pharmacy) {
          console.log('AUTH: Restauration immédiate depuis localStorage:', sessionData.pharmacy.name);
          if (isMounted) {
            setConnectedPharmacy({
              ...sessionData.pharmacy as unknown as Pharmacy,
              sessionToken: sessionData.sessionToken
            });
          }
        }
        
        // === ÉTAPE 2 : Validation asynchrone en arrière-plan (non-bloquante) ===
        console.log('AUTH: Validation async en arrière-plan, token:', sessionData.sessionToken.substring(0, 8) + '...');
        
        supabase.functions.invoke('validate-pharmacy-session', {
          body: { session_token: sessionData.sessionToken }
        }).then(({ data, error }) => {
          if (!isMounted) return;
          
          // === PARTIE 1 : Tolérance aux erreurs réseau ===
          if (error) {
            // Distinguer erreur réseau vs erreur de validation
            const errorMessage = error.message?.toLowerCase() || '';
            const isNetworkError = 
              errorMessage.includes('network') || 
              errorMessage.includes('timeout') ||
              errorMessage.includes('fetch') ||
              errorMessage.includes('failed') ||
              errorMessage.includes('aborted') ||
              error.name === 'FunctionsFetchError';
            
            if (isNetworkError) {
              console.warn('AUTH: Erreur réseau validation, conservation session locale');
              // On garde la session locale restaurée à l'étape 1
              return;
            }
            
            // Erreur de validation réelle (API répond mais erreur)
            console.error('AUTH: Erreur validation session pharmacie:', error);
            setConnectedPharmacy(null);
            localStorage.removeItem('pharmacy_session');
            return;
          }
          
          const validationData = data as { valid: boolean; pharmacy: Pharmacy; error?: string } | null;
          
          if (validationData?.valid && validationData.pharmacy) {
            console.log('AUTH: Session pharmacie validée, mise à jour avec données serveur:', validationData.pharmacy.name);
            setConnectedPharmacy({
              ...validationData.pharmacy,
              sessionToken: sessionData.sessionToken
            });
            
            // Mettre à jour le localStorage avec les données fraîches
            const enrichedSession: PharmacySessionData = {
              sessionToken: sessionData.sessionToken,
              expiresAt: sessionData.expiresAt,
              pharmacy: {
                id: validationData.pharmacy.id,
                name: validationData.pharmacy.name,
                email: validationData.pharmacy.email,
                city: validationData.pharmacy.city,
                status: validationData.pharmacy.status,
                address: validationData.pharmacy.address,
                departement: validationData.pharmacy.departement,
                arrondissement: validationData.pharmacy.arrondissement
              }
            };
            localStorage.setItem('pharmacy_session', JSON.stringify(enrichedSession));
          } else {
            console.log('AUTH: Session pharmacie invalide ou expirée côté serveur:', validationData?.error);
            setConnectedPharmacy(null);
            localStorage.removeItem('pharmacy_session');
          }
        }).catch((fetchError) => {
          // Erreur de fetch (réseau) - conserver la session locale
          console.warn('AUTH: Erreur fetch validation (réseau), conservation session locale:', fetchError);
        });
        
        // Retourner true immédiatement si on a restauré depuis localStorage
        return 'pharmacy' in sessionData && !!sessionData.pharmacy;
      } catch (error) {
        console.error('AUTH: Erreur parsing session pharmacie:', error);
        localStorage.removeItem('pharmacy_session');
        return false;
      }
    };

    // Fonction d'initialisation séquentielle
    const initializeAuth = async () => {
      try {
        // 1. D'abord restaurer la session pharmacie depuis localStorage
        await restorePharmacySession();
        
        // 2. Ensuite vérifier la session auth Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // 3. Récupérer les données utilisateur si connecté
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error('AUTH: Erreur initialisation:', error);
      } finally {
        // 4. Seulement maintenant, le chargement est terminé
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Écouter les changements d'auth (après l'initialisation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Ne pas mettre loading à false ici pendant l'initialisation
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
      }
    );

    // Lancer l'initialisation séquentielle
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // === PARTIE 2 : Auto-récupération de session pharmacie ===
  useEffect(() => {
    // Condition : utilisateur avec tenant (pharmacy) mais pas de session pharmacie connectée
    // ET pas déjà en cours de récupération
    if (!loading && pharmacy && !connectedPharmacy && !isRecoveringSession.current) {
      isRecoveringSession.current = true;
      
      console.log('AUTH: Auto-récupération session pharmacie pour:', pharmacy.name);
      
      createPharmacySession().then(({ error }) => {
        if (error) {
          console.error('AUTH: Échec auto-récupération session pharmacie:', error);
        } else {
          console.log('AUTH: Session pharmacie auto-récupérée avec succès');
        }
        isRecoveringSession.current = false;
      }).catch((e) => {
        console.error('AUTH: Exception auto-récupération:', e);
        isRecoveringSession.current = false;
      });
    }
  }, [loading, pharmacy, connectedPharmacy]);

  const signIn = async (email: string, password: string) => {
    try {
      // Empêcher la connexion utilisateur sans pharmacie connectée
      if (!connectedPharmacy) {
        return { error: new Error('Aucune pharmacie connectée. Veuillez connecter votre pharmacie d\'abord.') };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Vérifier que l'utilisateur appartient au tenant actif
      const { data: verification, error: verifyError } = await supabase.rpc(
        'verify_user_belongs_to_tenant',
        { p_tenant_id: connectedPharmacy.id }
      );

      if (verifyError || !verification) {
        await supabase.auth.signOut();
        return { error: new Error('Erreur de vérification du compte') };
      }

      const verificationResult = verification as { belongs: boolean; error?: string };

      if (!verificationResult.belongs) {
        await supabase.auth.signOut();
        return { 
          error: new Error('Ce compte utilisateur n\'existe pas dans cette pharmacie. Veuillez vérifier que vous êtes connecté à la bonne pharmacie.') 
        };
      }

      return { error: null };
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
            role: personnelData.role || 'Vendeur'
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

  // === PARTIE 3 : Stockage enrichi du localStorage ===
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
        console.error('AUTH: Erreur RPC create_pharmacy_session:', sessionError);
        return { error: new Error('Erreur lors de la création de la session') };
      }

      const sessionResult = sessionData as { success: boolean; session_token?: string; expires_at?: string; error?: string };

      // Vérifier explicitement le succès de la création
      if (!sessionResult.success || !sessionResult.session_token) {
        console.error('AUTH: Échec création session pharmacie:', sessionResult.error);
        return { error: new Error(sessionResult.error || 'Échec création session pharmacie') };
      }

      const connectedPharmacyData: ConnectedPharmacy = {
        ...pharmacy,
        sessionToken: sessionResult.session_token
      };

      // Stocker la pharmacie connectée
      setConnectedPharmacy(connectedPharmacyData);
      
      // === NOUVEAU : Stockage enrichi avec données pharmacie ===
      const enrichedSession: PharmacySessionData = {
        sessionToken: sessionResult.session_token,
        expiresAt: sessionResult.expires_at || '',
        pharmacy: {
          id: pharmacy.id,
          name: pharmacy.name,
          email: pharmacy.email,
          city: pharmacy.city,
          status: pharmacy.status,
          address: pharmacy.address,
          departement: pharmacy.departement,
          arrondissement: pharmacy.arrondissement
        }
      };
      localStorage.setItem('pharmacy_session', JSON.stringify(enrichedSession));

      console.log('AUTH: Session pharmacie créée avec stockage enrichi, token:', sessionResult.session_token.substring(0, 8) + '...');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Fonction connectPharmacy - utilise maintenant authenticate_pharmacy RPC
  // PLUS DE supabase.auth.signInWithPassword !
  const connectPharmacy = async (email: string, password: string) => {
    try {
      console.log('AUTH: Tentative de connexion pharmacie avec email:', email);
      
      // Utiliser la nouvelle RPC authenticate_pharmacy
      const { data, error } = await supabase.rpc('authenticate_pharmacy', {
        p_email: email,
        p_password: password
      });

      if (error) {
        console.error('AUTH: Erreur RPC authenticate_pharmacy:', error);
        return { error: new Error('Erreur lors de la connexion') };
      }

      const result = data as { success: boolean; pharmacy?: Pharmacy; session_token?: string; expires_at?: string; error?: string } | null;

      if (!result?.success || !result.pharmacy) {
        console.log('AUTH: Échec authentification pharmacie:', result?.error);
        return { error: new Error(result?.error || 'Email ou mot de passe incorrect') };
      }

      console.log('AUTH: Connexion pharmacie réussie:', result.pharmacy.name);

      // Stocker la pharmacie connectée (SANS toucher à supabase.auth)
      const connectedPharmacyData: ConnectedPharmacy = {
        ...result.pharmacy,
        sessionToken: result.session_token!
      };

      setConnectedPharmacy(connectedPharmacyData);
      
      // === NOUVEAU : Stockage enrichi avec données pharmacie ===
      const enrichedSession: PharmacySessionData = {
        sessionToken: result.session_token!,
        expiresAt: result.expires_at || '',
        pharmacy: {
          id: result.pharmacy.id,
          name: result.pharmacy.name,
          email: result.pharmacy.email,
          city: result.pharmacy.city,
          status: result.pharmacy.status,
          address: result.pharmacy.address,
          departement: result.pharmacy.departement,
          arrondissement: result.pharmacy.arrondissement
        }
      };
      localStorage.setItem('pharmacy_session', JSON.stringify(enrichedSession));

      console.log('AUTH: Session pharmacie stockée avec enrichissement');
      
      return { error: null };
    } catch (error) {
      console.error('AUTH: Exception connectPharmacy:', error);
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
    disconnectPharmacy,
    setConnectedPharmacyFromSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
