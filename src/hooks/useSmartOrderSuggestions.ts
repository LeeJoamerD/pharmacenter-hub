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

interface SaleForImport {
  id: string;
  numero_vente: string;
  date_vente: string;
  montant_total_ttc: number;
  client_name?: string;
  products_count: number;
}

interface SaleProductDetail {
  produit_id: string;
  libelle_produit: string;
  code_cip: string;
  quantite: number;
  prix_achat: number;
  categorie_tarification_id: string | null;
  niveau_detail: number;
}

export const useSmartOrderSuggestions = (
  existingProductIds: string[] = [],
  supplierId?: string
) => {
  const { tenantId } = useTenant();
  const { demands, isLoading: demandsLoading } = useProductDemands();
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Récupérer les produits demandés par les clients (niveau_detail = 1 uniquement)
  const clientDemandSuggestions = useMemo<SmartOrderSuggestion[]>(() => {
    if (!demands || demands.length === 0) return [];

    return demands
      .filter(demand => {
        // Exclure les produits déjà dans la commande
        if (existingProductIds.includes(demand.produit_id)) return false;
        return demand.produit?.id;
      })
      .map(demand => ({
        produit_id: demand.produit_id,
        libelle_produit: demand.produit?.libelle_produit || 'Produit inconnu',
        code_cip: demand.produit?.code_cip || '',
        prix_achat: 0, // Sera mis à jour lors de l'ajout
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

      // Utiliser la RPC existante pour les alertes stock
      const { data, error } = await supabase.rpc('get_stock_alerts_with_products' as any, {
        p_tenant_id: tenantId,
        p_search: null,
        p_category: null,
        p_status: null,
        p_sort_by: 'statut',
        p_sort_order: 'desc',
        p_limit: 500, // Récupérer toutes les alertes
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
    staleTime: 60 * 1000, // Cache 1 minute
  });

  // Transformer les alertes en suggestions (filtrer niveau_detail = 1)
  const stockAlertSuggestions = useMemo<SmartOrderSuggestion[]>(() => {
    if (!stockAlerts || stockAlerts.length === 0) return [];

    return stockAlerts
      .filter((alert: any) => {
        // Exclure les produits déjà dans la commande
        if (existingProductIds.includes(alert.id)) return false;
        // Ne garder que les alertes (pas le stock normal)
        if (!['rupture', 'critique', 'faible'].includes(alert.stock_status)) return false;
        return true;
      })
      .map((alert: any) => {
        const source = alert.stock_status as SuggestionSource;
        const urgence: SuggestionUrgency = 
          alert.stock_status === 'rupture' ? 'haute' :
          alert.stock_status === 'critique' ? 'haute' :
          'moyenne';

        // Calcul de la quantité suggérée : seuil faible - stock actuel + marge de sécurité
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

  // Recherche de ventes récentes
  const {
    data: recentSales = [],
    isLoading: salesLoading
  } = useQuery({
    queryKey: ['recent-sales-for-import', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('ventes')
        .select(`
          id,
          numero_vente,
          date_vente,
          montant_total_ttc,
          client:clients(nom_complet),
          lignes_ventes(produit_id)
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .order('date_vente', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur récupération ventes:', error);
        return [];
      }

      return (data || []).map((sale: any) => ({
        id: sale.id,
        numero_vente: sale.numero_vente,
        date_vente: sale.date_vente,
        montant_total_ttc: sale.montant_total_ttc || 0,
        client_name: sale.client?.nom_complet || 'Client anonyme',
        products_count: sale.lignes_ventes?.length || 0,
      })) as SaleForImport[];
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
  });

  // Recherche de ventes par terme
  const searchSales = useCallback(async (searchTerm: string): Promise<SaleForImport[]> => {
    if (!tenantId || !searchTerm || searchTerm.length < 2) return recentSales;

    const { data, error } = await supabase
      .from('ventes')
      .select(`
        id,
        numero_vente,
        date_vente,
        montant_total_ttc,
        client:clients(nom_complet),
        lignes_ventes(produit_id)
      `)
      .eq('tenant_id', tenantId)
      .eq('statut', 'Validée')
      .or(`numero_vente.ilike.%${searchTerm}%`)
      .order('date_vente', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erreur recherche ventes:', error);
      return [];
    }

    return (data || []).map((sale: any) => ({
      id: sale.id,
      numero_vente: sale.numero_vente,
      date_vente: sale.date_vente,
      montant_total_ttc: sale.montant_total_ttc || 0,
      client_name: sale.client?.nom_complet || 'Client anonyme',
      products_count: sale.lignes_ventes?.length || 0,
    }));
  }, [tenantId, recentSales]);

  // Récupérer les produits d'une vente spécifique (niveau_detail = 1 uniquement)
  const getProductsFromSale = useCallback(async (saleId: string): Promise<SmartOrderSuggestion[]> => {
    if (!tenantId || !saleId) return [];

    const { data, error } = await supabase
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
      .eq('vente_id', saleId);

    if (error) {
      console.error('Erreur récupération lignes vente:', error);
      return [];
    }

    // Récupérer les infos de la vente pour la référence
    const { data: saleData } = await supabase
      .from('ventes')
      .select('numero_vente')
      .eq('id', saleId)
      .single();

    return (data || [])
      .filter((ligne: any) => {
        // Filtrer uniquement niveau_detail = 1
        const niveauDetail = ligne.produit?.niveau_detail;
        if (niveauDetail !== 1) return false;
        // Exclure les produits déjà dans la commande
        if (existingProductIds.includes(ligne.produit_id)) return false;
        return ligne.produit?.id;
      })
      .map((ligne: any) => ({
        produit_id: ligne.produit_id,
        libelle_produit: ligne.produit?.libelle_produit || 'Produit inconnu',
        code_cip: ligne.produit?.code_cip || '',
        prix_achat: ligne.produit?.prix_achat || 0,
        categorie_tarification_id: ligne.produit?.categorie_tarification_id || null,
        source: 'vente' as SuggestionSource,
        quantite_suggeree: Math.ceil(ligne.quantite),
        urgence: 'moyenne' as SuggestionUrgency,
        vente_reference: saleData?.numero_vente || saleId,
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
    
    // Ventes pour import
    recentSales,
    searchSales,
    getProductsFromSale,
    selectedSaleId,
    setSelectedSaleId,
    
    // États de chargement
    isLoading: demandsLoading || alertsLoading || salesLoading,
    demandsLoading,
    alertsLoading,
    salesLoading,
  };
};
