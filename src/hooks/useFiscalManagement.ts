import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  centime_additionnel_collecte: number;
  centime_additionnel_deductible: number;
  centime_additionnel_a_payer: number;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface VATSummary {
  vatCollected: number;
  vatDeductible: number;
  vatDue: number;
  centimeCollected: number;
  centimeDeductible: number;
  centimeDue: number;
  centimeRate: number;
  averageRate: number;
  salesHT: number;
  purchasesHT: number;
  asdiPaid: number;
  totalNetPayable: number;
}

export const useFiscalManagement = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { formatAmount, formatNumber, formatPercentage, getInputStep, isNoDecimalCurrency, getCurrencySymbol } = useCurrencyFormatting();
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

  // Fonctions utilitaires - utiliser celles du hook centralisé
  // formatAmount, formatNumber, formatPercentage viennent de useCurrencyFormatting

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
  const { data: vatSummary, isLoading: loadingVAT, refetch: refetchVAT } = useQuery({
    queryKey: ['vat_summary', tenantId],
    queryFn: async (): Promise<VATSummary> => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

      // Récupérer le taux de centime additionnel depuis les paramètres régionaux
      const centimeRate = regionalParams?.taux_centime_additionnel || 5.0;

      // Ventes du mois - inclure le centime additionnel collecté
      const { data: ventes, error: ventesError } = await supabase
        .from('ventes')
        .select('montant_total_ttc, montant_total_ht, montant_centime_additionnel')
        .eq('tenant_id', tenantId)
        .gte('date_vente', startOfMonth)
        .lte('date_vente', endOfMonth);

      if (ventesError) throw ventesError;

      // Achats du mois - lire les montants réels directement depuis receptions_fournisseurs
      const { data: receptions, error: achatsError } = await supabase
        .from('receptions_fournisseurs')
        .select('montant_ht, montant_tva, montant_centime_additionnel, montant_asdi')
        .eq('tenant_id', tenantId)
        .gte('date_reception', startOfMonth)
        .lte('date_reception', endOfMonth);

      if (achatsError) throw achatsError;

      const salesHT = ventes?.reduce((sum, v) => sum + (v.montant_total_ht || 0), 0) || 0;
      const salesTTC = ventes?.reduce((sum, v) => sum + (v.montant_total_ttc || 0), 0) || 0;
      const vatCollected = salesTTC - salesHT;
      
      // Centime Additionnel collecté depuis les ventes (ou calculé à partir de la TVA collectée)
      const centimeCollectedFromSales = ventes?.reduce((sum, v) => sum + (v.montant_centime_additionnel || 0), 0) || 0;
      const centimeCollected = centimeCollectedFromSales > 0 
        ? centimeCollectedFromSales 
        : vatCollected * (centimeRate / 100);

      // Montants réels des réceptions (pas de recalcul)
      const purchasesHT = receptions?.reduce((sum, r) => sum + (r.montant_ht || 0), 0) || 0;
      const vatDeductible = receptions?.reduce((sum, r) => sum + (r.montant_tva || 0), 0) || 0;
      const centimeDeductible = receptions?.reduce((sum, r) => sum + (r.montant_centime_additionnel || 0), 0) || 0;
      const asdiPaid = receptions?.reduce((sum, r) => sum + (r.montant_asdi || 0), 0) || 0;

      const vatDue = vatCollected - vatDeductible;
      const centimeDue = centimeCollected - centimeDeductible;
      const averageRate = salesHT > 0 ? (vatCollected / salesHT) * 100 : 0;
      const totalNetPayable = (vatDue + centimeDue) - asdiPaid;

      // Arrondir les valeurs pour éviter les erreurs de virgule flottante
      return {
        vatCollected: Math.round(vatCollected),
        vatDeductible: Math.round(vatDeductible),
        vatDue: Math.round(vatDue),
        centimeCollected: Math.round(centimeCollected),
        centimeDeductible: Math.round(centimeDeductible),
        centimeDue: Math.round(centimeDue),
        centimeRate,
        averageRate,
        salesHT: Math.round(salesHT),
        purchasesHT: Math.round(purchasesHT),
        asdiPaid: Math.round(asdiPaid),
        totalNetPayable: Math.round(totalNetPayable),
      };
    },
    enabled: !!tenantId && !!regionalParams,
    retry: 1,
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
    const centimeRate = regionalParams?.taux_centime_additionnel || 5.0;
    
    doc.setFontSize(16);
    doc.text('Journal TVA et Centime Additionnel', 14, 20);
    doc.setFontSize(9);
    doc.text(`Pays: ${pays} | Système: ${systeme} | Devise: ${devise}`, 14, 28);
    doc.text(`Période: ${new Date().toLocaleDateString()} | Taux Centime Add.: ${centimeRate}%`, 14, 35);
    
    const tableData = declarations.map(d => [
      d.periode,
      formatAmount(d.tva_collectee),
      formatAmount(d.tva_deductible),
      formatAmount(d.tva_a_payer),
      formatAmount(d.centime_additionnel_collecte || 0),
      formatAmount(d.centime_additionnel_deductible || 0),
      formatAmount(d.centime_additionnel_a_payer || 0),
      formatAmount((d.tva_a_payer || 0) + (d.centime_additionnel_a_payer || 0)),
      d.statut,
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Période', 'TVA Coll.', 'TVA Déd.', 'TVA à Payer', 'Cent. Coll.', 'Cent. Déd.', 'Cent. à Payer', 'Total', 'Statut']],
      body: tableData,
      styles: { fontSize: 7 },
      headStyles: { fontSize: 7 },
    });

    // Footer avec mentions légales
    doc.setFontSize(8);
    const mentionCentime = `Centime Additionnel conforme à la législation de la République du Congo (${centimeRate}% sur la TVA)`;
    doc.text(mentionCentime, 14, doc.internal.pageSize.height - 18);
    doc.text(regionalParams?.mention_legale_footer || '', 14, doc.internal.pageSize.height - 10);

    doc.save('journal_tva_centime.pdf');
    toast.success('Journal TVA et Centime Additionnel généré');
  };

  const generateEtatTVAExcel = () => {
    const devise = regionalParams?.devise_principale || 'XAF';
    const pays = regionalParams?.pays || 'Congo-Brazzaville';
    const centimeRate = regionalParams?.taux_centime_additionnel || 5.0;
    
    const wsData = [
      [`État TVA et Centime Additionnel - ${pays}`, '', '', '', '', '', '', '', ''],
      [`Devise: ${devise} | Taux Centime Additionnel: ${centimeRate}%`, '', '', '', '', '', '', '', ''],
      [],
      ['Période', 'TVA Collectée', 'TVA Déductible', 'TVA à Payer', 'Centime Collecté', 'Centime Déductible', 'Centime à Payer', 'Total à Payer', 'Statut'],
      ...declarations.map(d => [
        d.periode,
        d.tva_collectee,
        d.tva_deductible,
        d.tva_a_payer,
        d.centime_additionnel_collecte || 0,
        d.centime_additionnel_deductible || 0,
        d.centime_additionnel_a_payer || 0,
        (d.tva_a_payer || 0) + (d.centime_additionnel_a_payer || 0),
        d.statut,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'État TVA + Centime');
    XLSX.writeFile(wb, 'etat_tva_centime.xlsx');
    toast.success('État TVA et Centime Additionnel généré');
  };

  const generateAnnexeFiscalePDF = () => {
    const doc = new jsPDF();
    const devise = regionalParams?.devise_principale || 'XAF';
    const pays = regionalParams?.pays || 'Congo-Brazzaville';
    const systeme = regionalParams?.systeme_comptable || 'OHADA';
    const centimeRate = regionalParams?.taux_centime_additionnel || 5.0;
    
    doc.setFontSize(16);
    doc.text('Annexe Fiscale', 14, 20);
    doc.setFontSize(10);
    doc.text(`Année: ${new Date().getFullYear()}`, 14, 28);
    doc.setFontSize(9);
    doc.text(`Pays: ${pays} | Système: ${systeme} | Devise: ${devise}`, 14, 35);
    doc.text(`Taux Centime Additionnel: ${centimeRate}% (sur la TVA)`, 14, 42);
    
    doc.text('Taux TVA Configurés:', 14, 55);
    const tauxData = tauxTVA.map(t => [
      t.nom_taux,
      t.taux_pourcentage + '%',
      t.type_taux,
      t.est_actif ? 'Actif' : 'Inactif',
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Nom', 'Taux', 'Type', 'Statut']],
      body: tauxData,
    });

    doc.setFontSize(8);
    doc.text(regionalParams?.mention_legale_footer || '', 14, doc.internal.pageSize.height - 10);

    doc.save('annexe_fiscale.pdf');
    toast.success('Annexe fiscale générée');
  };

  // ==================== DÉCLARATION MENSUELLE G n°10 ====================
  const generateDeclarationG10PDF = () => {
    const doc = new jsPDF();
    const deviseLabel = regionalParams?.devise_principale || 'XAF';
    const pays = regionalParams?.pays || 'Congo-Brazzaville';
    const systeme = regionalParams?.systeme_comptable || 'SYSCOHADA Révisé';
    const cRate = regionalParams?.taux_centime_additionnel || 5.0;
    const vatRate = regionalParams?.taux_tva_standard || 18;

    const now = new Date();
    const moisDeclaration = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    // En-tête
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉPUBLIQUE DU CONGO', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Direction Générale des Impôts et des Domaines', 105, 22, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉCLARATION MENSUELLE G n°10', 105, 35, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période : ${moisDeclaration}`, 105, 43, { align: 'center' });
    doc.text(`Système : ${systeme} | Devise : ${deviseLabel}`, 105, 50, { align: 'center' });

    let y = 60;

    // Section I : TVA Collectée
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION I — TAXES SUR LE CHIFFRE D\'AFFAIRES', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Désignation', `Montant (${deviseLabel})`]],
      body: [
        ['Chiffre d\'affaires HT (Ventes)', formatAmount(vatSummary?.salesHT || 0)],
        [`TVA Collectée (${vatRate}%)`, formatAmount(vatSummary?.vatCollected || 0)],
        ['Achats HT (Réceptions)', formatAmount(vatSummary?.purchasesHT || 0)],
        ['TVA Déductible sur achats', formatAmount(vatSummary?.vatDeductible || 0)],
        ['TVA Due (Collectée - Déductible)', formatAmount(vatSummary?.vatDue || 0)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Section II : Centime Additionnel
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`SECTION II — CENTIMES ADDITIONNELS (${cRate}% sur TVA)`, 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Désignation', `Montant (${deviseLabel})`]],
      body: [
        ['Centime Additionnel Collecté', formatAmount(vatSummary?.centimeCollected || 0)],
        ['Centime Additionnel Déductible', formatAmount(vatSummary?.centimeDeductible || 0)],
        ['Centime Additionnel Dû', formatAmount(vatSummary?.centimeDue || 0)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 174, 96] },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Section III : ASDI
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION III — ASDI (Acompte Spécial sur les Importations)', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Désignation', `Montant (${deviseLabel})`]],
      body: [
        ['ASDI payé (Compte 4491)', formatAmount(vatSummary?.asdiPaid || 0)],
        ['Déduction sur montant dû', `- ${formatAmount(vatSummary?.asdiPaid || 0)}`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [142, 68, 173] },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Section IV : Récapitulatif
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION IV — RÉCAPITULATIF ET TOTAL NET À PAYER', 14, y);
    y += 3;

    const vatDue = vatSummary?.vatDue || 0;
    const centimeDue = vatSummary?.centimeDue || 0;
    const asdi = vatSummary?.asdiPaid || 0;
    const totalNet = vatSummary?.totalNetPayable || 0;

    autoTable(doc, {
      startY: y,
      head: [['Élément', `Montant (${deviseLabel})`]],
      body: [
        ['TVA Due', formatAmount(vatDue)],
        ['Centime Additionnel Dû', formatAmount(centimeDue)],
        ['Sous-total (TVA + Centime)', formatAmount(vatDue + centimeDue)],
        ['ASDI à déduire (Compte 4491)', `- ${formatAmount(asdi)}`],
        ['TOTAL NET À PAYER AU TRÉSOR', formatAmount(totalNet)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [192, 57, 43] },
      theme: 'grid',
      didParseCell: function(data) {
        if (data.row.index === 4) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 11;
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Section V : Retenues à la source (structure préparée)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION V — RETENUES À LA SOURCE (à compléter)', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Nature de la retenue', 'Base', 'Taux', `Montant (${deviseLabel})`]],
      body: [
        ['IRPP (Salariés)', '—', '—', '—'],
        ['TUS (Taxe Unique sur les Salaires)', '—', '—', '—'],
        ['Retenue prestataires (10%)', '—', '10%', '—'],
        ['Retenue prestataires (20%)', '—', '20%', '—'],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [127, 140, 141] },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Mentions légales
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('MENTIONS LÉGALES :', 14, y);
    y += 5;
    doc.text(`• Échéance de dépôt : au plus tard le 20 du mois suivant la période déclarée.`, 14, y);
    y += 4;
    doc.text(`• Le dépôt est obligatoire même en l'absence d'activité (déclaration "Néant").`, 14, y);
    y += 4;
    doc.text(`• Centime Additionnel conforme à la législation de la République du Congo (${cRate}% sur la TVA).`, 14, y);
    y += 4;
    doc.text(`• ASDI : Acompte Spécial sur les Importations, comptabilisé au compte 4491 (État, acomptes versés).`, 14, y);
    y += 6;
    doc.text(regionalParams?.mention_legale_footer || '', 14, y);

    // Signature
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Fait à __________________, le ${now.toLocaleDateString('fr-FR')}`, 14, y);
    y += 8;
    doc.text('Signature et cachet du déclarant :', 14, y);

    doc.save(`declaration_G10_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
    toast.success('Déclaration Mensuelle G n°10 générée avec succès');
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
    refetchVAT,

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
    formatNumber,
    formatPercentage,
    getInputStep,
    isNoDecimalCurrency,
    getCurrencySymbol,
    getVATRate,
  };
};
