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

  const fetchReconciliationItems = useCallback(async (targetSessionId?: string) => {
    if (!tenantId) return [];
    
    const activeSessionId = targetSessionId || sessionId;
    if (!activeSessionId) return [];

    try {
      // Pagination pour gérer plus de 1000 items
      let allItems: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('inventaire_items')
          .select(`
            *,
            produit:produits(*),
            lot:lots(*)
          `)
          .eq('session_id', activeSessionId)
          .in('statut', ['ecart', 'compte'])
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allItems = [...allItems, ...data];
          from += batchSize;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        if (from >= 10000) {
          console.warn('Limite de 10000 items atteinte');
          hasMore = false;
        }
      }

      return (allItems || []).map(item => ({
        ...item,
        ecart: item.quantite_comptee - item.quantite_theorique,
        ecartValeur: (item.quantite_comptee - item.quantite_theorique) * (item.produit?.prix_vente_ttc || 0)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des items de réconciliation:', error);
      throw error;
    }
  }, [tenantId, sessionId]);

  const fetchReconciliationData = useCallback(async (targetSessionId?: string) => {
    if (!tenantId) return;
    
    const activeSessionId = targetSessionId || sessionId;
    
    console.log('🔍 [Réconciliation] fetchReconciliationData appelé', {
      targetSessionId,
      sessionId,
      activeSessionId,
      tenantId
    });
    
    try {
      setIsLoading(true);
      
      if (!activeSessionId) {
        // Pas de mock, juste vider les données
        setReconciliationItems([]);
        setSummary({
          totalProduits: 0,
          produitsEcart: 0,
          ecartPositif: 0,
          ecartNegatif: 0,
          valeurEcartTotal: 0,
          tauxPrecision: 0
        });
        setIsLoading(false);
        return;
      }

      // Pagination pour gérer plus de 1000 items
      let allItems: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('inventaire_items')
          .select(`
            *,
            produit:produits(*),
            lot:lots(*)
          `)
          .eq('tenant_id', tenantId)
          .eq('session_id', activeSessionId)
          .in('statut', ['ecart', 'compte', 'valide', 'rejete'])
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allItems = [...allItems, ...data];
          from += batchSize;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        if (from >= 10000) {
          console.warn('Limite de 10000 items atteinte');
          hasMore = false;
        }
      }

      const transformedItems: ReconciliationItem[] = (allItems || []).map((item) => {
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
          emplacement: item.emplacement_reel || 'N/A',
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
  const validateEcart = useCallback(async (itemId: string, motif?: string, actionCorrective?: string) => {
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
  }, [tenantId]);

  // Rejeter un écart
  const rejectEcart = useCallback(async (itemId: string, motif?: string, actionCorrective?: string) => {
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
  }, [tenantId]);

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
    console.log('[useInventoryReconciliation] useEffect triggered', { tenantId, sessionId, selectedSession });
    if (tenantId) {
      fetchSessions();
      // Utiliser selectedSession en priorité, sinon sessionId
      const activeSession = selectedSession || sessionId;
      if (activeSession) {
        fetchReconciliationData(activeSession);
      }
    }
  }, [tenantId, sessionId, selectedSession]);

  // Récupérer les produits conformes (sans écarts)
  const fetchConformItems = useCallback(async (sessionId: string) => {
    if (!tenantId) return [];
    
    try {
      // Pagination pour gérer plus de 1000 items
      let allItems: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('inventaire_items')
          .select('*')
          .eq('session_id', sessionId)
          .eq('tenant_id', tenantId)
          .eq('statut', 'compte')
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allItems = [...allItems, ...data];
          from += batchSize;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        if (from >= 10000) {
          console.warn('Limite de 10000 items atteinte');
          hasMore = false;
        }
      }

      // Filtrer côté client les produits où quantite_comptee = quantite_theorique
      const conformItems = allItems.filter(item => 
        item.quantite_comptee === item.quantite_theorique
      );

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
  }, [tenantId, currentPersonnel]);

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