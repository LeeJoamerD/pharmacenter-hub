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
    try {
      if (!tenantId) {
        toast.error('Aucun tenant trouvé');
        return;
      }

      // Get current user personnel
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (personnelError || !personnelData) {
        toast.error('Utilisateur non trouvé');
        return;
      }

      // Créer la session d'inventaire
      const { data: sessionInserted, error } = await supabase
        .from('inventaire_sessions')
        .insert({
          tenant_id: tenantId,
          nom: sessionData.nom,
          description: sessionData.description,
          type: sessionData.type,
          responsable: sessionData.responsable,
          secteurs: sessionData.secteurs,
          agent_id: personnelData.id,
          statut: 'planifiee',
          progression: 0,
          produits_comptes: 0,
          produits_total: 0,
          ecarts: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter quelques articles de test à la session
      const mockItems = [
        {
          tenant_id: tenantId,
          session_id: sessionInserted.id,
          code_barre: '3401353460101',
          produit_nom: 'Paracétamol 1000mg',
          lot_numero: 'LOT2024001',
          emplacement_theorique: 'A1-B2',
          quantite_theorique: 50,
          unite: 'boîtes',
          statut: 'non_compte'
        },
        {
          tenant_id: tenantId,
          session_id: sessionInserted.id,
          code_barre: '3401353460201',
          produit_nom: 'Amoxicilline 500mg',
          lot_numero: 'LOT2024002',
          emplacement_theorique: 'B3-C1',
          quantite_theorique: 30,
          unite: 'boîtes',
          statut: 'non_compte'
        },
        {
          tenant_id: tenantId,
          session_id: sessionInserted.id,
          code_barre: '3401053468451',
          produit_nom: 'Aspirine 100mg',
          lot_numero: 'LOT2024003',
          emplacement_theorique: 'C1-D3',
          quantite_theorique: 25,
          unite: 'boîtes',
          statut: 'non_compte'
        }
      ];

      const { error: itemsError } = await supabase
        .from('inventaire_items')
        .insert(mockItems);

      if (itemsError) {
        console.error('Erreur ajout articles:', itemsError);
        // Continue même si l'ajout des articles échoue
      }

      // Mettre à jour le total de produits dans la session
      await supabase
        .from('inventaire_sessions')
        .update({ produits_total: mockItems.length })
        .eq('id', sessionInserted.id);

      toast.success('Session d\'inventaire créée avec succès');
      await fetchSessions();
    } catch (error) {
      console.error('Erreur création session:', error);
      toast.error('Erreur lors de la création de la session');
    }
  };

  const startSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('inventaire_sessions')
        .update({ 
          statut: 'en_cours',
          date_debut: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Session démarrée avec succès');
      await fetchSessions();
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      toast.error('Erreur lors du démarrage');
    }
  };

  const stopSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('inventaire_sessions')
        .update({ 
          statut: 'terminee',
          date_fin: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Session arrêtée avec succès');
      await fetchSessions();
    } catch (error) {
      console.error('Erreur arrêt session:', error);
      toast.error('Erreur lors de l\'arrêt');
    }
  };

  const updateSession = async (sessionId: string, sessionData: Partial<InventorySession>) => {
    try {
      const { error } = await supabase
        .from('inventaire_sessions')
        .update({
          nom: sessionData.nom,
          description: sessionData.description,
          type: sessionData.type,
          responsable: sessionData.responsable,
          secteurs: sessionData.secteurs,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Session modifiée avec succès');
      await fetchSessions();
    } catch (error) {
      console.error('Erreur modification session:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [tenantId]);

  return {
    sessions,
    loading,
    createSession,
    startSession,
    stopSession,
    updateSession,
    refetch: fetchSessions
  };
};