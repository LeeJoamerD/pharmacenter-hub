import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Laboratory {
  id: string;
  tenant_id: string;
  libelle: string;
  pays_siege?: string;
  email_siege?: string;
  email_delegation_local?: string;
  telephone_appel_delegation_local?: string;
  telephone_whatsapp_delegation_local?: string;
  created_at: string;
  updated_at: string;
}

export const useLaboratories = () => {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLaboratories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('laboratoires')
        .select('*')
        .order('libelle');

      if (error) throw error;
      setLaboratories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des laboratoires';
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

  useEffect(() => {
    fetchLaboratories();
  }, []);

  return {
    laboratories,
    loading,
    error,
    refetch: fetchLaboratories,
  };
};