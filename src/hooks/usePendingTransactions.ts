/**
 * Hook pour gérer les transactions en attente d'encaissement
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface PendingTransaction {
  id: string;
  numero_vente: string;
  date_vente: string;
  montant_net: number;
  montant_total_ttc: number;
  montant_total_ht?: number;
  montant_tva?: number;
  montant_centime_additionnel?: number;
  remise_globale: number;
  // Champs assurance
  taux_couverture_assurance?: number;
  montant_part_assurance?: number;
  montant_part_patient?: number;
  // Métadonnées client
  metadata?: {
    client_info?: {
      assureur_id?: string;
      assureur_libelle?: string;
      taux_agent?: number;
      taux_ayant_droit?: number;
      taux_ticket_moderateur?: number;
      montant_ticket_moderateur?: number;
      taux_remise_automatique?: number;
      montant_remise_automatique?: number;
      societe_id?: string;
      personnel_id?: string;
    };
  };
  client?: {
    id: string;
    nom_complet: string;
    type_client: string;
    taux_agent?: number;
    taux_remise_automatique?: number;
    taux_ticket_moderateur?: number;
    assureur_id?: string;
    assureur?: { libelle_assureur: string };
  };
  lignes_ventes: Array<{
    id: string;
    quantite: number;
    prix_unitaire_ttc: number;
    montant_ligne_ttc: number;
    numero_lot: string | null;
    date_peremption_lot: string | null;
    produit: {
      id: string;
      libelle_produit: string;
      code_cip?: string;
    };
  }>;
}

export const usePendingTransactions = (sessionId?: string) => {
  const { tenantId } = useTenant();

  const { data: pendingTransactions, isLoading, error, refetch } = useQuery({
    queryKey: ['pending-transactions', tenantId, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('ventes')
        .select(`
          id,
          numero_vente,
          date_vente,
          montant_net,
          montant_total_ttc,
          montant_total_ht,
          montant_tva,
          montant_centime_additionnel,
          remise_globale,
          taux_couverture_assurance,
          montant_part_assurance,
          montant_part_patient,
          metadata,
          client:clients(
            id, 
            nom_complet, 
            type_client,
            taux_agent,
            taux_remise_automatique,
            taux_ticket_moderateur,
            assureur_id,
            assureur:assureurs(libelle_assureur)
          ),
          lignes_ventes!lignes_ventes_vente_id_fkey(
            id,
            quantite,
            prix_unitaire_ttc,
            montant_ligne_ttc,
            numero_lot,
            date_peremption_lot,
            produit:produits!lignes_ventes_produit_id_fkey(id, libelle_produit, code_cip)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('session_caisse_id', sessionId)
        .eq('statut', 'En cours')
        .order('date_vente', { ascending: false });

      if (error) {
        console.error('Erreur récupération ventes en attente:', error);
        throw error;
      }

      return (data || []) as PendingTransaction[];
    },
    enabled: !!tenantId && !!sessionId,
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 10 * 1000 // Rafraîchir toutes les 10 secondes
  });

  // Recherche d'une transaction par numéro de vente
  const searchByInvoiceNumber = async (invoiceNumber: string): Promise<PendingTransaction | null> => {
    if (!tenantId || !invoiceNumber) return null;

    const { data, error } = await supabase
      .from('ventes')
      .select(`
        id,
        numero_vente,
        date_vente,
        montant_net,
        montant_total_ttc,
        montant_total_ht,
        montant_tva,
        montant_centime_additionnel,
        remise_globale,
        taux_couverture_assurance,
        montant_part_assurance,
        montant_part_patient,
        metadata,
        session_caisse_id,
        statut,
        client:clients(
          id, 
          nom_complet, 
          type_client,
          taux_agent,
          taux_remise_automatique,
          taux_ticket_moderateur,
          assureur_id,
          assureur:assureurs(libelle_assureur)
        ),
        lignes_ventes!lignes_ventes_vente_id_fkey(
          id,
          quantite,
          prix_unitaire_ttc,
          montant_ligne_ttc,
          numero_lot,
          date_peremption_lot,
          produit:produits!lignes_ventes_produit_id_fkey(id, libelle_produit, code_cip)
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('numero_vente', invoiceNumber.trim())
      .maybeSingle();

    if (error) {
      console.error('Erreur recherche transaction:', error);
      return null;
    }

    if (!data) return null;

    // Vérifier si déjà encaissée
    if (data.statut !== 'En cours') {
      throw new Error('Cette transaction a déjà été encaissée');
    }

    return data as PendingTransaction;
  };

  // Compter les transactions en attente pour une session
  const countPendingForSession = async (sessionIdToCheck: string): Promise<{ count: number; total: number }> => {
    const { data, error } = await supabase
      .from('ventes')
      .select('id, montant_net')
      .eq('tenant_id', tenantId)
      .eq('session_caisse_id', sessionIdToCheck)
      .eq('statut', 'En cours');

    if (error) {
      console.error('Erreur comptage transactions en attente:', error);
      return { count: 0, total: 0 };
    }

    const count = data?.length || 0;
    const total = (data || []).reduce((sum, v) => sum + (v.montant_net || 0), 0);

    return { count, total };
  };

  return {
    pendingTransactions: pendingTransactions || [],
    isLoading,
    error,
    refetch,
    searchByInvoiceNumber,
    countPendingForSession
  };
};
