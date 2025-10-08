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
        setItems([]);
        setLoading(false);
        return;
      }

      // Récupérer les lignes d'inventaire avec les détails des produits et lots
      const { data: lignes, error } = await supabase
        .from('inventaire_lignes')
        .select(`
          *,
          produits:produit_id (
            libelle_produit,
            prix_vente_ttc
          ),
          lots:lot_id (
            numero_lot,
            quantite_restante,
            emplacement
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('session_id', activeSessionId);

      if (error) throw error;

      // Transformer les données en ReconciliationItem
      const transformedItems: ReconciliationItem[] = (lignes || []).map(ligne => {
        const quantiteTheorique = ligne.lots?.quantite_restante || 0;
        const quantiteComptee = ligne.quantite_comptee || 0;
        const ecart = quantiteComptee - quantiteTheorique;
        const valeurUnitaire = ligne.produits?.prix_vente_ttc || 0;
        
        return {
          id: ligne.id,
          produit: ligne.produits?.libelle_produit || 'Produit inconnu',
          lot: ligne.lots?.numero_lot || 'N/A',
          quantiteTheorique,
          quantiteComptee,
          ecart,
          statut: ligne.statut_validation || 'en_attente',
          emplacement: ligne.lots?.emplacement || 'N/A',
          valeurUnitaire,
          valeurEcart: ecart * valeurUnitaire,
          dateComptage: new Date(ligne.date_comptage || ligne.created_at),
          operateur: currentPersonnel ? `${currentPersonnel.prenoms} ${currentPersonnel.noms}` : 'N/A',
          commentaires: ligne.commentaires
        };
      });

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
          statut_validation: action,
          commentaires: comments,
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