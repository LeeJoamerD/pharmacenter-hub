import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';

export interface InventorySession {
  id: string;
  nom: string;
  description: string;
  dateCreation: Date;
  dateDebut?: Date;
  dateFin?: Date;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'suspendue';
  type: 'complet' | 'partiel' | 'cyclique';
  responsable: string;
  participants: string[];
  secteurs: string[];
  progression: number;
  produitsComptes: number;
  produitsTotal: number;
  ecarts: number;
}

export const useInventorySessions = () => {
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useTenant();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      if (!tenantId) {
        // Mock data when no tenant
        const mockSessions: InventorySession[] = [
          {
            id: '1',
            nom: 'Inventaire Test',
            description: 'Session de test',
            dateCreation: new Date(),
            statut: 'planifiee',
            type: 'complet',
            responsable: 'Test User',
            participants: [],
            secteurs: ['Test'],
            progression: 0,
            produitsComptes: 0,
            produitsTotal: 0,
            ecarts: 0
          }
        ];
        setSessions(mockSessions);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('inventaire_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedSessions: InventorySession[] = data?.map(session => ({
        id: session.id,
        nom: session.nom || 'Session sans nom',
        description: session.description || '',
        dateCreation: new Date(session.created_at),
        dateDebut: session.date_debut ? new Date(session.date_debut) : undefined,
        dateFin: session.date_fin ? new Date(session.date_fin) : undefined,
        statut: (session.statut || 'planifiee') as any,
        type: (session.type || 'complet') as any,
        responsable: session.responsable || 'Non assigné',
        participants: session.participants || [],
        secteurs: session.secteurs || [],
        progression: session.progression || 0,
        produitsComptes: session.produits_comptes || 0,
        produitsTotal: session.produits_total || 0,
        ecarts: session.ecarts || 0
      })) || [];

      setSessions(mappedSessions);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: any) => {
    toast.success('Fonctionnalité en cours d\'implémentation');
    return Promise.resolve();
  };

  const startSession = async (sessionId: string) => {
    toast.success('Session démarrée (mode démo)');
    return Promise.resolve();
  };

  useEffect(() => {
    fetchSessions();
  }, [tenantId]);

  return {
    sessions,
    loading,
    createSession,
    startSession,
    refetch: fetchSessions
  };
};