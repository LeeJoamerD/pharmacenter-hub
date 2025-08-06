import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  tenant_id: string;
  libelle_produit: string;
  code_cip: string | null;
  famille_id: string | null;
  rayon_id: string | null;
  dci_id: string | null;
  laboratoires_id: string | null;
  categorie_tarification_id: string | null;
  prix_achat: number | null;
  prix_vente_ht: number | null;
  tva: number | null;
  centime_additionnel: number | null;
  prix_vente_ttc: number | null;
  taux_tva: number | null;
  taux_centime_additionnel: number | null;
  stock_limite: number | null;
  stock_alerte: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  // Additional fields that might exist in database
  [key: string]: any;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produits')
        .select('*')
        .eq('is_active', true)
        .order('libelle_produit');

      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchTerm: string) => {
    try {
      const { data, error } = await supabase
        .from('produits')
        .select('*')
        .or(`libelle_produit.ilike.%${searchTerm}%,code_cip.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('libelle_produit')
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la recherche de produits:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    searchProducts,
    refetch: fetchProducts,
  };
};