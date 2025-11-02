import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface Caisse {
  id: string;
  tenant_id: string;
  nom_caisse: string;
  code_caisse: string;
  emplacement?: string;
  description?: string;
  type_caisse?: string;
  is_active: boolean;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCaisseInput {
  nom_caisse: string;
  code_caisse: string;
  emplacement?: string;
  description?: string;
  type_caisse?: string;
}

export const useCaisses = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les caisses actives
  const loadCaisses = useCallback(async (): Promise<void> => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('caisses')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('code_caisse', { ascending: true });

      if (error) throw error;

      setCaisses((data || []) as Caisse[]);
    } catch (err) {
      console.error('Erreur chargement caisses:', err);
      const errorMessage = 'Erreur lors du chargement des caisses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Créer une nouvelle caisse
  const createCaisse = useCallback(async (input: CreateCaisseInput): Promise<Caisse | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('caisses')
        .insert({
          tenant_id: tenantId,
          ...input,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Caisse créée avec succès');
      await loadCaisses();
      return data as Caisse;
    } catch (err) {
      console.error('Erreur création caisse:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la caisse';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadCaisses]);

  // Mettre à jour une caisse
  const updateCaisse = useCallback(async (id: string, updates: Partial<CreateCaisseInput>): Promise<Caisse | undefined> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('caisses')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Caisse mise à jour avec succès');
      await loadCaisses();
      return data as Caisse;
    } catch (err) {
      console.error('Erreur mise à jour caisse:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la caisse';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadCaisses]);

  // Désactiver une caisse
  const deactivateCaisse = useCallback(async (id: string): Promise<void> => {
    if (!tenantId) {
      toast.error('Aucun tenant trouvé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('caisses')
        .update({ is_active: false })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Caisse désactivée avec succès');
      await loadCaisses();
    } catch (err) {
      console.error('Erreur désactivation caisse:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la désactivation de la caisse';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadCaisses]);

  // Charger les caisses au montage
  useEffect(() => {
    if (tenantId) {
      loadCaisses();
    }
  }, [tenantId, loadCaisses]);

  return {
    caisses,
    loading,
    error,
    loadCaisses,
    createCaisse,
    updateCaisse,
    deactivateCaisse
  };
};