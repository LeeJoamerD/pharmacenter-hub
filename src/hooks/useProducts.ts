import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  tenant_id: string;
  categorie_tarification_id: string | null;
  centime_additionnel: number | null;
  code_cip: string | null;
  dci_id: string | null;
  famille_id: string | null;
  famille_produit_id: string | null;
  id_produit_source: string | null;
  nom_produit: string;
  code_barre: string | null;
  prix_achat_moyen: number | null;
  prix_vente_unitaire: number | null;
  tva_applicable: number | null;
  stock_minimum: number | null;
  stock_maximum: number | null;
  unite_mesure: string | null;
  forme_pharmaceutique: string | null;
  dosage: string | null;
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
        .order('nom_produit');

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
        .or(`nom_produit.ilike.%${searchTerm}%,code_barre.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('nom_produit')
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