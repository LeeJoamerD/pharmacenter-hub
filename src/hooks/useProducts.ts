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
  classe_therapeutique_id?: string;
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
  // Champs pour les produits détails
  id_produit_source?: string | null;
  quantite_unites_details_source?: number | null;
  niveau_detail?: number | null;
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
        .from('produits_with_stock')
        .select(`
          *
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

  const createProductDetail = async (sourceProduct: Product, quantity: number) => {
    try {
      // Validation de base
      if (!sourceProduct.code_cip) {
        throw new Error('Le produit source doit avoir un code CIP pour créer un détail');
      }

      const sourceLevel = sourceProduct.niveau_detail ?? 1;
      if (sourceLevel >= 3) {
        throw new Error('Impossible de créer un détail pour un produit de niveau 3');
      }

      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      // Calculer les propriétés du produit détail
      const newLevel = sourceLevel + 1;
      let detailCip: string;
      
      if (newLevel === 3) {
        // Pour niveau 3, récupérer le CIP racine (niveau 1)
        let rootCip = sourceProduct.code_cip;
        if (sourceLevel === 2) {
          // Si source est niveau 2, enlever le suffixe " - 2" pour obtenir le CIP racine
          rootCip = sourceProduct.code_cip.replace(/\s*-\s*\d+$/, '');
        }
        detailCip = rootCip + ' - 3';
      } else {
        detailCip = sourceProduct.code_cip + ` - ${newLevel}`;
      }
      
      const detailName = sourceProduct.libelle_produit + ' (D)';

      // Vérifier que ce détail direct n'existe pas déjà
      const { data: existingDetail } = await supabase
        .from('produits')
        .select('id, is_active')
        .eq('id_produit_source', sourceProduct.id)
        .eq('tenant_id', personnel.tenant_id)
        .eq('niveau_detail', newLevel)
        .maybeSingle();

      if (existingDetail) {
        throw new Error(`Un produit détail de niveau ${newLevel} existe déjà pour ce produit source`);
      }

      // Vérifier l'unicité du CIP
      const { data: existingCip } = await supabase
        .from('produits')
        .select('id, is_active')
        .eq('code_cip', detailCip)
        .eq('tenant_id', personnel.tenant_id)
        .maybeSingle();

      if (existingCip) {
        if (existingCip.is_active) {
          throw new Error('Un produit avec ce code CIP existe déjà et est actif');
        } else {
          // Réactiver le produit existant
          const { data, error } = await supabase
            .from('produits')
            .update({
              libelle_produit: detailName,
              niveau_detail: newLevel,
              id_produit_source: sourceProduct.id,
              quantite_unites_details_source: quantity,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCip.id)
            .select()
            .single();

          if (error) throw error;

          toast({
            title: "Succès",
            description: "Produit détail réactivé avec succès",
          });

          await fetchProducts();
          return data;
        }
      }

      // Créer un nouveau produit détail
      const { data, error } = await supabase
        .from('produits')
        .insert({
          tenant_id: personnel.tenant_id,
          libelle_produit: detailName,
          code_cip: detailCip,
          famille_id: sourceProduct.famille_id,
          rayon_id: sourceProduct.rayon_id,
          dci_id: sourceProduct.dci_id,
          classe_therapeutique_id: sourceProduct.classe_therapeutique_id,
          laboratoires_id: sourceProduct.laboratoires_id,
          taux_tva: sourceProduct.taux_tva,
          tva: sourceProduct.tva,
          prix_achat: sourceProduct.prix_achat,
          prix_vente_ht: sourceProduct.prix_vente_ht,
          prix_vente_ttc: sourceProduct.prix_vente_ttc,
          stock_limite: sourceProduct.stock_limite,
          stock_alerte: sourceProduct.stock_alerte,
          is_active: true,
          id_produit_source: sourceProduct.id,
          quantite_unites_details_source: quantity,
          niveau_detail: newLevel
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit détail créé avec succès",
      });

      await fetchProducts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du produit détail';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductDetail,
    refetch: fetchProducts,
  };
};