import { useState, useEffect, useCallback } from 'react';
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
  unite: string;
  dateComptage: Date;
  operateur: string;
  commentaires?: string;
  motifEcart?: string;
  actionCorrective?: string;
  validePar?: string;
  dateValidation?: Date;
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
  console.log('[useInventoryReconciliation] Hook initialized with sessionId:', sessionId);
  
  const { tenantId } = useTenant();
  const { currentPersonnel } = usePersonnel();
  
  console.log('[useInventoryReconciliation] Context loaded:', { 
    tenantId, 
    hasPersonnel: !!currentPersonnel,
    personnelId: currentPersonnel?.id
  });
  
  const [reconciliationItems, setReconciliationItems] = useState<ReconciliationItem[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalProduits: 0,
    produitsEcart: 0,
    ecartPositif: 0,
    ecartNegatif: 0,
    valeurEcartTotal: 0,
    tauxPrecision: 0
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!tenantId) return;
    
    console.log('[useInventoryReconciliation] fetchSessions called', { tenantId });
    
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
  }, [tenantId]);

  const fetchReconciliationItems = async (targetSessionId?: string) => {
    if (!tenantId) return [];
    
    const activeSessionId = targetSessionId || sessionId;
    if (!activeSessionId) return [];

    try {
      // Récupérer les items avec écarts depuis inventaire_items
      const { data, error } = await supabase
        .from('inventaire_items')
        .select(`
          *,
          produit:produits(*),
          lot:lots(*)
        `)
        .eq('session_id', activeSessionId)
        .in('statut', ['ecart', 'compte']);

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        ecart: item.quantite_comptee - item.quantite_theorique,
        ecartValeur: (item.quantite_comptee - item.quantite_theorique) * (item.produit?.prix_vente_ttc || 0)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des items de réconciliation:', error);
      throw error;
    }
  };

  const fetchReconciliationData = useCallback(async (targetSessionId?: string) => {
    if (!tenantId) return;
    
    console.log('[useInventoryReconciliation] fetchReconciliationData called', { 
      targetSessionId, 
      sessionId, 
      tenantId,
      hasPersonnel: !!currentPersonnel 
    });
    
    try {
      setIsLoading(true);
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
            unite: 'boîte',
            dateComptage: new Date(),
            operateur: currentPersonnel ? `${currentPersonnel.prenoms} ${currentPersonnel.noms}` : 'N/A',
            commentaires: 'Emballages endommagés'
          }
        ];
        setReconciliationItems(mockItems);
        
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
        
        setIsLoading(false);
        return;
      }

      // Récupérer les items d'inventaire avec écarts
      const { data: items, error } = await supabase
        .from('inventaire_items')
        .select(`
          *,
          produit:produits(*),
          lot:lots(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('session_id', activeSessionId)
        .in('statut', ['ecart', 'compte', 'valide', 'rejete']);

      if (error) throw error;

      const transformedItems: ReconciliationItem[] = (items || []).map((item) => {
        const ecart = item.quantite_comptee - item.quantite_theorique;
        const valeurUnitaire = item.produit?.prix_vente_ttc || 0;
        
        return {
          id: item.id,
          produit: item.produit?.libelle_produit || 'Produit inconnu',
          lot: item.lot?.numero_lot || 'N/A',
          quantiteTheorique: item.quantite_theorique,
          quantiteComptee: item.quantite_comptee,
          ecart,
          statut: (item.statut || 'en_attente') as 'en_attente' | 'valide' | 'rejete',
          emplacement: item.emplacement_reel || item.lot?.emplacement || 'N/A',
          valeurUnitaire,
          valeurEcart: ecart * valeurUnitaire,
          unite: item.unite || 'unité',
          dateComptage: new Date(item.date_comptage || item.created_at),
          operateur: currentPersonnel ? `${currentPersonnel.prenoms} ${currentPersonnel.noms}` : 'N/A',
          commentaires: item.notes || undefined
        };
      });

      setReconciliationItems(transformedItems);

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
      setIsLoading(false);
    }
  }, [tenantId, sessionId, currentPersonnel]);

  // Valider un écart
  const validateEcart = async (itemId: string, motif?: string, actionCorrective?: string) => {
    if (!tenantId) return;
    
    try {
      const updateData: any = { statut: 'valide' };
      if (motif) updateData.motif_ecart = motif;
      if (actionCorrective) updateData.action_corrective = actionCorrective;
      
      const { error } = await supabase
        .from('inventaire_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Mettre à jour l'état local
      setReconciliationItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, statut: 'valide', motifEcart: motif, actionCorrective }
          : item
      ));

      toast.success('Écart validé avec succès');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation de l\'écart');
      throw error;
    }
  };

  // Rejeter un écart
  const rejectEcart = async (itemId: string, motif?: string, actionCorrective?: string) => {
    if (!tenantId) return;
    
    try {
      // Remettre statut à 'non_compte' pour recompter
      const updateData: any = {
        statut: 'non_compte',
        quantite_comptee: null,
        date_comptage: null,
        notes: null
      };
      if (motif) updateData.motif_ecart = motif;
      if (actionCorrective) updateData.action_corrective = actionCorrective;
      
      const { error } = await supabase
        .from('inventaire_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Retirer l'item de la liste locale (car il n'est plus dans les statuts 'ecart' ou 'compte')
      setReconciliationItems(prev => prev.filter(item => item.id !== itemId));

      toast.success('Écart rejeté - Article remis en attente de comptage');
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet de l\'écart');
      throw error;
    }
  };

  const validateItem = async (itemId: string, action: 'valide' | 'rejete', comments?: string) => {
    if (!tenantId) return;
    
    try {
      // Mise à jour en base de données
      const { error } = await supabase
        .from('inventaire_items')
        .update({ 
          statut: action,
          notes: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Mettre à jour l'état local
      if (action === 'rejete') {
        // Si rejeté, remettre en attente de comptage
        setReconciliationItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        setReconciliationItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, statut: action, commentaires: comments }
            : item
        ));
      }

      toast.success(`Article ${action === 'valide' ? 'validé' : 'rejeté'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation de l\'article');
      throw error;
    }
  };

  useEffect(() => {
    console.log('[useInventoryReconciliation] useEffect triggered', { tenantId, sessionId });
    if (tenantId) {
      fetchSessions();
      fetchReconciliationData();
    }
  }, [tenantId, sessionId, fetchSessions, fetchReconciliationData]);

  // Récupérer les produits conformes (sans écarts)
  const fetchConformItems = async (sessionId: string) => {
    if (!tenantId) return [];
    
    try {
      const { data, error } = await supabase
        .from('inventaire_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('tenant_id', tenantId)
        .eq('statut', 'compte');

      if (error) throw error;

      // Filtrer côté client les produits où quantite_comptee = quantite_theorique
      const conformItems = data?.filter(item => 
        item.quantite_comptee === item.quantite_theorique
      ) || [];

      return conformItems.map(item => ({
        id: item.id,
        produit: item.produit_nom || 'Produit inconnu',
        lot: item.lot_numero || 'Sans lot',
        emplacement: item.emplacement_reel || item.emplacement_theorique || 'Non défini',
        quantiteTheorique: item.quantite_theorique || 0,
        quantiteComptee: item.quantite_comptee || 0,
        ecart: 0,
        valeurEcart: 0,
        unite: item.unite || 'unité',
        statut: 'valide' as const,
        valeurUnitaire: 0,
        dateComptage: new Date(),
        operateur: currentPersonnel ? `${currentPersonnel.prenoms} ${currentPersonnel.noms}` : 'N/A',
        motifEcart: undefined,
        actionCorrective: undefined
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des produits conformes:', error);
      return [];
    }
  };

  return {
    reconciliationItems,
    summary,
    sessions,
    selectedSession,
    isLoading,
    setSelectedSession,
    fetchReconciliationItems,
    fetchConformItems,
    validateEcart,
    rejectEcart
  };
};