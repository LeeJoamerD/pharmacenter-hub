import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { usePersonnel } from '@/hooks/usePersonnel';
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

export const useInventoryReconciliation = (sessionId?: string) => {
  const { tenantId } = useTenant();
  const { currentPersonnel } = usePersonnel();
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
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('inventaire_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('statut', ['en_cours', 'terminee'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
    }
  };

  const fetchReconciliationData = async (targetSessionId?: string) => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const activeSessionId = targetSessionId || sessionId;
      
      if (!activeSessionId) {
        // Utiliser des données mockées si aucune session n'est sélectionnée
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
            operateur: currentPersonnel ? `${currentPersonnel.prenoms} ${currentPersonnel.noms}` : 'N/A',
            commentaires: 'Emballages endommagés'
          }
        ];
        setItems(mockItems);
        
        const totalProduits = mockItems.length;
        const produitsEcart = mockItems.filter(item => item.ecart !== 0).length;
        const ecartPositif = mockItems.filter(item => item.ecart > 0).length;
        const ecartNegatif = mockItems.filter(item => item.ecart < 0).length;
        const valeurEcartTotal = mockItems.reduce((sum, item) => sum + item.valeurEcart, 0);
        const tauxPrecision = totalProduits > 0 ? ((totalProduits - produitsEcart) / totalProduits) * 100 : 0;

        setSummary({
          totalProduits,
          produitsEcart,
          ecartPositif,
          ecartNegatif,
          valeurEcartTotal,
          tauxPrecision
        });
        
        setLoading(false);
        return;
      }

      // Récupérer les lignes d'inventaire
      const { data: lignes, error } = await supabase
        .from('inventaire_lignes')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('session_id', activeSessionId);

      if (error) throw error;

      // Pour chaque ligne, récupérer les détails du produit et du lot
      const transformedItems: ReconciliationItem[] = await Promise.all(
        (lignes || []).map(async (ligne) => {
          // Récupérer les détails du produit
          const { data: produit } = await supabase
            .from('produits')
            .select('libelle_produit, prix_vente_ttc')
            .eq('id', ligne.produit_id)
            .single();

          // Récupérer les détails du lot
          const { data: lot } = await supabase
            .from('lots')
            .select('numero_lot, quantite_restante, emplacement')
            .eq('id', ligne.lot_id)
            .single();

          const quantiteTheorique = lot?.quantite_restante || 0;
          const quantiteComptee = ligne.quantite_comptee || 0;
          const ecart = quantiteComptee - quantiteTheorique;
          const valeurUnitaire = produit?.prix_vente_ttc || 0;
          
          return {
            id: ligne.id,
            produit: produit?.libelle_produit || 'Produit inconnu',
            lot: lot?.numero_lot || 'N/A',
            quantiteTheorique,
            quantiteComptee,
            ecart,
            statut: (ligne.statut || 'en_attente') as 'en_attente' | 'valide' | 'rejete',
            emplacement: lot?.emplacement || ligne.emplacement_reel || 'N/A',
            valeurUnitaire,
            valeurEcart: ecart * valeurUnitaire,
            dateComptage: new Date(ligne.date_comptage || ligne.created_at),
            operateur: currentPersonnel ? `${currentPersonnel.prenoms} ${currentPersonnel.noms}` : 'N/A',
            commentaires: ligne.notes
          };
        })
      );

      setItems(transformedItems);

      // Calculer le résumé
      const totalProduits = transformedItems.length;
      const produitsEcart = transformedItems.filter(item => item.ecart !== 0).length;
      const ecartPositif = transformedItems.filter(item => item.ecart > 0).length;
      const ecartNegatif = transformedItems.filter(item => item.ecart < 0).length;
      const valeurEcartTotal = transformedItems.reduce((sum, item) => sum + item.valeurEcart, 0);
      const tauxPrecision = totalProduits > 0 
        ? ((totalProduits - produitsEcart) / totalProduits) * 100 
        : 0;

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
    if (!tenantId) return;
    
    try {
      // Mise à jour en base de données
      const { error } = await supabase
        .from('inventaire_lignes')
        .update({ 
          statut: action,
          notes: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Mettre à jour l'état local
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
    if (tenantId) {
      fetchSessions();
      fetchReconciliationData();
    }
  }, [sessionId, tenantId]);

  return {
    items,
    summary,
    sessions,
    loading,
    validateItem,
    refetch: fetchReconciliationData
  };
};