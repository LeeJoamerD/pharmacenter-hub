import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  tenant_id: string;
  nom: string;
  adresse: string | null;
  telephone_appel: string | null;
  telephone_whatsapp: string | null;
  email: string | null;
  niu: string | null;
  created_at: string;
  updated_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('nom');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des fournisseurs';
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

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .insert({
          ...supplierData,
          tenant_id: (await supabase.from('personnel').select('tenant_id').eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id).single()).data?.tenant_id
        })
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => [...prev, data]);
      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du fournisseur';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => prev.map(supplier => 
        supplier.id === id ? { ...supplier, ...data } : supplier
      ));
      
      toast({
        title: "Succès",
        description: "Fournisseur modifié avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du fournisseur';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      toast({
        title: "Succès",
        description: "Fournisseur supprimé avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du fournisseur';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
};