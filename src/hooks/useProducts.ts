import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  tenant_id: string;
  libelle_produit: string;
  code_cip?: string;
  famille_id?: string;
  rayon_id?: string;
  dci_id?: string;
  laboratoires_id?: string;
  prix_achat?: number;
  prix_vente_ht?: number;
  prix_vente_ttc?: number;
  tva?: number;
  taux_tva?: number;
  stock_limite?: number;
  stock_alerte?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  famille?: {
    libelle_famille: string;
  };
  rayon?: {
    nom_rayon: string;
  };
  dci?: {
    nom_dci: string;
  };
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
        .select(`
          *,
          famille:famille_produit(libelle_famille),
          rayon:rayons(nom_rayon),
          dci:dci(nom_dci)
        `)
        .eq('is_active', true)
        .order('libelle_produit', { ascending: true });

      if (error) throw error;
      setProducts((data as any) || []);
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

  const createProduct = async (productData: Omit<Product, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    try {
      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      const { data, error } = await supabase
        .from('produits')
        .insert({
          tenant_id: personnel.tenant_id,
          ...productData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });

      await fetchProducts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du produit';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('produits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(product => 
        product.id === id ? { ...product, ...data } : product
      ));
      
      toast({
        title: "Succès",
        description: "Produit modifié avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du produit';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produits')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== id));
      toast({
        title: "Succès",
        description: "Produit désactivé avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du produit';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
};