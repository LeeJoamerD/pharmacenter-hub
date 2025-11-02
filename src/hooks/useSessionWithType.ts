import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { CashSession } from './useCashRegister';

export type TypeSession = 'Matin' | 'Midi' | 'Soir';

export interface SessionWithType extends CashSession {
  type_session: TypeSession;
  date_session: string;
  caisse_id?: string;
}

export interface SessionConfig {
  type_session: TypeSession;
  caisse_id: string;
  caissier_id: string;
  fond_caisse_ouverture: number;
}

export const useSessionWithType = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si une session est ouverte pour un type et une caisse
  const hasOpenSession = useCallback(async (
    type_session?: TypeSession,
    caisse_id?: string
  ): Promise<boolean> => {
    if (!tenantId) return false;

    try {
      const { data, error } = await supabase
        .rpc('has_open_session', { 
          p_type_session: type_session || null,
          p_caisse_id: caisse_id || null
        });

      if (error) throw error;

      return data as boolean;
    } catch (err) {
      console.error('Erreur vérification session:', err);
      return false;
    }
  }, [tenantId]);

  // Obtenir la session ouverte pour un type et une caisse
  const getOpenSession = useCallback(async (
    type_session: TypeSession,
    caisse_id: string
  ): Promise<SessionWithType | null> => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('sessions_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('type_session', type_session)
        .eq('caisse_id', caisse_id)
        .eq('statut', 'Ouverte')
        .eq('date_session', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return data as SessionWithType | null;
    } catch (err) {
      console.error('Erreur récupération session:', err);
      return null;
    }
  }, [tenantId]);

  // Obtenir toutes les sessions d'une journée
  const getDailySessions = useCallback(async (date?: string): Promise<SessionWithType[]> => {
    if (!tenantId) return [];

    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('sessions_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date_session', targetDate)
        .order('type_session', { ascending: true });

      if (error) throw error;

      return (data || []) as SessionWithType[];
    } catch (err) {
      console.error('Erreur récupération sessions journalières:', err);
      return [];
    }
  }, [tenantId]);

  // Ouvrir une nouvelle session avec type et caisse
  const openSessionWithType = useCallback(async (
    config: SessionConfig
  ): Promise<SessionWithType | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Vérifier qu'il n'y a pas déjà une session ouverte pour ce type et cette caisse
      const hasOpen = await hasOpenSession(config.type_session, config.caisse_id);
      
      if (hasOpen) {
        throw new Error(`Une session ${config.type_session} est déjà ouverte pour cette caisse`);
      }

      // Générer le numéro de session
      const { data: numeroSession, error: numeroError } = await supabase
        .rpc('generate_session_number', { 
          p_type_session: config.type_session,
          p_caisse_id: config.caisse_id
        });

      if (numeroError) throw numeroError;

      // Créer la nouvelle session
      const { data: newSession, error } = await supabase
        .from('sessions_caisse')
        .insert({
          tenant_id: tenantId,
          numero_session: numeroSession,
          caissier_id: config.caissier_id,
          agent_id: config.caissier_id,
          type_session: config.type_session,
          date_session: new Date().toISOString().split('T')[0],
          caisse_id: config.caisse_id,
          date_ouverture: new Date().toISOString(),
          fond_caisse_ouverture: config.fond_caisse_ouverture,
          statut: 'Ouverte'
        })
        .select()
        .single();

      if (error) throw error;

      // Enregistrer le mouvement initial
      await supabase
        .from('mouvements_caisse')
        .insert({
          tenant_id: tenantId,
          session_caisse_id: newSession.id,
          type_mouvement: 'Fond_initial',
          montant: config.fond_caisse_ouverture,
          description: `Fond de caisse initial - Session ${config.type_session}`,
          motif: `Fond de caisse initial - Session ${config.type_session}`,
          agent_id: config.caissier_id,
          date_mouvement: new Date().toISOString()
        });

      toast.success(`Session ${config.type_session} ouverte avec succès`);
      
      return newSession as SessionWithType;
    } catch (err) {
      console.error('Erreur ouverture session:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ouverture de la session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, hasOpenSession]);

  // Fermer une session
  const closeSessionWithType = useCallback(async (
    sessionId: string,
    montantReelFermeture: number,
    notes?: string
  ): Promise<SessionWithType | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Calculer le montant théorique
      const { data: montantTheorique, error: calcError } = await supabase
        .rpc('calculate_expected_closing', { 
          p_session_id: sessionId
        });

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
          fond_caisse_fermeture: montantReelFermeture,
          ecart: ecart,
          statut: 'Fermée',
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'ajustement si nécessaire
      if (ecart !== 0) {
        await supabase
          .from('mouvements_caisse')
          .insert({
            tenant_id: tenantId,
            session_caisse_id: sessionId,
            type_mouvement: 'Ajustement',
            montant: ecart,
            description: `Écart de fermeture: ${ecart > 0 ? 'excédent' : 'manquant'}`,
            motif: `Écart de fermeture: ${ecart > 0 ? 'excédent' : 'manquant'}`,
            date_mouvement: new Date().toISOString()
          });
      }

      toast.success('Session fermée avec succès');
      
      return updatedSession as SessionWithType;
    } catch (err) {
      console.error('Erreur fermeture session:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la fermeture de la session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Charger les caisses au montage
  useEffect(() => {
    if (tenantId) {
      loadCaisses();
    }
  }, [tenantId, loadCaisses]);

  return {
    caisses,
    loading,
    error,
    loadCaisses,
    hasOpenSession,
    getOpenSession,
    getDailySessions,
    openSessionWithType,
    closeSessionWithType
  };
};