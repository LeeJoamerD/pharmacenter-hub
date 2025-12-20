
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface AccountingGeneralConfig {
  id: string;
  tenant_id: string;
  plan_comptable: string;
  decimal_places: number;
  auto_lettrage: boolean;
  controle_equilibre: boolean;
  saisie_analytique: boolean;
  regime_tva: string;
  taux_tva_normal: number;
  taux_tva_reduit: number;
  periodicite_tva: string;
  auto_calcul_tva: boolean;
  created_at: string;
  updated_at: string;
}

// Interface unifiée pour les journaux - mappage depuis journaux_comptables
export interface AccountingJournal {
  id: string;
  tenant_id: string;
  code: string;           // mappé depuis code_journal
  name: string;           // mappé depuis libelle_journal
  type: string;           // mappé depuis type_journal
  description?: string;
  prefixe?: string;
  sequence_courante?: number;
  auto_generation: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountingNumberingRule {
  id: string;
  tenant_id: string;
  rule_type: string;
  format_pattern: string;
  current_number: number;
  reset_frequency: string;
  last_reset_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountingCurrency {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  is_base_currency: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountingExchangeRate {
  id: string;
  tenant_id: string;
  currency_id: string;
  rate: number;
  rate_date: string;
  auto_update_enabled: boolean;
  update_frequency: string;
  created_at: string;
  updated_at: string;
  currency?: AccountingCurrency;
}

export interface CompanyInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  pays: string;
  email: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  code: string;
  type: string;
}

export interface FiscalYear {
  id: string;
  tenant_id: string;
  year: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useAccountingConfiguration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  // Fetch general configuration
  const {
    data: generalConfig,
    isLoading: isLoadingGeneral,
    error: generalError
  } = useQuery({
    queryKey: ['accounting-general-config', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_general_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!tenantId
  });

  // Fetch journals from journaux_comptables (source unique de vérité)
  const {
    data: journals = [],
    isLoading: isLoadingJournals,
    error: journalsError
  } = useQuery({
    queryKey: ['accounting-journals', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journaux_comptables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('code_journal');
      
      if (error) throw error;
      
      // Mapper les colonnes vers l'interface AccountingJournal
      return (data || []).map((journal: any) => ({
        id: journal.id,
        tenant_id: journal.tenant_id,
        code: journal.code_journal,
        name: journal.libelle_journal,
        type: journal.type_journal,
        description: journal.description,
        prefixe: journal.prefixe,
        sequence_courante: journal.sequence_courante,
        auto_generation: journal.auto_generation || false,
        is_active: journal.is_active !== false,
        created_at: journal.created_at,
        updated_at: journal.updated_at
      })) as AccountingJournal[];
    },
    enabled: !!tenantId
  });

  // Fetch numbering rules
  const {
    data: numberingRules = [],
    isLoading: isLoadingNumberingRules,
    error: numberingRulesError
  } = useQuery({
    queryKey: ['accounting-numbering-rules', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_numbering_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('rule_type');
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId
  });

  // Fetch currencies with exchange rates
  const {
    data: currencies = [],
    isLoading: isLoadingCurrencies,
    error: currenciesError
  } = useQuery({
    queryKey: ['accounting-currencies', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_currencies')
        .select(`
          *,
          exchange_rates:accounting_exchange_rates!currency_id(
            id,
            rate,
            rate_date,
            auto_update_enabled,
            update_frequency
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('is_base_currency', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId
  });

  // Fetch company info from pharmacies table
  const {
    data: companyInfo,
    isLoading: isLoadingCompany,
    error: companyError
  } = useQuery({
    queryKey: ['company-info', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId
  });

  // Fetch fiscal years - Fixed field mapping
  const {
    data: rawFiscalYears = [],
    isLoading: isLoadingFiscalYears,
    error: fiscalYearsError
  } = useQuery({
    queryKey: ['fiscal-years', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('libelle_exercice', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId
  });

  // Map raw fiscal years to expected interface
  const fiscalYears = rawFiscalYears.map((item: any) => ({
    id: item.id,
    tenant_id: item.tenant_id,
    year: item.libelle_exercice,
    start_date: item.date_debut,
    end_date: item.date_fin,
    status: item.statut,
    created_at: item.created_at,
    updated_at: item.updated_at
  }));

  // Mutations
  const saveGeneralConfigMutation = useMutation({
    mutationFn: async (config: Partial<AccountingGeneralConfig>) => {
      const configWithTenant = {
        ...config,
        tenant_id: tenantId
      };
      
      const { data, error } = await supabase
        .from('accounting_general_config')
        .upsert(configWithTenant, { onConflict: 'tenant_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-general-config', tenantId] });
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres généraux ont été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
      console.error('Error saving general config:', error);
    }
  });

  const saveJournalMutation = useMutation({
    mutationFn: async (journal: Partial<AccountingJournal>) => {
      // Mapper vers les colonnes de journaux_comptables
      const journalData = {
        tenant_id: tenantId,
        code_journal: journal.code || '',
        libelle_journal: journal.name || '',
        type_journal: journal.type || '',
        description: journal.description,
        prefixe: journal.prefixe,
        sequence_courante: journal.sequence_courante,
        auto_generation: journal.auto_generation || false,
        is_active: journal.is_active !== false
      };
      
      if (journal.id) {
        const { data, error } = await supabase
          .from('journaux_comptables')
          .update(journalData)
          .eq('id', journal.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('journaux_comptables')
          .insert(journalData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals', tenantId] });
      toast({
        title: "Journal sauvegardé",
        description: "Le journal comptable a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le journal",
        variant: "destructive",
      });
      console.error('Error saving journal:', error);
    }
  });

  const deleteJournalMutation = useMutation({
    mutationFn: async (journalId: string) => {
      const { error } = await supabase
        .from('journaux_comptables')
        .delete()
        .eq('id', journalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals', tenantId] });
      toast({
        title: "Journal supprimé",
        description: "Le journal comptable a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le journal",
        variant: "destructive",
      });
      console.error('Error deleting journal:', error);
    }
  });

  const saveNumberingRuleMutation = useMutation({
    mutationFn: async (rule: Partial<AccountingNumberingRule>) => {
      const ruleWithTenant = {
        ...rule,
        tenant_id: tenantId,
        rule_type: rule.rule_type || '',
        format_pattern: rule.format_pattern || ''
      };
      
      const { data, error } = await supabase
        .from('accounting_numbering_rules')
        .upsert(ruleWithTenant, { onConflict: 'tenant_id,rule_type' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-numbering-rules', tenantId] });
      toast({
        title: "Règle sauvegardée",
        description: "La règle de numérotation a été mise à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la règle de numérotation",
        variant: "destructive",
      });
      console.error('Error saving numbering rule:', error);
    }
  });

  const saveCurrencyMutation = useMutation({
    mutationFn: async (currency: Partial<AccountingCurrency>) => {
      const currencyWithTenant = {
        ...currency,
        tenant_id: tenantId,
        code: currency.code || '',
        name: currency.name || ''
      };
      
      if (currency.id) {
        const { data, error } = await supabase
          .from('accounting_currencies')
          .update(currencyWithTenant)
          .eq('id', currency.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('accounting_currencies')
          .insert(currencyWithTenant)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-currencies', tenantId] });
      toast({
        title: "Devise sauvegardée",
        description: "La devise a été mise à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la devise",
        variant: "destructive",
      });
      console.error('Error saving currency:', error);
    }
  });

  const saveExchangeRateMutation = useMutation({
    mutationFn: async (rate: Partial<AccountingExchangeRate>) => {
      const rateWithTenant = {
        ...rate,
        tenant_id: tenantId,
        currency_id: rate.currency_id || '',
        rate: rate.rate || 0
      };
      
      const { data, error } = await supabase
        .from('accounting_exchange_rates')
        .upsert(rateWithTenant, { onConflict: 'tenant_id,currency_id,rate_date' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-currencies', tenantId] });
      toast({
        title: "Taux mis à jour",
        description: "Le taux de change a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le taux de change",
        variant: "destructive",
      });
      console.error('Error saving exchange rate:', error);
    }
  });

  const updateCompanyInfoMutation = useMutation({
    mutationFn: async (info: Partial<CompanyInfo>) => {
      const { data, error } = await supabase
        .from('pharmacies')
        .update(info)
        .eq('id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-info', tenantId] });
      toast({
        title: "Informations mises à jour",
        description: "Les informations de l'entreprise ont été mises à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les informations de l'entreprise",
        variant: "destructive",
      });
      console.error('Error updating company info:', error);
    }
  });

  const saveFiscalYearMutation = useMutation({
    mutationFn: async (fiscalYear: Partial<FiscalYear>) => {
      // Map frontend fields to database fields
      const fiscalYearData = {
        tenant_id: tenantId,
        libelle_exercice: fiscalYear.year || '',
        date_debut: fiscalYear.start_date || '',
        date_fin: fiscalYear.end_date || '',
        statut: fiscalYear.status || 'Ouvert'
      };
      
      if (fiscalYear.id) {
        const { data, error } = await supabase
          .from('exercices_comptables')
          .update(fiscalYearData)
          .eq('id', fiscalYear.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('exercices_comptables')
          .insert(fiscalYearData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years', tenantId] });
      toast({
        title: "Exercice sauvegardé",
        description: "L'exercice comptable a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'exercice comptable",
        variant: "destructive",
      });
      console.error('Error saving fiscal year:', error);
    }
  });

  const deleteFiscalYearMutation = useMutation({
    mutationFn: async (fiscalYearId: string) => {
      const { error } = await supabase
        .from('exercices_comptables')
        .delete()
        .eq('id', fiscalYearId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years', tenantId] });
      toast({
        title: "Exercice supprimé",
        description: "L'exercice comptable a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'exercice comptable",
        variant: "destructive",
      });
      console.error('Error deleting fiscal year:', error);
    }
  });

  // Get next accounting number function
  const getNextAccountingNumber = async (ruleType: string, journalCode?: string) => {
    const { data, error } = await supabase.rpc('get_next_accounting_number', {
      p_tenant_id: tenantId,
      p_rule_type: ruleType,
      p_journal_code: journalCode || null
    });
    
    if (error) throw error;
    return data;
  };

  return {
    // Data
    generalConfig,
    journals,
    numberingRules,
    currencies,
    companyInfo,
    fiscalYears,
    
    // Loading states
    isLoading: isLoadingGeneral || isLoadingJournals || isLoadingNumberingRules || 
               isLoadingCurrencies || isLoadingCompany || isLoadingFiscalYears,
    isLoadingGeneral,
    isLoadingJournals,
    isLoadingNumberingRules,
    isLoadingCurrencies,
    isLoadingCompany,
    isLoadingFiscalYears,
    
    // Errors
    error: generalError || journalsError || numberingRulesError || 
           currenciesError || companyError || fiscalYearsError,
    
    // Mutations
    saveGeneralConfig: saveGeneralConfigMutation.mutate,
    saveJournal: saveJournalMutation.mutate,
    deleteJournal: deleteJournalMutation.mutate,
    saveNumberingRule: saveNumberingRuleMutation.mutate,
    saveCurrency: saveCurrencyMutation.mutate,
    saveExchangeRate: saveExchangeRateMutation.mutate,
    updateCompanyInfo: updateCompanyInfoMutation.mutate,
    saveFiscalYear: saveFiscalYearMutation.mutate,
    deleteFiscalYear: deleteFiscalYearMutation.mutate,
    getNextAccountingNumber,
    
    // Mutation states
    isSaving: saveGeneralConfigMutation.isPending || saveJournalMutation.isPending || 
              saveNumberingRuleMutation.isPending || saveCurrencyMutation.isPending ||
              saveExchangeRateMutation.isPending || updateCompanyInfoMutation.isPending ||
              saveFiscalYearMutation.isPending,
  };
};
