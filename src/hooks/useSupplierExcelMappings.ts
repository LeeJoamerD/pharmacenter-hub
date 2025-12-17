import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { SupplierExcelMapping, ExcelColumnMapping } from '@/types/excelMapping';

export const useSupplierExcelMappings = () => {
  const { tenantId } = useTenant();
  const [mappings, setMappings] = useState<SupplierExcelMapping[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger tous les mappings
  const loadMappings = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_excel_mappings')
        .select(`
          *,
          fournisseur:fournisseurs(id, nom)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        mapping_config: item.mapping_config as ExcelColumnMapping,
        fournisseur: item.fournisseur as { id: string; nom: string } | undefined
      }));
      
      setMappings(transformedData);
    } catch (error) {
      console.error('Erreur chargement mappings:', error);
      toast.error('Erreur lors du chargement des mappings');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Récupérer le mapping d'un fournisseur spécifique
  const getMappingBySupplier = useCallback(async (fournisseurId: string): Promise<SupplierExcelMapping | null> => {
    if (!tenantId || !fournisseurId) return null;

    try {
      const { data, error } = await supabase
        .from('supplier_excel_mappings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('fournisseur_id', fournisseurId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          mapping_config: data.mapping_config as ExcelColumnMapping
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération mapping fournisseur:', error);
      return null;
    }
  }, [tenantId]);

  // Créer un nouveau mapping
  const createMapping = useCallback(async (
    fournisseurId: string, 
    mappingConfig: ExcelColumnMapping
  ): Promise<boolean> => {
    if (!tenantId) {
      toast.error('Tenant non identifié');
      return false;
    }

    try {
      const { error } = await supabase
        .from('supplier_excel_mappings')
        .insert({
          tenant_id: tenantId,
          fournisseur_id: fournisseurId,
          mapping_config: mappingConfig as any,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Un mapping existe déjà pour ce fournisseur');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Mapping créé avec succès');
      await loadMappings();
      return true;
    } catch (error) {
      console.error('Erreur création mapping:', error);
      toast.error('Erreur lors de la création du mapping');
      return false;
    }
  }, [tenantId, loadMappings]);

  // Mettre à jour un mapping existant
  const updateMapping = useCallback(async (
    id: string,
    mappingConfig: ExcelColumnMapping
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('supplier_excel_mappings')
        .update({ mapping_config: mappingConfig as any })
        .eq('id', id);

      if (error) throw error;

      toast.success('Mapping mis à jour avec succès');
      await loadMappings();
      return true;
    } catch (error) {
      console.error('Erreur mise à jour mapping:', error);
      toast.error('Erreur lors de la mise à jour du mapping');
      return false;
    }
  }, [loadMappings]);

  // Supprimer un mapping
  const deleteMapping = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('supplier_excel_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Mapping supprimé avec succès');
      await loadMappings();
      return true;
    } catch (error) {
      console.error('Erreur suppression mapping:', error);
      toast.error('Erreur lors de la suppression du mapping');
      return false;
    }
  }, [loadMappings]);

  // Charger les mappings au montage
  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  return {
    mappings,
    loading,
    loadMappings,
    getMappingBySupplier,
    createMapping,
    updateMapping,
    deleteMapping
  };
};
