import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

// Types
export interface Invoice {
  id: string;
  tenant_id: string;
  numero: string;
  type: 'client' | 'fournisseur';
  date_emission: string;
  date_echeance: string;
  client_id?: string;
  fournisseur_id?: string;
  vente_id?: string;
  reception_id?: string;
  client_fournisseur?: string;
  client_nom?: string;
  client_telephone?: string;
  client_email?: string;
  client_adresse?: string;
  fournisseur_nom?: string;
  fournisseur_telephone?: string;
  fournisseur_email?: string;
  fournisseur_adresse?: string;
  libelle: string;
  reference_externe?: string;
  notes?: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'brouillon' | 'emise' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee';
  statut_paiement: 'impayee' | 'partielle' | 'payee';
  montant_paye: number;
  montant_restant: number;
  relances_effectuees: number;
  derniere_relance?: string;
  pieces_jointes: string[];
  created_by_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  jours_retard?: number;
  jours_avant_echeance?: number;
  nombre_lignes?: number;
}

export interface InvoiceLine {
  id: string;
  tenant_id: string;
  facture_id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  created_at: string;
  updated_at: string;
}

export interface CreditNote {
  id: string;
  tenant_id: string;
  numero: string;
  facture_origine_id: string;
  date_emission: string;
  motif: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'brouillon' | 'emis' | 'applique' | 'annule';
  created_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  facture_id: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference_paiement?: string;
  notes?: string;
  created_by_id?: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  tenant_id: string;
  facture_id: string;
  date_relance: string;
  type_relance: 'email' | 'sms' | 'telephone' | 'courrier';
  message?: string;
  destinataire: string;
  statut: 'envoyee' | 'echec' | 'delivree' | 'lue';
  created_by_id?: string;
  created_at: string;
}

export const useInvoiceManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { pharmacy, personnel } = useAuth();
  const { formatPrice, currentCurrency } = useCurrency();
  const { settings } = useGlobalSystemSettings();
  const [isSaving, setIsSaving] = useState(false);

  const tenantId = pharmacy?.id;
  const personnelId = personnel?.id;

  // Fetch regional invoice parameters
  const { data: regionalParams, isLoading: isLoadingRegional } = useQuery({
    queryKey: ['invoice-regional-params', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .from('parametres_factures_regionaux')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Init auto avec template Congo si pas trouvé
        await supabase.rpc('init_invoice_params_for_tenant', {
          p_tenant_id: tenantId,
          p_country_code: 'CG'
        });
        
        const { data: retryData } = await supabase
          .from('parametres_factures_regionaux')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();
        return retryData;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Fetch invoices from view
  const { data: invoices = [], isLoading: isLoadingInvoices, error } = useQuery({
    queryKey: ['factures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_factures_avec_details')
        .select('*')
        .order('date_emission', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
  });

  // Fetch credit notes
  const { data: creditNotes = [], isLoading: isLoadingCredits } = useQuery({
    queryKey: ['avoirs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avoirs')
        .select('*')
        .order('date_emission', { ascending: false });
      
      if (error) throw error;
      return data as CreditNote[];
    },
  });

  // Regional utility functions
  const formatAmount = useCallback((amount: number): string => {
    if (!regionalParams) return formatPrice(amount);
    
    const formatted = amount.toFixed(2);
    const [integer, decimal] = formatted.split('.');
    
    const integerFormatted = integer.replace(
      /\B(?=(\d{3})+(?!\d))/g, 
      regionalParams.separateur_milliers || ' '
    );
    
    const numberFormatted = `${integerFormatted}${regionalParams.separateur_decimal || ','}${decimal}`;
    
    if (regionalParams.position_symbole_devise === 'before') {
      return `${regionalParams.symbole_devise} ${numberFormatted}`;
    }
    return `${numberFormatted} ${regionalParams.symbole_devise}`;
  }, [regionalParams, formatPrice]);

  const getDevise = useCallback((): string => {
    return regionalParams?.symbole_devise || currentCurrency.symbol;
  }, [regionalParams, currentCurrency]);

  const getInvoicePrefix = useCallback((type: 'client' | 'fournisseur' | 'avoir'): string => {
    if (!regionalParams) return type === 'client' ? 'FC' : 'FF';
    
    switch(type) {
      case 'client': return regionalParams.prefixe_facture_client || 'FC';
      case 'fournisseur': return regionalParams.prefixe_facture_fournisseur || 'FF';
      case 'avoir': return regionalParams.prefixe_avoir || 'AV';
      default: return 'FC';
    }
  }, [regionalParams]);

  const getTVARate = useCallback((reduced: boolean = false): number => {
    if (!regionalParams) return 18.00;
    return reduced && regionalParams.taux_tva_reduit 
      ? regionalParams.taux_tva_reduit 
      : regionalParams.taux_tva_standard || 18.00;
  }, [regionalParams]);

  const formatInvoiceNumber = useCallback((prefix: string, year: number, number: number): string => {
    if (!regionalParams || !regionalParams.format_numero) {
      return `${prefix}-${year}-${String(number).padStart(4, '0')}`;
    }
    
    const template = regionalParams.format_numero;
    return template
      .replace('{PREFIX}', prefix)
      .replace('{YEAR}', String(year))
      .replace('{NUMBER:04d}', String(number).padStart(regionalParams.longueur_numero || 4, '0'))
      .replace('{NUMBER:05d}', String(number).padStart(regionalParams.longueur_numero || 5, '0'))
      .replace('{NUMBER}', String(number));
  }, [regionalParams]);

  const getLegalMentions = useCallback((): string => {
    return regionalParams?.mentions_legales_facture || '';
  }, [regionalParams]);

  const getPaymentTerms = useCallback((): string => {
    return regionalParams?.conditions_paiement_defaut || '';
  }, [regionalParams]);

  // Generate invoice number
  const generateInvoiceNumber = useCallback(async (type: 'client' | 'fournisseur') => {
    const { data, error } = await supabase.rpc('generate_invoice_number', {
      p_tenant_id: tenantId,
      p_type: type,
    });
    
    if (error) throw error;
    return data as string;
  }, [tenantId]);

  // Calculate line totals
  const calculateLineTotals = useCallback((line: Partial<InvoiceLine>) => {
    const quantite = line.quantite || 0;
    const prix_unitaire = line.prix_unitaire || 0;
    const taux_tva = line.taux_tva || 0;

    const montant_ht = quantite * prix_unitaire;
    const montant_tva = (montant_ht * taux_tva) / 100;
    const montant_ttc = montant_ht + montant_tva;

    return { montant_ht, montant_tva, montant_ttc };
  }, []);

  // Create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: Partial<Invoice> & { lines: Partial<InvoiceLine>[], vente_ids?: string[], reception_id?: string }) => {
      setIsSaving(true);
      const { lines, vente_ids, reception_id, ...invoiceData } = invoice;

      // Generate numero if not provided
      if (!invoiceData.numero && invoiceData.type) {
        invoiceData.numero = await generateInvoiceNumber(invoiceData.type);
      }

      // Clean empty string UUIDs - convert to null for database
      const cleanedInvoiceData = {
        ...invoiceData,
        client_id: invoiceData.client_id || null,
        fournisseur_id: invoiceData.fournisseur_id || null,
        // Link to first vente/reception if available
        vente_id: vente_ids && vente_ids.length > 0 ? vente_ids[0] : null,
        reception_id: reception_id || null,
        tenant_id: tenantId,
        created_by_id: personnelId,
      };

      // Insert invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('factures')
        .insert(cleanedInvoiceData as any)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert lines
      if (lines && lines.length > 0) {
        const linesToInsert = lines.map(line => {
          const totals = calculateLineTotals(line);
          return {
            designation: line.designation || '',
            quantite: line.quantite || 0,
            prix_unitaire: line.prix_unitaire || 0,
            taux_tva: line.taux_tva || 0,
            ...totals,
            facture_id: newInvoice.id,
            tenant_id: tenantId,
          };
        });

        const { error: linesError } = await supabase
          .from('lignes_facture')
          .insert(linesToInsert as any);

        if (linesError) throw linesError;
      }

      // Mark sales as invoiced if vente_ids provided
      if (vente_ids && vente_ids.length > 0) {
        const { error: updateSalesError } = await supabase
          .from('ventes')
          .update({ 
            facture_generee: true, 
            facture_id: newInvoice.id 
          })
          .in('id', vente_ids);

        if (updateSalesError) {
          console.error('Error marking sales as invoiced:', updateSalesError);
        }
      }

      // Mark reception as invoiced if reception_id provided
      if (reception_id) {
        const { error: updateReceptionError } = await supabase
          .from('receptions_fournisseurs')
          .update({ 
            facture_generee: true, 
            facture_id: newInvoice.id 
          })
          .eq('id', reception_id);

        if (updateReceptionError) {
          console.error('Error marking reception as invoiced:', updateReceptionError);
        }
      }

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast({ title: 'Succès', description: 'Facture créée avec succès' });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Erreur lors de la création de la facture',
        variant: 'destructive' 
      });
      setIsSaving(false);
    },
  });

  // Update invoice
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      setIsSaving(true);
      const { error } = await supabase
        .from('factures')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast({ title: 'Succès', description: 'Facture mise à jour' });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message,
        variant: 'destructive' 
      });
      setIsSaving(false);
    },
  });

  // Delete invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast({ title: 'Succès', description: 'Facture supprimée' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Record payment
  const recordPaymentMutation = useMutation({
    mutationFn: async (payment: Partial<Payment>) => {
      setIsSaving(true);
      
      // Insert payment
      const { error: paymentError } = await supabase
        .from('paiements_factures')
        .insert({
          facture_id: payment.facture_id!,
          montant: payment.montant!,
          mode_paiement: payment.mode_paiement!,
          date_paiement: payment.date_paiement,
          reference_paiement: payment.reference_paiement,
          notes: payment.notes,
          tenant_id: tenantId,
          created_by_id: personnelId,
        } as any);

      if (paymentError) throw paymentError;

      // Update invoice montant_paye
      const { data: invoice, error: fetchError } = await supabase
        .from('factures')
        .select('montant_paye')
        .eq('id', payment.facture_id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('factures')
        .update({ 
          montant_paye: (invoice.montant_paye || 0) + (payment.montant || 0) 
        })
        .eq('id', payment.facture_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast({ title: 'Succès', description: 'Paiement enregistré' });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message,
        variant: 'destructive' 
      });
      setIsSaving(false);
    },
  });

  // Send reminder
  const sendReminderMutation = useMutation({
    mutationFn: async (reminder: Partial<Reminder>) => {
      const { error } = await supabase
        .from('relances_factures')
        .insert({
          facture_id: reminder.facture_id!,
          type_relance: reminder.type_relance!,
          date_relance: reminder.date_relance,
          destinataire: reminder.destinataire,
          message: reminder.message,
          statut: reminder.statut || 'envoyee',
          tenant_id: tenantId,
          created_by_id: personnelId,
        } as any);

      if (error) throw error;

      // Update invoice relances count
      const { data: invoice, error: fetchError } = await supabase
        .from('factures')
        .select('relances_effectuees')
        .eq('id', reminder.facture_id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('factures')
        .update({ 
          relances_effectuees: (invoice.relances_effectuees || 0) + 1,
          derniere_relance: new Date().toISOString().split('T')[0],
        })
        .eq('id', reminder.facture_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast({ title: 'Succès', description: 'Relance envoyée' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Create credit note
  const createCreditNoteMutation = useMutation({
    mutationFn: async (creditNote: Partial<CreditNote>) => {
      setIsSaving(true);

      // Generate numero
      const { data: numero, error: numeroError } = await supabase.rpc('generate_avoir_number', {
        p_tenant_id: tenantId,
      });

      if (numeroError) throw numeroError;

      const { data, error } = await supabase
        .from('avoirs')
        .insert({
          numero: numero as string,
          facture_origine_id: creditNote.facture_origine_id!,
          motif: creditNote.motif!,
          montant_ht: creditNote.montant_ht || 0,
          montant_tva: creditNote.montant_tva || 0,
          montant_ttc: creditNote.montant_ttc || 0,
          date_emission: creditNote.date_emission,
          statut: creditNote.statut || 'brouillon',
          tenant_id: tenantId,
          created_by_id: personnelId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avoirs'] });
      toast({ title: 'Succès', description: 'Avoir créé' });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message,
        variant: 'destructive' 
      });
      setIsSaving(false);
    },
  });

  // Search and filter functions
  const searchInvoices = useCallback((term: string, type?: 'client' | 'fournisseur') => {
    return invoices.filter(inv => {
      const matchesType = !type || inv.type === type;
      const matchesTerm = 
        inv.numero.toLowerCase().includes(term.toLowerCase()) ||
        inv.client_fournisseur?.toLowerCase().includes(term.toLowerCase()) ||
        inv.libelle.toLowerCase().includes(term.toLowerCase());
      return matchesType && matchesTerm;
    });
  }, [invoices]);

  const getInvoicesByType = useCallback((type: 'client' | 'fournisseur') => {
    return invoices.filter(inv => inv.type === type);
  }, [invoices]);

  const getInvoicesByStatus = useCallback((status: string) => {
    return invoices.filter(inv => inv.statut === status);
  }, [invoices]);

  const getOverdueInvoices = useCallback((type?: 'client' | 'fournisseur') => {
    return invoices.filter(inv => {
      const matchesType = !type || inv.type === type;
      return matchesType && inv.statut === 'en_retard';
    });
  }, [invoices]);

  const getUpcomingInvoices = useCallback((days: number, type?: 'client' | 'fournisseur') => {
    return invoices.filter(inv => {
      const matchesType = !type || inv.type === type;
      return matchesType && inv.jours_avant_echeance && inv.jours_avant_echeance <= days && inv.jours_avant_echeance > 0;
    });
  }, [invoices]);

  // Statistics
  const getInvoiceStats = useCallback((type: 'client' | 'fournisseur') => {
    const filtered = invoices.filter(inv => inv.type === type);
    
    return {
      totalCreances: filtered.reduce((sum, inv) => sum + inv.montant_restant, 0),
      totalDettes: filtered.reduce((sum, inv) => sum + inv.montant_ttc, 0),
      countOverdue: filtered.filter(inv => inv.statut === 'en_retard').length,
      countPaid: filtered.filter(inv => inv.statut_paiement === 'payee').length,
      countUnpaid: filtered.filter(inv => inv.statut_paiement === 'impayee').length,
      averageAmount: filtered.length > 0 ? filtered.reduce((sum, inv) => sum + inv.montant_ttc, 0) / filtered.length : 0,
    };
  }, [invoices]);

  return {
    // Data
    invoices,
    creditNotes,
    currentInvoice: null,
    
    // Loading states
    isLoadingInvoices,
    isLoadingCredits,
    isLoading: isLoadingInvoices || isLoadingCredits,
    isSaving,
    loadingRegionalParams: isLoadingRegional,
    
    // Error
    error,
    
    // Regional params
    regionalParams,
    
    // Regional utilities
    formatAmount,
    getDevise,
    getInvoicePrefix,
    getTVARate,
    formatInvoiceNumber,
    getLegalMentions,
    getPaymentTerms,
    
    // Actions
    createInvoice: createInvoiceMutation.mutate,
    updateInvoice: (id: string, updates: Partial<Invoice>) => updateInvoiceMutation.mutate({ id, updates }),
    deleteInvoice: deleteInvoiceMutation.mutate,
    recordPayment: recordPaymentMutation.mutate,
    sendReminder: sendReminderMutation.mutate,
    createCreditNote: createCreditNoteMutation.mutate,
    
    // Utilities
    searchInvoices,
    getInvoicesByType,
    getInvoicesByStatus,
    getOverdueInvoices,
    getUpcomingInvoices,
    getInvoiceStats,
    calculateLineTotals,
    generateInvoiceNumber,
    
    // Refresh
    refreshInvoices: () => queryClient.invalidateQueries({ queryKey: ['factures'] }),
    refreshCreditNotes: () => queryClient.invalidateQueries({ queryKey: ['avoirs'] }),
  };
};
