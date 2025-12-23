import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface TauxTVA {
  id: string;
  tenant_id: string;
  nom_taux: string;
  taux_pourcentage: number;
  type_taux: 'Standard' | 'Réduit' | 'Exonéré' | 'Spécial';
  description?: string;
  est_actif: boolean;
  est_par_defaut: boolean;
  created_at: string;
  updated_at: string;
}

export interface ObligationFiscale {
  id: string;
  tenant_id: string;
  type_obligation: string;
  frequence: 'Mensuel' | 'Trimestriel' | 'Annuel';
  prochaine_echeance: string;
  statut: 'En attente' | 'Planifié' | 'Traité' | 'En retard';
  rappel_email: boolean;
  rappel_jours_avant: number;
  description?: string;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConformiteFiscale {
  id: string;
  tenant_id: string;
  element_controle: string;
  statut_conformite: 'Conforme' | 'En cours' | 'À améliorer' | 'Non conforme';
  score_conformite: number;
  derniere_verification?: string;
  prochaine_verification?: string;
  description?: string;
  recommandations?: string;
  created_at: string;
  updated_at: string;
}

export interface ParametresFiscaux {
  id: string;
  tenant_id: string;
  regime_tva: 'Normal' | 'Simplifié' | 'Franchise';
  frequence_declaration: 'Mensuelle' | 'Trimestrielle' | 'Annuelle';
  numero_tva?: string;
  email_alertes?: string;
  alerte_echeances: boolean;
  alerte_seuil_tva: boolean;
  alerte_reglementations: boolean;
  rapport_mensuel_auto: boolean;
  jours_alerte_avant_echeance: number;
  created_at: string;
  updated_at: string;
}

export interface ArchiveFiscale {
  id: string;
  tenant_id: string;
  type_document: 'Déclaration TVA' | 'Facture' | 'Pièce justificative' | 'Rapport';
  reference_document: string;
  periode: string;
  fichier_url?: string;
  taille_fichier_ko: number;
  statut_archivage: 'Archivé' | 'En cours' | 'Expiré';
  date_archivage: string;
  date_expiration?: string;
  created_at: string;
  updated_at: string;
}

export interface TVADeclaration {
  id: string;
  tenant_id: string;
  exercice_id: string;
  periode: string;
  tva_collectee: number;
  tva_deductible: number;
  tva_a_payer: number;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface VATSummary {
  vatCollected: number;
  vatDeductible: number;
  vatDue: number;
  averageRate: number;
  salesHT: number;
  purchasesHT: number;
}

export const useFiscalManagement = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { formatPrice, currentCurrency, changeCurrency } = useCurrency();
  const { settings } = useGlobalSystemSettings();

  // ==================== PARAMÈTRES RÉGIONAUX ====================
  const { data: regionalParams, isLoading: loadingRegionalParams } = useQuery({
    queryKey: ['parametres_regionaux_fiscaux', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametres_regionaux_fiscaux')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Si pas de config, initialiser avec Congo-Brazzaville par défaut
      if (!data) {
        const { data: initData, error: initError } = await supabase
          .rpc('init_fiscal_params_for_tenant', { p_tenant_id: tenantId, p_country_code: 'CG' });
        
        if (initError) throw initError;
        
        // Récupérer la config nouvellement créée
        const { data: newData, error: fetchError } = await supabase
          .from('parametres_regionaux_fiscaux')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();
        
        if (fetchError) throw fetchError;
        return newData;
      }
      
      return data;
    },
    enabled: !!tenantId,
  });

  // Fonctions utilitaires
  const formatAmount = (amount: number): string => {
    return formatPrice(amount);
  };

  const getVATRate = (type: 'standard' | 'reduit' | 'super_reduit' = 'standard'): number => {
    if (!regionalParams) return 18.0;
    
    if (type === 'standard') {
      return regionalParams.taux_tva_standard || 18.0;
    }
    
    // Pour les taux réduits, parser le JSON
    if (regionalParams.taux_tva_reduits && typeof regionalParams.taux_tva_reduits === 'object') {
      const reduits = regionalParams.taux_tva_reduits as any;
      if (type === 'reduit' && reduits.reduit) {
        return reduits.reduit;
      }
      if (type === 'super_reduit' && reduits.super_reduit) {
        return reduits.super_reduit;
      }
    }
    
    return regionalParams.taux_tva_standard || 18.0;
  };

  // ==================== TAUX TVA ====================
  const { data: tauxTVA = [], isLoading: loadingTaux } = useQuery({
    queryKey: ['taux_tva', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('taux_tva')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('est_par_defaut', { ascending: false });
      
      if (error) throw error;
      return data as TauxTVA[];
    },
    enabled: !!tenantId,
  });

  const createTauxTVA = useMutation({
    mutationFn: async (taux: Omit<TauxTVA, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('taux_tva')
        .insert({ ...taux, tenant_id: tenantId } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taux_tva', tenantId] });
      toast.success('Taux TVA créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du taux TVA');
    },
  });

  const updateTauxTVA = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TauxTVA> & { id: string }) => {
      const { data, error } = await supabase
        .from('taux_tva')
        .update(updates as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taux_tva', tenantId] });
      toast.success('Taux TVA mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du taux TVA');
    },
  });

  const deleteTauxTVA = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('taux_tva')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taux_tva', tenantId] });
      toast.success('Taux TVA supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du taux TVA');
    },
  });

  // ==================== DÉCLARATIONS TVA ====================
  const { data: declarations = [], isLoading: loadingDeclarations } = useQuery({
    queryKey: ['tva_declaration', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tva_declaration')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as TVADeclaration[];
    },
    enabled: !!tenantId,
  });

  const createDeclaration = useMutation({
    mutationFn: async (declaration: Omit<TVADeclaration, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tva_declaration')
        .insert({ ...declaration, tenant_id: tenantId } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tva_declaration', tenantId] });
      toast.success('Déclaration créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la déclaration');
    },
  });

  const updateDeclaration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TVADeclaration> & { id: string }) => {
      const { data, error } = await supabase
        .from('tva_declaration')
        .update(updates as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tva_declaration', tenantId] });
      toast.success('Déclaration mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // ==================== OBLIGATIONS FISCALES ====================
  const { data: obligations = [], isLoading: loadingObligations } = useQuery({
    queryKey: ['obligations_fiscales', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligations_fiscales')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('est_actif', true)
        .order('prochaine_echeance', { ascending: true });
      
      if (error) throw error;
      return data as ObligationFiscale[];
    },
    enabled: !!tenantId,
  });

  const createObligation = useMutation({
    mutationFn: async (obligation: Omit<ObligationFiscale, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('obligations_fiscales')
        .insert({ ...obligation, tenant_id: tenantId } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations_fiscales', tenantId] });
      toast.success('Obligation créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'obligation');
    },
  });

  const updateObligation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ObligationFiscale> & { id: string }) => {
      const { data, error } = await supabase
        .from('obligations_fiscales')
        .update(updates as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations_fiscales', tenantId] });
      toast.success('Obligation mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // ==================== CONFORMITÉ ====================
  const { data: conformiteItems = [], isLoading: loadingConformite } = useQuery({
    queryKey: ['conformite_fiscale', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conformite_fiscale')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('score_conformite', { ascending: false });
      
      if (error) throw error;
      return data as ConformiteFiscale[];
    },
    enabled: !!tenantId,
  });

  const { data: scoreGlobal = 0 } = useQuery({
    queryKey: ['conformite_score_global', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conformite_fiscale')
        .select('score_conformite')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      if (!data || data.length === 0) return 0;
      
      const total = data.reduce((sum, item) => sum + item.score_conformite, 0);
      return Math.round(total / data.length);
    },
    enabled: !!tenantId,
  });

  const updateConformiteItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConformiteFiscale> & { id: string }) => {
      const { data, error } = await supabase
        .from('conformite_fiscale')
        .update(updates as any)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conformite_fiscale', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['conformite_score_global', tenantId] });
      toast.success('Conformité mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // ==================== PARAMÈTRES FISCAUX ====================
  const { data: parametresFiscaux } = useQuery({
    queryKey: ['parametres_fiscaux', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametres_fiscaux')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ParametresFiscaux | null;
    },
    enabled: !!tenantId,
  });

  const updateParametresFiscaux = useMutation({
    mutationFn: async (updates: Partial<ParametresFiscaux>) => {
      if (parametresFiscaux?.id) {
        const { data, error } = await supabase
          .from('parametres_fiscaux')
          .update(updates as any)
          .eq('id', parametresFiscaux.id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('parametres_fiscaux')
          .insert({ ...updates, tenant_id: tenantId } as any)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametres_fiscaux', tenantId] });
      toast.success('Paramètres mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des paramètres');
    },
  });

  // ==================== ARCHIVES ====================
  const { data: archives = [], isLoading: loadingArchives } = useQuery({
    queryKey: ['archives_fiscales', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archives_fiscales')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date_archivage', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ArchiveFiscale[];
    },
    enabled: !!tenantId,
  });

  const { data: capaciteArchivage = { used: 0, total: 10240 } } = useQuery({
    queryKey: ['capacite_archivage', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archives_fiscales')
        .select('taille_fichier_ko')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      const used = data?.reduce((sum, item) => sum + (item.taille_fichier_ko || 0), 0) || 0;
      return { used, total: 10240000 }; // 10 GB en Ko
    },
    enabled: !!tenantId,
  });

  // ==================== CALCUL TVA AUTOMATIQUE ====================
  const { data: vatSummary, isLoading: loadingVAT } = useQuery({
    queryKey: ['vat_summary', tenantId],
    queryFn: async (): Promise<VATSummary> => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

      // Ventes du mois
      const { data: ventes, error: ventesError } = await supabase
        .from('ventes')
        .select('montant_total_ttc, montant_total_ht')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfMonth)
        .lte('date_vente', endOfMonth);

      if (ventesError) throw ventesError;

      // Achats du mois - récupérer via lignes_reception_fournisseur
      // Utiliser prix_achat_unitaire_reel (colonne correcte) et filtrer côté client
      const { data: lignesReception, error: achatsError } = await supabase
        .from('lignes_reception_fournisseur')
        .select('prix_achat_unitaire_reel, quantite_recue, tenant_id, reception_id, receptions_fournisseurs(date_reception)')
        .eq('tenant_id', tenantId);

      if (achatsError) throw achatsError;

      // Filtrer par date côté client pour éviter les erreurs de relation PostgREST
      const filteredReceptions = lignesReception?.filter((l: any) => {
        const dateReception = l.receptions_fournisseurs?.date_reception;
        if (!dateReception) return false;
        return dateReception >= startOfMonth && dateReception <= endOfMonth;
      }) || [];

      const salesHT = ventes?.reduce((sum, v) => sum + (v.montant_total_ht || 0), 0) || 0;
      const salesTTC = ventes?.reduce((sum, v) => sum + (v.montant_total_ttc || 0), 0) || 0;
      const vatCollected = salesTTC - salesHT;

      const purchasesHT = filteredReceptions.reduce((sum, l: any) => sum + ((l.prix_achat_unitaire_reel || 0) * (l.quantite_recue || 0)), 0);
      const vatDeductible = purchasesHT * (getVATRate('standard') / 100);

      const vatDue = vatCollected - vatDeductible;
      const averageRate = salesHT > 0 ? (vatCollected / salesHT) * 100 : 0;

      return {
        vatCollected,
        vatDeductible,
        vatDue,
        averageRate,
        salesHT,
        purchasesHT,
      };
    },
    enabled: !!tenantId,
    retry: 1, // Réduire les tentatives en cas d'erreur
  });

  // ==================== ANALYTICS TAX ====================
  const { data: taxAnalytics = [] } = useQuery({
    queryKey: ['tax_analytics', tenantId],
    queryFn: async () => {
      const months = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { data: declarations } = await supabase
          .from('tva_declaration')
          .select('tva_a_payer')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        const tva = declarations?.reduce((sum, d) => sum + d.tva_a_payer, 0) || 0;

        months.push({
          month: date.toLocaleString('fr', { month: 'short' }),
          tva,
          is: 0,
          autres: Math.round(tva * 0.3),
        });
      }

      return months;
    },
    enabled: !!tenantId,
  });

  // ==================== GÉNÉRATION RAPPORTS ====================
  const generateJournalTVAPDF = () => {
    const doc = new jsPDF();
    const devise = regionalParams?.devise_principale || 'XAF';
    const pays = regionalParams?.pays || 'Congo-Brazzaville';
    const systeme = regionalParams?.systeme_comptable || 'OHADA';
    
    doc.setFontSize(16);
    doc.text('Journal TVA', 14, 20);
    doc.setFontSize(9);
    doc.text(`Pays: ${pays} | Système: ${systeme} | Devise: ${devise}`, 14, 28);
    doc.text(`Période: ${new Date().toLocaleDateString()}`, 14, 35);
    
    const tableData = declarations.map(d => [
      d.periode,
      formatAmount(d.tva_collectee),
      formatAmount(d.tva_deductible),
      formatAmount(d.tva_a_payer),
      d.statut,
    ]);

    (doc as any).autoTable({
      startY: 42,
      head: [['Période', 'TVA Collectée', 'TVA Déductible', 'TVA à Payer', 'Statut']],
      body: tableData,
    });

    // Footer avec mentions légales
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.text(regionalParams?.mention_legale_footer || '', 14, doc.internal.pageSize.height - 10);

    doc.save('journal_tva.pdf');
    toast.success('Journal TVA généré');
  };

  const generateEtatTVAExcel = () => {
    const devise = regionalParams?.devise_principale || 'XAF';
    const pays = regionalParams?.pays || 'Congo-Brazzaville';
    
    const wsData = [
      [`État TVA - ${pays}`, '', '', '', ''],
      [`Devise: ${devise}`, '', '', '', ''],
      [],
      ['Période', 'TVA Collectée', 'TVA Déductible', 'TVA à Payer', 'Statut'],
      ...declarations.map(d => [
        d.periode,
        d.tva_collectee,
        d.tva_deductible,
        d.tva_a_payer,
        d.statut,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'État TVA');
    XLSX.writeFile(wb, 'etat_tva.xlsx');
    toast.success('État TVA généré');
  };

  const generateAnnexeFiscalePDF = () => {
    const doc = new jsPDF();
    const devise = regionalParams?.devise_principale || 'XAF';
    const pays = regionalParams?.pays || 'Congo-Brazzaville';
    const systeme = regionalParams?.systeme_comptable || 'OHADA';
    
    doc.setFontSize(16);
    doc.text('Annexe Fiscale', 14, 20);
    doc.setFontSize(10);
    doc.text(`Année: ${new Date().getFullYear()}`, 14, 28);
    doc.setFontSize(9);
    doc.text(`Pays: ${pays} | Système: ${systeme} | Devise: ${devise}`, 14, 35);
    
    doc.text('Taux TVA Configurés:', 14, 48);
    const tauxData = tauxTVA.map(t => [
      t.nom_taux,
      t.taux_pourcentage + '%',
      t.type_taux,
      t.est_actif ? 'Actif' : 'Inactif',
    ]);

    (doc as any).autoTable({
      startY: 53,
      head: [['Nom', 'Taux', 'Type', 'Statut']],
      body: tauxData,
    });

    doc.setFontSize(8);
    doc.text(regionalParams?.mention_legale_footer || '', 14, doc.internal.pageSize.height - 10);

    doc.save('annexe_fiscale.pdf');
    toast.success('Annexe fiscale générée');
  };

  return {
    // Taux TVA
    tauxTVA,
    loadingTaux,
    createTauxTVA,
    updateTauxTVA,
    deleteTauxTVA,

    // Déclarations
    declarations,
    loadingDeclarations,
    createDeclaration,
    updateDeclaration,

    // Obligations
    obligations,
    loadingObligations,
    createObligation,
    updateObligation,

    // Conformité
    conformiteItems,
    scoreGlobal,
    loadingConformite,
    updateConformiteItem,

    // Paramètres
    parametresFiscaux,
    updateParametresFiscaux,

    // Archives
    archives,
    capaciteArchivage,
    loadingArchives,

    // VAT Summary
    vatSummary,
    loadingVAT,

    // Analytics
    taxAnalytics,

    // Rapports
    generateJournalTVAPDF,
    generateEtatTVAExcel,
    generateAnnexeFiscalePDF,

    // Paramètres régionaux
    regionalParams,
    loadingRegionalParams,
    formatAmount,
    getVATRate,
  };
};
