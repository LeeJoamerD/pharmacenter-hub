import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export interface AccountingJournal {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  type: string;
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

  // Fetch general configuration
  const {
    data: generalConfig,
    isLoading: isLoadingGeneral,
    error: generalError
  } = useQuery({
    queryKey: ['accounting-general-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_general_config')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    }
  });

  // Fetch journals
  const {
    data: journals = [],
    isLoading: isLoadingJournals,
    error: journalsError
  } = useQuery({
    queryKey: ['accounting-journals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_journals')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch numbering rules
  const {
    data: numberingRules = [],
    isLoading: isLoadingNumberingRules,
    error: numberingRulesError
  } = useQuery({
    queryKey: ['accounting-numbering-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_numbering_rules')
        .select('*')
        .order('rule_type');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch currencies with exchange rates
  const {
    data: currencies = [],
    isLoading: isLoadingCurrencies,
    error: currenciesError
  } = useQuery({
    queryKey: ['accounting-currencies'],
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
        .eq('is_active', true)
        .order('is_base_currency', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch company info from pharmacies table
  const {
    data: companyInfo,
    isLoading: isLoadingCompany,
    error: companyError
  } = useQuery({
    queryKey: ['company-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch fiscal years
  const {
    data: fiscalYears = [],
    isLoading: isLoadingFiscalYears,
    error: fiscalYearsError
  } = useQuery({
    queryKey: ['fiscal-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Mutations
  const saveGeneralConfigMutation = useMutation({
    mutationFn: async (config: Partial<AccountingGeneralConfig>) => {
      const { data, error } = await supabase
        .from('accounting_general_config')
        .upsert(config, { onConflict: 'tenant_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-general-config'] });
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
      if (journal.id) {
        const { data, error } = await supabase
          .from('accounting_journals')
          .update(journal)
          .eq('id', journal.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('accounting_journals')
          .insert(journal)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
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
        .from('accounting_journals')
        .delete()
        .eq('id', journalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
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
      const { data, error } = await supabase
        .from('accounting_numbering_rules')
        .upsert(rule, { onConflict: 'tenant_id,rule_type' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-numbering-rules'] });
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
      if (currency.id) {
        const { data, error } = await supabase
          .from('accounting_currencies')
          .update(currency)
          .eq('id', currency.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('accounting_currencies')
          .insert(currency)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-currencies'] });
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
      const { data, error } = await supabase
        .from('accounting_exchange_rates')
        .upsert(rate, { onConflict: 'tenant_id,currency_id,rate_date' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-currencies'] });
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
        .eq('id', info.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
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
      if (fiscalYear.id) {
        const { data, error } = await supabase
          .from('exercices_comptables')
          .update(fiscalYear)
          .eq('id', fiscalYear.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('exercices_comptables')
          .insert(fiscalYear)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
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
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
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
      p_tenant_id: companyInfo?.id,
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