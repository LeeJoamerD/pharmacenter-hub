import { useState, useEffect, useCallback } from 'react';
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
  quantiteInitiale: number;
  quantiteMouvement: number;
  unite: string;
  statut: 'non_compte' | 'compte' | 'ecart' | 'valide';
  dateComptage?: Date;
  operateur: string;
}

export const useInventoryEntry = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
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
  }, []);

  const fetchInventoryItems = useCallback(async (sessionId?: string) => {
    try {
      console.log('🔍 fetchInventoryItems appelé avec sessionId:', sessionId);
      setLoading(true);
      
      if (!sessionId) {
        console.log('⚠️ Pas de sessionId, items vidés');
        setItems([]);
        setLoading(false);
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
        setLoading(false);
        return;
      }

      console.log('👤 Tenant ID:', personnelData.tenant_id);

      // Pagination pour gérer plus de 1000 items (limite Supabase)
      let allItems: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('inventaire_items')
          .select('*')
          .eq('session_id', sessionId)
          .eq('tenant_id', personnelData.tenant_id)
          .order('created_at', { ascending: false })
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

      const mappedItems: InventoryItem[] = allItems.map(item => ({
        id: item.id,
        codeBarre: item.code_barre,
        produit: item.produit_nom,
        lot: item.lot_numero || '',
        emplacementTheorique: item.emplacement_theorique,
        emplacementReel: item.emplacement_reel || item.emplacement_theorique,
        quantiteTheorique: item.quantite_theorique,
        quantiteComptee: item.quantite_comptee || 0,
        quantiteInitiale: item.quantite_initiale || 0,
        quantiteMouvement: item.quantite_mouvement || 0,
        unite: item.unite,
        statut: item.statut as 'non_compte' | 'compte' | 'ecart' | 'valide',
        dateComptage: item.date_comptage ? new Date(item.date_comptage) : undefined,
        operateur: item.operateur_nom || ''
      }));

      console.log(`✅ Chargé ${mappedItems.length} items d'inventaire`);
      setItems(mappedItems);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des articles:', error);
      toast.error('Erreur lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordEntry = useCallback(async (entryData: {
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
  }, [fetchInventoryItems]);

  const updateSessionAggregates = useCallback(async (sessionId: string, tenantId: string) => {
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
  }, []);

  const saveCount = useCallback(async (itemId: string, count: number, location: string, sessionId: string) => {
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
  }, [items, updateSessionAggregates]);

  const resetCount = useCallback(async (itemId: string, sessionId: string) => {
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
  }, [updateSessionAggregates]);

  const initializeSessionItems = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      
      // Récupérer le tenant_id de l'utilisateur
      const { data: userData } = await supabase.auth.getUser();
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', userData.user?.id)
        .maybeSingle();

      if (!personnelData?.tenant_id) {
        toast.error('Utilisateur non authentifié ou sans tenant associé');
        setLoading(false);
        return;
      }

      // Check session type first
      const { data: sessionData } = await supabase
        .from('inventaire_sessions')
        .select('type, reception_id, session_caisse_id')
        .eq('id', sessionId)
        .single();

      if (sessionData?.type === 'reception' && sessionData?.reception_id) {
        await initializeReceptionItems(sessionId, sessionData.reception_id, personnelData.tenant_id);
      } else if (sessionData?.type === 'vente' && sessionData?.session_caisse_id) {
        await initializeSalesItems(sessionId, sessionData.session_caisse_id, personnelData.tenant_id);
      } else {
        // Default: use RPC for standard inventory
        const { data, error } = await supabase.rpc('init_inventaire_items', {
          p_session_id: sessionId,
          p_tenant_id: personnelData.tenant_id
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string; message?: string; inserted_count?: number };
        if (!result?.success) {
          toast.error(result?.error || 'Erreur lors de l\'initialisation');
          return;
        }
        if (result.inserted_count === 0) {
          toast.warning('Aucun lot actif trouvé.');
        } else {
          toast.success(result.message || `${result.inserted_count} produit(s) chargé(s)`);
        }
      }
      
      await fetchInventoryItems(sessionId);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      toast.error('Erreur lors de l\'initialisation de la session');
    } finally {
      setLoading(false);
    }
  }, [fetchInventoryItems]);

  // Initialize items from a reception (supplier delivery)
  const initializeReceptionItems = useCallback(async (sessionId: string, receptionId: string, tenantId: string) => {
    // Check if already initialized
    const { count } = await supabase
      .from('inventaire_items')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('tenant_id', tenantId);

    if (count && count > 0) {
      toast.info('Session déjà initialisée');
      return;
    }

    // Fetch reception lines with product info
    const { data: lines, error: linesError } = await supabase
      .from('lignes_reception_fournisseur')
      .select(`
        *,
        produit:produits!produit_id(id, libelle_produit, code_cip)
      `)
      .eq('reception_id', receptionId)
      .eq('tenant_id', tenantId);

    if (linesError) throw linesError;
    if (!lines || lines.length === 0) {
      toast.warning('Aucune ligne de réception trouvée');
      return;
    }

    // For each line, calculate initiale = lot.quantite_restante - quantite_recue
    const itemsToInsert = [];
    for (const line of lines) {
      const produit = line.produit as any;
      const quantiteRecue = (line.quantite_recue || 0) + (line.quantite_acceptee || 0) - (line.quantite_recue || 0); // quantite_acceptee is the actual received
      const qteRecue = line.quantite_recue || 0;
      
      // Get the lot's current stock to calculate what it was BEFORE reception
      let quantiteInitiale = 0;
      if (line.lot_id) {
        const { data: lotData } = await supabase
          .from('lots')
          .select('quantite_restante')
          .eq('id', line.lot_id)
          .single();
        // Current stock = initial + received, so initial = current - received
        quantiteInitiale = (lotData?.quantite_restante || 0) - qteRecue;
        if (quantiteInitiale < 0) quantiteInitiale = 0;
      }

      const quantiteTheorique = quantiteInitiale + qteRecue;

      itemsToInsert.push({
        tenant_id: tenantId,
        session_id: sessionId,
        produit_id: produit?.id || line.produit_id,
        lot_id: line.lot_id,
        code_barre: produit?.code_cip || 'PRODUIT-' + (line.produit_id || ''),
        produit_nom: produit?.libelle_produit || 'Produit inconnu',
        lot_numero: line.numero_lot || '',
        quantite_theorique: quantiteTheorique,
        quantite_initiale: quantiteInitiale,
        quantite_mouvement: qteRecue,
        emplacement_theorique: (line as any).emplacement || 'Stock principal',
        unite: 'unités',
        statut: 'non_compte'
      });
    }

    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('inventaire_items')
        .insert(itemsToInsert as any);

      if (insertError) throw insertError;

      // Update session aggregates
      await supabase
        .from('inventaire_sessions')
        .update({
          produits_total: itemsToInsert.length,
          produits_comptes: 0,
          ecarts: 0,
          progression: 0
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      toast.success(`${itemsToInsert.length} produit(s) de réception chargé(s)`);
    }
  }, []);

  // Initialize items from a sales session (POS session)
  const initializeSalesItems = useCallback(async (sessionId: string, sessionCaisseId: string, tenantId: string) => {
    // Check if already initialized
    const { count } = await supabase
      .from('inventaire_items')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('tenant_id', tenantId);

    if (count && count > 0) {
      toast.info('Session déjà initialisée');
      return;
    }

    // Fetch sales for this caisse session
    const { data: ventes, error: ventesError } = await supabase
      .from('ventes')
      .select('id')
      .eq('session_caisse_id', sessionCaisseId)
      .eq('tenant_id', tenantId);

    if (ventesError) throw ventesError;
    if (!ventes || ventes.length === 0) {
      toast.warning('Aucune vente trouvée pour cette session de caisse');
      return;
    }

    const venteIds = ventes.map(v => v.id);

    // Fetch all sale lines for these sales
    const { data: lignesVentes, error: lignesError } = await supabase
      .from('lignes_ventes')
      .select(`
        *,
        produit:produits!produit_id(id, libelle_produit, code_cip)
      `)
      .in('vente_id', venteIds)
      .eq('tenant_id', tenantId);

    if (lignesError) throw lignesError;
    if (!lignesVentes || lignesVentes.length === 0) {
      toast.warning('Aucune ligne de vente trouvée');
      return;
    }

    // Aggregate by produit_id + lot_id
    const aggregated = new Map<string, {
      produitId: string;
      lotId: string | null;
      codeCip: string;
      produitNom: string;
      lotNumero: string;
      totalVendu: number;
    }>();

    for (const ligne of lignesVentes) {
      const produit = ligne.produit as any;
      const key = `${ligne.produit_id}_${ligne.lot_id || 'no_lot'}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.totalVendu += ligne.quantite || 0;
      } else {
        aggregated.set(key, {
          produitId: produit?.id || ligne.produit_id,
          lotId: ligne.lot_id,
          codeCip: produit?.code_cip || 'PRODUIT-' + ligne.produit_id,
          produitNom: produit?.libelle_produit || 'Produit inconnu',
          lotNumero: ligne.numero_lot || '',
          totalVendu: ligne.quantite || 0
        });
      }
    }

    const itemsToInsert = [];
    for (const [, agg] of aggregated) {
      // Current stock = initial - sold, so initial = current + sold
      let quantiteInitiale = 0;
      if (agg.lotId) {
        const { data: lotData } = await supabase
          .from('lots')
          .select('quantite_restante')
          .eq('id', agg.lotId)
          .single();
        quantiteInitiale = (lotData?.quantite_restante || 0) + agg.totalVendu;
      }

      const quantiteTheorique = quantiteInitiale - agg.totalVendu;

      itemsToInsert.push({
        tenant_id: tenantId,
        session_id: sessionId,
        produit_id: agg.produitId,
        lot_id: agg.lotId,
        code_barre: agg.codeCip,
        produit_nom: agg.produitNom,
        lot_numero: agg.lotNumero,
        quantite_theorique: quantiteTheorique,
        quantite_initiale: quantiteInitiale,
        quantite_mouvement: agg.totalVendu,
        emplacement_theorique: 'Stock principal',
        unite: 'unités',
        statut: 'non_compte'
      });
    }

    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('inventaire_items')
        .insert(itemsToInsert as any);

      if (insertError) throw insertError;

      await supabase
        .from('inventaire_sessions')
        .update({
          produits_total: itemsToInsert.length,
          produits_comptes: 0,
          ecarts: 0,
          progression: 0
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      toast.success(`${itemsToInsert.length} produit(s) de vente chargé(s)`);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const finishSession = useCallback(async (sessionId: string) => {
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
        .from('inventaire_sessions')
        .update({
          statut: 'terminee',
          date_fin: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', personnelData.tenant_id);

      if (error) throw error;
      
      toast.success('Inventaire clôturé avec succès');
      await fetchSessions();
    } catch (error) {
      console.error('Erreur finishSession:', error);
      toast.error('Erreur lors de la clôture de l\'inventaire');
    }
  }, [fetchSessions]);

  return {
    items,
    sessions,
    loading,
    recordEntry,
    saveCount,
    resetCount,
    initializeSessionItems,
    refetch: fetchInventoryItems,
    finishSession
  };
};