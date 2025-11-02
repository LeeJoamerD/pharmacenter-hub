import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { TypeSession } from './useSessionWithType';

export interface SessionReport {
  session_id: string;
  tenant_id: string;
  numero_session: string;
  type_session: TypeSession;
  date_session: string;
  statut: string;
  nom_caisse?: string;
  code_caisse?: string;
  caisse_emplacement?: string;
  caissier_nom?: string;
  fond_caisse_ouverture: number;
  fond_caisse_fermeture?: number;
  montant_theorique_fermeture?: number;
  ecart?: number;
  date_ouverture: string;
  date_fermeture?: string;
  nombre_ventes: number;
  total_ventes: number;
  montant_moyen_vente: number;
  total_especes: number;
  total_carte: number;
  total_mobile: number;
  total_cheque: number;
  total_virement: number;
  total_entrees: number;
  total_sorties: number;
  nombre_articles_vendus: number;
}

export interface CaisseTypeReport {
  caisse_id: string;
  tenant_id: string;
  nom_caisse: string;
  code_caisse: string;
  type_session?: TypeSession;
  date_session?: string;
  nombre_sessions: number;
  total_ventes: number;
  nombre_ventes: number;
  montant_moyen_vente: number;
}

export interface DailyReport {
  tenant_id: string;
  date_session: string;
  nombre_sessions_ouvertes: number;
  nombre_caisses_actives: number;
  total_ventes_journee: number;
  nombre_ventes_journee: number;
  total_matin: number;
  total_midi: number;
  total_soir: number;
}

export const useSessionReports = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtenir le rapport complet d'une session
  const getSessionReport = useCallback(async (sessionId: string): Promise<SessionReport | null> => {
    if (!tenantId) return null;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('v_rapport_session_complet')
        .select('*')
        .eq('session_id', sessionId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;

      return data as SessionReport;
    } catch (err) {
      console.error('Erreur récupération rapport session:', err);
      const message = 'Erreur lors de la récupération du rapport';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Obtenir les rapports par caisse et type
  const getCaisseTypeReports = useCallback(async (
    date?: string,
    caisseId?: string,
    typeSession?: TypeSession
  ): Promise<CaisseTypeReport[]> => {
    if (!tenantId) return [];

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('v_rapport_par_caisse_type')
        .select('*')
        .eq('tenant_id', tenantId);

      if (date) {
        query = query.eq('date_session', date);
      }

      if (caisseId) {
        query = query.eq('caisse_id', caisseId);
      }

      if (typeSession) {
        query = query.eq('type_session', typeSession);
      }

      const { data, error } = await query.order('date_session', { ascending: false });

      if (error) throw error;

      return (data || []) as CaisseTypeReport[];
    } catch (err) {
      console.error('Erreur récupération rapports par caisse:', err);
      const message = 'Erreur lors de la récupération des rapports';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Obtenir le résumé journalier
  const getDailyReport = useCallback(async (date?: string): Promise<DailyReport | null> => {
    if (!tenantId) return null;

    const targetDate = date || new Date().toISOString().split('T')[0];

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('v_resume_journalier')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date_session', targetDate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return data as DailyReport | null;
    } catch (err) {
      console.error('Erreur récupération résumé journalier:', err);
      const message = 'Erreur lors de la récupération du résumé journalier';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Exporter un rapport en PDF (à implémenter)
  const exportSessionToPDF = useCallback(async (sessionId: string): Promise<void> => {
    const report = await getSessionReport(sessionId);
    
    if (!report) {
      toast.error('Impossible de récupérer le rapport');
      return;
    }

    // TODO: Implémenter l'export PDF
    toast.info('Export PDF en cours de développement');
  }, [getSessionReport]);

  return {
    loading,
    error,
    getSessionReport,
    getCaisseTypeReports,
    getDailyReport,
    exportSessionToPDF
  };
};