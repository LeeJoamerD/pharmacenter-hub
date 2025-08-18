import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockSettings {
  id?: string;
  tenant_id: string;
  default_units: string;
  valuation_method: string;
  rounding_precision: number;
  minimum_stock_days: number;
  maximum_stock_days: number;
  reorder_point_days: number;
  safety_stock_percentage: number;
  auto_reorder_enabled: boolean;
  allow_negative_stock: boolean;
  track_expiration_dates: boolean;
  require_lot_numbers: boolean;
  auto_generate_lots: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: Omit<StockSettings, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
  default_units: 'Unité',
  valuation_method: 'FIFO',
  rounding_precision: 2,
  minimum_stock_days: 30,
  maximum_stock_days: 365,
  reorder_point_days: 15,
  safety_stock_percentage: 10.00,
  auto_reorder_enabled: false,
  allow_negative_stock: false,
  track_expiration_dates: true,
  require_lot_numbers: false,
  auto_generate_lots: false,
};

export const useStockSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['stock-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (settings: Partial<StockSettings> & { tenant_id: string }) => {
      const { data, error } = await supabase
        .from('stock_settings')
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
      queryClient.invalidateQueries({ queryKey: ['stock-settings'] });
      toast({
        title: "Configuration créée",
        description: "Les paramètres de stock ont été créés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration de stock.",
        variant: "destructive",
      });
      console.error('Error creating stock settings:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<StockSettings>) => {
      const { data, error } = await supabase
        .from('stock_settings')
        .update(settings)
        .eq('tenant_id', settings.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-settings'] });
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres de stock ont été sauvegardés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration de stock.",
        variant: "destructive",
      });
      console.error('Error updating stock settings:', error);
    },
  });

  const saveSettings = async (settings: Partial<StockSettings> & { tenant_id: string }) => {
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