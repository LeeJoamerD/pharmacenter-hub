import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReconciliationItem {
  id: string;
  produit: string;
  lot: string;
  quantiteTheorique: number;
  quantiteComptee: number;
  ecart: number;
  statut: 'en_attente' | 'valide' | 'rejete';
  emplacement: string;
  valeurUnitaire: number;
  valeurEcart: number;
  dateComptage: Date;
  operateur: string;
  commentaires?: string;
}

export interface ReconciliationSummary {
  totalProduits: number;
  produitsEcart: number;
  ecartPositif: number;
  ecartNegatif: number;
  valeurEcartTotal: number;
  tauxPrecision: number;
}

export const useInventoryReconciliation = () => {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalProduits: 0,
    produitsEcart: 0,
    ecartPositif: 0,
    ecartNegatif: 0,
    valeurEcartTotal: 0,
    tauxPrecision: 0
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventaire_sessions')
        .select('*')
        .in('statut', ['en_cours', 'terminee'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
    }
  };

  const fetchReconciliationData = async (sessionId?: string) => {
    try {
      setLoading(true);
      
      // Pour l'instant, on utilise des données mockées
      const mockItems: ReconciliationItem[] = [
        {
          id: '1',
          produit: 'Paracétamol 1000mg',
          lot: 'LOT2024001',
          quantiteTheorique: 50,
          quantiteComptee: 48,
          ecart: -2,
          statut: 'en_attente',
          emplacement: 'A1-B2',
          valeurUnitaire: 12.50,
          valeurEcart: -25.00,
          dateComptage: new Date(),
          operateur: 'Marie Dubois',
          commentaires: 'Emballages endommagés'
        },
        {
          id: '2',
          produit: 'Amoxicilline 500mg',
          lot: 'LOT2024002',
          quantiteTheorique: 30,
          quantiteComptee: 32,
          ecart: 2,
          statut: 'valide',
          emplacement: 'B3-C1',
          valeurUnitaire: 8.75,
          valeurEcart: 17.50,
          dateComptage: new Date(),
          operateur: 'Jean Martin'
        }
      ];

      setItems(mockItems);

      // Calculer le résumé
      const totalProduits = mockItems.length;
      const produitsEcart = mockItems.filter(item => item.ecart !== 0).length;
      const ecartPositif = mockItems.filter(item => item.ecart > 0).length;
      const ecartNegatif = mockItems.filter(item => item.ecart < 0).length;
      const valeurEcartTotal = mockItems.reduce((sum, item) => sum + item.valeurEcart, 0);
      const tauxPrecision = ((totalProduits - produitsEcart) / totalProduits) * 100;

      setSummary({
        totalProduits,
        produitsEcart,
        ecartPositif,
        ecartNegatif,
        valeurEcartTotal,
        tauxPrecision
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données de réconciliation');
    } finally {
      setLoading(false);
    }
  };

  const validateItem = async (itemId: string, action: 'valide' | 'rejete', comments?: string) => {
    try {
      // Mettre à jour localement
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, statut: action, commentaires: comments }
          : item
      ));

      toast.success(`Article ${action === 'valide' ? 'validé' : 'rejeté'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation de l\'article');
      throw error;
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchReconciliationData();
  }, []);

  return {
    items,
    summary,
    sessions,
    loading,
    validateItem,
    refetch: fetchReconciliationData
  };
};