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
      
      return { 
        returns: data as Return[], 
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
    return data as Return;
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
      // Générer numéro retour
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const count = (returns?.length || 0) + 1;
      const numero = `RET-${dateStr}-${String(count).padStart(4, '0')}`;

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
      const { error } = await supabase
        .from('retours')
        .update({
          statut: decision,
          validateur_id: validatorId,
          date_validation: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
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

  // Traiter le retour (remboursement + réintégration stock)
  const processReturnMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const retour = await getReturnById(returnId);
      if (!retour || retour.statut !== 'Approuvé') {
        throw new Error('Le retour doit être approuvé avant traitement');
      }

      // Réintégrer le stock pour les produits en bon état
      const lignesAReintegrer = retour.lignes?.filter(l => 
        (l.etat_produit === 'Parfait' || l.etat_produit === 'Endommagé') && 
        l.lot_id
      );

      if (lignesAReintegrer && lignesAReintegrer.length > 0) {
        for (const ligne of lignesAReintegrer) {
          // Mettre à jour quantité lot
          const { data: lot } = await supabase
            .from('lots')
            .select('quantite_restante')
            .eq('id', ligne.lot_id)
            .single();
          
          if (lot) {
            await supabase
              .from('lots')
              .update({ quantite_restante: lot.quantite_restante + ligne.quantite_retournee })
              .eq('id', ligne.lot_id);
          }

          // Marquer comme remis en stock
          await supabase
            .from('lignes_retours')
            .update({ remis_en_stock: true })
            .eq('id', ligne.id);
        }
      }

      // Marquer le retour comme terminé
      const { error } = await supabase
        .from('retours')
        .update({ statut: 'Terminé' })
        .eq('id', returnId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['lots', tenantId] });
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
