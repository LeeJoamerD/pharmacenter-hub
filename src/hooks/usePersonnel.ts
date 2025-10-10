import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Personnel {
  id: string;
  noms: string;
  prenoms: string;
  role: string;
  tenant_id: string;
  auth_user_id: string;
  email?: string;
  telephone_appel?: string;
}

export const usePersonnel = () => {
  const { user } = useAuth();

  const { data: currentPersonnel, isLoading, error } = useQuery({
    queryKey: ['current-personnel', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Personnel;
    },
    enabled: !!user?.id,
  });

  return {
    currentPersonnel,
    isLoading,
    error,
  };
};
