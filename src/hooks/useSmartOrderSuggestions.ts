import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useProductDemands } from './useProductDemands';

export type SuggestionSource = 
  | 'demande_client' 
  | 'vente' 
  | 'rupture' 
  | 'critique' 
  | 'faible';

export type SuggestionUrgency = 'haute' | 'moyenne' | 'basse';

export interface SmartOrderSuggestion {
  produit_id: string;
  libelle_produit: string;
  code_cip: string;
  prix_achat: number;
  categorie_tarification_id: string | null;
  source: SuggestionSource;
  quantite_suggeree: number;
  urgence: SuggestionUrgency;
  stock_actuel?: number;
  stock_optimal?: number;
  nombre_demandes?: number;
  derniere_demande?: string;
  vente_reference?: string;
}

export interface SessionForImport {
  id: string;
  numero_session: string;
  date_ouverture: string;
  montant_total_ventes: number;
  agent_name: string;
}

export const useSmartOrderSuggestions = (
  existingProductIds: string[] = [],
  supplierId?: string
) => {
  const { tenantId } = useTenant();
  const { demands, isLoading: demandsLoading } = useProductDemands();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Récupérer les produits demandés par les clients (niveau_detail = 1 uniquement)
  const clientDemandSuggestions = useMemo<SmartOrderSuggestion[]>(() => {
    if (!demands || demands.length === 0) return [];

    return demands
      .filter(demand => {
        if (existingProductIds.includes(demand.produit_id)) return false;
        return demand.produit?.id;
      })
      .map(demand => ({
        produit_id: demand.produit_id,
        libelle_produit: demand.produit?.libelle_produit || 'Produit inconnu',
        code_cip: demand.produit?.code_cip || '',
        prix_achat: 0,
        categorie_tarification_id: null,
        source: 'demande_client' as SuggestionSource,
        quantite_suggeree: Math.max(1, demand.nombre_demandes),
        urgence: demand.nombre_demandes >= 5 ? 'haute' : demand.nombre_demandes >= 2 ? 'moyenne' : 'basse',
        nombre_demandes: demand.nombre_demandes,
        derniere_demande: demand.derniere_demande,
      }));
  }, [demands, existingProductIds]);

  // Récupérer les alertes de stock (rupture, critique, faible) - niveau_detail = 1 uniquement
  const {
    data: stockAlerts = [],
    isLoading: alertsLoading
  } = useQuery({
    queryKey: ['smart-order-stock-alerts', tenantId, existingProductIds.join(',')],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase.rpc('get_stock_alerts_with_products' as any, {
        p_tenant_id: tenantId,
        p_search: null,
        p_category: null,
        p_status: null,
        p_sort_by: 'statut',
        p_sort_order: 'desc',
        p_limit: 500,
        p_offset: 0
      });
      if (error) {
        console.error('Erreur récupération alertes stock:', error);
        return [];
      }
      const alertData = (data as any)?.data || [];
      return alertData;
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });

  // Transformer les alertes en suggestions (filtrer niveau_detail = 1)
  const stockAlertSuggestions = useMemo<SmartOrderSuggestion[]>(() => {
    if (!stockAlerts || stockAlerts.length === 0) return [];

    return stockAlerts
      .filter((alert: any) => {
        if (existingProductIds.includes(alert.id)) return false;
        if (!['rupture', 'critique', 'faible'].includes(alert.stock_status)) return false;
        return true;
      })
      .map((alert: any) => {
        const source = alert.stock_status as SuggestionSource;
        const urgence: SuggestionUrgency = 
          alert.stock_status === 'rupture' ? 'haute' :
          alert.stock_status === 'critique' ? 'haute' :
          'moyenne';
        const seuilOptimal = alert.seuil_faible || alert.seuil_critique || 10;
        const quantiteSuggeree = Math.max(1, Math.ceil((seuilOptimal - alert.stock_actuel) * 1.2));

        return {
          produit_id: alert.id,
          libelle_produit: alert.nom_produit || 'Produit inconnu',
          code_cip: alert.code_produit || '',
          prix_achat: alert.prix_unitaire || 0,
          categorie_tarification_id: null,
          source,
          quantite_suggeree: quantiteSuggeree,
          urgence,
          stock_actuel: alert.stock_actuel,
          stock_optimal: seuilOptimal,
        };
      });
  }, [stockAlerts, existingProductIds]);

  // Recherche de sessions de caisse récentes (fermées)
  const {
    data: recentSessions = [],
    isLoading: sessionsLoading
  } = useQuery({
    queryKey: ['recent-sessions-for-import', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('sessions_caisse')
        .select(`
          id,
          numero_session,
          date_ouverture,
          montant_total_ventes,
          statut,
          agent:personnel!sessions_caisse_agent_id_fkey(noms, prenoms)
        `)
        .eq('tenant_id', tenantId)
        .order('date_ouverture', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erreur récupération sessions:', error);
        return [];
      }

      return (data || []).map((session: any) => ({
        id: session.id,
        numero_session: session.numero_session || 'N/A',
        date_ouverture: session.date_ouverture,
        montant_total_ventes: session.montant_total_ventes || 0,
        agent_name: session.agent 
          ? `${session.agent.prenoms || ''} ${session.agent.noms || ''}`.trim() 
          : 'Agent inconnu',
      })) as SessionForImport[];
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });

  // Recherche de sessions par terme
  const searchSessions = useCallback(async (searchTerm: string): Promise<SessionForImport[]> => {
    if (!tenantId || !searchTerm || searchTerm.length < 2) return recentSessions;

    const { data, error } = await supabase
      .from('sessions_caisse')
      .select(`
        id,
        numero_session,
        date_ouverture,
        montant_total_ventes,
        statut,
        agent:personnel!sessions_caisse_agent_id_fkey(noms, prenoms)
      `)
      .eq('tenant_id', tenantId)
      .ilike('numero_session', `%${searchTerm}%`)
      .order('date_ouverture', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erreur recherche sessions:', error);
      return [];
    }

    return (data || []).map((session: any) => ({
      id: session.id,
      numero_session: session.numero_session || 'N/A',
      date_ouverture: session.date_ouverture,
      montant_total_ventes: session.montant_total_ventes || 0,
      agent_name: session.agent 
        ? `${session.agent.prenoms || ''} ${session.agent.noms || ''}`.trim() 
        : 'Agent inconnu',
    }));
  }, [tenantId, recentSessions]);

  // Récupérer les produits d'une session de caisse (niveau_detail = 1, agrégés)
  const getProductsFromSession = useCallback(async (sessionId: string): Promise<SmartOrderSuggestion[]> => {
    if (!tenantId || !sessionId) return [];

    // 1. Récupérer toutes les ventes de cette session
    const { data: ventes, error: ventesError } = await supabase
      .from('ventes')
      .select('id, numero_vente')
      .eq('tenant_id', tenantId)
      .eq('session_caisse_id', sessionId);

    if (ventesError || !ventes || ventes.length === 0) {
      console.error('Erreur récupération ventes de la session:', ventesError);
      return [];
    }

    const venteIds = ventes.map(v => v.id);

    // 2. Récupérer toutes les lignes de ventes avec produits
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_ventes')
      .select(`
        produit_id,
        quantite,
        produit:produits(
          id,
          libelle_produit,
          code_cip,
          prix_achat,
          categorie_tarification_id,
          niveau_detail
        )
      `)
      .in('vente_id', venteIds);

    if (lignesError) {
      console.error('Erreur récupération lignes ventes:', lignesError);
      return [];
    }

    // 3. Filtrer niveau_detail = 1 et agréger par produit_id
    const aggregated = new Map<string, {
      produit_id: string;
      libelle_produit: string;
      code_cip: string;
      prix_achat: number;
      categorie_tarification_id: string | null;
      quantite_totale: number;
    }>();

    for (const ligne of (lignes || [])) {
      const produit = ligne.produit as any;
      if (!produit?.id || produit.niveau_detail !== 1) continue;
      if (existingProductIds.includes(ligne.produit_id)) continue;

      const existing = aggregated.get(ligne.produit_id);
      if (existing) {
        existing.quantite_totale += ligne.quantite || 0;
      } else {
        aggregated.set(ligne.produit_id, {
          produit_id: ligne.produit_id,
          libelle_produit: produit.libelle_produit || 'Produit inconnu',
          code_cip: produit.code_cip || '',
          prix_achat: produit.prix_achat || 0,
          categorie_tarification_id: produit.categorie_tarification_id || null,
          quantite_totale: ligne.quantite || 0,
        });
      }
    }

    return Array.from(aggregated.values()).map(item => ({
      produit_id: item.produit_id,
      libelle_produit: item.libelle_produit,
      code_cip: item.code_cip,
      prix_achat: item.prix_achat,
      categorie_tarification_id: item.categorie_tarification_id,
      source: 'vente' as SuggestionSource,
      quantite_suggeree: Math.ceil(item.quantite_totale),
      urgence: 'moyenne' as SuggestionUrgency,
      vente_reference: `Session ${sessionId.substring(0, 8)}`,
    }));
  }, [tenantId, existingProductIds]);

  // Compter les suggestions par source
  const suggestionCounts = useMemo(() => ({
    demandes: clientDemandSuggestions.length,
    ruptures: stockAlertSuggestions.filter(s => s.source === 'rupture').length,
    critiques: stockAlertSuggestions.filter(s => s.source === 'critique').length,
    faibles: stockAlertSuggestions.filter(s => s.source === 'faible').length,
    total: clientDemandSuggestions.length + stockAlertSuggestions.length,
  }), [clientDemandSuggestions, stockAlertSuggestions]);

  // Suggestions triées par urgence
  const allSuggestions = useMemo(() => {
    const all = [...clientDemandSuggestions, ...stockAlertSuggestions];
    return all.sort((a, b) => {
      const urgencyOrder = { haute: 0, moyenne: 1, basse: 2 };
      return urgencyOrder[a.urgence] - urgencyOrder[b.urgence];
    });
  }, [clientDemandSuggestions, stockAlertSuggestions]);

  return {
    // Suggestions par catégorie
    clientDemandSuggestions,
    stockAlertSuggestions,
    allSuggestions,
    
    // Compteurs
    suggestionCounts,
    
    // Sessions pour import
    recentSessions,
    searchSessions,
    getProductsFromSession,
    selectedSessionId,
    setSelectedSessionId,
    
    // États de chargement
    isLoading: demandsLoading || alertsLoading || sessionsLoading,
    demandsLoading,
    alertsLoading,
    sessionsLoading,
  };
};
