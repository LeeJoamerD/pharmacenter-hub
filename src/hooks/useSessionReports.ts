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
      // Use sessions_caisse directly to avoid type issues with views
      const { data, error } = await supabase
        .from('sessions_caisse')
        .select('*, caisses(nom_caisse, code_caisse)')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;
      
      const caisse = data.caisses as { nom_caisse: string; code_caisse: string } | null;
      
      // Map the data to our SessionReport interface
      return {
        session_id: data.id,
        tenant_id: data.tenant_id,
        numero_session: data.numero_session || '',
        type_session: (data.type_session as TypeSession) || 'Matin',
        date_session: data.date_session || '',
        statut: data.statut || 'ouverte',
        nom_caisse: caisse?.nom_caisse,
        code_caisse: caisse?.code_caisse,
        fond_caisse_ouverture: data.fond_caisse_ouverture || 0,
        fond_caisse_fermeture: data.fond_caisse_fermeture,
        montant_theorique_fermeture: data.montant_theorique_fermeture,
        ecart: data.ecart,
        date_ouverture: data.date_ouverture || '',
        date_fermeture: data.date_fermeture,
        nombre_ventes: 0,
        total_ventes: 0,
        montant_moyen_vente: 0,
        total_especes: 0,
        total_carte: 0,
        total_mobile: 0,
        total_cheque: 0,
        total_virement: 0,
        total_entrees: 0,
        total_sorties: 0,
        nombre_articles_vendus: 0
      } as SessionReport;
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
        query = query.eq('date_journee', date);
      }

      if (caisseId) {
        query = query.eq('caisse_nom', caisseId);
      }

      if (typeSession) {
        query = query.eq('type_caisse', typeSession);
      }

      const { data, error } = await query.order('date_journee', { ascending: false });

      if (error) throw error;

      // Map the view data to our CaisseTypeReport interface
      return (data || []).map(row => ({
        caisse_id: row.caisse_nom || '',
        tenant_id: row.tenant_id,
        nom_caisse: row.caisse_nom || '',
        code_caisse: row.caisse_nom || '',
        type_session: row.type_caisse as TypeSession,
        date_session: row.date_journee,
        nombre_sessions: row.nombre_sessions || 0,
        total_ventes: row.total_encaissements || 0,
        nombre_ventes: 0,
        montant_moyen_vente: 0
      })) as CaisseTypeReport[];
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
        .eq('date_journee', targetDate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;
      
      // Map the view data to our DailyReport interface
      return {
        tenant_id: data.tenant_id,
        date_session: data.date_journee || targetDate,
        nombre_sessions_ouvertes: data.nombre_sessions || 0,
        nombre_caisses_actives: data.nombre_mouvements || 0,
        total_ventes_journee: data.total_encaissements || 0,
        nombre_ventes_journee: data.nombre_mouvements || 0,
        total_matin: 0,
        total_midi: 0,
        total_soir: 0
      } as DailyReport;
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