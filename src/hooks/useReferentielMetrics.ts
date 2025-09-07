import { useTenantQuery } from './useTenantQuery';

export const useReferentielMetrics = () => {
  const { useTenantQueryWithCache } = useTenantQuery();

  // Fetch counts for each table
  const { data: products = [] } = useTenantQueryWithCache(
    ['products-count'],
    'produits',
    'id',
    { is_active: true }
  );

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
    produits: products?.length || 0,
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