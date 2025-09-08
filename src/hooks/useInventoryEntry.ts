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
        .eq('statut', 'en_cours')
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
      
      // Pour l'instant, on utilise des données mockées car la table inventaire_items n'existe pas encore
      const mockItems: InventoryItem[] = [
        {
          id: '1',
          codeBarre: '3401353460101',
          produit: 'Paracétamol 1000mg',
          lot: 'LOT2024001',
          emplacementTheorique: 'A1-B2',
          emplacementReel: 'A1-B2',
          quantiteTheorique: 50,
          quantiteComptee: 48,
          unite: 'boîtes',
          statut: 'ecart',
          dateComptage: new Date(),
          operateur: 'Marie Dubois'
        },
        {
          id: '2',
          codeBarre: '3401353460201',
          produit: 'Amoxicilline 500mg',
          lot: 'LOT2024002',
          emplacementTheorique: 'B3-C1',
          emplacementReel: 'B3-C1',
          quantiteTheorique: 30,
          quantiteComptee: 30,
          unite: 'boîtes',
          statut: 'compte',
          dateComptage: new Date(),
          operateur: 'Jean Martin'
        }
      ];

      setItems(mockItems);
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
      // Temporairement mettre à jour localement
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              quantiteComptee: count, 
              emplacementReel: location,
              statut: count === item.quantiteTheorique ? 'compte' : 'ecart',
              dateComptage: new Date()
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