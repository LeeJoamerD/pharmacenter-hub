import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface CashSession {
  id: string;
  tenant_id: string;
  numero_session: string;
  caissier_id: string;
  date_ouverture: string;
  date_fermeture?: string;
  fond_caisse_ouverture: number;
  montant_theorique_fermeture?: number;
  montant_reel_fermeture?: number;
  ecart?: number;
  statut: 'Ouverte' | 'Fermée';
  created_at?: string;
  updated_at?: string;
}

export interface CashMovement {
  id: string;
  tenant_id: string;
  session_caisse_id: string;
  type_mouvement: 'Encaissement' | 'Retrait' | 'Fond_initial' | 'Ajustement';
  montant: number;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  agent_id?: string;
  date_mouvement: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionReport {
  session: CashSession;
  movements: CashMovement[];
  summary: {
    fondCaisseOuverture: number;
    totalEncaissements: number;
    totalRetraits: number;
    totalAjustements: number;
    montantTheorique: number;
    montantReel: number;
    ecart: number;
  };
}

const useCashRegister = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [allSessions, setAllSessions] = useState<CashSession[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la session active
  const loadCurrentSession = useCallback(async (): Promise<void> => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('sessions_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Ouverte')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCurrentSession(data as CashSession | null);
    } catch (err) {
      console.error('Erreur chargement session active:', err);
      const errorMessage = 'Erreur lors du chargement de la session active';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Charger toutes les sessions
  const loadAllSessions = useCallback(async (): Promise<void> => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('sessions_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date_ouverture', { ascending: false });

      if (error) throw error;

      setAllSessions((data || []) as CashSession[]);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      toast.error('Erreur lors du chargement des sessions');
    }
  }, [tenantId]);

  // Charger les mouvements d'une session
  const loadMovements = useCallback(async (sessionId: string): Promise<void> => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('mouvements_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('session_caisse_id', sessionId)
        .order('date_mouvement', { ascending: false });

      if (error) throw error;

      setMovements((data || []) as CashMovement[]);
    } catch (err) {
      console.error('Erreur chargement mouvements:', err);
      toast.error('Erreur lors du chargement des mouvements');
    }
  }, [tenantId]);

  // Ouvrir une nouvelle session
  const openSession = useCallback(async (
    caissierId: string,
    fondCaisseOuverture: number
  ): Promise<CashSession | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Vérifier qu'il n'y a pas de session ouverte
      const { data: existingSession } = await supabase
        .rpc('has_open_session' as any) as { data: boolean };

      if (existingSession) {
        throw new Error('Une session est déjà ouverte');
      }

      // Générer le numéro de session
      const { data: numeroSession, error: numeroError } = await supabase
        .rpc('generate_session_number' as any) as { data: string; error: any };

      if (numeroError) throw numeroError;

      // Créer la nouvelle session
      const { data: newSession, error } = await supabase
        .from('sessions_caisse')
        .insert({
          tenant_id: tenantId,
          numero_session: numeroSession,
          caissier_id: caissierId,
          date_ouverture: new Date().toISOString(),
          fond_caisse_ouverture: fondCaisseOuverture,
          statut: 'Ouverte' as const
        })
        .select()
        .single() as { data: CashSession; error: any };

      if (error) throw error;

      // Enregistrer le mouvement initial
      await supabase
        .from('mouvements_caisse')
        .insert({
          tenant_id: tenantId,
          session_caisse_id: newSession.id,
          type_mouvement: 'Fond_initial' as const,
          montant: fondCaisseOuverture,
          description: 'Fond de caisse initial',
          agent_id: caissierId,
          date_mouvement: new Date().toISOString()
        });

      setCurrentSession(newSession as CashSession);
      toast.success('Session ouverte avec succès');
      
      await loadAllSessions();
      return newSession;
    } catch (err) {
      console.error('Erreur ouverture session:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ouverture de la session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadAllSessions]);

  // Fermer une session de caisse
  const closeSession = useCallback(async (
    sessionId: string,
    montantReelFermeture: number,
    notes?: string
  ): Promise<CashSession | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Calculer le montant théorique
      const { data: montantTheorique, error: calcError } = await supabase
        .rpc('calculate_expected_closing' as any, { 
          p_session_id: sessionId
        }) as { data: number; error: any };

      if (calcError) throw calcError;

      const theorique = Number(montantTheorique) || 0;
      const ecart = Number(montantReelFermeture) - theorique;

      // Mettre à jour la session
      const { data: updatedSession, error } = await supabase
        .from('sessions_caisse')
        .update({
          date_fermeture: new Date().toISOString(),
          montant_reel_fermeture: montantReelFermeture,
          montant_theorique_fermeture: theorique,
          ecart: ecart,
          statut: 'Fermée' as const,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .select()
        .single() as { data: CashSession; error: any };

      if (error) throw error;

      setCurrentSession(updatedSession as CashSession);
      // Enregistrer le mouvement d'ajustement si nécessaire
      if (ecart !== 0) {
        await supabase
          .from('mouvements_caisse')
          .insert({
            tenant_id: tenantId,
            session_caisse_id: sessionId,
            type_mouvement: 'Ajustement' as const,
            montant: ecart,
            description: `Écart de fermeture: ${ecart > 0 ? 'excédent' : 'manquant'}`,
            date_mouvement: new Date().toISOString()
          });
      }

      setCurrentSession(null);
      toast.success('Session fermée avec succès');
      
      await loadAllSessions();
      return updatedSession;
    } catch (err) {
      console.error('Erreur fermeture session:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la fermeture de la session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadAllSessions]);

  // Enregistrer un mouvement de caisse
  const recordMovement = useCallback(async (
    sessionId: string,
    typeMouvement: CashMovement['type_mouvement'],
    montant: number,
    description: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<CashMovement | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    try {
      const { data: movement, error } = await supabase
        .from('mouvements_caisse')
        .insert({
          tenant_id: tenantId,
          session_caisse_id: sessionId,
          type_mouvement: typeMouvement,
          montant: montant,
          description: description,
          reference_id: referenceId,
          reference_type: referenceType,
          date_mouvement: new Date().toISOString()
        })
        .select()
        .single() as { data: CashMovement; error: any };

      if (error) throw error;

      toast.success('Mouvement enregistré avec succès');
      
      // Recharger les mouvements si c'est la session courante
      if (currentSession?.id === sessionId) {
        await loadMovements(sessionId);
      }
      
      return movement;
    } catch (err) {
      console.error('Erreur enregistrement mouvement:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du mouvement';
      setError(message);
      toast.error(message);
      throw err;
    }
  }, [tenantId, currentSession, loadMovements]);

  // Calculer le solde actuel d'une session
  const getSessionBalance = useCallback(async (sessionId: string): Promise<number> => {
    if (!tenantId) return 0;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions_caisse')
        .select('fond_caisse_ouverture')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .single() as { data: { fond_caisse_ouverture: number }; error: any };

      if (sessionError) throw sessionError;

      const { data: movements, error: movementsError } = await supabase
        .from('mouvements_caisse')
        .select('type_mouvement, montant')
        .eq('session_caisse_id', sessionId)
        .eq('tenant_id', tenantId) as { data: { type_mouvement: string; montant: number }[]; error: any };

      if (movementsError) throw movementsError;

      const totalMovements = movements?.reduce((total, m) => {
        const amount = m.type_mouvement === 'Retrait' ? -m.montant : m.montant;
        return total + amount;
      }, 0) || 0;

      return session.fond_caisse_ouverture + totalMovements;
    } catch (err) {
      console.error('Erreur calcul solde:', err);
      return 0;
    }
  }, [tenantId]);

  // Obtenir le rapport de caisse pour une session
  const getSessionReport = useCallback(async (sessionId: string): Promise<SessionReport | null> => {
    if (!tenantId) return null;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions_caisse')
        .select('*')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .single() as { data: CashSession; error: any };

      if (sessionError) throw sessionError;

      const { data: movements, error: movementsError } = await supabase
        .from('mouvements_caisse')
        .select('*')
        .eq('session_caisse_id', sessionId)
        .eq('tenant_id', tenantId)
        .order('date_mouvement', { ascending: true }) as { data: CashMovement[]; error: any };

      if (movementsError) throw movementsError;

      // Calculer les totaux par type de mouvement
      const totalEncaissements = movements
        ?.filter(m => m.type_mouvement === 'Encaissement')
        .reduce((total, m) => total + m.montant, 0) || 0;

      const totalRetraits = movements
        ?.filter(m => m.type_mouvement === 'Retrait')
        .reduce((total, m) => total + m.montant, 0) || 0;

      const totalAjustements = movements
        ?.filter(m => m.type_mouvement === 'Ajustement')
        .reduce((total, m) => total + m.montant, 0) || 0;

      const montantTheorique = session.fond_caisse_ouverture + totalEncaissements - totalRetraits + totalAjustements;

      return {
        session,
        movements: movements || [],
        summary: {
          fondCaisseOuverture: session.fond_caisse_ouverture,
          totalEncaissements,
          totalRetraits,
          totalAjustements,
          montantTheorique,
          montantReel: session.montant_reel_fermeture || 0,
          ecart: session.ecart || 0
        }
      };
    } catch (err) {
      console.error('Erreur génération rapport:', err);
      toast.error('Erreur lors de la génération du rapport');
      return null;
    }
  }, [tenantId]);

  // Charger les données au montage du composant
  useEffect(() => {
    if (tenantId) {
      loadCurrentSession();
      loadAllSessions();
    }
  }, [tenantId, loadCurrentSession, loadAllSessions]);

  return {
    // État
    currentSession,
    allSessions,
    movements,
    loading,
    error,
    
    // Fonctions de chargement
    loadCurrentSession,
    loadAllSessions,
    loadMovements,
    
    // Actions principales
    openSession,
    closeSession,
    recordMovement,
    getSessionBalance,
    getSessionReport
  };
};

export default useCashRegister;