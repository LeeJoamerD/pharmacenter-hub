import { useTenantQuery } from './useTenantQuery';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReferentielMetrics = () => {
  const { tenantId } = useTenant();

  // Fetch count for products using count query
  const { data: productsCount } = useQuery({
    queryKey: ['products-count', tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from('produits')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  const { useTenantQueryWithCache } = useTenantQuery();

  const { data: families = [] } = useTenantQueryWithCache(
    ['families-count'],
    'famille_produit',
    'id'
  );

  const { data: formes = [] } = useTenantQueryWithCache(
    ['formes-count'],
    'formes_galeniques',
    'id'
  );

  const { data: rayons = [] } = useTenantQueryWithCache(
    ['rayons-count'],
    'rayons_produits',
    'id'
  );

  const { data: categories = [] } = useTenantQueryWithCache(
    ['categories-count'],
    'categorie_tarification',
    'id'
  );

  const { data: dcis = [] } = useTenantQueryWithCache(
    ['dcis-count'],
    'dci',
    'id'
  );

  const { data: regulations = [] } = useTenantQueryWithCache(
    ['regulations-count'],
    'reglementations',
    'id'
  );

  return {
    produits: productsCount || 0,
    familles: families?.length || 0,
    formes: formes?.length || 0,
    rayons: rayons?.length || 0,
    categories: categories?.length || 0,
    dci: dcis?.length || 0,
    reglementations: regulations?.length || 0,
  };
};

export const useRecentProducts = (limit: number = 5) => {
  const { useTenantQueryWithCache } = useTenantQuery();

  const { data: recentProducts, isLoading } = useTenantQueryWithCache(
    ['recent-products'],
    'produits',
    'id, libelle_produit, created_at, famille_id',
    { is_active: true },
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit 
    }
  );

  return {
    products: recentProducts || [],
    isLoading
  };
};