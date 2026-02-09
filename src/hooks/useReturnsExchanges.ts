import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Return {
  id: string;
  numero_retour: string;
  date_retour: string;
  vente_origine_id?: string;
  numero_vente_origine?: string;
  client_id?: string;
  type_operation: 'Retour' | 'Échange' | 'Avoir';
  montant_total_retour: number;
  montant_rembourse: number;
  montant_avoir: number;
  mode_remboursement?: 'Espèces' | 'Virement' | 'Avoir' | 'Crédit compte';
  statut: 'En attente' | 'Approuvé' | 'Rejeté' | 'Terminé';
  motif_retour: string;
  notes?: string;
  lignes?: ReturnLine[];
}

export interface ReturnLine {
  id: string;
  produit_id?: string;
  lot_id?: string;
  quantite_retournee: number;
  prix_unitaire: number;
  montant_ligne: number;
  etat_produit: 'Parfait' | 'Endommagé' | 'Expiré' | 'Non conforme';
  taux_remboursement: number;
  motif_ligne?: string;
  remis_en_stock: boolean;
}

export interface CreateReturnData {
  vente_origine_id: string;
  numero_vente_origine: string;
  client_id?: string;
  type_operation: 'Retour' | 'Échange' | 'Avoir';
  motif_retour: string;
  notes?: string;
  lignes: Omit<ReturnLine, 'id'>[];
}

export interface ReturnFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  statut?: string[];
  minAmount?: number;
  maxAmount?: number;
  clientId?: string;
  typeOperation?: string[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Hook pour gérer les retours et échanges de produits
 * Fonctionnalités: création, validation, traitement, statistiques
 */
export const useReturnsExchanges = () => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États pour filtres et pagination
  const [filters, setFilters] = useState<ReturnFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Récupérer tous les retours avec filtres et pagination
  const { data: returnsData, isLoading: returnsLoading } = useQuery({
    queryKey: ['returns', tenantId, filters, pagination.page, pagination.pageSize],
    queryFn: async () => {
      let query = supabase
        .from('retours')
        .select(`
          *,
          client:client_id(nom_complet, telephone, email),
          agent:agent_id(noms, prenoms),
          validateur:validateur_id(noms, prenoms),
          lignes_retours(
            *,
            produit:produit_id(libelle_produit)
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId!);

      // Appliquer filtres
      if (filters.search) {
        query = query.or(`numero_retour.ilike.%${filters.search}%,numero_vente_origine.ilike.%${filters.search}%,motif_retour.ilike.%${filters.search}%`);
      }
      
      if (filters.startDate) {
        query = query.gte('date_retour', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('date_retour', filters.endDate);
      }
      
      if (filters.statut && filters.statut.length > 0) {
        query = query.in('statut', filters.statut);
      }
      
      if (filters.minAmount !== undefined) {
        query = query.gte('montant_total_retour', filters.minAmount);
      }
      
      if (filters.maxAmount !== undefined) {
        query = query.lte('montant_total_retour', filters.maxAmount);
      }
      
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      
      if (filters.typeOperation && filters.typeOperation.length > 0) {
        query = query.in('type_operation', filters.typeOperation);
      }

      // Pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      const { data, error, count } = await query
        .order('date_retour', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Mapper lignes_retours vers lignes pour correspondre à l'interface Return
      const mappedData = (data || []).map((retour: any) => ({
        ...retour,
        lignes: retour.lignes_retours,
      }));
      
      return { 
        returns: mappedData as Return[], 
        total: count || 0 
      };
    },
    enabled: !!tenantId,
  });

  const returns = returnsData?.returns || [];
  const totalReturns = returnsData?.total || 0;

  // Récupérer un retour par ID
  const getReturnById = async (id: string): Promise<Return | null> => {
    const { data, error } = await supabase
      .from('retours')
      .select(`
        *,
        client:client_id(nom_complet, telephone),
        lignes_retours(
          *,
          produit:produit_id(libelle_produit, code_cip),
          lot:lot_id(numero_lot, date_peremption)
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching return:', error);
      return null;
    }
    
    // Mapper lignes_retours vers lignes pour cohérence avec l'interface Return
    const mappedReturn = {
      ...data,
      lignes: (data as any).lignes_retours,
    };
    return mappedReturn as Return;
  };

  // Rechercher transaction originale
  const searchOriginalTransaction = async (reference: string) => {
    const { data, error } = await supabase
      .from('ventes')
      .select(`
        id,
        numero_vente,
        date_vente,
        montant_net,
        client_id,
        client:clients(nom_complet),
        lignes_ventes(
          id,
          quantite,
          prix_unitaire_ttc,
          produit_id,
          numero_lot,
          date_peremption_lot,
          produit:produits(libelle_produit, code_cip)
        )
      `)
      .eq('tenant_id', tenantId!)
      .ilike('numero_vente', `%${reference}%`)
      .order('date_vente', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erreur recherche transaction:', error);
      throw error;
    }
    
    console.log('✅ Data reçue de Supabase:', data);
    return data;
  };

  // Calculer montant remboursement selon état produit
  const calculateRefundAmount = (
    items: Array<{ prix_unitaire: number; quantite_retournee: number; etat_produit: string }>
  ): number => {
    return items.reduce((total, item) => {
      let taux = 100; // Parfait = 100%
      if (item.etat_produit === 'Endommagé') taux = 50;
      if (item.etat_produit === 'Expiré' || item.etat_produit === 'Non conforme') taux = 0;
      
      return total + (item.prix_unitaire * item.quantite_retournee * taux / 100);
    }, 0);
  };

  // Créer un retour
  const createReturnMutation = useMutation({
    mutationFn: async (returnData: CreateReturnData) => {
      // Vérifier qu'il n'y a pas déjà un retour en cours pour cette vente
      const { data: existingReturns } = await supabase
        .from('retours')
        .select('id, numero_retour, statut')
        .eq('tenant_id', tenantId!)
        .eq('vente_origine_id', returnData.vente_origine_id)
        .in('statut', ['En attente', 'Approuvé']);
      
      if (existingReturns && existingReturns.length > 0) {
        throw new Error(
          `Un retour existe déjà pour cette transaction (${existingReturns[0].numero_retour} - ${existingReturns[0].statut})`
        );
      }

      // Générer numéro retour via RPC atomique
      const { data: numero, error: numeroError } = await supabase.rpc('generate_retour_number', {
        p_tenant_id: tenantId
      });

      if (numeroError || !numero) {
        throw new Error('Impossible de générer le numéro de retour');
      }

      // Calculer montants
      const montantTotal = returnData.lignes.reduce((sum, l) => sum + l.montant_ligne, 0);
      const montantRembourse = calculateRefundAmount(returnData.lignes);

      // Créer le retour
      const { data: retour, error: retourError } = await supabase
        .from('retours')
        .insert({
          tenant_id: tenantId,
          numero_retour: numero,
          vente_origine_id: returnData.vente_origine_id,
          numero_vente_origine: returnData.numero_vente_origine,
          client_id: returnData.client_id,
          type_operation: returnData.type_operation,
          montant_total_retour: montantTotal,
          montant_rembourse: montantRembourse,
          montant_avoir: returnData.type_operation === 'Avoir' ? montantRembourse : 0,
          mode_remboursement: returnData.type_operation === 'Avoir' ? 'Avoir' : 'Espèces',
          statut: 'En attente',
          motif_retour: returnData.motif_retour,
          notes: returnData.notes,
        })
        .select()
        .single();

      if (retourError) throw retourError;

      // Créer les lignes de retour
      const lignes = returnData.lignes.map(ligne => ({
        tenant_id: tenantId,
        retour_id: retour.id,
        ...ligne,
      }));

      const { error: lignesError } = await supabase
        .from('lignes_retours')
        .insert(lignes);

      if (lignesError) throw lignesError;

      return retour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      toast({
        title: 'Retour créé',
        description: 'La demande de retour a été créée avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de créer le retour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Valider un retour (Approuver/Rejeter)
  const validateReturnMutation = useMutation({
    mutationFn: async ({ id, decision, validatorId }: { 
      id: string; 
      decision: 'Approuvé' | 'Rejeté';
      validatorId: string;
    }) => {
      // Vérifier que validatorId n'est pas vide
      if (!validatorId) {
        throw new Error('Utilisateur non identifié. Veuillez vous reconnecter.');
      }

      const { data, error } = await supabase
        .from('retours')
        .update({
          statut: decision,
          validateur_id: validatorId,
          date_validation: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      
      // Vérifier que l'UPDATE a bien fonctionné
      if (!data) {
        throw new Error('Impossible de valider le retour. Vérifiez vos permissions.');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      toast({
        title: 'Retour validé',
        description: 'Le retour a été traité avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de valider le retour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Traiter le retour (remboursement + réintégration stock via RPC atomique)
  const processReturnMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const retour = await getReturnById(returnId);
      if (!retour || retour.statut !== 'Approuvé') {
        throw new Error('Le retour doit être approuvé avant traitement');
      }

      // Filtrer les lignes éligibles (état OK, lot_id présent, pas encore réintégré)
      const lignesAReintegrer = retour.lignes?.filter(l => 
        (l.etat_produit === 'Parfait' || l.etat_produit === 'Endommagé') && 
        l.lot_id &&
        !l.remis_en_stock  // Éviter double réintégration
      );

      if (lignesAReintegrer && lignesAReintegrer.length > 0) {
        for (const ligne of lignesAReintegrer) {
          // Utiliser la RPC atomique pour réintégrer le stock
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'rpc_stock_record_movement',
            {
              p_type_mouvement: 'entree',
              p_produit_id: ligne.produit_id,
              p_quantite_mouvement: ligne.quantite_retournee,
              p_lot_id: ligne.lot_id,
              p_prix_unitaire: ligne.prix_unitaire,
              p_reference_id: retour.id,
              p_reference_type: 'retour',
              p_reference_document: retour.numero_retour,
              p_motif: retour.motif_retour || 'Réintégration stock suite retour'
            }
          );

          // Vérifier le résultat de la RPC
          if (rpcError) {
            throw new Error(`Erreur RPC: ${rpcError.message}`);
          }
          
          const result = rpcResult as { success: boolean; error?: string };
          if (!result.success) {
            throw new Error(`Échec réintégration: ${result.error}`);
          }

          // Marquer comme remis en stock
          const { error: updateError } = await supabase
            .from('lignes_retours')
            .update({ remis_en_stock: true })
            .eq('id', ligne.id)
            .eq('tenant_id', tenantId);

          if (updateError) {
            throw new Error(`Erreur mise à jour ligne: ${updateError.message}`);
          }
        }
      }

      // Marquer le retour comme terminé
      const { error } = await supabase
        .from('retours')
        .update({ statut: 'Terminé' })
        .eq('id', returnId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // === Mise à jour du statut de la vente originale ===
      if (retour.vente_origine_id) {
        // 1. Récupérer les quantités vendues
        const { data: lignesVente } = await supabase
          .from('lignes_ventes')
          .select('produit_id, quantite')
          .eq('vente_id', retour.vente_origine_id)
          .eq('tenant_id', tenantId!);

        // 2. Récupérer tous les retours terminés pour cette vente (y compris celui-ci)
        const { data: retoursTermines } = await supabase
          .from('retours')
          .select('id')
          .eq('vente_origine_id', retour.vente_origine_id)
          .eq('tenant_id', tenantId!)
          .eq('statut', 'Terminé');

        const retourIds = (retoursTermines || []).map(r => r.id);

        if (retourIds.length > 0 && lignesVente && lignesVente.length > 0) {
          // 3. Récupérer toutes les lignes retournées de ces retours
          const { data: lignesRetournees } = await supabase
            .from('lignes_retours')
            .select('produit_id, quantite_retournee')
            .in('retour_id', retourIds)
            .eq('tenant_id', tenantId!);

          // 4. Sommer les quantités retournées par produit
          const qteRetourneesParProduit: Record<string, number> = {};
          (lignesRetournees || []).forEach(lr => {
            if (lr.produit_id) {
              qteRetourneesParProduit[lr.produit_id] = (qteRetourneesParProduit[lr.produit_id] || 0) + lr.quantite_retournee;
            }
          });

          // 5. Vérifier si tout est retourné
          const toutRetourne = lignesVente.every(lv => {
            if (!lv.produit_id) return true;
            return (qteRetourneesParProduit[lv.produit_id] || 0) >= lv.quantite;
          });

          if (toutRetourne) {
            const { error: updateVenteError } = await supabase
              .from('ventes')
              .update({ statut: 'Remboursée' })
              .eq('id', retour.vente_origine_id)
              .eq('tenant_id', tenantId!);

            if (updateVenteError) {
              console.error('Erreur mise à jour statut vente:', updateVenteError);
            } else {
              console.log('✅ Vente marquée comme Retournée:', retour.vente_origine_id);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['lots', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ventes'] });
      toast({
        title: 'Retour traité',
        description: 'Le retour a été traité et le stock mis à jour',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de traiter le retour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Statistiques des retours avec périodes
  const { data: statistics } = useQuery({
    queryKey: ['return-statistics', tenantId],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfWeek = new Date(today.setDate(today.getDate() - 7)).toISOString();
      const yesterday = new Date(today.setDate(today.getDate() - 1)).toISOString();

      // Tous les retours
      const { data: allReturns, error } = await supabase
        .from('retours')
        .select('montant_total_retour, montant_rembourse, statut, date_retour, created_at')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Retours du jour
      const returnsToday = allReturns?.filter(r => 
        new Date(r.created_at) >= new Date(startOfDay)
      ) || [];

      // Retours hier
      const returnsYesterday = allReturns?.filter(r => 
        new Date(r.created_at) >= new Date(yesterday) && 
        new Date(r.created_at) < new Date(startOfDay)
      ) || [];

      // Ventes de la semaine pour calculer taux
      const { data: ventesWeek } = await supabase
        .from('ventes')
        .select('id')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfWeek);

      const returnsWeek = allReturns?.filter(r => 
        new Date(r.created_at) >= new Date(startOfWeek)
      ) || [];

      const total = allReturns?.length || 0;
      const enAttente = allReturns?.filter(r => r.statut === 'En attente').length || 0;
      const approuves = allReturns?.filter(r => r.statut === 'Approuvé').length || 0;
      const rejetes = allReturns?.filter(r => r.statut === 'Rejeté').length || 0;
      const termines = allReturns?.filter(r => r.statut === 'Terminé').length || 0;
      const montantTotal = allReturns?.reduce((sum, r) => sum + (r.montant_total_retour || 0), 0) || 0;
      const montantRembourseTodaySum = returnsToday.reduce((sum, r) => sum + (r.montant_rembourse || 0), 0);
      const tauxRetour = (ventesWeek?.length || 0) > 0 ? (returnsWeek.length / ventesWeek.length) * 100 : 0;

      return {
        total,
        enAttente,
        approuves,
        rejetes,
        termines,
        montantTotal,
        montantRembourse: montantRembourseTodaySum,
        tauxRetour,
        returnsToday: returnsToday.length,
        returnsYesterday: returnsYesterday.length,
        trendToday: returnsToday.length - returnsYesterday.length,
      };
    },
    enabled: !!tenantId,
  });

  // Fonction pour mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<ReturnFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à page 1
  }, []);

  // Fonction pour changer de page
  const changePage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Export vers Excel
  const exportToExcel = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('retours')
        .select(`
          numero_retour,
          date_retour,
          numero_vente_origine,
          type_operation,
          montant_total_retour,
          montant_rembourse,
          statut,
          motif_retour,
          client:client_id(nom_complet, telephone)
        `)
        .eq('tenant_id', tenantId!);

      if (error) throw error;

      const exportData = data.map((r: any) => ({
        'N° Retour': r.numero_retour,
        'Date': new Date(r.date_retour).toLocaleDateString('fr-FR'),
        'Transaction Origine': r.numero_vente_origine,
        'Client': r.client?.nom_complet || '-',
        'Téléphone': r.client?.telephone || '-',
        'Type': r.type_operation,
        'Montant Total': r.montant_total_retour,
        'Montant Remboursé': r.montant_rembourse,
        'Statut': r.statut,
        'Motif': r.motif_retour
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Retours');
      XLSX.writeFile(wb, `retours_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export réussi',
        description: 'Le fichier Excel a été téléchargé',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [tenantId, toast]);

  // Export vers PDF
  const exportToPDF = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('retours')
        .select(`
          numero_retour,
          date_retour,
          numero_vente_origine,
          type_operation,
          montant_total_retour,
          montant_rembourse,
          statut,
          motif_retour,
          client:client_id(nom_complet)
        `)
        .eq('tenant_id', tenantId!)
        .order('date_retour', { ascending: false })
        .limit(100);

      if (error) throw error;

      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(18);
      doc.text('Rapport des Retours', 14, 22);
      doc.setFontSize(11);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

      // Tableau
      const tableData = data.map((r: any) => [
        r.numero_retour,
        new Date(r.date_retour).toLocaleDateString('fr-FR'),
        r.client?.nom_complet || '-',
        r.type_operation,
        `${r.montant_rembourse.toLocaleString()} FCFA`,
        r.statut
      ]);

      autoTable(doc, {
        head: [['N° Retour', 'Date', 'Client', 'Type', 'Montant', 'Statut']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`retours_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Export réussi',
        description: 'Le fichier PDF a été téléchargé',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [tenantId, toast]);

  return {
    returns,
    returnsLoading,
    totalReturns,
    filters,
    updateFilters,
    pagination: { ...pagination, total: totalReturns },
    changePage,
    getReturnById,
    searchOriginalTransaction,
    calculateRefundAmount,
    createReturn: createReturnMutation.mutateAsync,
    validateReturn: validateReturnMutation.mutateAsync,
    processReturn: processReturnMutation.mutateAsync,
    statistics,
    exportToExcel,
    exportToPDF,
  };
};
