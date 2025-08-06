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
      // For now, create mock data until transporteurs table is created
      setTransporters([]);
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
      // Mock implementation until table is created
      const newTransporter: Transporter = {
        id: `temp-${Date.now()}`,
        tenant_id: 'temp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...transporterData
      };

      setTransporters(prev => [...prev, newTransporter]);
      toast({
        title: "Succès",
        description: "Transporteur créé avec succès",
      });
      
      return newTransporter;
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
      setTransporters(prev => prev.map(transporter => 
        transporter.id === id ? { ...transporter, ...updates } : transporter
      ));
      
      toast({
        title: "Succès",
        description: "Transporteur modifié avec succès",
      });
      
      return updates;
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