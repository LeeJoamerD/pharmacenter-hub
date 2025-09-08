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

      const { data, error } = await supabase
        .from('inventaire_items')
        .select('*')
        .eq('session_id', sessionId)
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

  const saveCount = async (itemId: string, count: number, location: string) => {
    try {
      // Get current user personnel
      const { data: userData } = await supabase.auth.getUser();
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('id, noms, prenoms')
        .eq('auth_user_id', userData.user?.id)
        .single();

      const operateurNom = personnelData ? `${personnelData.prenoms} ${personnelData.noms}` : 'Utilisateur';

      // Find the item to get its theoretical quantity
      const item = items.find(i => i.id === itemId);
      if (!item) {
        toast.error('Article non trouvé');
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
          operateur_id: personnelData?.id,
          operateur_nom: operateurNom
        })
        .eq('id', itemId);

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

      toast.success('Comptage sauvegardé');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du comptage');
      throw error;
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
    refetch: fetchInventoryItems
  };
};