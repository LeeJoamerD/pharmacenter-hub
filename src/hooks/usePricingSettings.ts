import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PricingSettings {
  id?: string;
  tenant_id: string;
  default_margin: number;
  minimum_margin: number;
  maximum_margin: number;
  price_rounding_method: string;
  price_rounding_value: number;
  auto_update_prices: boolean;
  include_tax_in_price: boolean;
  default_tax_rate: number;
  default_centime_additionnel_rate: number;
  allow_discounts: boolean;
  max_discount_percent: number;
  require_discount_approval: boolean;
  show_cost_to_customers: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: Omit<PricingSettings, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
  default_margin: 20.00,
  minimum_margin: 5.00,
  maximum_margin: 100.00,
  price_rounding_method: 'Nearest',
  price_rounding_value: 0.01,
  auto_update_prices: false,
  include_tax_in_price: true,
  default_tax_rate: 19.25,
  default_centime_additionnel_rate: 0.175,
  allow_discounts: true,
  max_discount_percent: 10.00,
  require_discount_approval: false,
  show_cost_to_customers: false,
};

export const usePricingSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (settings: Partial<PricingSettings> & { tenant_id: string }) => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .insert({
          ...DEFAULT_SETTINGS,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      toast({
        title: "Configuration créée",
        description: "Les paramètres de tarification ont été créés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration de tarification.",
        variant: "destructive",
      });
      console.error('Error creating pricing settings:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<PricingSettings>) => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .update(settings)
        .eq('tenant_id', settings.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres de tarification ont été sauvegardés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration de tarification.",
        variant: "destructive",
      });
      console.error('Error updating pricing settings:', error);
    },
  });

  const saveSettings = async (settings: Partial<PricingSettings> & { tenant_id: string }) => {
    if (query.data) {
      return updateMutation.mutateAsync({ ...settings, tenant_id: query.data.tenant_id });
    } else {
      return createMutation.mutateAsync(settings);
    }
  };

  return {
    settings: query.data,
    loading: query.isLoading,
    error: query.error,
    saveSettings,
    isUpdating: updateMutation.isPending || createMutation.isPending,
  };
};