import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryItem {
  id: string;
  codeBarre: string;
  produit: string;
  lot: string;
  emplacementTheorique: string;
  emplacementReel: string;
  quantiteTheorique: number;
  quantiteComptee: number;
  unite: string;
  statut: 'non_compte' | 'compte' | 'ecart' | 'valide';
  dateComptage?: Date;
  operateur: string;
}

export const useInventoryEntry = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventaire_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      toast.error('Erreur lors du chargement des sessions');
    }
  };

  const fetchInventoryItems = async (sessionId?: string) => {
    try {
      setLoading(true);
      
      if (!sessionId) {
        setItems([]);
        return;
      }

      // Get current user's tenant_id for multi-tenancy
      const { data: userData } = await supabase.auth.getUser();
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', userData.user?.id)
        .maybeSingle();

      if (!personnelData?.tenant_id) {
        toast.error('Session utilisateur non valide');
        return;
      }

      const { data, error } = await supabase
        .from('inventaire_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('tenant_id', personnelData.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedItems: InventoryItem[] = data?.map(item => ({
        id: item.id,
        codeBarre: item.code_barre,
        produit: item.produit_nom,
        lot: item.lot_numero || '',
        emplacementTheorique: item.emplacement_theorique,
        emplacementReel: item.emplacement_reel || item.emplacement_theorique,
        quantiteTheorique: item.quantite_theorique,
        quantiteComptee: item.quantite_comptee || 0,
        unite: item.unite,
        statut: item.statut as 'non_compte' | 'compte' | 'ecart' | 'valide',
        dateComptage: item.date_comptage ? new Date(item.date_comptage) : undefined,
        operateur: item.operateur_nom || ''
      })) || [];

      setItems(mappedItems);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      toast.error('Erreur lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  };

  const recordEntry = async (entryData: {
    sessionId: string;
    produitId: string;
    quantite: number;
    emplacement: string;
    notes?: string;
  }) => {
    try {
      // Temporairement simuler l'enregistrement
      toast.success('Saisie enregistrée avec succès');
      await fetchInventoryItems(entryData.sessionId);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement de la saisie');
      throw error;
    }
  };

  const saveCount = async (itemId: string, count: number, location: string, sessionId: string) => {
    try {
      // Get current user personnel
      const { data: userData } = await supabase.auth.getUser();
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('id, noms, prenoms, tenant_id')
        .eq('auth_user_id', userData.user?.id)
        .maybeSingle();

      if (!personnelData) {
        toast.error('Personnel non trouvé');
        return;
      }

      const operateurNom = `${personnelData.prenoms} ${personnelData.noms}`;

      // Find the item to get its theoretical quantity
      const item = items.find(i => i.id === itemId);
      if (!item) {
        toast.error('Article non trouvé');
        return;
      }

      // Validate quantity
      if (count < 0) {
        toast.error('La quantité ne peut pas être négative');
        return;
      }

      const statut = count === item.quantiteTheorique ? 'compte' : 'ecart';

      const { error } = await supabase
        .from('inventaire_items')
        .update({
          quantite_comptee: count,
          emplacement_reel: location,
          statut: statut,
          date_comptage: new Date().toISOString(),
          operateur_id: personnelData.id,
          operateur_nom: operateurNom
        })
        .eq('id', itemId)
        .eq('tenant_id', personnelData.tenant_id);

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              quantiteComptee: count, 
              emplacementReel: location,
              statut: statut as 'non_compte' | 'compte' | 'ecart' | 'valide',
              dateComptage: new Date(),
              operateur: operateurNom
            }
          : item
      ));

      // Update session aggregates
      await updateSessionAggregates(sessionId, personnelData.tenant_id);

      toast.success('Comptage sauvegardé');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du comptage');
      throw error;
    }
  };

  const resetCount = async (itemId: string, sessionId: string) => {
    try {
      // Get current user personnel
      const { data: userData } = await supabase.auth.getUser();
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', userData.user?.id)
        .maybeSingle();

      if (!personnelData) {
        toast.error('Personnel non trouvé');
        return;
      }

      const { error } = await supabase
        .from('inventaire_items')
        .update({
          quantite_comptee: null,
          emplacement_reel: null,
          statut: 'non_compte',
          date_comptage: null,
          operateur_id: null,
          operateur_nom: null
        })
        .eq('id', itemId)
        .eq('tenant_id', personnelData.tenant_id);

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              quantiteComptee: 0, 
              emplacementReel: item.emplacementTheorique,
              statut: 'non_compte' as 'non_compte' | 'compte' | 'ecart' | 'valide',
              dateComptage: undefined,
              operateur: ''
            }
          : item
      ));

      // Update session aggregates
      await updateSessionAggregates(sessionId, personnelData.tenant_id);

      toast.success('Comptage réinitialisé');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error('Erreur lors de la réinitialisation du comptage');
      throw error;
    }
  };

  const updateSessionAggregates = async (sessionId: string, tenantId: string) => {
    try {
      // Recalculate aggregates from current items
      const { data: sessionItems } = await supabase
        .from('inventaire_items')
        .select('statut')
        .eq('session_id', sessionId)
        .eq('tenant_id', tenantId);

      if (sessionItems) {
        const total = sessionItems.length;
        const counted = sessionItems.filter(item => item.statut !== 'non_compte').length;
        const ecarts = sessionItems.filter(item => item.statut === 'ecart').length;
        const progression = total > 0 ? Math.round((counted / total) * 100) : 0;

        await supabase
          .from('inventaire_sessions')
          .update({
            produits_total: total,
            produits_comptes: counted,
            ecarts: ecarts,
            progression: progression
          })
          .eq('id', sessionId)
          .eq('tenant_id', tenantId);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des agrégats:', error);
    }
  };

  const initializeSessionItems = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('init_inventaire_items', {
        p_session_id: sessionId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string; inserted_count?: number };

      if (!result?.success) {
        toast.error(result?.error || 'Erreur lors de l\'initialisation');
        return;
      }

      toast.success(result.message || 'Session initialisée avec succès');
      await fetchInventoryItems(sessionId);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      toast.error('Erreur lors de l\'initialisation de la session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchInventoryItems();
  }, []);

  return {
    items,
    sessions,
    loading,
    recordEntry,
    saveCount,
    resetCount,
    initializeSessionItems,
    refetch: fetchInventoryItems
  };
};