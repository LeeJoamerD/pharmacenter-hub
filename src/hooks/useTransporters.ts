import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Transporter {
  id: string;
  tenant_id: string;
  nom: string;
  adresse: string | null;
  telephone_appel: string | null;
  telephone_whatsapp: string | null;
  email: string | null;
  contact_principal: string | null;
  zone_couverture: string[] | null;
  tarif_base: number | null;
  tarif_par_km: number | null;
  delai_livraison_standard: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useTransporters = () => {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransporters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transporteurs')
        .select('*')
        .eq('is_active', true)
        .order('nom');

      if (error) throw error;
      setTransporters(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des transporteurs';
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

  const createTransporter = async (transporterData: Omit<Transporter, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
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
        .from('transporteurs')
        .insert({
          ...transporterData,
          tenant_id: personnel.tenant_id
        })
        .select()
        .single();

      if (error) throw error;

      setTransporters(prev => [...prev, data]);
      toast({
        title: "Succès",
        description: "Transporteur créé avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du transporteur';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateTransporter = async (id: string, updates: Partial<Transporter>) => {
    try {
      const { data, error } = await supabase
        .from('transporteurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTransporters(prev => prev.map(transporter => 
        transporter.id === id ? { ...transporter, ...data } : transporter
      ));
      
      toast({
        title: "Succès",
        description: "Transporteur modifié avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du transporteur';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteTransporter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transporteurs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransporters(prev => prev.filter(transporter => transporter.id !== id));
      toast({
        title: "Succès",
        description: "Transporteur supprimé avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du transporteur';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const calculateShippingCost = (transporter: Transporter, distance?: number): number => {
    if (!transporter.tarif_base) return 0;
    
    let cost = transporter.tarif_base;
    
    if (distance && transporter.tarif_par_km) {
      cost += distance * transporter.tarif_par_km;
    }
    
    return cost;
  };

  const getTransportersByZone = (zone: string): Transporter[] => {
    return transporters.filter(t => 
      t.zone_couverture?.includes(zone) || 
      t.zone_couverture?.includes('National') ||
      t.zone_couverture?.includes('Toutes zones')
    );
  };

  const findBestTransporter = (zone: string, distance?: number): Transporter | null => {
    const availableTransporters = getTransportersByZone(zone);
    
    if (availableTransporters.length === 0) return null;
    
    // Trier par coût de livraison (si distance fournie) sinon par tarif de base
    return availableTransporters.sort((a, b) => {
      const costA = calculateShippingCost(a, distance);
      const costB = calculateShippingCost(b, distance);
      return costA - costB;
    })[0];
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  return {
    transporters,
    loading,
    error,
    createTransporter,
    updateTransporter,
    deleteTransporter,
    calculateShippingCost,
    getTransportersByZone,
    findBestTransporter,
    refetch: fetchTransporters,
  };
};